import React, { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useDrop } from "../../hooks/use-drop";
import type { CommonComponentProps } from "../../interface";

function TableDev({ _id, _name, children }: CommonComponentProps) {
  const { canDrop, drop } = useDrop(_id, _name);

  const columns = useMemo(() => {
    return (
      React.Children.map(children, (item: any) => ({
        title: item.props?.title,
        dataIndex: item.props?.dataIndex,
        id: item.props?._id,
      })) || []
    );
  }, [children]);

  return (
    <div
      className="w-[100%]"
      // @ts-expect-error ConnectDropTarget type mismatch
      ref={drop}
      data-component-id={_id}
      style={{ border: canDrop ? "1px solid #ccc" : "none" }}
    >
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
          <TableRow>
            <TableCell
              colSpan={Math.max(columns.length, 1)}
              className="py-6 text-center text-muted-foreground"
            >
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default TableDev;
