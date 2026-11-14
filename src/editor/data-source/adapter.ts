import { httpAdapter } from "./adapters/http";
import { mockAdapter } from "./adapters/mock";
import type { DataSource, LoadContext, LoadParams, LoadResult } from "./types";

export interface DataSourceAdapter {
  kind: string;
  load(source: DataSource, params: LoadParams, ctx: LoadContext): Promise<LoadResult>;
}

const adapters = new Map<string, DataSourceAdapter>();

export function registerDataSourceAdapter(adapter: DataSourceAdapter) {
  adapters.set(adapter.kind, adapter);
}

export function getDataSourceAdapter(kind: string) {
  return adapters.get(kind);
}

registerDataSourceAdapter(mockAdapter);
registerDataSourceAdapter(httpAdapter);
