import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDataSourceRuntimeStore } from "@/editor/data-source/runtime";
import { createEmptyDataSource, createField, inferFields } from "@/editor/data-source/schema";
import { useDataSourceStore } from "@/editor/data-source/store";
import type {
  DataSource,
  DataSourceField,
  DataSourceFieldType,
  DataSourceRequest,
  DataSourceSearchType,
} from "@/editor/data-source/types";

interface Props {
  open: boolean;
  source: DataSource | null;
  onClose: () => void;
}

const FIELD_TYPES: { label: string; value: DataSourceFieldType }[] = [
  { label: "文本", value: "string" },
  { label: "数字", value: "number" },
  { label: "布尔", value: "boolean" },
  { label: "日期", value: "date" },
  { label: "枚举", value: "enum" },
];

const SEARCH_TYPES: { label: string; value: DataSourceSearchType }[] = [
  { label: "输入框", value: "input" },
  { label: "下拉框", value: "select" },
  { label: "日期", value: "date" },
  { label: "日期区间", value: "dateRange" },
  { label: "数字区间", value: "numberRange" },
];

const METHOD_OPTIONS = ["GET", "POST", "PUT", "DELETE"].map((method) => ({
  label: method,
  value: method,
}));

function SimpleSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  value?: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(String(next))}
      items={options}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EditorRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function JsonTextarea({
  value,
  onChange,
  className,
}: {
  value: unknown;
  onChange: (value: any) => void;
  className?: string;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [invalid, setInvalid] = useState(false);

  return (
    <div>
      <Textarea
        className={cn("min-h-20 font-mono text-xs", className)}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          try {
            const parsed = next.trim() ? JSON.parse(next) : null;
            setInvalid(false);
            onChange(parsed);
          } catch {
            setInvalid(true);
          }
        }}
      />
      {invalid ? <p className="mt-1 text-xs text-destructive">JSON 格式错误</p> : null}
    </div>
  );
}

