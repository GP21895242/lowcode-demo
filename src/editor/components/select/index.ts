import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import SelectDev from "./dev";
import SelectProd from "./prod";

const DEFAULT_OPTIONS = [
  { key: 1, label: "选项一" },
  { key: 2, label: "选项二" },
  { key: 3, label: "选项三" },
];

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Select, {
    name: ItemType.Select,
    desc: "下拉选择",
    defaultProps: {
      label: { type: "static", value: "标签" },
      placeholder: { type: "static", value: "请选择" },
      options: { type: "static", value: DEFAULT_OPTIONS },
      defaultValue: { type: "static", value: "" },
    },
    dev: SelectDev,
    prod: SelectProd,
    setter: [
      { name: "label", label: "标签", type: "input" },
      { name: "placeholder", label: "占位提示", type: "input" },
      { name: "options", label: "选项", type: "options" },
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
    order: 3.3,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
