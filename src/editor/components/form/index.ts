import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import Dev from "./dev";
import Prod from "./prod";
import Setter from "./setter";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Form, {
    name: ItemType.Form,
    desc: "表单",
    defaultProps: {
      labelPosition: { type: "static", value: "left" },
    },
    dev: Dev,
    prod: Prod,
    setter: Setter as any,
    events: [
      {
        name: "onFinish",
        desc: "校验成功",
      },
    ],
    methods: [
      {
        name: "submit",
        desc: "提交",
      },
    ],
    order: 6,
    allowDrag: [
      ItemType.Page,
      ItemType.Space,
      ItemType.Modal,
      ItemType.Card,
      ItemType.TabPane,
      ItemType.Carousel,
      ItemType.Loop,
      ItemType.GridLayout,
    ],
  });
};
