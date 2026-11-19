import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import CardInstanceDev from "./dev";
import CardInstanceProd from "./prod";
import CardInstanceSetter from "./setter";

/**
 * 卡片实例组件：页面只持有模板引用与契约数据，内部实现由模板独立维护
 */
export default function registerCardInstanceComponent(ctx: Context) {
  ctx.registerComponent(ItemType.CardInstance, {
    name: ItemType.CardInstance,
    desc: "卡片实例",
    // 实例属性由插入模板时生成，物料不直接提供默认值
    defaultProps: () => ({}),
    dev: CardInstanceDev,
    prod: CardInstanceProd,
    setter: CardInstanceSetter as any,
    events: [],
    methods: [],
    order: 1.1,
    hiddenInMaterial: true,
    allowDrag: [
      ItemType.Page,
      ItemType.Space,
      ItemType.Card,
      ItemType.TabPane,
      ItemType.Carousel,
      ItemType.GridLayout,
    ],
  });
}
