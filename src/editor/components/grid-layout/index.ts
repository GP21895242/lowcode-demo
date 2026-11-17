import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import GridLayoutDev from "./dev";
import GridLayoutProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.GridLayout, {
    name: ItemType.GridLayout,
    desc: "自由布局",
    defaultProps: {
      cols: { type: "static", value: 12 },
      rowHeight: { type: "static", value: 24 },
      layout: { type: "static", value: [] },
    },
    dev: GridLayoutDev,
    prod: GridLayoutProd,
    setter: [
      {
        name: "cols",
        label: "列数",
        type: "input",
      },
      {
        name: "rowHeight",
        label: "行高(px)",
        type: "input",
      },
    ],
    methods: [],
    events: [],
    order: 1.05,
    allowDrag: [ItemType.Page],
  });
};
