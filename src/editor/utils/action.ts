import axios from "axios";
import type { StoreApi } from "zustand/vanilla";

import { openConfirm } from "../common/confirm-dialog";
import { toast } from "../../components/ui/toast";
import { getByPath } from "../../lib/utils";
import type { Node } from "../layouts/flow-event/data";
import type { PageDataStore } from "../page-store/stores/page-data";
import type { RefRegistry } from "../page-store/stores/refs";

/**
 * 事件流的数据域：页面事件流写页面数据，卡片内部事件流写卡片数据域
 */
export interface EventDomain {
  getData: (key: string) => any;
  getDataSnapshot: () => Record<string, any>;
  setData: (key: string, value: any) => void;
  getComponentRef: (componentId: number) => any;
}

/**
 * 页面事件流数据域：由页面实例的 pageData 与组件 ref 注册表构造
 */
export function createPageEventDomain(
  pageData: StoreApi<PageDataStore>,
  refs: RefRegistry,
): EventDomain {
  return {
    getData: (key) => pageData.getState().data[key],
    getDataSnapshot: () => pageData.getState().data,
    setData: (key, value) => pageData.getState().setData(key, value),
    getComponentRef: (componentId) => refs.get(componentId),
  };
}

export function execEventFlow(
  nodes: Node[] = [],
  eventData?: any,
  initEventData?: any,
  domain?: EventDomain,
) {
  if (!nodes.length) return;
  if (!domain) return;

  nodes.forEach(async (item: Node) => {
    // 判断是否是动作节点，如果是动作节点并且条件结果不为false，则执行动作
    if (item.type === "action" && item.conditionResult !== false) {
      // 根据不同动作类型执行不同动作
      await eventHandleMap[item.config.type](
        item,
        item.config.config,
        eventData,
        initEventData,
        domain,
      );
    } else if (item.type === "condition") {
      // 如果是条件节点，执行条件脚本，把结果注入到子节点conditionResult属性中
      const conditionResult = (item.config || []).reduce((prev: any, cur: any) => {
        const result = execScript(cur.condition, eventData, initEventData, domain);
        prev[cur.id] = result;
        return prev;
      }, {});

      (item.children || []).forEach((c: any) => {
        c.conditionResult = !!conditionResult[c.conditionId];
      });
      // 递归执行子节点事件流
      execEventFlow(item.children, null, initEventData, domain);
    } else if (item.type === "event") {
      // 如果是事件节点，执行事件子节点事件流
      execEventFlow(item.children, null, initEventData, domain);
    }
  });
}

async function confirmHandle(
  item: any,
  actionConfig: any,
  _: any,
  initEventData: any,
  domain: EventDomain,
) {
  const { text } = actionConfig || {};
  openConfirm({
    title: "提示",
    content: text,
    zIndex: 100000,
    onOk: () => {
      // 执行成功后，执行后续成功success事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "confirm");
      execEventFlow(nodes, null, initEventData, domain);
    },
    onCancel: () => {
      // 执行失败后，执行后续error事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "cancel");
      execEventFlow(nodes, null, initEventData, domain);
    },
  });
}

// 请求数据
async function requestHandle(
  item: any,
  actionConfig: any,
  eventData: any,
  initEventData: any,
  domain: EventDomain,
) {
  const { url, method, params = [], body = [] } = actionConfig || {};

  try {
    // 解析代码里的变量
    const paramsValue = params.reduce((prev: any, cur: any) => {
      prev[cur.key] = cur.value.replace(/\{(.+)\}/g, (_: string, $2: string) => {
        return getByPath(
          {
            eventData,
            initEventData,
            data: domain.getDataSnapshot(),
          },
          $2,
        );
      });
      return prev;
    }, {});

    let bodyValue;

    if (body && body.type === "script" && body.script) {
      bodyValue = execScript(body.script, eventData, initEventData, domain);
    } else if (body && body.type === "json" && body.json) {
      bodyValue = JSON.parse(body.json);
    }

    const res = await axios({
      url,
      method,
      params: paramsValue,
      data: bodyValue,
    });

    // 执行成功后，执行后续成功success事件
    const nodes = item.children?.filter((o: any) => o.eventKey === "success");
    execEventFlow(nodes, res.data, initEventData, domain);
  } catch (error) {
    console.log(error, "error");

    const nodes = item.children?.filter((o: any) => o.eventKey === "error");
    execEventFlow(nodes, undefined, undefined, domain);
  } finally {
    const nodes = item.children?.filter((o: any) => o.eventKey === "finally");
    execEventFlow(nodes, undefined, undefined, domain);
  }
}

