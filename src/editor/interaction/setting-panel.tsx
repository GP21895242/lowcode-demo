import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCardTemplatesStore } from "../card-template/store";
import type { CardTemplate } from "../card-template/types";
import { ItemType } from "../item-type";
import { useComponetsStore, type Component } from "../stores/components";
import { useInteractionStore } from "./runtime";
import type { InteractionAction, PageInteraction } from "./types";

const ACTION_OPTIONS = [
  { label: "写入卡片输入", value: "set-input" },
  { label: "调用卡片方法", value: "invoke" },
  { label: "写入页面变量", value: "set-variable" },
];

interface CardOption {
  scopeId: string;
  templateId: string;
  template?: CardTemplate;
}

function collectCards(components: Component[], result: CardOption[] = []) {
  components.forEach((component) => {
    if (component.name === ItemType.CardInstance && component.props?.scopeId) {
      result.push({
        scopeId: String(component.props.scopeId),
        templateId: String(component.props.templateId ?? ""),
      });
    }
    if (component.children?.length) collectCards(component.children, result);
  });
  return result;
}

function createInteraction(scopeId: string, event: string): PageInteraction {
  return {
    id: `interaction_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    trigger: { type: "card-event", scopeId, event },
    actions: [],
  };
}

function createAction(type: InteractionAction["type"]): InteractionAction {
  if (type === "invoke") return { type: "invoke", targetScopeId: "", method: "" };
  if (type === "set-variable") return { type: "set-variable", name: "", valueFrom: "{eventData}" };
  return { type: "set-input", targetScopeId: "", key: "", valueFrom: "{eventData}" };
}

function PanelField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="flex min-w-0 flex-col items-stretch gap-1 text-[11px] font-normal text-muted-foreground">
      <span>{label}</span>
      {children}
    </Label>
  );
}

/**
 * 卡片联动配置面板：触发事件只来自卡片契约，动作为页面级编排
 */
export default function InteractionSettingPanel() {
  const components = useComponetsStore((state) => state.components);
  const templates = useCardTemplatesStore((state) => state.templates);
  const interactions = useInteractionStore((state) => state.interactions);
  const addInteraction = useInteractionStore((state) => state.addInteraction);
  const updateInteraction = useInteractionStore((state) => state.updateInteraction);
  const deleteInteraction = useInteractionStore((state) => state.deleteInteraction);

  const cards = collectCards(components).map((card) => ({
    ...card,
    template: templates.find((template) => template.id === card.templateId),
  }));

  const cardOptions = cards.map((card) => ({
    value: card.scopeId,
    label: `${card.template?.name ?? "未知模板"} · ${card.scopeId}`,
  }));

  if (!cards.length) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        页面暂无卡片实例，先插入卡片后再配置联动。
      </div>
    );
  }

  function getTemplate(scopeId: string) {
    return cards.find((card) => card.scopeId === scopeId)?.template;
  }

  function updateTrigger(interaction: PageInteraction, patch: Partial<PageInteraction["trigger"]>) {
    updateInteraction(interaction.id, { trigger: { ...interaction.trigger, ...patch } });
  }

  function updateAction(interaction: PageInteraction, index: number, action: InteractionAction) {
    updateInteraction(interaction.id, {
      actions: interaction.actions.map((item, itemIndex) => (itemIndex === index ? action : item)),
    });
  }

  function patchAction(
    interaction: PageInteraction,
    index: number,
    patch: Partial<InteractionAction>,
  ) {
    const action = interaction.actions[index];
    if (!action) return;
    updateAction(interaction, index, { ...action, ...patch } as InteractionAction);
  }

  return (
    <div className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] leading-4 text-muted-foreground">
          卡片事件上行到页面后，按声明驱动其他卡片或页面变量；同一条链重复命中会自动跳过。
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const first = cards[0];
            const event = getTemplate(first.scopeId)?.contract.events[0]?.name ?? "";
            addInteraction(createInteraction(first.scopeId, event));
          }}
        >
          <Plus />
          添加
        </Button>
      </div>

      {!interactions.length ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          暂无联动，点击「添加」创建第一条
        </div>
      ) : null}

      {interactions.map((interaction, interactionIndex) => {
        const triggerTemplate = getTemplate(interaction.trigger.scopeId);
        const eventOptions = (triggerTemplate?.contract.events ?? []).map((event) => ({
          label: event.label || event.name,
          value: event.name,
        }));

        return (
          <div key={interaction.id} className="rounded-md border border-border p-2">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch
                  checked={interaction.enabled}
                  onCheckedChange={(checked) =>
                    updateInteraction(interaction.id, { enabled: checked })
                  }
                />
                联动 {interactionIndex + 1}
              </label>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="删除联动"
                title="删除联动"
                onClick={() => deleteInteraction(interaction.id)}
              >
                <Trash2 />
              </Button>
            </div>

            <div className="mt-2 space-y-2">
              <PanelField label="触发卡片">
                <Select
                  value={interaction.trigger.scopeId}
                  items={cardOptions}
                  onValueChange={(next) => {
                    if (!next) return;
                    const event = getTemplate(next)?.contract.events[0]?.name ?? "";
                    updateInteraction(interaction.id, {
                      trigger: { ...interaction.trigger, scopeId: next, event },
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择卡片" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PanelField>

              <PanelField label="触发事件">
                {eventOptions.length ? (
                  <Select
                    value={interaction.trigger.event}
                    items={eventOptions}
                    onValueChange={(next) => {
                      if (!next) return;
                      updateTrigger(interaction, { event: next });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择事件" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-[11px] text-muted-foreground">该卡片契约未暴露事件</p>
                )}
              </PanelField>

              <PanelField label="取值字段">
                <Input
                  value={interaction.trigger.field ?? ""}
                  placeholder="可选，如 region"
                  onChange={(event) => updateTrigger(interaction, { field: event.target.value })}
                />
              </PanelField>
            </div>

            <div className="mt-3 border-t border-border pt-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium">动作</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateInteraction(interaction.id, {
                      actions: [...interaction.actions, createAction("set-input")],
                    })
                  }
                >
                  <Plus />
                  动作
                </Button>
              </div>

              {!interaction.actions.length ? (
                <p className="text-[11px] text-muted-foreground">还没有动作，命中事件时不做处理</p>
              ) : null}

              {interaction.actions.map((action, actionIndex) => {
                const targetScopeId = action.type === "set-variable" ? "" : action.targetScopeId;
                const targetTemplate = getTemplate(targetScopeId);
                const inputOptions = (targetTemplate?.contract.inputs ?? []).map((input) => ({
                  label: input.label || input.key,
                  value: input.key,
                }));
                const methodOptions = (targetTemplate?.contract.methods ?? []).map((method) => ({
                  label: method.label || method.name,
                  value: method.name,
                }));

                return (
                  <div key={actionIndex} className="mb-2 space-y-2 rounded-md bg-muted/40 p-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={action.type}
                        items={ACTION_OPTIONS}
                        onValueChange={(next) =>
                          updateAction(
                            interaction,
                            actionIndex,
                            createAction(next as InteractionAction["type"]),
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="动作类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="删除动作"
                        title="删除动作"
                        onClick={() =>
                          updateInteraction(interaction.id, {
                            actions: interaction.actions.filter(
                              (_, itemIndex) => itemIndex !== actionIndex,
                            ),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    {action.type !== "set-variable" ? (
                      <PanelField label="目标卡片">
                        <Select
                          value={action.targetScopeId}
                          items={cardOptions}
                          onValueChange={(next) => {
                            if (!next) return;
                            patchAction(interaction, actionIndex, { targetScopeId: next });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择卡片" />
                          </SelectTrigger>
                          <SelectContent>
                            {cardOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </PanelField>
                    ) : null}

                    {action.type === "set-input" ? (
                      <>
                        <PanelField label="目标输入">
                          {inputOptions.length ? (
                            <Select
                              value={action.key}
                              items={inputOptions}
                              onValueChange={(next) => {
                                if (!next) return;
                                patchAction(interaction, actionIndex, { key: next });
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="选择契约输入" />
                              </SelectTrigger>
                              <SelectContent>
                                {inputOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              目标卡片契约未暴露输入
                            </p>
                          )}
                        </PanelField>
                        <PanelField label="取值表达式">
                          <Input
                            value={action.valueFrom}
                            placeholder="{eventData.region}"
                            onChange={(event) =>
                              patchAction(interaction, actionIndex, {
                                valueFrom: event.target.value,
                              })
                            }
                          />
                        </PanelField>
                      </>
                    ) : null}

                    {action.type === "invoke" ? (
                      <>
                        <PanelField label="目标方法">
                          {methodOptions.length ? (
                            <Select
                              value={action.method}
                              items={methodOptions}
                              onValueChange={(next) => {
                                if (!next) return;
                                patchAction(interaction, actionIndex, { method: next });
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="选择契约方法" />
                              </SelectTrigger>
                              <SelectContent>
                                {methodOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">
                              目标卡片契约未暴露方法
                            </p>
                          )}
                        </PanelField>
                        <PanelField label="参数表达式">
                          <Input
                            value={typeof action.argsFrom === "string" ? action.argsFrom : ""}
                            placeholder="{eventData}"
                            onChange={(event) =>
                              patchAction(interaction, actionIndex, {
                                argsFrom: event.target.value,
                              })
                            }
                          />
                        </PanelField>
                      </>
                    ) : null}

                    {action.type === "set-variable" ? (
                      <>
                        <PanelField label="变量名">
                          <Input
                            value={action.name}
                            placeholder="如 selectedRegion"
                            onChange={(event) =>
                              patchAction(interaction, actionIndex, { name: event.target.value })
                            }
                          />
                        </PanelField>
                        <PanelField label="取值表达式">
                          <Input
                            value={action.valueFrom}
                            placeholder="{eventData.region}"
                            onChange={(event) =>
                              patchAction(interaction, actionIndex, {
                                valueFrom: event.target.value,
                              })
                            }
                          />
                        </PanelField>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
