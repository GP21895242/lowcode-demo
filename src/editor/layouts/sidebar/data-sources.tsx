import { Database, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataSourceEditor } from "@/editor/layouts/data-source-editor";
import { RelationEditor } from "@/editor/layouts/data-source-editor/relation-editor";
import { createSamplePageData } from "@/editor/data-source/schema";
import { useDataSourceStore } from "@/editor/data-source/store";
import type { DataSource } from "@/editor/data-source/types";

const KIND_LABEL: Record<DataSource["kind"], string> = {
  http: "HTTP",
  static: "静态",
};

const DataSources: React.FC = () => {
  const sources = useDataSourceStore((state) => state.sources);
  const addSource = useDataSourceStore((state) => state.addSource);
  const deleteSource = useDataSourceStore((state) => state.deleteSource);
  const setRelations = useDataSourceStore((state) => state.setRelations);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<DataSource | null>(null);
  const [relationOpen, setRelationOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(source: DataSource) {
    setEditing(source);
    setEditorOpen(true);
  }

  function createSample() {
    const { sources: sampleSources, relations } = createSamplePageData(String(Date.now()));
    sampleSources.forEach(addSource);
    setRelations([...useDataSourceStore.getState().relations, ...relations]);
  }

  function remove(source: DataSource) {
    if (window.confirm(`确定删除数据源「${source.title}」吗？关联关系也会一并删除。`)) {
      deleteSource(source.id);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {sources.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-center">
            <Database className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">暂无数据源</p>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={createSample}>
              <Sparkles className="size-3.5" />
              创建示例数据源
            </Button>
          </div>
        ) : (
          sources.map((source) => (
            <div key={source.id} className="mb-1.5 rounded-md border border-border p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{source.title}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {source.name}
                  </div>
                </div>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    onClick={() => openEdit(source)}
                    aria-label="编辑数据源"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove(source)}
                    aria-label="删除数据源"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="rounded bg-muted px-1 py-0.5">{KIND_LABEL[source.kind]}</span>
                <span>{source.fields.length} 字段</span>
                <span>{source.mock.data.length} 行 Mock</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border p-2">
        <Button variant="outline" size="sm" className="w-full" onClick={openNew}>
          <Plus className="size-3.5" />
          新建数据源
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setRelationOpen(true)}
        >
          <Database className="size-3.5" />
          关联关系
        </Button>
      </div>

      <DataSourceEditor
        open={editorOpen}
        source={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />
      <RelationEditor open={relationOpen} onClose={() => setRelationOpen(false)} />
    </div>
  );
};

export default DataSources;
