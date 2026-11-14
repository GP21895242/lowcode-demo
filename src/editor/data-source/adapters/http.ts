import axios from "axios";
import { getByPath } from "@/lib/utils";
import { usePageDataStore } from "@/editor/stores/page-data";
import type { DataSourceAdapter } from "../adapter";
import type { DataSource, LoadContext, LoadParams, LoadResult } from "../types";

function resolveTemplate(template: string, context: Record<string, any>) {
  return template.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const value = getByPath(context, path.trim());
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

function buildContext(params: LoadParams, variables: Record<string, any>) {
  return {
    search: params.search,
    filters: params.filters,
    sort: params.sort ?? {},
    page: params.page ?? {},
    vars: variables,
  };
}

function buildRequestParams(source: DataSource, params: LoadParams, context: Record<string, any>) {
  const configured = source.request?.params;
  if (configured && Object.keys(configured).length > 0) {
    return Object.fromEntries(
      Object.entries(configured).map(([key, value]) => [
        key,
        resolveTemplate(String(value), context),
      ]),
    );
  }

  const merged: Record<string, any> = {};
  Object.entries(params.search).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") merged[key] = value;
  });
  Object.entries(params.filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") merged[key] = value;
  });
  if (params.sort?.field) {
    merged.sort = params.sort.field;
    merged.order = params.sort.order;
  }
  if (params.page) {
    merged.pageNo = params.page.pageNo;
    merged.pageSize = params.page.pageSize;
  }
  return merged;
}

function pickRows(payload: any, resultPath?: string): any[] {
  const target = resultPath ? getByPath(payload, resultPath) : payload;
  if (Array.isArray(target)) return target;
  if (Array.isArray(target?.data)) return target.data;
  if (Array.isArray(target?.rows)) return target.rows;
  if (Array.isArray(target?.list)) return target.list;
  return [];
}

export const httpAdapter: DataSourceAdapter = {
  kind: "http",
  async load(source, params, ctx: LoadContext): Promise<LoadResult> {
    const request = source.request;
    if (!request?.url) {
      throw new Error(`数据源「${source.title}」未配置接口地址`);
    }

    const variables = usePageDataStore.getState().data;
    const context = buildContext(params, variables);
    const query = buildRequestParams(source, params, context);
    const method = request.method || "GET";

    let data: any;
    if (method !== "GET" && method !== "DELETE") {
      if (request.body && request.body.trim()) {
        const resolved = resolveTemplate(request.body, context);
        data = JSON.parse(resolved);
      } else {
        data = params;
      }
    }

    const response = await axios.request({
      url: request.url,
      method,
      headers: request.headers,
      params: method === "GET" || method === "DELETE" ? query : undefined,
      data,
      signal: ctx.signal,
    });

    const payload = response.data;
    const rows = pickRows(payload, request.resultPath);
    const total = request.totalPath
      ? getByPath(payload, request.totalPath)
      : (payload?.total ?? payload?.totalCount ?? rows.length);

    return { rows, total: Number(total) || rows.length };
  },
};
