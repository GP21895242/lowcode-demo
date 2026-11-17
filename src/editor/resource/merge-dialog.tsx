import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useCardTemplatesStore } from "../card-template/store";
import { useDataSourceStore } from "../data-source/store";
import type { DataSource, DataSourceField } from "../data-source/types";
import { usePageSearchStore } from "../search/store";
import type { PageSearchConfig, SearchControl } from "../search/types";
import { useComponetsStore } from "../stores/components";
import { getComponentById } from "../utils/utils";
import { fingerprintSource, type MergeSuggestion } from "./scan";
import { getMergeSuggestions } from "./scan-cache";
import { useSuggestionStore } from "./suggestion-store";

function candidateKey(candidate: MergeSuggestion["candidates"][number]) {
  return `${candidate.componentId}:${candidate.key}`;
}

function buildMergedSource(
  target: DataSource,
  others: DataSource[],
  resolutions: Record<string, any>,
): DataSource {
  const fieldMap = new Map<string, DataSourceField>();
  [target, ...others].forEach((source) => {
    source.fields.forEach((field) => {
      // 字段取并集，差异由冲突决策覆盖
      if (!fieldMap.has(field.dataKey)) {
        fieldMap.set(field.dataKey, structuredClone(field));
      }
    });
  });

  Object.entries(resolutions).forEach(([key, value]) => {
    const separator = key.indexOf(":");
    if (separator < 0) return;

    const kind = key.slice(0, separator);
    const dataKey = key.slice(separator + 1);
    const field = fieldMap.get(dataKey);
    if (!field) return;

    if (kind === "type") {
      field.type = value;
      return;
    }

    if (kind === "options") {
      const chosen = [target, ...others].find((source) => source.id === value);
      const chosenField = chosen?.fields.find((item) => item.dataKey === dataKey);
      if (chosenField?.options) {
        field.options = structuredClone(chosenField.options);
      }
    }
  });

  const mockOwner = resolutions.mock
    ? [target, ...others].find((source) => source.id === resolutions.mock)
    : target;

  return {
    ...structuredClone(target),
    fields: [...fieldMap.values()],
    mock: structuredClone(mockOwner?.mock ?? target.mock),
    fingerprint: fingerprintSource(target),
    mergedFrom: [...new Set([...(target.mergedFrom ?? []), ...others.map((source) => source.id)])],
  };
}

interface SelectionState {
  selected: Record<string, string[]>;
  targets: Record<string, string>;
  resolutions: Record<string, Record<string, any>>;
  variables: Record<string, string>;
}

/**
 * 合并建议面板：唯一执行入口，默认不勾选任何实例，冲突未决时禁止应用
 */
