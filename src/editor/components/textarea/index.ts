import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import TextareaDev from "./dev";
import TextareaProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Textarea, {
    name: ItemType.Textarea,
    desc: "多行文本",
    defaultProps: {
      label: { type: "static", value: "标签" },
      placeholder: { type: "static", value: "请输入" },
      defaultValue: { type: "static", value: "" },
      rows: { type: "static", value: 3 },
    },
    dev: TextareaDev,
    prod: TextareaProd,
    setter: [
      { name: "label", label: "标签", type: "input" },
      { name: "placeholder", label: "占位提示", type: "input" },
      { name: "defaultValue", label: "默认值", type: "input" },
      { name: "rows", label: "行数", type: "input" },
      {
        name: "disabled",
        label: "禁用",
        type: "select",
        options: [
          { label: "否", value: "false" },
          { label: "是", value: "true" },
        ],
      },
    ],
    methods: [],
    events: [],
    order: 3.2,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
