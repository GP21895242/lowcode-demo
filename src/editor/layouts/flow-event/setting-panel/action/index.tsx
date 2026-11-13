import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { AppForm, useAppForm, useWatchValue } from "../../../../../components/form";
import { Field } from "../../../../../components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import type { SettingPanelProps } from "../../data";
import AsyncTaskSetting from "./async-task";
import ComponentMethodSetting from "./component-method";
import ConfirmSetting from "./confirm";
import ExecScriptSetting from "./exec-script";
import RequestSetting from "./request";
import SetVariableSetting from "./set-variable";
import ShowMessageSetting from "./show-message";

const actionMap: Record<string, React.ComponentType> = {
  ShowMessage: ShowMessageSetting,
  ComponentMethod: ComponentMethodSetting,
  SetVariable: SetVariableSetting,
  ExecScript: ExecScriptSetting,
  AsyncTask: AsyncTaskSetting,
  Request: RequestSetting,
  Confirm: ConfirmSetting,
};

const EventActionTypesDesc: Record<string, string> = {
  ShowMessage: "显示消息",
  ComponentMethod: "组件方法",
  SetVariable: "设置变量",
  ExecScript: "执行脚本",
  Request: "请求接口",
  Confirm: "显示确认框",
};

const actionOptions = Object.keys(actionMap)
  .filter((key) => EventActionTypesDesc[key])
  .map((key) => ({ label: EventActionTypesDesc[key], value: key }));

function ActionSettingPanel({ node, updateNode, close }: SettingPanelProps, ref: any) {
  const form = useAppForm<{ type?: string; config?: Record<string, any> }>(
    {
      type: node.config?.type,
      config: node.config?.config ?? {},
    },
    { onSubmit },
  );

  const type = useWatchValue(form, "type");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    form.setFieldValue("config", {});
  }, [type, form]);

  useImperativeHandle(
    ref,
    () => ({
      save: () => {
        void form.handleSubmit();
      },
    }),
    [form],
  );

  function onSubmit(values: { type?: string; config?: Record<string, any> }) {
    if (!values.type) return;

    let menus = [
      {
        label: "成功",
        key: "success",
        nodeType: "event",
        nodeName: "成功",
        eventKey: "success",
      },
      {
        label: "失败",
        key: "error",
        nodeType: "event",
        nodeName: "失败",
        eventKey: "error",
      },
      {
        label: "成功或失败",
        key: "finally",
        nodeType: "event",
        nodeName: "成功或失败",
        eventKey: "finally",
      },
    ];

    if (values.type === "Confirm") {
      menus = [
        {
          label: "确认",
          key: "confirm",
          nodeType: "event",
          nodeName: "确认",
          eventKey: "confirm",
        },
        {
          label: "取消",
          key: "cancel",
          nodeType: "event",
          nodeName: "取消",
          eventKey: "cancel",
        },
      ];
    }

    updateNode(node.id, {
      config: { type: values.type, config: values.config ?? {} },
      label: EventActionTypesDesc[values.type],
      menus,
    });

    close();
  }

  const SettingComponent = type ? actionMap[type] : null;

  return (
    <AppForm form={form} className="py-2">
      <Field name="type" label="动作类型">
        {({ value, onChange }) => (
          <Select value={value} onValueChange={onChange} items={actionOptions}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="请选择动作类型" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      {SettingComponent ? React.createElement(SettingComponent) : null}
    </AppForm>
  );
}

export default forwardRef(ActionSettingPanel);
