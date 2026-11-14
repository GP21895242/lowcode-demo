import { FilePlus2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Field, FieldError, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "../components/ui/toast";
import { openConfirm } from "../editor/common/confirm-dialog";
import { usePagesStore, type PageRecord } from "../editor/stores/pages";
import AppHeader from "./app-header";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function openEditor(id: string) {
  window.location.hash = `#/pages/${encodeURIComponent(id)}/edit`;
}

export default function PageList() {
  const pages = usePagesStore((state) => state.pages);
  const createPage = usePagesStore((state) => state.createPage);
  const deletePage = usePagesStore((state) => state.deletePage);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const [nameError, setNameError] = useState("");

  const filteredPages = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();
    if (!keyword) return pages;
    return pages.filter((page) => page.name.toLocaleLowerCase().includes(keyword));
  }, [pages, query]);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = pageName.trim();
    if (!name) {
      setNameError("请输入页面名称");
      return;
    }

    const page = createPage(name);
    setDialogOpen(false);
    setPageName("");
    setNameError("");
    openEditor(page.id);
  }

  function handleDelete(page: PageRecord) {
    openConfirm({
      title: "删除页面",
      content: `确定要删除“${page.name}”吗？此操作不可恢复。`,
      okText: "删除",
      onOk: () => {
        deletePage(page.id);
        toast.add({ title: "页面已删除", type: "success" });
      },
    });
  }

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">页面管理</h1>
            <p className="mt-2 text-sm text-muted-foreground">创建、查询并维护你的低代码页面。</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus />
            新建页面
          </Button>
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="查询页面"
                className="pl-8"
                placeholder="按页面名称查询..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <span className="text-xs text-muted-foreground">共 {pages.length} 个页面</span>
          </div>

          {filteredPages.length > 0 ? (
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="px-4">页面名称</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead className="w-36 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow
                      key={page.id}
                      className="cursor-pointer"
                      onClick={() => openEditor(page.id)}
                    >
                      <TableCell className="px-4 py-3">
                        <a
                          href={`#/pages/${encodeURIComponent(page.id)}/preview`}
                          className="inline-flex max-w-full truncate rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {page.name}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateFormatter.format(new Date(page.createdAt))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateFormatter.format(new Date(page.updatedAt))}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex justify-end gap-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm" onClick={() => openEditor(page.id)}>
                            <Pencil />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(page)}
                          >
                            <Trash2 />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center border-t border-border px-6 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <FilePlus2 className="size-5 text-muted-foreground" />
              </div>
              <h2 className="text-sm font-medium">
                {pages.length === 0 ? "暂无页面" : "无匹配结果"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {pages.length === 0
                  ? "新建一个页面，开始你的设计。"
                  : "换个关键词试试，或清空当前查询。"}
              </p>
              <Button
                className="mt-5"
                variant="outline"
                size="sm"
                onClick={() => (pages.length === 0 ? setDialogOpen(true) : setQuery(""))}
              >
                {pages.length === 0 ? "立即新建" : "清空查询"}
              </Button>
            </div>
          )}
        </section>
      </main>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setPageName("");
            setNameError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建页面</DialogTitle>
            <DialogDescription>创建空白页面后，将直接进入编辑器。</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-6" onSubmit={handleCreate}>
            <Field data-invalid={!!nameError}>
              <FieldLabel htmlFor="page-name">页面名称</FieldLabel>
              <Input
                id="page-name"
                autoFocus
                placeholder="例如：订单管理"
                value={pageName}
                aria-invalid={!!nameError}
                onChange={(event) => {
                  setPageName(event.target.value);
                  if (nameError) setNameError("");
                }}
              />
              <FieldError>{nameError}</FieldError>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">创建并编辑</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
