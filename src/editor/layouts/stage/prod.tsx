import React from "react";
import { useContentStore, usePageDataStore, usePageStores } from "../../page-store/contexts";
import type { Component } from "../../page-store/stores/content";
import { useComponentConfigStore } from "../../stores/component-config";
import { expandComponents } from "../../loop/expand";
import { useLoopRows } from "../../loop/rows";
import { collectLoopSourceIds, type RowScope } from "../../loop/scope";
import { createPageEventDomain, execEventFlow } from "../../utils/action";

const ProdStage: React.FC = () => {
  const { components } = useContentStore();
  const { data } = usePageDataStore();
  const { componentConfig } = useComponentConfigStore();
  const { pageData, refs } = usePageStores();

  const domain = React.useMemo(() => createPageEventDomain(pageData, refs), [pageData, refs]);
  const runEventFlow = React.useMemo(
    () => (nodes: any, eventData?: any, initEventData?: any) =>
      execEventFlow(nodes, eventData, initEventData, domain),
    [domain],
  );

  const loopSourceIds = React.useMemo(() => collectLoopSourceIds(components), [components]);
  const loopRows = useLoopRows(loopSourceIds);
  const getLoopRows = React.useCallback(
    (sourceId: string) => loopRows.get(sourceId) ?? [],
    [loopRows],
  );

  /** 变量取值：循环行内优先取行作用域，否则回退页面数据 */
  function readValue(name: string, scope?: RowScope) {
    if (scope && Object.prototype.hasOwnProperty.call(scope, name)) {
      return scope[name];
    }

    return data[name];
  }

  // 处理组件props
  function formatProps(component: Component, scope?: RowScope) {
    const props = Object.keys(component.props || {}).reduce<any>((prev, cur) => {
      // 如果组件属性是对象，则判断是静态值还是变量
      if (typeof component.props[cur] === "object") {
        // 如果是静态值，则直接赋值。 如果是变量，则取变量中的默认值
        if (component.props[cur]?.type === "static") {
          prev[cur] = component.props[cur].value;
        } else if (component.props[cur]?.type === "variable") {
          const variableName = component.props[cur].value;
          // 行作用域优先，其次取页面数据；两者都没有时保持 undefined
          prev[cur] = readValue(variableName, scope);
        } else if (component.props[cur]?.type === "dataSource") {
          prev[cur] = component.props[cur].value;
        }
      } else {
        prev[cur] = component.props[cur];
      }

      return prev;
    }, {});
    return props;
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

  // 处理事件
  function handleEvent(component: Component) {
    const props: any = {};

    const events = componentConfig?.[component.name]?.events;

    if (!events?.length) {
      return props;
    }

    events.forEach((event: any) => {
      const eventConfig = component.props[event.name];

      if (eventConfig) {
        props[event.name] = (params: any) => {
          if (eventConfig.children) {
            runEventFlow(eventConfig.children, params, params);
          }
        };
      }
    });

    return props;
  }

  function renderComponents(
    components: Component[],
    scope?: RowScope,
    keyPrefix = "",
  ): React.ReactNode {
    return expandComponents(components, { scope, keyPrefix, getRows: getLoopRows }).map((node) => {
      const component = node.component;

      if (!componentConfig[component.name]?.prod) {
        return null;
      }

      if (isHidden(component, node.scope)) {
        return null;
      }

      let props = formatProps(component, node.scope);

      props = { ...props, ...handleEvent(component) };

      return React.createElement(
        componentConfig[component.name]?.prod,
        {
          key: node.key,
          _id: node.runtimeId,
          _name: component.name,
          _execEventFlow: runEventFlow,
          ref: (ref) => {
            refs.set(node.runtimeId, ref);
          },
          ...component.props,
          ...props,
        },
        component.props.children ||
          renderComponents(component.children || [], node.scope, `${node.key}/`),
      );
    });
  }

  return (
    <div>
      <React.Suspense fallback="loading...">{renderComponents(components)}</React.Suspense>
    </div>
  );
};

export default ProdStage;
