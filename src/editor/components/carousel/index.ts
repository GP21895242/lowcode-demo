import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import CarouselDev from "./dev";
import CarouselProd from "./prod";
import Setter from "./setter";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Carousel, {
    name: ItemType.Carousel,
    desc: "轮播图",
    defaultProps: {
      sizes: { type: "static", value: 1 },
      spacing: { type: "static", value: 16 },
      orientation: { type: "static", value: "horizontal" },
      align: { type: "static", value: "start" },
      loop: { type: "static", value: "true" },
    },
    dev: CarouselDev,
    prod: CarouselProd,
    setter: Setter as any,
    methods: [],
    events: [],
    order: 1.25,
    allowDrag: [
      ItemType.Page,
      ItemType.Space,
      ItemType.Card,
      ItemType.Modal,
      ItemType.TabPane,
      ItemType.GridLayout,
    ],
  });
};
