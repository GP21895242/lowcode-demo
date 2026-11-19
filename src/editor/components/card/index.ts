import type { Context } from "../../interface";
import { ItemType } from "../../item-type";
import CardDev from "./dev";
import CardProd from "./prod";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Card, {
    name: ItemType.Card,
    desc: "卡片",
    defaultProps: {
      title: { type: "static", value: "卡片标题" },
      description: { type: "static", value: "卡片描述" },
    },
    dev: CardDev,
    prod: CardProd,
    setter: [
      {
        name: "title",
        label: "标题",
        type: "input",
      },
      {
        name: "description",
        label: "描述",
        type: "input",
      },
    ],
    methods: [],
    events: [],
    order: 1.2,
    allowDrag: [
      ItemType.Page,
      ItemType.Space,
      ItemType.Card,
      ItemType.TabPane,
      ItemType.Carousel,
      ItemType.GridLayout,
    ],
  });
};
