import { describe, expect, it } from "vite-plus/test";

import { ItemType } from "../item-type";
import { usePagesStore, PAGE_SCHEMA_VERSION } from "../stores/pages";
import {
  createBlankCardTemplate,
  createCardInstanceProps,
  createCardTemplateRoot,
  getCardTemplate,
  getTemplateReferences,
  useCardTemplatesStore,
} from "./store";

function createReferencedPage(pageId: string, templateId: string) {
  const page = usePagesStore.getState().createPage(pageId);
  usePagesStore.getState().savePage(page.id, {
    schemaVersion: PAGE_SCHEMA_VERSION,
    components: [
      {
        id: 1,
        name: "Page",
        props: {},
        children: [
          {
            id: 20,
            name: ItemType.CardInstance,
            props: { templateId },
            children: [{ id: 21, name: ItemType.CardInstance, props: { templateId } }],
          },
        ],
      },
    ],
    variables: [],
    sources: [],
    relations: [],
  });

  return page;
}

describe("卡片模板 store", () => {
  it("createTemplate 深拷贝输入并补齐默认契约", () => {
    const root = createCardTemplateRoot();
    const template = useCardTemplatesStore.getState().createTemplate({
      name: "测试模板",
      root,
      sources: [],
      variables: [],
      relations: [],
    });

    expect(template.id).toMatch(/^tpl_/);
    expect(template.version).toBe(1);
    expect(template.contract).toEqual({ inputs: [], events: [], methods: [], slots: [] });
    expect(template.impl.root).not.toBe(root);

    root.props.title = { type: "static", value: "已修改" };
    expect(getCardTemplate(template.id)?.impl.root.props.title).toEqual({
      type: "static",
      value: "卡片标题",
    });
  });

  it("createBlankCardTemplate 使用默认根节点", () => {
    const template = createBlankCardTemplate("空白卡片");

    expect(template.name).toBe("空白卡片");
    expect(template.impl.root.name).toBe(ItemType.Card);
  });

  it("只有契约变化才升版本", () => {
    const template = createBlankCardTemplate("版本模板");

    useCardTemplatesStore.getState().updateTemplate(template.id, {
      name: "改名",
      impl: { ...template.impl, root: createCardTemplateRoot() },
    });
    expect(getCardTemplate(template.id)?.version).toBe(1);

    useCardTemplatesStore.getState().updateTemplate(template.id, {
      contract: {
        inputs: [
          {
            key: "title",
            label: "标题",
            type: "text",
            defaultValue: "",
            binding: { kind: "var", variable: "search.title" },
          },
        ],
        events: [],
        methods: [],
        slots: [],
      },
    });

    const updated = getCardTemplate(template.id);
    expect(updated?.version).toBe(2);
    expect(updated?.name).toBe("改名");
    expect(updated?.contractHistory?.[1]).toEqual(template.contract);
  });

  it("统计页面中的模板引用（含嵌套节点）", () => {
    const template = createBlankCardTemplate("引用模板");
    const page = createReferencedPage("引用页面", template.id);

    const references = getTemplateReferences(template.id);

    expect(references).toEqual([{ pageId: page.id, pageName: "引用页面", componentIds: [20, 21] }]);

    usePagesStore.getState().deletePage(page.id);
  });

  it("被引用时阻止删除，没有引用时可以删除", () => {
    const template = createBlankCardTemplate("删除模板");
    const page = createReferencedPage("删除页面", template.id);

    const blocked = useCardTemplatesStore.getState().deleteTemplate(template.id);
    expect(blocked.ok).toBe(false);
    expect(blocked.references[0].componentIds).toEqual([20, 21]);
    expect(getCardTemplate(template.id)).toBeDefined();

    usePagesStore.getState().deletePage(page.id);

    expect(useCardTemplatesStore.getState().deleteTemplate(template.id).ok).toBe(true);
    expect(getCardTemplate(template.id)).toBeUndefined();
  });

  it("createCardInstanceProps 生成初始实例属性", () => {
    const template = createBlankCardTemplate("实例模板");

    expect(createCardInstanceProps(template)).toEqual({
      templateId: template.id,
      templateVersion: 1,
      inputValues: {},
      slotMapping: {},
    });

    useCardTemplatesStore.getState().deleteTemplate(template.id);
  });
});
