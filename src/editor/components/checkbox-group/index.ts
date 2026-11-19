import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import CheckboxGroupDev from "./dev";
import CheckboxGroupProd from "./prod";

const DEFAULT_OPTIONS = [
  { key: 1, label: "选项一" },
  { key: 2, label: "选项二" },
  { key: 3, label: "选项三" },
];

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.CheckboxGroup, {
    name: ItemType.CheckboxGroup,
    desc: "多选框组",
    defaultProps: {
      label: { type: "static", value: "标签" },
      options: { type: "static", value: DEFAULT_OPTIONS },
      defaultValue: { type: "static", value: "" },
    },
    dev: CheckboxGroupDev,
    prod: CheckboxGroupProd,
    setter: [
      { name: "label", label: "标签", type: "input" },
      { name: "options", label: "选项", type: "options" },
      { name: "defaultValue", label: "默认值", type: "input", placeholder: "多个值用逗号分隔" },
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
    order: 3.5,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
