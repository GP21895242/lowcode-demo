import axios from "axios";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { formatDate } from "../../../lib/utils";
import type { CommonComponentProps } from "../../interface";

interface TableColumnConfig {
  title: any;
  dataIndex: string;
  type?: string;
  options?: any[];
}

function TableProd({ url, children, _execEventFlow }: CommonComponentProps, ref: any) {
  const [data, setData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState({});
  const [loading, setLoading] = useState(false);

  const getData = useCallback(
    async (params?: any) => {
      if (!url) return;

      setLoading(true);

      try {
        const response = await axios.get(url, { params });
        setData(response.data);
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    void getData(searchParams);
  }, [getData, searchParams]);

  useImperativeHandle(
    ref,
    () => ({
      search: setSearchParams,
      reload: () => {
        void getData(searchParams);
      },
    }),
    [getData, searchParams],
  );

  const columns = useMemo<TableColumnConfig[]>(() => {
    return (
      React.Children.map(children, (item: any) => {
        return {
          title: item.props?.title,
          dataIndex: item.props?.dataIndex,
          type: item.props?.type,
          options: item.props?.options,
        };
      }) || []
    );
  }, [children]);

  function renderCell(row: any, column: TableColumnConfig) {
    const value = row?.[column.dataIndex];

    if (column.type === "date") {
      return formatDate(value) ?? "";
    }

    if (column.type === "option") {
      return (
        <div className="flex items-center gap-2 text-primary">
          {(column.options || []).map((option: any, index: number) => (
            <span key={option.key ?? option.label} className="flex items-center gap-2">
              {index > 0 ? <span className="h-3 w-px bg-border" /> : null}
              <a
                className="cursor-pointer select-none hover:underline"
                onClick={() => {
                  _execEventFlow?.(option?.event?.children, row, row);
                }}
              >
                {option.label}
              </a>
            </span>
          ))}
        </div>
      );
    }

    return value;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.dataIndex}>{column.title}</TableHead>
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
        ) : data.length ? (
          data.map((row, rowIndex) => (
            <TableRow key={row.id ?? rowIndex}>
              {columns.map((column) => (
                <TableCell key={column.dataIndex}>{renderCell(row, column)}</TableCell>
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
  );
}

export default forwardRef(TableProd as any);
