import { getByPath } from "../../../lib/utils";
import { useDataSource, useDataSourceFields } from "../../data-source/hooks";
import type { DataSourceBinding } from "../../data-source/types";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";
import { ChartView } from "./view";

function ChartDev({
  _id,
  _name,
  title,
  chartType,
  data,
  xField,
  yField,
  dataSource,
}: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);
  const sourceId = (dataSource as DataSourceBinding | undefined)?.sourceId;
  const { rows, loading, error, selection, select } = useDataSource(sourceId);
  const fields = useDataSourceFields(sourceId);

  const xKey =
    xField || fields.find((field) => field.visible && field.type !== "number")?.dataKey || "label";
  const yKey = yField || fields.find((field) => field.type === "number")?.dataKey || "value";
  const chartData = sourceId ? rows.slice(0, 10) : data;

  function handleSelect(row: any) {
    if (!sourceId || !row) return;

    const value = getByPath(row, xKey);
    if (selection && selection.value === value) {
      select(null);
      return;
    }
    select({ field: xKey, value, row });
  }

  function renderChart() {
    if (sourceId && loading) {
      return <div className="py-10 text-center text-sm text-muted-foreground">加载中...</div>;
    }
    if (sourceId && error) {
      return <div className="py-10 text-center text-sm text-destructive">{error}</div>;
    }
    if (sourceId && !rows.length) {
      return <div className="py-10 text-center text-sm text-muted-foreground">暂无数据</div>;
    }

    return (
      <ChartView
        chartType={chartType}
        data={chartData}
        xKey={xKey}
        yKey={yKey}
        onSelect={sourceId ? handleSelect : undefined}
      />
    );
  }

  return (
    <div
      data-component-id={_id}
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      className="w-full rounded-md bg-background p-3"
      style={{ border: canDrop ? "1px solid #ccc" : "1px dashed #e5e7eb" }}
    >
      {title ? <div className="mb-2 text-sm font-medium">{title}</div> : null}
      {renderChart()}
      {sourceId && selection ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>已选：{String(selection.value ?? "")}</span>
          <button
            type="button"
            className="cursor-pointer text-primary hover:underline"
            onClick={() => select(null)}
          >
            清除
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ChartDev;
