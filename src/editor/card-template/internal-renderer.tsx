import React from "react";
import type { Component } from "../stores/components";
import { useComponentConfigStore } from "../stores/component-config";
import { execEventFlow } from "../utils/action";
import { expandComponents } from "../loop/expand";
import { useLoopRows } from "../loop/rows";
import { collectLoopSourceIds, type RowScope } from "../loop/scope";
import { useCardRuntime } from "./runtime-context";

interface CardInternalRendererProps {
  /** 编辑态只读预览：不渲染事件、不暴露组件 id */
  readonly?: boolean;
}

/**
 * 卡片内部渲染器：用 prod 组件渲染展开后的模板树，所有取数与事件都限定在卡片作用域
 */
export default function CardInternalRenderer({ readonly = false }: CardInternalRendererProps) {
  const { expanded, getData, propOverrides, contractEvents, emit, domain, setComponentRef } =
    useCardRuntime();
  const { componentConfig } = useComponentConfigStore();

  const runFlow = React.useCallback(
    (nodes: any, eventData?: any, initEventData?: any) => {
      execEventFlow(nodes, eventData, initEventData, domain);
    },
    [domain],
  );

  const loopSourceIds = React.useMemo(() => collectLoopSourceIds([expanded.root]), [expanded.root]);
  const loopRows = useLoopRows(loopSourceIds);
  const getLoopRows = React.useCallback(
    (sourceId: string) => loopRows.get(sourceId) ?? [],
    [loopRows],
  );

  function readValue(name: string, scope?: RowScope) {
    if (scope && Object.prototype.hasOwnProperty.call(scope, name)) {
      return scope[name];
    }

    return getData(name);
  }

  function formatProps(component: Component, scope?: RowScope) {
    return Object.keys(component.props || {}).reduce<Record<string, any>>((prev, key) => {
      const value = component.props[key];

      if (value && typeof value === "object") {
        if (value.type === "static") {
          prev[key] = value.value;
        } else if (value.type === "variable") {
          prev[key] = readValue(value.value, scope);
        } else if (value.type === "dataSource") {
          // 保留 $slot 占位，由数据源 hook 在卡片上下文中解析真实作用域
          prev[key] = value.value;
        }
      } else {
        prev[key] = value;
      }

      return prev;
    }, {});
  }

  function buildEventProps(component: Component, events: any[]) {
    return events.reduce<Record<string, any>>((prev, event) => {
      const binding = component.props?.[event.name];

      if (binding?.children || contractEvents.has(event.name)) {
        prev[event.name] = (params: any) => {
          // 内部事件先在卡片内闭环，命中契约事件再向上 emit
          if (binding?.children) {
            execEventFlow(binding.children, params, params, domain);
          }

          if (contractEvents.has(event.name)) {
            emit(event.name, params);
          }
        };
      }

      return prev;
    }, {});
  }

  function isHidden(component: Component, scope?: RowScope) {
    if (component.hidden?.type === "static" && component.hidden?.value) {
      return true;
    }

    return (
      component.hidden?.type === "variable" &&
      !!component.hidden?.value &&
      readValue(component.hidden.value, scope) === true
    );
  }

  function renderComponents(
    components: Component[],
    scope?: RowScope,
    keyPrefix = "",
  ): React.ReactNode {
    return expandComponents(components, { scope, keyPrefix, getRows: getLoopRows }).map((node) => {
      const component = node.component;
      const config = componentConfig[component.name];

      if (!config?.prod) return null;
      if (isHidden(component, node.scope)) return null;

      const props: any = {
        key: node.key,
        ...component.props,
        ...formatProps(component, node.scope),
      };

      if (!readonly) {
        props._id = node.runtimeId;
        props._name = component.name;
        props._execEventFlow = runFlow;
        props.ref = (ref: any) => {
          setComponentRef(node.runtimeId, ref);
        };
        Object.assign(props, buildEventProps(component, config.events ?? []));
      }

      const children =
        component.props?.children ??
        renderComponents(component.children ?? [], node.scope, `${node.key}/`);

      return React.createElement(
        config.prod,
        { ...props, ...(propOverrides[component.id] ?? {}) },
        children,
      );
    });
  }

  return <>{renderComponents([expanded.root])}</>;
}
