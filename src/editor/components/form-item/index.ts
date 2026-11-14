import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import Dev from "./dev";
import Prod from "./prod";
import Setter from "./setter";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.FormItem, {
    name: ItemType.FormItem,
    desc: "表单项",
    defaultProps: () => {
      return {
        name: { type: "static", value: new Date().getTime() },
        label: { type: "static", value: "标题" },
        options: { type: "static", value: [] },
      };
    },
    dev: Dev,
    prod: Prod,
    setter: Setter as any,
    order: 7,
    allowDrag: [ItemType.Form],
  });
};
