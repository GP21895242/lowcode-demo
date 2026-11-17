import { forwardRef, useImperativeHandle, useMemo } from "react";
import { useCardTemplate } from "../../card-template/store";
import type { CommonComponentProps } from "../../interface";
import { useCardEventEmitter, useCardRegistry, usePageStores } from "../../page-store/contexts";
import { createPageEventDomain, execEventFlow } from "../../utils/action";
import CardInstanceView from "./view";

/**
 * 卡片实例（正式态）：只暴露契约能力，事件向上交给页面事件流
 */
const CardInstanceProd = forwardRef<any, CommonComponentProps>((props, ref) => {
  const { _id, templateId, inputValues, slotMapping } = props;
  const componentId = _id;
  const template = useCardTemplate(templateId);
  const cards = useCardRegistry();
  const emitCardEvent = useCardEventEmitter();
  const { pageData, refs } = usePageStores();
  const domain = useMemo(() => createPageEventDomain(pageData, refs), [pageData, refs]);

  useImperativeHandle(ref, () => {
    const handle = () => cards.get(componentId);

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
  }, [cards, componentId, template]);

  const emit = (event: string, payload: any) => {
    // 事件绑定沿用 props[eventName] = { children } 机制
    const binding = props[event];
    if (binding?.children) {
      execEventFlow(binding.children, payload, payload, domain);
    }

    // 页面级联动只认契约事件，内部实现不参与
    emitCardEvent(componentId, event, payload);
  };

  return (
    <CardInstanceView
      templateId={templateId}
      componentId={componentId}
      inputValues={inputValues}
      slotMapping={slotMapping}
      onEmit={emit}
    />
  );
});

export default CardInstanceProd;
