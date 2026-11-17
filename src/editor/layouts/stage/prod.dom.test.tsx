import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { getActivePageStores } from "../../page-store/active";
import { PageProvider } from "../../page-store/provider";
import type { PageDesignInput } from "../../page-store/types";
import { useComponentConfigStore } from "../../stores/component-config";
import type { CommonComponentProps } from "../../interface";
import ProdStage from "./prod";

const PageShell = ({ children }: CommonComponentProps) => <div>{children}</div>;
const TextProd = ({ text }: CommonComponentProps) => <span>{String(text)}</span>;
const ButtonProd = ({ text, onClick }: CommonComponentProps) => (
  <button type="button" onClick={onClick}>
    {text}
  </button>
);

function registerFakeComponents() {
  useComponentConfigStore.setState({
    componentConfig: {
      Page: {
        name: "Page",
        desc: "页面",
        prod: PageShell,
        dev: PageShell,
        order: 0,
        allowDrag: [],
      },
      Text: {
        name: "Text",
        desc: "文本",
        prod: TextProd,
        dev: TextProd,
        order: 1,
        allowDrag: ["Page"],
      },
      HookButton: {
        name: "HookButton",
        desc: "事件按钮",
        prod: ButtonProd,
        dev: ButtonProd,
        order: 2,
        allowDrag: ["Page"],
        events: [{ name: "onClick", desc: "点击事件" }],
      },
    },
  });
}

const design: PageDesignInput = {
  components: [
    {
      id: 1,
      name: "Page",
      props: {},
      children: [
        { id: 2, name: "Text", props: { text: { type: "static", value: "静态文本" } } },
        { id: 3, name: "Text", props: { text: { type: "variable", value: "msg" } } },
        {
          id: 4,
          name: "Text",
          props: { text: { type: "static", value: "隐藏文本" } },
          hidden: { type: "static", value: true },
        },
        {
          id: 5,
          name: "HookButton",
          props: {
            text: "触发事件",
            onClick: {
              children: [
                {
                  id: "n1",
                  type: "action",
                  config: {
                    type: "SetVariable",
                    config: { variable: "clicked", value: "yes" },
                  },
                },
              ],
            },
          },
        },
        { id: 6, name: "Unknown", props: { text: { type: "static", value: "未注册" } } },
      ],
    },
  ],
  variables: [{ name: "msg", defaultValue: "变量文本" }],
};

function renderStage() {
  return render(
    <PageProvider view="preview" design={design}>
      <ProdStage />
    </PageProvider>,
  );
}

describe("正式态页面渲染", () => {
  beforeEach(() => {
    registerFakeComponents();
  });

  it("渲染静态属性、变量属性并跳过隐藏与未注册组件", () => {
    renderStage();

    expect(screen.getByText("静态文本")).toBeInTheDocument();
    expect(screen.getByText("变量文本")).toBeInTheDocument();
    expect(screen.queryByText("隐藏文本")).toBeNull();
    expect(screen.queryByText("未注册")).toBeNull();
  });

  it("组件事件按配置的事件流执行", async () => {
    renderStage();

    fireEvent.click(screen.getByRole("button", { name: "触发事件" }));

    await waitFor(() => {
      expect(getActivePageStores().pageData.getState().data.clicked).toBe("yes");
    });
  });
});
