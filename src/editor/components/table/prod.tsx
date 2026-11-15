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
import { formatDate, getByPath } from "../../../lib/utils";
import { useDataSource, useDataSourceFields } from "../../data-source/hooks";
import type { DataSourceBinding } from "../../data-source/types";
import type { CommonComponentProps } from "../../interface";

interface TableColumnConfig {
  title: any;
  dataIndex: string;
  type?: string;
  options?: any[];
}

function TableProd({ url, children, _execEventFlow, dataSource }: CommonComponentProps, ref: any) {
  const sourceId = (dataSource as DataSourceBinding | undefined)?.sourceId;
  const {
    rows,
    loading,
    error,
    params,
    reload,
    search: searchSource,
    setSort,
  } = useDataSource(sourceId);
  const fields = useDataSourceFields(sourceId);

  const [legacyData, setLegacyData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState({});
  const [legacyLoading, setLegacyLoading] = useState(false);

  const getLegacyData = useCallback(
    async (params?: any) => {
      if (!url || sourceId) return;

      setLegacyLoading(true);

      try {
        const response = await axios.get(url, { params });
        setLegacyData(response.data);
      } finally {
        setLegacyLoading(false);
      }
    },
    [url, sourceId],
  );

  useEffect(() => {
    if (!sourceId) {
      void getLegacyData(searchParams);
    }
  }, [getLegacyData, searchParams, sourceId]);

  useImperativeHandle(
    ref,
    () => ({
      search: (values: any) => {
        if (sourceId) {
          searchSource(values ?? {});
          return;
        }
        setSearchParams(values ?? {});
      },
      reload: () => {
        if (sourceId) {
          reload();
          return;
        }
        void getLegacyData(searchParams);
      },
    }),
    [sourceId, getLegacyData, searchParams, searchSource, reload],
  );

  const columns = useMemo<TableColumnConfig[]>(() => {
    const childColumns =
      React.Children.map(children, (item: any) => {
        return {
          title: item.props?.title,
          dataIndex: item.props?.dataIndex,
          type: item.props?.type,
          options: item.props?.options,
        };
      }) || [];

    if (childColumns.length > 0) {
      return childColumns;
    }

    return fields
      .filter((field) => field.visible)
      .map((field) => ({
        title: field.label,
        dataIndex: field.dataKey,
        type: field.type === "date" ? "date" : "text",
      }));
  }, [children, fields]);

  const fieldMap = useMemo(() => new Map(fields.map((field) => [field.dataKey, field])), [fields]);

  const data = sourceId ? rows : legacyData;
  const isLoading = sourceId ? loading : legacyLoading;
  const sort = params?.sort;

  function handleSort(dataIndex: string) {
    if (!sourceId) return;
    const field = fieldMap.get(dataIndex);
    if (!field?.sortable) return;

    const next =
      sort?.field === dataIndex
        ? sort.order === "asc"
          ? { field: dataIndex, order: "desc" as const }
          : undefined
        : { field: dataIndex, order: "asc" as const };

    setSort(next);
  }

  function renderCell(row: any, column: TableColumnConfig) {
    const value = getByPath(row, column.dataIndex);

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
          {columns.map((column) => {
            const field = fieldMap.get(column.dataIndex);
            return (
              <TableHead key={column.dataIndex}>
                {sourceId && field?.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 select-none"
                    onClick={() => handleSort(column.dataIndex)}
                  >
                    {column.title}
                    <span className="text-[10px] text-muted-foreground">
                      {sort?.field === column.dataIndex ? (sort.order === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                ) : (
                  column.title
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
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
              数据源加载失败：{error}
            </TableCell>
          </TableRow>
        ) : data.length ? (
          data.map((row, rowIndex) => (
            <TableRow key={getByPath(row, fields[0]?.dataKey ?? "id") ?? rowIndex}>
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
