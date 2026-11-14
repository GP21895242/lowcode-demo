import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import ChartDev from "./dev";
import ChartProd from "./prod";
import Setter from "./setter";
import { DEMO_DATA } from "./view";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Chart, {
    name: ItemType.Chart,
    desc: "图表",
    defaultProps: {
      title: { type: "static", value: "示例图表" },
      chartType: { type: "static", value: "bar" },
      data: { type: "static", value: JSON.stringify(DEMO_DATA) },
    },
    dev: ChartDev,
    prod: ChartProd,
    setter: Setter as any,
    order: 10,
    allowDrag: [ItemType.Page, ItemType.Space],
  });
};
