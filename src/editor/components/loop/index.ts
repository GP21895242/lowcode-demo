import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import LoopDev from "./dev";
import LoopProd from "./prod";
import Setter from "./setter";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Loop, {
    name: ItemType.Loop,
    desc: "循环容器",
    defaultProps: {
      keyField: { type: "static", value: "" },
      scopeName: { type: "static", value: "row" },
    },
    dev: LoopDev,
    prod: LoopProd,
    setter: Setter as any,
    methods: [],
    events: [],
    order: 1.15,
    allowDrag: [
      ItemType.Page,
      ItemType.Space,
      ItemType.Card,
      ItemType.Modal,
      ItemType.TabPane,
      ItemType.Carousel,
      ItemType.Box,
      ItemType.Tabs,
      ItemType.Loop,
    ],
  });
};
