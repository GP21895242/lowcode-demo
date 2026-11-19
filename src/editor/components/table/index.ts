import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import TableDev from "./dev";
import TableProd from "./prod";
import Setter from "./setter";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Table, {
    name: ItemType.Table,
    desc: "表格",
    defaultProps: {},
    dev: TableDev,
    prod: TableProd,
    setter: Setter as any,
    methods: [
      {
        name: "search",
        desc: "搜索",
      },
      {
        name: "reload",
        desc: "刷新",
      },
    ],
    order: 4,
    allowDrag: [
      ItemType.Page,
      ItemType.Space,
      ItemType.Card,
      ItemType.TabPane,
      ItemType.Carousel,
      ItemType.Loop,
      ItemType.GridLayout,
    ],
  });
};
