import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import SwitchDev from "./dev";
import SwitchProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Switch, {
    name: ItemType.Switch,
    desc: "开关",
    defaultProps: {
      label: { type: "static", value: "开关" },
      defaultChecked: { type: "static", value: "false" },
    },
    dev: SwitchDev,
    prod: SwitchProd,
    setter: [
      { name: "label", label: "标签", type: "input" },
      {
        name: "defaultChecked",
        label: "默认开启",
        type: "select",
        options: [
          { label: "否", value: "false" },
          { label: "是", value: "true" },
        ],
      },
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
    order: 3.6,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
