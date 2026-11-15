/**
 * 卡片联动声明，P4 由 InteractionBus 消费
 */
export interface PageInteraction {
  id: string;
  enabled: boolean;
  trigger: {
    type: "card-event";
    scopeId: string;
    event: string;
    field?: string;
  };
  actions: InteractionAction[];
}

export type InteractionAction =
  | { type: "set-input"; targetScopeId: string; key: string; valueFrom: string }
  | { type: "invoke"; targetScopeId: string; method: string; argsFrom?: any }
  | { type: "set-variable"; name: string; valueFrom: string };
