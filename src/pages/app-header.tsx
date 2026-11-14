import { ChevronRight, Layers } from "lucide-react";
import type { ReactNode } from "react";

export interface AppBreadcrumbItem {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  breadcrumbs?: AppBreadcrumbItem[];
  actions?: ReactNode;
}

export default function AppHeader({ breadcrumbs, actions }: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <a href="#/pages" className="flex items-center gap-2" aria-label="返回首页">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="size-4" />
        </span>
        <span className="text-sm font-semibold">lowcode</span>
      </a>
      <div className="h-5 w-px bg-border" />

      {breadcrumbs?.length ? (
        <nav aria-label="面包屑" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-xs">
            {breadcrumbs.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
                {item.href ? (
                  <a
                    href={item.href}
                    className="truncate rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span aria-current="page" className="truncate font-medium text-foreground">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        <span className="text-xs text-muted-foreground">页面管理</span>
      )}

      <div className="flex-1" />
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
