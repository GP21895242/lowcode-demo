import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getByPath } from "@/lib/utils";
import { useDataSourceRuntimeStore } from "../data-source/runtime";
import { registerScopedSources, unregisterScopedSources } from "../data-source/scope-sources";
import { usePageDataStore } from "../stores/page-data";
import type { EventDomain } from "../utils/action";
import { useExpandedTemplate, type ExpandedTemplate } from "./expander";
import { registerCardInstance, unregisterCardInstance } from "./registry";
import { CardRuntimeContext, type CardRuntimeContextValue } from "./runtime-context";
import { CardScopeContext, type CardSourceScope } from "./scope-context";
import { isCardSlotRef, readCardSlotKey, type CardInputDef, type CardTemplate } from "./types";

const EMPTY_INPUTS: Record<string, any> = {};

interface CardRuntimeProviderProps {
  template: CardTemplate;
  scopeId: string;
  inputs?: Record<string, any>;
  slotMapping?: Record<string, string>;
  onEmit?: (event: string, payload: any) => void;
  children: ReactNode;
}

function getInitialData(variables: { name: string; defaultValue: any }[]) {
  return variables.reduce<Record<string, any>>((next, variable) => {
    next[variable.name] = variable.defaultValue;
    return next;
  }, {});
}

/**
 * 卡片独立运行时：隔离数据域、私有数据源与组件 id，只通过契约与页面通信
 */
