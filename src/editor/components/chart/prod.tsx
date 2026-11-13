import type { CommonComponentProps } from "../../interface";
import { ChartView } from "./view";

function ChartProd({ title, chartType, data }: CommonComponentProps) {
  return (
    <div className="w-full rounded-md bg-background p-3">
      {title ? <div className="mb-2 text-sm font-medium">{title}</div> : null}
      <ChartView chartType={chartType} data={data} />
    </div>
  );
}

export default ChartProd;
