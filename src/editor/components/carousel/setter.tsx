import CommonSetter from "../../common/common-setter";
import type { ComponentSetter } from "../../interface";

const BASIC_SETTERS: ComponentSetter[] = [
  {
    name: "sizes",
    label: "每屏显示数",
    type: "select",
    options: [
      { label: "1 个", value: "1" },
      { label: "2 个", value: "2" },
      { label: "3 个", value: "3" },
      { label: "4 个", value: "4" },
    ],
  },
  {
    name: "spacing",
    label: "间距(px)",
    type: "input",
  },
  {
    name: "orientation",
    label: "轮播方向",
    type: "select",
    options: [
      { label: "水平", value: "horizontal" },
      { label: "垂直", value: "vertical" },
    ],
  },
  {
    name: "align",
    label: "对齐方式",
    type: "select",
    options: [
      { label: "起点对齐", value: "start" },
      { label: "居中对齐", value: "center" },
      { label: "终点对齐", value: "end" },
    ],
  },
  {
    name: "loop",
    label: "循环播放",
    type: "select",
    options: [
      { label: "开启", value: "true" },
      { label: "关闭", value: "false" },
    ],
  },
];

function Setter() {
  return (
    <>
      <CommonSetter setters={BASIC_SETTERS} />
      <p className="px-3 py-2 text-xs text-muted-foreground">
        拖入子组件作为轮播内容；需要按数据循环时可在外层使用「循环容器」。
      </p>
    </>
  );
}

export default Setter;