export function CardRuntimeProvider({
  template,
  scopeId,
  inputs,
  slotMapping,
  onEmit,
  children,
}: CardRuntimeProviderProps) {
  const expanded = useExpandedTemplate(template);
  const contract = template.contract;
  const scope = `card:${scopeId}`;
  const pageData = usePageDataStore((state) => state.data);

  const [runtimeInputs, setRuntimeInputs] = useState<{
    scopeId: string;
    values: Record<string, any>;
  }>({ scopeId, values: {} });
  const [data, setData] = useState<Record<string, any>>(() =>
    getInitialData(expanded?.variables ?? []),
  );
  const [componentRefs] = useState(() => new Map<number, any>());

  const scopedRuntimeInputs =
    runtimeInputs.scopeId === scopeId ? runtimeInputs.values : EMPTY_INPUTS;
  const values = useMemo(
    () => ({ ...(inputs ?? {}), ...scopedRuntimeInputs }),
    [inputs, scopedRuntimeInputs],
  );

  const dataRef = useRef(data);
  const valuesRef = useRef(values);

  // 输入值优先取页面配置，支持静态值与页面变量绑定，其次取契约默认绑定与默认值
  const resolveInputValue = useCallback(
    (def: CardInputDef) => {
      const raw = values[def.key];
      const readPageValue = (key: string) => pageData[key] ?? getByPath(pageData, key);

      if (raw?.type === "static" && raw.value !== undefined) return raw.value;
      if (raw?.type === "variable") {
        const bound = readPageValue(String(raw.value));
        if (bound !== undefined && bound !== null) return bound;
      } else if (raw !== undefined && raw !== null && raw?.type !== "static") {
        return raw;
      }

      if (def.variable) {
        const fromPage = readPageValue(def.variable);
        if (fromPage !== undefined && fromPage !== null) return fromPage;
      }

      return def.defaultValue;
    },
    [pageData, values],
  );

  const resolvedValues = useMemo(
    () =>
      contract.inputs.reduce<Record<string, any>>((next, def) => {
        next[def.key] = resolveInputValue(def);
        return next;
      }, {}),
    [contract.inputs, resolveInputValue],
  );

  // 变量型输入直接并入卡片数据域，与页面数据隔离
  const inputVarValues = useMemo(
    () =>
      contract.inputs.reduce<Record<string, any>>((next, def) => {
        if (def.binding.kind === "var") {
          next[def.binding.variable] = resolvedValues[def.key];
        }
        return next;
      }, {}),
    [contract.inputs, resolvedValues],
  );

  const inputVarsRef = useRef(inputVarValues);

  useLayoutEffect(() => {
    dataRef.current = data;
    valuesRef.current = resolvedValues;
    inputVarsRef.current = inputVarValues;
  }, [data, inputVarValues, resolvedValues]);

  // 父组件布局 effect 先于子组件取数 effect 执行，确保私有源已注册
  useLayoutEffect(() => {
    if (!expanded) return;

    registerScopedSources(scope, expanded.sources, expanded.relations);
    return () => unregisterScopedSources(scope);
  }, [expanded, scope]);

  const getData = useCallback(
    (key: string) => {
      if (key === "$props") return resolvedValues;
      if (key.startsWith("$props.")) {
        return getByPath(resolvedValues, key.slice("$props.".length));
      }
      return getByPath({ ...data, ...inputVarValues }, key);
    },
    [data, inputVarValues, resolvedValues],
  );

  const setCardData = useCallback((key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const getInternalComponentRef = useCallback(
    (componentId: number) => componentRefs.get(componentId),
    [componentRefs],
  );
  const setInternalComponentRef = useCallback(
    (componentId: number, ref: any) => {
      if (ref) {
        componentRefs.set(componentId, ref);
      } else {
        componentRefs.delete(componentId);
      }
    },
    [componentRefs],
  );

  const resolveSource = useCallback(
    (sourceId: string): CardSourceScope => {
      if (isCardSlotRef(sourceId)) {
        const mapped = slotMapping?.[readCardSlotKey(sourceId)];
        return {
          sourceId: mapped ?? "",
          scope: "page",
          getVariables: () => usePageDataStore.getState().data,
        };
      }

      return {
        sourceId,
        scope,
        getVariables: () => ({
          ...dataRef.current,
          ...inputVarsRef.current,
          $props: valuesRef.current,
        }),
      };
    },
    [scope, slotMapping],
  );

  const propOverrides = useMemo(() => {
    const overrides: Record<number, Record<string, any>> = {};
    if (!expanded) return overrides;

    contract.inputs.forEach((def) => {
      if (def.binding.kind !== "prop") return;

      const runtimeId = expanded.idMap.get(def.binding.targetNodeId);
      if (runtimeId === undefined) return;

      overrides[runtimeId] = {
        ...(overrides[runtimeId] ?? {}),
        [def.binding.targetProp]: resolvedValues[def.key],
      };
    });

    return overrides;
  }, [contract.inputs, expanded, resolvedValues]);

  const emit = useCallback(
    (event: string, payload: any) => {
      onEmit?.(event, payload);
    },
    [onEmit],
  );

  const domain = useMemo<EventDomain>(
    () => ({
      getData,
      getDataSnapshot: () => ({
        ...data,
        ...inputVarValues,
        $props: resolvedValues,
      }),
      setData: setCardData,
      getComponentRef: getInternalComponentRef,
    }),
    [data, getData, getInternalComponentRef, inputVarValues, resolvedValues, setCardData],
  );

  const setInput = useCallback(
    (key: string, value: any) => {
      setRuntimeInputs((prev) => {
        const base = prev.scopeId === scopeId ? prev.values : {};
        return { scopeId, values: { ...base, [key]: value } };
      });
    },
    [scopeId],
  );

  const reload = useCallback(() => {
    if (!expanded) return;

    const runtime = useDataSourceRuntimeStore.getState();
    const variables = {
      ...dataRef.current,
      ...inputVarsRef.current,
      $props: valuesRef.current,
    };
    expanded.sources.forEach((source) => {
      void runtime.load(source.id, { force: true, scope, variables });
    });
  }, [expanded, scope]);

  // 契约方法按名称匹配内部组件 ref，模板作者只需让内部组件暴露同名方法
  const invoke = useCallback(
    (method: string, args?: any) => {
      if (!expanded) return undefined;

      for (const runtimeId of expanded.idMap.values()) {
        const ref = getInternalComponentRef(runtimeId);
        if (ref && typeof ref[method] === "function") {
          return ref[method](args);
        }
      }

      return undefined;
    },
    [expanded, getInternalComponentRef],
  );

  useEffect(() => {
    registerCardInstance({
      scopeId,
      templateId: template.id,
      templateName: template.name,
      setInput,
      getInputs: () => valuesRef.current,
      reload,
      invoke,
    });

    return () => unregisterCardInstance(scopeId);
  }, [scopeId, template.id, template.name, setInput, reload, invoke]);

  const contractEvents = useMemo(
    () => new Set(contract.events.map((event) => event.name)),
    [contract.events],
  );

  const runtimeValue = useMemo<CardRuntimeContextValue>(
    () => ({
      scopeId,
      contract,
      expanded: expanded as ExpandedTemplate,
      inputs: resolvedValues,
      getData,
      resolveSource,
      propOverrides,
      emit,
      contractEvents,
      domain,
      setComponentRef: setInternalComponentRef,
    }),
    [
      scopeId,
      contract,
      expanded,
      resolvedValues,
      getData,
      resolveSource,
      propOverrides,
      emit,
      contractEvents,
      domain,
      setInternalComponentRef,
    ],
  );

  const scopeValue = useMemo(() => ({ scopeId, resolveSource }), [scopeId, resolveSource]);

  if (!expanded) return null;

  return (
    <CardScopeContext.Provider value={scopeValue}>
      <CardRuntimeContext.Provider value={runtimeValue}>{children}</CardRuntimeContext.Provider>
    </CardScopeContext.Provider>
  );
}
