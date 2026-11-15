import { create } from "zustand";

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

interface State {
  variables: Variable[];
}

interface Action {
  /**
   * 批量设置变量
   * @param variables 变量列表
   */
  setVariables: (variables: VariableInput[]) => void;
  /**
   * 新增变量
   * @param variable 变量定义
   */
  addVariable: (variable: VariableInput) => void;
  /**
   * 更新变量
   * @param name 变量名
   * @param patch 变更内容
   */
  updateVariable: (name: string, patch: Partial<Omit<Variable, "name">>) => void;
  /**
   * 删除变量
   * @param name 变量名
   */
  deleteVariable: (name: string) => void;
}

export const useVariablesStore = create<State & Action>()((set, get) => ({
  variables: [],
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