// 执行脚本
async function execScriptHandle(
  item: any,
  actionConfig: any,
  eventData: any,
  initEventData: any,
  domain: EventDomain,
) {
  const { script } = actionConfig || {};

  if (script) {
    try {
      // 执行脚本
      execScript(script, eventData, initEventData, domain);

      // 执行成功后，执行后续成功success事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "success");
      execEventFlow(nodes, undefined, undefined, domain);
    } catch {
      // 执行失败后，执行后续error事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "error");
      execEventFlow(nodes, undefined, undefined, domain);
    } finally {
      // 执行后续成功或失败finally事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "finally");
      execEventFlow(nodes, undefined, undefined, domain);
    }
  }
}

// 设置变量
async function setVariableHandle(
  item: any,
  actionConfig: any,
  eventData: any,
  initEventData: any,
  domain: EventDomain,
) {
  const { variable, value } = actionConfig || {};

  if (variable && value) {
    try {
      if (/\{(.+)\}/.test(value)) {
        value.replace(/\{(.+)\}/g, (_: string, $2: string) => {
          const data = getByPath(
            {
              eventData,
              initEventData,
              data: domain.getDataSnapshot(),
            },
            $2,
          );
          domain.setData(variable, data);
        });
      } else {
        // 变量设置
        domain.setData(variable, value);
      }

      // 执行成功后，执行后续成功success事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "success");
      execEventFlow(nodes, undefined, undefined, domain);
    } catch {
      // 执行失败后，执行后续error事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "error");
      execEventFlow(nodes, undefined, undefined, domain);
    } finally {
      // 执行后续成功或失败finally事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "finally");
      execEventFlow(nodes, undefined, undefined, domain);
    }
  }
}

// 组件方法
async function componentMethodHandle(
  item: any,
  actionConfig: any,
  eventData: any,
  initEventData: any,
  domain: EventDomain,
) {
  const { componentId, method } = actionConfig || {};

  if (componentId && actionConfig) {
    try {
      // 执行组件方法，卡片域只解析当前实例的内部 ref
      await domain.getComponentRef(componentId)[method](eventData);

      // 执行成功后，执行后续成功success事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "success");
      execEventFlow(nodes, eventData, initEventData, domain);
    } catch {
      // 执行失败后，执行后续error事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "error");
      execEventFlow(nodes, eventData, initEventData, domain);
    } finally {
      // 执行后续成功或失败finally事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "finally");
      execEventFlow(nodes, eventData, initEventData, domain);
    }
  }
}

// 显示提示
function showMessageHandle(item: any, actionConfig: any, _: any, __: any, domain: EventDomain) {
  if (actionConfig?.type && actionConfig?.text) {
    try {
      if (actionConfig.type === "success") {
        toast.add({ title: actionConfig.text, type: "success" });
      } else if (actionConfig.type === "error") {
        toast.add({ title: actionConfig.text, type: "error" });
      }

      // 执行成功后，执行后续成功success事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "success");
      execEventFlow(nodes, undefined, undefined, domain);
    } catch {
      // 执行失败后，执行后续error事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "error");
      execEventFlow(nodes, undefined, undefined, domain);
    } finally {
      // 执行后续成功或失败finally事件
      const nodes = item.children?.filter((o: any) => o.eventKey === "finally");
      execEventFlow(nodes, undefined, undefined, domain);
    }
  }
}

// 执行脚本
function execScript(script: string, eventData: any, initEventData: any, domain: EventDomain) {
  // eslint-disable-next-line no-implied-eval
  const func = new Function("ctx", `return ${script}`);

  const ctx = {
    setData: domain.setData,
    getComponentRef: domain.getComponentRef,
    getData: domain.getData,
    eventData,
    initEventData,
  };
  return func(ctx);
}

const eventHandleMap: any = {
  ShowMessage: showMessageHandle,
  ComponentMethod: componentMethodHandle,
  SetVariable: setVariableHandle,
  ExecScript: execScriptHandle,
  Request: requestHandle,
  Confirm: confirmHandle,
};
