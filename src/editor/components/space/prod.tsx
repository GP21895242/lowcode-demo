import type { CommonComponentProps } from "../../interface";

const gapMap: Record<string, string> = {
  small: "gap-2",
  middle: "gap-4",
  large: "gap-6",
};

function SpaceProd({ children, size, direction }: CommonComponentProps) {
  return (
    <div
      className={`flex ${direction === "vertical" ? "flex-col" : "flex-row"} ${
        gapMap[size] || gapMap.middle
      }`}
      style={{ width: direction === "vertical" ? "100%" : undefined }}
    >
      {children}
    </div>
  );
}

export default SpaceProd;
