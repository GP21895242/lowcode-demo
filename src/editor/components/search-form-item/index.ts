import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import Dev from "./dev";
import Prod from "./prod";
import Setter from "./setter";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.SearchFormItem, {
    name: ItemType.SearchFormItem,
    desc: "搜索项",
    defaultProps: () => {
      return {
        name: { type: "static", value: new Date().getTime() },
        label: { type: "static", value: "标题" },
        type: { type: "static", value: "auto" },
      };
    },
    dev: Dev,
    prod: Prod,
    setter: Setter as any,
    order: 9,
    allowDrag: [ItemType.SearchForm],
  });
};
