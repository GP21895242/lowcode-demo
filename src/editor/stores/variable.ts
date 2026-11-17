import { useVariablesStore as useContextVariablesStore } from "../page-store/contexts";
import { bindPageStoreHook } from "../page-store/legacy";

export {
  normalizeVariable,
  type Variable,
  type VariableControl,
  type VariableInput,
  type VariableOption,
  type VariableScope,
  type VariablesActions,
  type VariablesState,
  type VariablesStore,
  type VariableType,
} from "../page-store/stores/variables";

/**
 * 页面变量 store（旧入口）：React 内读取 Context 实例
 */
export const useVariablesStore = bindPageStoreHook(
  useContextVariablesStore,
  (stores) => stores.variables,
);
