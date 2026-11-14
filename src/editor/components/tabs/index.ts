import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import TabsDev from "./dev";
import TabsProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Tabs, {
    name: ItemType.Tabs,
    desc: "标签页",
    defaultProps: {
      variant: { type: "static", value: "default" },
    },
    dev: TabsDev,
    prod: TabsProd,
    setter: [
      {
        name: "variant",
        label: "样式",
        type: "select",
        options: [
          { label: "默认", value: "default" },
          { label: "线条", value: "line" },
        ],
      },
    ],
    order: 1.3,
    allowDrag: [ItemType.Page, ItemType.Space, ItemType.Card, ItemType.TabPane],
  });
};
