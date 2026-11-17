import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSamplePageData } from "../data-source/schema";
import type { DataSource, DataSourceRelation } from "../data-source/types";
import { ItemType } from "../item-type";
import { createComponentId, type Component } from "../stores/components";
import { usePagesStore } from "../stores/pages";
import type { Variable } from "../stores/variable";
import type { CardContract, CardInstanceProps, CardTemplate } from "./types";

const TEMPLATES_STORAGE_KEY = "lowcode-card-templates";
const TEMPLATE_SCHEMA_VERSION = 1;

/** 模板被页面实例引用的情况 */
export interface CardTemplateReference {
  pageId: string;
  pageName: string;
  componentIds: number[];
}

interface State {
  templates: CardTemplate[];
}

interface CreateTemplateInput {
  name: string;
  desc?: string;
  root: Component;
  sources?: DataSource[];
  variables?: Variable[];
  relations?: DataSourceRelation[];
  contract?: CardContract;
}

interface UpdateTemplateInput {
  name?: string;
  desc?: string;
  contract?: CardContract;
  impl?: CardTemplate["impl"];
}

interface Action {
  /**
   * 新建卡片模板
   */
  createTemplate: (input: CreateTemplateInput) => CardTemplate;
  /**
   * 更新卡片模板；契约变化时自增版本，内部实现变化只刷新更新时间
   */
  updateTemplate: (id: string, patch: UpdateTemplateInput) => void;
  /**
   * 删除卡片模板，被引用时阻止删除
   */
  deleteTemplate: (id: string) => { ok: boolean; references: CardTemplateReference[] };
}

function emptyContract(): CardContract {
  return { inputs: [], events: [], methods: [], slots: [] };
}

/** 新建模板的默认根节点：设计器只允许在卡片内部编排内容 */
export function createCardTemplateRoot(): Component {
  return {
    id: createComponentId(),
    name: ItemType.Card,
    props: {
      title: { type: "static", value: "卡片标题" },
      description: { type: "static", value: "卡片描述" },
    },
    children: [],
  };
}

/** 创建空白卡片模板，随后进入可视化设计器编排内部实现 */
export function createBlankCardTemplate(name: string): CardTemplate {
  return useCardTemplatesStore.getState().createTemplate({
    name,
    root: createCardTemplateRoot(),
  });
}

/**
 * 统计模板在页面中的实例引用，删除与升级前均以此为准
 */
export function getTemplateReferences(templateId: string): CardTemplateReference[] {
  const references: CardTemplateReference[] = [];

  usePagesStore.getState().pages.forEach((page) => {
    const componentIds: number[] = [];

    const walk = (components: Component[]) => {
      components.forEach((component) => {
        if (
          component.name === ItemType.CardInstance &&
          component.props?.templateId === templateId
        ) {
          componentIds.push(component.id);
        }
        if (component.children?.length) walk(component.children);
      });
    };

    walk(page.components ?? []);

    if (componentIds.length) {
      references.push({ pageId: page.id, pageName: page.name, componentIds });
    }
  });

  return references;
}

export function getCardTemplate(templateId?: string) {
  if (!templateId) return undefined;
  return useCardTemplatesStore.getState().templates.find((item) => item.id === templateId);
}

/**
 * 订阅单个模板，模板更新时实例会随之刷新
 */
export function useCardTemplate(templateId?: string) {
  return useCardTemplatesStore((state) =>
    templateId ? state.templates.find((item) => item.id === templateId) : undefined,
  );
}

/**
 * 生成插入页面的实例属性；插槽默认不预选，避免系统自动合并数据源
 */
export function createCardInstanceProps(template: CardTemplate): CardInstanceProps {
  return {
    templateId: template.id,
    templateVersion: template.version,
    inputValues: {},
    slotMapping: {},
  };
}

/** 示例模板：演示卡片私有数据源与输入注入，便于直接验证隔离效果 */
function createSampleTemplate(): CardTemplate {
  const now = new Date().toISOString();
  const source = createSamplePageData("card").sources[0];
  const rootId = 910001;

  const root: Component = {
    id: rootId,
    name: ItemType.Card,
    props: {
      title: { type: "static", value: "订单概览" },
      description: { type: "static", value: "卡片私有数据源，实例之间互不影响" },
    },
    children: [
      {
        id: 910002,
        name: ItemType.Table,
        props: {
          dataSource: { type: "dataSource", value: { sourceId: source.id, autoLoad: true } },
        },
        children: [
          {
            id: 910003,
            name: ItemType.TableColumn,
            props: {
              title: { type: "static", value: "区域" },
              dataIndex: { type: "static", value: "region" },
            },
          },
          {
            id: 910004,
            name: ItemType.TableColumn,
            props: {
              title: { type: "static", value: "月份" },
              dataIndex: { type: "static", value: "month" },
            },
          },
          {
            id: 910005,
            name: ItemType.TableColumn,
            props: {
              title: { type: "static", value: "金额" },
              dataIndex: { type: "static", value: "amount" },
            },
          },
        ],
      },
    ],
  };

  return {
    id: "tpl_order_overview",
    name: "订单概览卡片",
    desc: "内置示例模板：私有数据源 + 标题输入",
    version: 1,
    contract: {
      inputs: [
        {
          key: "title",
          label: "标题",
          type: "text",
          defaultValue: "订单概览",
          binding: { kind: "prop", targetNodeId: rootId, targetProp: "title" },
        },
      ],
      events: [],
      methods: [],
      slots: [],
    },
    impl: {
      root,
      sources: [{ ...source, title: "卡片订单数据" }],
      variables: [],
      relations: [],
    },
    createdAt: now,
    updatedAt: now,
  };
}

const initialTemplates = [createSampleTemplate()];

export const useCardTemplatesStore = create<State & Action>()(
  persist(
    (set, get) => ({
      templates: initialTemplates,
      createTemplate: (input) => {
        const now = new Date().toISOString();
        const template: CardTemplate = {
          id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: input.name,
          desc: input.desc,
          version: 1,
          contract: input.contract ?? emptyContract(),
          contractHistory: { 1: structuredClone(input.contract ?? emptyContract()) },
          impl: {
            root: structuredClone(input.root),
            sources: structuredClone(input.sources ?? []),
            variables: structuredClone(input.variables ?? []),
            relations: structuredClone(input.relations ?? []),
          },
          createdAt: now,
          updatedAt: now,
        };

        set({ templates: [...get().templates, template] });
        return template;
      },
      updateTemplate: (id, patch) =>
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id !== id) return template;

            // 契约是唯一兼容边界：仅契约变化才升版本，内部实现调整靠 updatedAt 让展开缓存失效
            const versionChanged = "contract" in patch;
            const contractHistory =
              patch.contract === undefined
                ? template.contractHistory
                : // 保留旧版本契约，供实例升级时对比 diff
                  {
                    ...(template.contractHistory ?? {}),
                    [template.version]: structuredClone(template.contract),
                  };

            return {
              ...template,
              ...patch,
              contractHistory,
              version: versionChanged ? template.version + 1 : template.version,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
      deleteTemplate: (id) => {
        const references = getTemplateReferences(id);
        if (references.length) return { ok: false, references };

        set({ templates: get().templates.filter((template) => template.id !== id) });
        return { ok: true, references: [] };
      },
    }),
    {
      name: TEMPLATES_STORAGE_KEY,
      version: TEMPLATE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Zustand 仅在状态变更时写入存储，首次访问主动保存初始模板。
if (localStorage.getItem(TEMPLATES_STORAGE_KEY) === null) {
  useCardTemplatesStore.setState({ templates: initialTemplates });
}