function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: DataSourceField;
  onChange: (patch: Partial<DataSourceField>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="grid grid-cols-[1fr_1fr_110px_auto] items-end gap-2">
        <EditorRow label="dataKey">
          <Input
            value={field.dataKey}
            onChange={(event) => onChange({ dataKey: event.target.value })}
          />
        </EditorRow>
        <EditorRow label="显示名">
          <Input
            value={field.label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </EditorRow>
        <EditorRow label="类型">
          <SimpleSelect
            value={field.type}
            options={FIELD_TYPES}
            onChange={(value) => onChange({ type: value as DataSourceFieldType })}
          />
        </EditorRow>
        <Button
          variant="ghost"
          size="icon"
          className="mb-0.5 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="删除字段"
        >
          <span className="text-lg leading-none">×</span>
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_160px] gap-2">
        <EditorRow label="描述">
          <Input
            value={field.description ?? ""}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </EditorRow>
        <EditorRow label="查询控件">
          <SimpleSelect
            value={field.searchType ?? "input"}
            options={SEARCH_TYPES}
            onChange={(value) => onChange({ searchType: value as DataSourceSearchType })}
          />
        </EditorRow>
      </div>

      {field.type === "enum" || field.searchType === "select" ? (
        <div className="mt-2">
          <EditorRow label="选项 JSON（[{ label, value }]）">
            <Textarea
              key={`${field.dataKey}-options`}
              className="min-h-16 font-mono text-xs"
              defaultValue={JSON.stringify(field.options ?? [], null, 2)}
              onChange={(event) => {
                try {
                  const parsed = event.target.value.trim() ? JSON.parse(event.target.value) : [];
                  onChange({ options: Array.isArray(parsed) ? parsed : [] });
                } catch {
                  // 输入过程中允许暂时非法，保存前不强制校验
                }
              }}
            />
          </EditorRow>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-4 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={field.visible}
            onChange={(event) => onChange({ visible: event.target.checked })}
          />
          可见
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={field.sortable}
            onChange={(event) => onChange({ sortable: event.target.checked })}
          />
          可排序
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={field.searchable}
            onChange={(event) => onChange({ searchable: event.target.checked })}
          />
          可查询
        </label>
      </div>
    </div>
  );
}

export function DataSourceEditor({ open, source, onClose }: Props) {
  const addSource = useDataSourceStore((state) => state.addSource);
  const updateSource = useDataSourceStore((state) => state.updateSource);

  const [draft, setDraft] = useState<DataSource>(() => createEmptyDataSource());
  const [mockText, setMockText] = useState("[]");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    if (!open) return;
    const next = source
      ? (JSON.parse(JSON.stringify(source)) as DataSource)
      : createEmptyDataSource();
    setDraft(next);
    setMockText(JSON.stringify(next.mock.data ?? [], null, 2));
    setError("");
    setTab("basic");
  }, [open, source]);

  function patch(next: Partial<DataSource>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function patchRequest(next: Partial<DataSourceRequest>) {
    setDraft((prev) => ({
      ...prev,
      request: {
        url: "",
        method: "GET",
        ...prev.request,
        ...next,
      },
    }));
  }

  function updateField(index: number, next: Partial<DataSourceField>) {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...next } : field,
      ),
    }));
  }

  function save() {
    let mockData: any[];
    try {
      const parsed = mockText.trim() ? JSON.parse(mockText) : [];
      if (!Array.isArray(parsed)) throw new Error("Mock 数据必须是数组");
      mockData = parsed;
    } catch (reason: any) {
      setError(`Mock 数据 JSON 解析失败：${reason?.message ?? "格式错误"}`);
      return;
    }

    const name = draft.name.trim();
    if (!name) {
      setError("请填写数据源名称");
      return;
    }

    const duplicated = useDataSourceStore
      .getState()
      .sources.some((item) => item.name === name && item.id !== draft.id);
    if (duplicated) {
      setError("数据源名称已存在");
      return;
    }

    const keys = draft.fields.map((field) => field.dataKey.trim());
    if (keys.some((key) => !key)) {
      setError("字段 dataKey 不能为空");
      return;
    }
    if (new Set(keys).size !== keys.length) {
      setError("字段 dataKey 不能重复");
      return;
    }

    const next: DataSource = {
      ...draft,
      name,
      title: draft.title.trim() || name,
      fields: draft.fields.map((field) => ({ ...field, dataKey: field.dataKey.trim() })),
      mock: { ...draft.mock, data: mockData },
    };

    if (source) {
      updateSource(source.id, next);
    } else {
      addSource(next);
    }

    const runtime = useDataSourceRuntimeStore.getState();
    if (runtime.sources[next.id]) {
      runtime.invalidate(next.id);
      void runtime.load(next.id, { force: true });
    }

    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{source ? "编辑数据源" : "新建数据源"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="min-h-0">
          <TabsList>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="request">接口配置</TabsTrigger>
            <TabsTrigger value="fields">字段 Schema</TabsTrigger>
            <TabsTrigger value="mock">Mock 数据</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <EditorRow label="名称（页面内唯一标识）">
                <Input
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="orders"
                />
              </EditorRow>
              <EditorRow label="显示名">
                <Input
                  value={draft.title}
                  onChange={(event) => patch({ title: event.target.value })}
                  placeholder="订单数据"
                />
              </EditorRow>
              <EditorRow label="数据源类型">
                <SimpleSelect
                  value={draft.kind}
                  options={[
                    { label: "HTTP 接口", value: "http" },
                    { label: "静态数据", value: "static" },
                  ]}
                  onChange={(value) => patch({ kind: value as DataSource["kind"] })}
                />
              </EditorRow>
              <EditorRow label="主键字段">
                <Input
                  value={draft.primaryKey ?? ""}
                  onChange={(event) => patch({ primaryKey: event.target.value })}
                  placeholder="id"
                />
              </EditorRow>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              编辑态始终使用 Mock 数据；预览态默认连接真实接口，开启下方「预览使用
              Mock」后仍走模拟数据。
            </p>
          </TabsContent>

          <TabsContent value="request" className="max-h-[60vh] overflow-y-auto pr-1">
            {draft.kind === "static" ? (
              <p className="py-3 text-xs text-muted-foreground">
                静态数据源不需要接口配置，组件将直接使用 Mock 数据。
              </p>
            ) : null}
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <EditorRow label="接口地址">
                <Input
                  value={draft.request?.url ?? ""}
                  onChange={(event) => patchRequest({ url: event.target.value })}
                  placeholder="https://api.example.com/orders"
                />
              </EditorRow>
              <EditorRow label="请求方法">
                <SimpleSelect
                  value={draft.request?.method ?? "GET"}
                  options={METHOD_OPTIONS}
                  onChange={(value) =>
                    patchRequest({ method: value as DataSourceRequest["method"] })
                  }
                />
              </EditorRow>
              <EditorRow label="结果路径">
                <Input
                  value={draft.request?.resultPath ?? ""}
                  onChange={(event) => patchRequest({ resultPath: event.target.value })}
                  placeholder="data"
                />
              </EditorRow>
              <EditorRow label="总数路径">
                <Input
                  value={draft.request?.totalPath ?? ""}
                  onChange={(event) => patchRequest({ totalPath: event.target.value })}
                  placeholder="total"
                />
              </EditorRow>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <EditorRow label="请求头（JSON）">
                <JsonTextarea
                  key={`${draft.id}-headers`}
                  value={draft.request?.headers ?? {}}
                  onChange={(value) => patchRequest({ headers: value ?? {} })}
                />
              </EditorRow>
              <EditorRow label="参数映射（JSON）">
                <JsonTextarea
                  key={`${draft.id}-params`}
                  value={draft.request?.params ?? {}}
                  onChange={(value) => patchRequest({ params: value ?? {} })}
                />
              </EditorRow>
            </div>
            <div className="mt-2">
              <EditorRow label="请求体模板（JSON，可选）">
                <JsonTextarea
                  key={`${draft.id}-body`}
                  value={draft.request?.body ? safeParse(draft.request.body) : {}}
                  onChange={(value) => patchRequest({ body: value ? JSON.stringify(value) : "" })}
                />
              </EditorRow>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              参数值支持模板：{"{search.关键字}"}、{"{filters.字段}"}、{"{sort.field}"}、
              {"{page.pageNo}"}、{"{vars.页面变量}"}。
            </p>
          </TabsContent>

          <TabsContent value="fields" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">共 {draft.fields.length} 个字段</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => patch({ fields: [...draft.fields, createField()] })}
              >
                <Wand2 className="size-3.5" />
                添加字段
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {draft.fields.map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  onChange={(next) => updateField(index, next)}
                  onDelete={() =>
                    patch({ fields: draft.fields.filter((_, fieldIndex) => fieldIndex !== index) })
                  }
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mock" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={draft.mock.enabled}
                  onChange={(event) =>
                    patch({ mock: { ...draft.mock, enabled: event.target.checked } })
                  }
                />
                预览时也使用 Mock
              </label>
              <EditorRow label="模拟延迟（毫秒）">
                <Input
                  type="number"
                  value={draft.mock.delay}
                  onChange={(event) =>
                    patch({ mock: { ...draft.mock, delay: Number(event.target.value) || 0 } })
                  }
                />
              </EditorRow>
            </div>
            <EditorRow label={`Mock 数据（JSON 数组）`}>
              <Textarea
                className="min-h-64 font-mono text-xs"
                value={mockText}
                onChange={(event) => setMockText(event.target.value)}
                spellCheck={false}
              />
            </EditorRow>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    const parsed = mockText.trim() ? JSON.parse(mockText) : [];
                    setMockText(JSON.stringify(parsed, null, 2));
                    setError("");
                  } catch {
                    setError("Mock 数据 JSON 格式错误");
                  }
                }}
              >
                格式化 JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    const parsed = mockText.trim() ? JSON.parse(mockText) : [];
                    if (!Array.isArray(parsed)) throw new Error("必须是数组");
                    patch({ fields: inferFields(parsed) });
                    setError("");
                  } catch (reason: any) {
                    setError(reason?.message ?? "无法从 Mock 数据生成字段");
                  }
                }}
              >
                从 Mock 生成字段
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
