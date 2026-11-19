import { ItemType } from "../../item-type";
import type { Context } from "../../interface";
import { BASIC_ALLOW_DRAG } from "../_shared/control";
import ImageDev from "./dev";
import ImageProd from "./prod";

const DEFAULT_SRC =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimal%20abstract%20gradient%20banner%20background%2C%20soft%20light%2C%20modern%20clean&image_size=landscape_4_3";

export default (ctx: Context) => {
  ctx.registerComponent(ItemType.Image, {
    name: ItemType.Image,
    desc: "图片",
    defaultProps: {
      src: { type: "static", value: DEFAULT_SRC },
      alt: { type: "static", value: "图片" },
      height: { type: "static", value: 240 },
      fit: { type: "static", value: "cover" },
      radius: { type: "static", value: 8 },
    },
    dev: ImageDev,
    prod: ImageProd,
    setter: [
      { name: "src", label: "图片地址", type: "input" },
      { name: "alt", label: "替代文本", type: "input" },
      { name: "height", label: "高度(px)", type: "input" },
      {
        name: "fit",
        label: "填充方式",
        type: "select",
        options: [
          { label: "裁切填充", value: "cover" },
          { label: "完整显示", value: "contain" },
          { label: "拉伸填充", value: "fill" },
        ],
      },
      { name: "radius", label: "圆角(px)", type: "input" },
    ],
    methods: [],
    events: [],
    order: 1.6,
    allowDrag: BASIC_ALLOW_DRAG,
  });
};
