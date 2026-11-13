import React, { useCallback, useEffect, useRef } from "react";

import { AppForm, useAppForm } from "../../../components/form";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import CommonSetter from "../../common/common-setter";
import SettingFormItemSwitch from "../../common/setting-form-item/switch";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <Label className="w-[92px] shrink-0 pt-2 text-right text-sm font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const ComponentAttr = () => {
  const { curComponentId, curComponent, updateComponentProps, updateComponent } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  const form = useAppForm<any>({});
  const resettingRef = useRef(false);

  useEffect(() => {
    resettingRef.current = true;

    const previous = form.store.state.values || {};
    const next = Object.keys(previous).reduce((acc: any, key) => {
      acc[key] = null;
      return acc;
    }, {});

    form.reset({ ...next, ...(curComponent?.props || {}) });

    const timer = setTimeout(() => {
      resettingRef.current = false;
    }, 0);

    return () => clearTimeout(timer);
  }, [curComponent, form]);

  const handleValuesChange = useCallback(
    (values: any) => {
      if (resettingRef.current) return;
      if (curComponentId) {
        updateComponentProps(curComponentId, values);
      }
    },
    [curComponentId, updateComponentProps],
  );

  if (!curComponentId || !curComponent) return null;

  const setter = componentConfig[curComponent?.name]?.setter;

  return (
    <AppForm form={form} onValuesChange={handleValuesChange} className="py-2">
      <Row label="组件id">
        <Input value={curComponent.id} disabled />
      </Row>
      <Row label="组件名称">
        <Input value={curComponent.name} disabled />
      </Row>
      <Row label="组件描述">
        <Input
          value={curComponent.desc ?? ""}
          onChange={(event) => {
            updateComponent(curComponentId, "desc", event.target.value);
          }}
        />
      </Row>
      <Row label="隐藏">
        <SettingFormItemSwitch
          value={curComponent.hidden}
          onChange={(value) => {
            updateComponent(curComponentId, "hidden", value);
          }}
        />
      </Row>
      {setter &&
        (!Array.isArray(setter) ? (
          React.createElement(setter as any)
        ) : (
          <CommonSetter setters={setter as any} />
        ))}
    </AppForm>
  );
};

export default ComponentAttr;
