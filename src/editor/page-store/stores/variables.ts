import { createStore, type StoreApi } from "zustand/vanilla";

export type VariableType = "string" | "number" | "boolean" | "date" | "datetime" | "json";

/**
 * page：由设计者或事件流维护
 * search：由全局搜索区驱动，值写入 pageData 的 search.<key>
 */
export type VariableScope = "page" | "search";

export type VariableControl = "input" | "select" | "date" | "dateRange" | "numberRange";

export interface VariableOption {
  label: string;
  value: any;
}

export interface Variable {
  /**
   * 变量名
   */
  name: string;
  /**
   * 变量类型
   */
  type: VariableType;
  /**
   * 默认值
   */
  defaultValue: any;
  /**
   * 备注
   */
  remark: string;
  /**
   * 变量作用域
   */
  scope: VariableScope;
  /**
   * 搜索区控件类型
   */
  control?: VariableControl;
  /**
   * 搜索区选项
   */
  options?: VariableOption[];
  /**
   * 搜索值的持久化方式
   */
  persist?: "none" | "url" | "storage";
  /**
   * 仅限制设计面板编辑，不限制事件流写入
   */
  readonly?: boolean;
}

export type VariableInput = Partial<Omit<Variable, "name">> & { name: string };

/**
 * 补齐变量默认字段，兼容 v1 的 { name, defaultValue, remark } 结构
 */
export function normalizeVariable(input: VariableInput): Variable {
  return {
    name: input.name,
    type: input.type ?? "string",
    defaultValue: input.defaultValue ?? "",
    remark: input.remark ?? "",
    scope: input.scope ?? "page",
    control: input.control,
    options: input.options,
    persist: input.persist,
    readonly: input.readonly,
  };
}

export interface VariablesState {
  variables: Variable[];
}

export interface VariablesActions {
  /**
   * 批量设置变量
   */
  setVariables: (variables: VariableInput[]) => void;
  /**
   * 新增变量
   */
  addVariable: (variable: VariableInput) => void;
  /**
   * 更新变量
   */
  updateVariable: (name: string, patch: Partial<Omit<Variable, "name">>) => void;
  /**
   * 删除变量
   */
  deleteVariable: (name: string) => void;
}

export type VariablesStore = VariablesState & VariablesActions;

/**
 * 页面变量 store：变量定义与页面一一对应
 */
export function createVariablesStore(initial: VariableInput[] = []): StoreApi<VariablesStore> {
  return createStore<VariablesStore>()((set, get) => ({
    variables: initial.map(normalizeVariable),
    setVariables: (variables) => set({ variables: variables.map(normalizeVariable) }),
    addVariable: (variable) => {
      const next = normalizeVariable(variable);
      if (!next.name) return;
      set({ variables: [...get().variables, next] });
    },
    updateVariable: (name, patch) =>
      set({
        variables: get().variables.map((variable) =>
          variable.name === name ? { ...variable, ...patch } : variable,
        ),
      }),
    deleteVariable: (name) =>
      set({ variables: get().variables.filter((variable) => variable.name !== name) }),
  }));
}
