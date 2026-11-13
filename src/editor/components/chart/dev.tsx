import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";
import { ChartView } from "./view";

function ChartDev({ _id, _name, title, chartType, data }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className="w-full rounded-md bg-background p-3"
      style={{ border: canDrop ? "1px solid #ccc" : "1px dashed #e5e7eb" }}
    >
      {title ? <div className="mb-2 text-sm font-medium">{title}</div> : null}
      <ChartView chartType={chartType} data={data} />
    </div>
  );
}

export default ChartDev;