export default function MergeDialog() {
  const open = useSuggestionStore((state) => state.dialogOpen);
  const closeDialog = useSuggestionStore((state) => state.closeDialog);
  const dismissedIds = useSuggestionStore((state) => state.dismissedIds);
  const dismiss = useSuggestionStore((state) => state.dismiss);
  const components = useComponetsStore((state) => state.components);
  const sources = useDataSourceStore((state) => state.sources);
  const templates = useCardTemplatesStore((state) => state.templates);
  const [state, setState] = useState<SelectionState>({
    selected: {},
    targets: {},
    resolutions: {},
    variables: {},
  });

  const suggestions = useMemo(
    () =>
      getMergeSuggestions({ components, sources, templates }).filter(
        (suggestion) => !dismissedIds.includes(suggestion.id),
      ),
    [components, dismissedIds, sources, templates],
  );

  function selectedKeys(suggestion: MergeSuggestion) {
    return new Set(state.selected[suggestion.id] ?? []);
  }

  function toggleCandidate(suggestion: MergeSuggestion, key: string) {
    setState((prev) => {
      const current = new Set(prev.selected[suggestion.id] ?? []);
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }
      return { ...prev, selected: { ...prev.selected, [suggestion.id]: [...current] } };
    });
  }

  function resolveConflict(suggestionId: string, key: string, value: any) {
    setState((prev) => ({
      ...prev,
      resolutions: {
        ...prev.resolutions,
        [suggestionId]: { ...(prev.resolutions[suggestionId] ?? {}), [key]: value },
      },
    }));
  }

  function applySourceSuggestion(suggestion: MergeSuggestion) {
    const checked = selectedKeys(suggestion);
    if (!checked.size) return;

    const targetId = state.targets[suggestion.id] ?? suggestion.sourceIds?.[0];
    const target = sources.find((source) => source.id === targetId);
    if (!target) return;

    const involvedIds = suggestion.sourceIds ?? [];
    const involvedSources = involvedIds
      .filter((id) => id !== targetId)
      .map((id) => sources.find((source) => source.id === id))
      .filter((source): source is DataSource => !!source);

    const refsBySource = new Map<string, string[]>();
    suggestion.candidates.forEach((candidate) => {
      if (!candidate.sourceId) return;
      const list = refsBySource.get(candidate.sourceId) ?? [];
      list.push(candidateKey(candidate));
      refsBySource.set(candidate.sourceId, list);
    });

    // 仅删除所有引用都被勾选的重复源，避免留下悬空映射
    const deletable = involvedIds.filter(
      (id) => id !== targetId && (refsBySource.get(id) ?? []).every((key) => checked.has(key)),
    );

    const patches = suggestion.candidates
      .filter((candidate) => checked.has(candidateKey(candidate)))
      .filter((candidate) => candidate.sourceId && candidate.sourceId !== targetId)
      .map((candidate) => {
        const component = getComponentById(candidate.componentId, components);
        return {
          componentId: candidate.componentId,
          props: {
            slotMapping: {
              ...(component?.props?.slotMapping ?? {}),
              [candidate.key]: targetId,
            },
          },
        };
      });

    const merged = buildMergedSource(
      target,
      involvedSources,
      state.resolutions[suggestion.id] ?? {},
    );
    const nextSources = sources
      .filter((source) => !deletable.includes(source.id))
      .map((source) => (source.id === targetId ? merged : source));
    const nextRelations = useDataSourceStore
      .getState()
      .relations.filter(
        (relation) =>
          !deletable.includes(relation.sourceId) && !deletable.includes(relation.targetId),
      );

    useComponetsStore.getState().applyMergeTransaction({
      componentProps: patches,
      sources: nextSources,
      relations: nextRelations,
    });

    setState((prev) => ({
      ...prev,
      selected: { ...prev.selected, [suggestion.id]: [] },
      resolutions: { ...prev.resolutions, [suggestion.id]: {} },
    }));
    toast.add({ title: "已合并重复数据源，可一次撤销", type: "success" });
  }

  function applySearchSuggestion(suggestion: MergeSuggestion) {
    const checked = selectedKeys(suggestion);
    if (!checked.size) return;

    const rawVariable =
      state.variables[suggestion.id] ?? `search.${suggestion.candidates[0]?.key ?? "field"}`;
    const variable = rawVariable.startsWith("search.") ? rawVariable : `search.${rawVariable}`;
    const config = usePageSearchStore.getState().config;
    const fields = [...(config?.fields ?? [])];
    const targets = [...(config?.targets ?? [])];
    const patches = suggestion.candidates
      .filter((candidate) => checked.has(candidateKey(candidate)))
      .map((candidate) => {
        const component = getComponentById(candidate.componentId, components);

        if (
          !targets.some(
            (target) =>
              target.kind === "card" &&
              target.componentId === candidate.componentId &&
              target.inputKey === candidate.key,
          )
        ) {
          targets.push({
            kind: "card",
            componentId: candidate.componentId,
            inputKey: candidate.key,
            variable,
          });
        }

        return {
          componentId: candidate.componentId,
          props: {
            inputValues: {
              ...(component?.props?.inputValues ?? {}),
              [candidate.key]: { type: "variable", value: variable },
            },
          },
        };
      });

    if (!fields.some((field) => field.variable === variable)) {
      const first = suggestion.candidates.find((candidate) => checked.has(candidateKey(candidate)));
      fields.push({
        variable,
        label: first?.key ?? variable,
        control: (state.resolutions[suggestion.id]?.control ??
          first?.control ??
          "input") as SearchControl,
        options: first?.options,
        order: fields.length,
      });
    }

    const nextConfig: PageSearchConfig = {
      scope: config?.scope ?? "page",
      groupId: config?.groupId,
      fields,
      targets,
      trigger: config?.trigger ?? "submit",
      debounce: config?.debounce,
    };

    useComponetsStore.getState().applyMergeTransaction({
      componentProps: patches,
      search: nextConfig,
    });

    setState((prev) => ({
      ...prev,
      selected: { ...prev.selected, [suggestion.id]: [] },
      resolutions: { ...prev.resolutions, [suggestion.id]: {} },
    }));
    toast.add({ title: "已生成页面搜索字段并绑定实例，可一次撤销", type: "success" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeDialog();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>优化建议</DialogTitle>
          <DialogDescription>
            系统只生成建议，不会自动合并；所有改动需手动确认，应用后只产生一条撤销记录。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {!suggestions.length ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              暂无合并建议。插入相同卡片不会自动合并任何数据源。
            </p>
          ) : null}

          <div className="flex flex-col gap-3 py-2">
            {suggestions.map((suggestion) => {
              const checked = selectedKeys(suggestion);
              const resolutions = state.resolutions[suggestion.id] ?? {};
              const unresolved = suggestion.conflicts.some(
                (conflict) => resolutions[conflict.key] === undefined,
              );
              const targetId = state.targets[suggestion.id] ?? suggestion.sourceIds?.[0] ?? "";
              const canApply = checked.size > 0 && !unresolved;

              return (
                <div key={suggestion.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {suggestion.kind === "source" ? "合并重复数据源" : "合并搜索项"}
                      </div>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                        {suggestion.reasons.map((reason) => (
                          <li key={reason}>· {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {suggestion.confidence === "high" ? "高可信" : "需确认"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {suggestion.candidates.map((candidate) => (
                      <label
                        key={candidateKey(candidate)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 accent-primary"
                          checked={checked.has(candidateKey(candidate))}
                          onChange={() => toggleCandidate(suggestion, candidateKey(candidate))}
                        />
                        <span className="min-w-0 truncate">{candidate.label}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {candidate.sourceId ?? candidate.key}
                        </span>
                      </label>
                    ))}
                  </div>

                  {suggestion.kind === "source" ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
                        合并到
                        <Select
                          value={targetId}
                          items={(suggestion.sourceIds ?? []).map((id) => ({
                            label: sources.find((source) => source.id === id)?.title ?? id,
                            value: id,
                          }))}
                          onValueChange={(next) => {
                            if (!next) return;
                            setState((prev) => ({
                              ...prev,
                              targets: { ...prev.targets, [suggestion.id]: next },
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择目标数据源" />
                          </SelectTrigger>
                          <SelectContent>
                            {(suggestion.sourceIds ?? []).map((id) => (
                              <SelectItem key={id} value={id}>
                                {sources.find((source) => source.id === id)?.title ?? id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
                        搜索变量名
                        <Input
                          value={
                            state.variables[suggestion.id] ??
                            `search.${suggestion.candidates[0]?.key ?? "field"}`
                          }
                          onChange={(event) =>
                            setState((prev) => ({
                              ...prev,
                              variables: {
                                ...prev.variables,
                                [suggestion.id]: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    </div>
                  )}

                  {suggestion.conflicts.length ? (
                    <div className="mt-2 space-y-2 rounded-md bg-muted/40 p-2">
                      <div className="text-[11px] font-medium">需要确认的差异</div>
                      {suggestion.conflicts.map((conflict) => (
                        <label
                          key={conflict.key}
                          className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground"
                        >
                          {conflict.kind === "type"
                            ? `字段类型：${conflict.key.slice("type:".length)}`
                            : conflict.kind === "options"
                              ? `字段选项：${conflict.key.slice("options:".length)}`
                              : conflict.kind === "mock-data"
                                ? "Mock 数据来源"
                                : "搜索控件类型"}
                          <Select
                            value={resolutions[conflict.key] ?? ""}
                            items={conflict.options.map((option) => ({
                              label: option.label,
                              value: String(option.value),
                            }))}
                            onValueChange={(next) => {
                              if (!next) return;
                              resolveConflict(suggestion.id, conflict.key, next);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="请选择" />
                            </SelectTrigger>
                            <SelectContent>
                              {conflict.options.map((option) => (
                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => dismiss(suggestion.id)}>
                      忽略
                    </Button>
                    <Button
                      size="sm"
                      disabled={!canApply}
                      onClick={() =>
                        suggestion.kind === "source"
                          ? applySourceSuggestion(suggestion)
                          : applySearchSuggestion(suggestion)
                      }
                    >
                      应用
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
