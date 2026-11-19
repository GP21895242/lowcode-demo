import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import LinkDev from "./dev";
import LinkProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Link, {
    name: ItemType.Link,
    desc: "链接",
    defaultProps: {
      text: { type: "static", value: "链接文字" },
      href: { type: "static", value: "https://" },
      target: { type: "static", value: "_self" },
      underline: { type: "static", value: "hover" },
    },
    dev: LinkDev,
    prod: LinkProd,
    setter: [
      { name: "text", label: "文本", type: "input" },
      { name: "href", label: "链接地址", type: "input" },
      {
        name: "target",
        label: "打开方式",
        type: "select",
        options: [
          { label: "当前窗口", value: "_self" },
          { label: "新窗口", value: "_blank" },
        ],
      },
      {
        name: "underline",
        label: "下划线",
        type: "select",
        options: [
          { label: "悬停显示", value: "hover" },
          { label: "始终显示", value: "always" },
          { label: "不显示", value: "none" },
        ],
      },
    ],
    methods: [],
    events: [],
    order: 1.8,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
