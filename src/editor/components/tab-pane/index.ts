import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import TabPaneDev from "./dev";
import TabPaneProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.TabPane, {
    name: ItemType.TabPane,
    desc: "标签页项",
    defaultProps: {
      label: { type: "static", value: "标签页" },
    },
    dev: TabPaneDev,
    prod: TabPaneProd,
    setter: [
      {
        name: "label",
        label: "标签页标题",
        type: "input",
      },
    ],
    order: 1.4,
    allowDrag: [ItemType.Tabs],
  });
};
