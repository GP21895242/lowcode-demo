import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import TextDev from "./dev";
import TextProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Text, {
    name: ItemType.Text,
    desc: "文本",
    defaultProps: {
      text: { type: "static", value: "文本内容" },
      variant: { type: "static", value: "p" },
      align: { type: "static", value: "left" },
    },
    dev: TextDev,
    prod: TextProd,
    setter: [
      { name: "text", label: "内容", type: "input" },
      {
        name: "variant",
        label: "排版",
        type: "select",
        options: [
          { label: "一级标题", value: "h1" },
          { label: "二级标题", value: "h2" },
          { label: "三级标题", value: "h3" },
          { label: "四级标题", value: "h4" },
          { label: "正文", value: "p" },
          { label: "导语", value: "lead" },
          { label: "次要文本", value: "muted" },
          { label: "小号文本", value: "small" },
        ],
      },
      {
        name: "align",
        label: "对齐方式",
        type: "select",
        options: [
          { label: "左对齐", value: "left" },
          { label: "居中", value: "center" },
          { label: "右对齐", value: "right" },
        ],
      },
    ],
    methods: [],
    events: [],
    order: 1.7,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
