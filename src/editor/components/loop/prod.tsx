import type { CommonComponentProps } from "../../interface";

/**
 * 正式态兜底：正常情况下循环容器已被舞台展开为行内实例，不会直接渲染到这里
 */
function LoopProd({ children }: CommonComponentProps) {
  return <>{children}</>;
}

export default LoopProd;
