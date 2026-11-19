import React, { useCallback, useEffect, useRef } from "react";

import { AppForm, useAppForm } from "@/components/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CommonSetter from "../../common/common-setter";
import SettingFormItemSwitch from "../../common/setting-form-item/switch";
import {
  GRID_ITEM_DEFAULT_H,
  GRID_ITEM_DEFAULT_W,
  normalizeGridLayout,
  setGridItemSize,
  unwrapStaticValue,
} from "../../components/grid-layout/layout-utils";
import { ItemType } from "../../item-type";
import { useComponentConfigStore } from "../../stores/component-config";
import { useComponetsStore } from "../../stores/components";
import { getComponentById } from "../../utils/utils";

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
  const { components, curComponentId, curComponent, updateComponentProps, updateComponent } =
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

  // 选中的组件位于自由布局中时，额外提供该网格项的宽高设置
  const parentComponent = getComponentById(curComponent.parentId ?? null, components);
  const isGridItem = parentComponent?.name === ItemType.GridLayout;
  const gridCols = Math.max(
    1,
    Math.round(Number(unwrapStaticValue(parentComponent?.props?.cols, 12)) || 12),
  );
  const gridLayout = isGridItem
    ? normalizeGridLayout(unwrapStaticValue(parentComponent?.props?.layout, []))
    : [];
  const gridItem = gridLayout.find((item) => item.i === String(curComponent.id)) ?? {
    i: String(curComponent.id),
    x: 0,
    y: 0,
    w: GRID_ITEM_DEFAULT_W,
    h: GRID_ITEM_DEFAULT_H,
  };

  const handleGridItemSizeChange = (patch: { w?: number; h?: number }) => {
    if (!parentComponent) return;

    const next = setGridItemSize(gridLayout, String(curComponent.id), patch, gridCols);
    updateComponentProps(parentComponent.id, { layout: { type: "static", value: next } });
  };

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
      {isGridItem ? (
        <>
          <Row label="网格宽度(列)">
            <Input
              type="number"
              min={1}
              max={gridCols}
              value={gridItem.w}
              onChange={(event) => {
                const value = Math.round(Number(event.target.value));
                if (Number.isFinite(value) && value >= 1) handleGridItemSizeChange({ w: value });
              }}
            />
          </Row>
          <Row label="网格高度(行)">
            <Input
              type="number"
              min={1}
              value={gridItem.h}
              onChange={(event) => {
                const value = Math.round(Number(event.target.value));
                if (Number.isFinite(value) && value >= 1) handleGridItemSizeChange({ h: value });
              }}
            />
          </Row>
        </>
      ) : null}
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
