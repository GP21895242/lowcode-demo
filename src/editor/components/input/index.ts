import { BASIC_ALLOW_DRAG } from "../_shared/control";
import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import InputDev from "./dev";
import InputProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Input, {
    name: ItemType.Input,
    desc: "输入框",
    defaultProps: {
      label: { type: "static", value: "标签" },
      placeholder: { type: "static", value: "请输入" },
      defaultValue: { type: "static", value: "" },
    },
    dev: InputDev,
    prod: InputProd,
    setter: [
      { name: "label", label: "标签", type: "input" },
      { name: "placeholder", label: "占位提示", type: "input" },
      { name: "defaultValue", label: "默认值", type: "input" },
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
    order: 3.1,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
