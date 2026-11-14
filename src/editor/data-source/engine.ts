import { getDataSourceAdapter } from "./adapter";
import type { DataSource, LoadContext, LoadParams, LoadResult } from "./types";

/** 编辑态固定走 Mock；预览态默认走真实接口，数据源可单独打开 Mock 调试 */
export async function executeDataSource(
  source: DataSource,
  params: LoadParams,
  ctx: LoadContext,
): Promise<LoadResult> {
  const useMock = ctx.mode === "edit" || source.kind === "static" || source.mock.enabled;
  const kind = useMock ? "mock" : source.kind;
  const adapter = getDataSourceAdapter(kind);

  if (!adapter) {
    throw new Error(`未找到数据源适配器：${kind}`);
  }

  return adapter.load(source, params, ctx);
}
