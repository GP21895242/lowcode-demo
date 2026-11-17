/**
 * 卡片联动声明，P4 由 InteractionBus 消费
 */
export interface PageInteraction {
  id: string;
  enabled: boolean;
  trigger: {
    type: "card-event";
    componentId: number;
    event: string;
    field?: string;
  };
  actions: InteractionAction[];
}

export type InteractionAction =
  | { type: "set-input"; targetComponentId: number; key: string; valueFrom: string }
  | { type: "invoke"; targetComponentId: number; method: string; argsFrom?: any }
  | { type: "set-variable"; name: string; valueFrom: string };
