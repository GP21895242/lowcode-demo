import React from "react";
import { useComponentConfigStore } from "../stores/component-config";
import type { Component } from "../stores/components";
import { execEventFlow } from "../utils/action";
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

  function formatProps(component: Component) {
    return Object.keys(component.props || {}).reduce<Record<string, any>>((prev, key) => {
      const value = component.props[key];

      if (value && typeof value === "object") {
        if (value.type === "static") {
          prev[key] = value.value;
        } else if (value.type === "variable") {
          prev[key] = getData(value.value);
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

      if (binding?.children) {
        prev[event.name] = (params: any) => {
          // 内部事件先在卡片内闭环，命中契约事件再向上 emit
          execEventFlow(binding.children, params, params, domain);

          if (contractEvents.has(event.name)) {
            emit(event.name, params);
          }
        };
      }

      return prev;
    }, {});
  }

  function renderComponent(component: Component): React.ReactNode {
    const config = componentConfig[component.name];

    if (!config?.prod) return null;

    if (component.hidden?.type === "static" && component.hidden?.value) {
      return null;
    }

    if (
      component.hidden?.type === "variable" &&
      component.hidden?.value &&
      getData(component.hidden.value) === true
    ) {
      return null;
    }

    const props: any = {
      key: component.id,
      ...component.props,
      ...formatProps(component),
    };

    if (!readonly) {
      props._id = component.id;
      props._name = component.name;
      props._execEventFlow = runFlow;
      props.ref = (ref: any) => {
        setComponentRef(component.id, ref);
      };
      Object.assign(props, buildEventProps(component, config.events ?? []));
    }

    const children = component.props?.children ?? renderComponents(component.children ?? []);

    return React.createElement(
      config.prod,
      { ...props, ...(propOverrides[component.id] ?? {}) },
      children,
    );
  }

  function renderComponents(components: Component[]): React.ReactNode {
    return components.map((component) => renderComponent(component));
  }

  return <>{renderComponent(expanded.root)}</>;
}
