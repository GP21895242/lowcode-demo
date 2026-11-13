import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import ChartDev from "./dev";
import ChartProd from "./prod";
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
    setter: [
      {
        name: "title",
        label: "标题",
        type: "input",
      },
      {
        name: "chartType",
        label: "图表类型",
        type: "select",
        options: [
          { label: "柱状图", value: "bar" },
          { label: "折线图", value: "line" },
        ],
      },
      {
        name: "data",
        label: "数据",
        type: "input",
      },
    ],
    order: 10,
    allowDrag: [ItemType.Page, ItemType.Space],
  });
};
