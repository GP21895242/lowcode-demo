import React, { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getByPath } from "@/lib/utils";
import { useDataSource, useDataSourceFields } from "../../data-source/hooks";
import type { DataSourceBinding } from "../../data-source/types";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function TableDev({ _id, _name, children, dataSource }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);
  const sourceId = (dataSource as DataSourceBinding | undefined)?.sourceId;
  const { rows, loading, error } = useDataSource(sourceId);
  const fields = useDataSourceFields(sourceId);

  const columns = useMemo(() => {
    const childColumns =
      React.Children.map(children, (item: any) => ({
        title: item.props?.title,
        dataIndex: item.props?.dataIndex,
        id: item.props?._id,
      })) || [];

    if (childColumns.length > 0) {
      return childColumns;
    }

    return fields
      .filter((field) => field.visible)
      .map((field) => ({
        title: field.label,
        dataIndex: field.dataKey,
        id: undefined,
      }));
  }, [children, fields]);

  return (
    <div
      className="w-[100%]"
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      data-component-id={_id}
      style={{ border: canDrop ? "1px solid #ccc" : "none" }}
    >
      {sourceId ? (
        <div className="mb-1 text-[10px] text-muted-foreground">Mock 数据预览</div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column: any) => (
              <TableHead key={column.dataIndex}>
                <div data-component-id={column.id}>{column.title}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(columns.length, 1)}
                className="py-6 text-center text-muted-foreground"
              >
                加载中...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(columns.length, 1)}
                className="py-6 text-center text-destructive"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.slice(0, 5).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column: any) => (
                  <TableCell key={column.dataIndex}>
                    {getByPath(row, column.dataIndex) ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={Math.max(columns.length, 1)}
                className="py-6 text-center text-muted-foreground"
              >
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default TableDev;
