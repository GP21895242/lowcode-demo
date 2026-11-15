import { forwardRef, useImperativeHandle } from "react";
import { getCardInstance } from "../../card-template/registry";
import { useCardTemplate } from "../../card-template/store";
import type { CommonComponentProps } from "../../interface";
import { execEventFlow } from "../../utils/action";
import CardInstanceView from "./view";

/**
 * 卡片实例（正式态）：只暴露契约能力，事件向上交给页面事件流
 */
const CardInstanceProd = forwardRef<any, CommonComponentProps>((props, ref) => {
  const { templateId, scopeId, inputValues, slotMapping } = props;
  const template = useCardTemplate(templateId);

  useImperativeHandle(ref, () => {
    const handle = () => getCardInstance(scopeId);

    const methods = Object.fromEntries(
      (template?.contract.methods ?? []).map((method) => [
        method.name,
        (args?: any) => handle()?.invoke(method.name, args),
      ]),
    );

    return {
      ...methods,
      setInput: (key: string, value: any) => handle()?.setInput(key, value),
      getInputs: () => handle()?.getInputs() ?? {},
      reload: () => handle()?.reload(),
    };
  }, [scopeId, template]);

  const emit = (event: string, payload: any) => {
    // 事件绑定沿用 props[eventName] = { children } 机制
    const binding = props[event];
    if (binding?.children) {
      execEventFlow(binding.children, payload, payload);
    }
  };

  return (
    <CardInstanceView
      templateId={templateId}
      scopeId={scopeId}
      inputValues={inputValues}
      slotMapping={slotMapping}
      onEmit={emit}
    />
  );
});

export default CardInstanceProd;
