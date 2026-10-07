import { Space as AntdSpace } from "antd";
import type { CommonComponentProps } from "../../interface";

function Space({ children, size, direction }: CommonComponentProps) {
  return (
    <AntdSpace
      direction={direction}
      size={size}
      style={{ width: direction === "vertical" ? "100%" : "" }}
    >
      {children}
    </AntdSpace>
  );
}

export default Space;
