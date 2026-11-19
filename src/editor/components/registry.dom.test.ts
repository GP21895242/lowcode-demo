import { describe, expect, it } from "vite-plus/test";

import type { ComponentConfig } from "../interface";
import { ItemType } from "../item-type";

const modules = import.meta.glob("./*/index.ts", { eager: true }) as Record<
  string,
  { default?: (ctx: any) => void }
>;

function loadRegistry() {
  const registry: Record<string, ComponentConfig> = {};

  Object.entries(modules).forEach(([path, module]) => {
    expect(module.default, `${path} 缺少默认导出`).toBeTypeOf("function");
    module.default?.({
      registerComponent: (name: string, config: ComponentConfig) => {
        expect(registry[name], `组件 ${name} 重复注册`).toBeUndefined();
        registry[name] = config;
      },
    });
  });

  return registry;
}

const REQUIRED = [
  ItemType.Page,
  ItemType.Box,
  ItemType.Button,
  ItemType.Space,
  ItemType.Card,
  ItemType.Form,
  ItemType.FormItem,
  ItemType.Table,
  ItemType.TableColumn,
  ItemType.Modal,
  ItemType.Tabs,
  ItemType.TabPane,
  ItemType.Carousel,
  ItemType.Loop,
  ItemType.Input,
  ItemType.Textarea,
  ItemType.Select,
  ItemType.RadioGroup,
  ItemType.CheckboxGroup,
  ItemType.Switch,
  ItemType.Image,
  ItemType.Text,
  ItemType.Link,
  ItemType.Chart,
  ItemType.GridLayout,
  ItemType.SearchForm,
  ItemType.SearchFormItem,
  ItemType.CardInstance,
];

describe("组件注册表契约", () => {
  const registry = loadRegistry();

  it("注册了全部内置组件且名称与 key 一致", () => {
    const names = Object.keys(registry).sort();

    expect(names).toEqual(expect.arrayContaining([...REQUIRED].sort()));
    Object.entries(registry).forEach(([key, config]) => {
      expect(config.name).toBe(key);
    });
  });

  it("每个组件都提供物料、渲染器与拖拽约束", () => {
    Object.entries(registry).forEach(([key, config]) => {
      expect(config.desc, `${key} 缺少描述`).toBeTruthy();
      expect(config.dev, `${key} 缺少设计态渲染器`).toBeTruthy();
      expect(config.prod, `${key} 缺少正式态渲染器`).toBeTruthy();
      expect(typeof config.order, `${key} 缺少排序`).toBe("number");

      expect(Array.isArray(config.allowDrag)).toBe(true);
      config.allowDrag.forEach((target) => {
        expect(registry[target], `${key} 的 allowDrag 引用了未注册组件 ${target}`).toBeDefined();
      });
    });
  });

  it("属性 setter 与事件/方法声明结构合法", () => {
    Object.entries(registry).forEach(([key, config]) => {
      // setter 允许是数组或自定义属性面板组件
      if (Array.isArray(config.setter)) {
        config.setter.forEach((setter) => {
          expect(setter.name, `${key} setter 缺少 name`).toBeTruthy();
          expect(setter.label, `${key} setter ${setter.name} 缺少 label`).toBeTruthy();
          expect(setter.type, `${key} setter ${setter.name} 缺少 type`).toBeTruthy();
        });
      }

      ["events", "methods"].forEach((field) => {
        const list = config[field as "events" | "methods"] ?? [];
        const names = list.map((item) => item.name);

        expect(new Set(names).size, `${key} 的 ${field} 名称重复`).toBe(names.length);
        list.forEach((item) => {
          expect(item.desc, `${key} 的 ${field}.${item.name} 缺少描述`).toBeTruthy();
        });
      });
    });
  });

  it("defaultProps 的取值统一为 { type, value } 结构", () => {
    Object.entries(registry).forEach(([key, config]) => {
      const defaultProps =
        typeof config.defaultProps === "function" ? config.defaultProps() : config.defaultProps;

      Object.entries(defaultProps ?? {}).forEach(([prop, value]) => {
        expect(["static", "variable"], `${key}.${prop} 的 type 非法`).toContain(value.type);
        expect(value).toHaveProperty("value");
      });
    });
  });
});
