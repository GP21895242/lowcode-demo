<!-- CODEGRAPH_START -->

## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## UI 组件规范（shadcn + Base UI）

- 新增 UI 组件统一使用 shadcn CLI 添加（`npx shadcn@latest add <component>`）。当前 `components.json` 的 `style` 为 `base-vega`，底层交互库为 `@base-ui/react`；禁止引入 `@radix-ui/*` 系列依赖。
- 设计令牌与主题统一维护在 `src/index.css`（`@theme inline` + CSS 变量），类名合并统一使用 `src/lib/utils.ts` 导出的 `cn`。
- `src/components/ui/` 下由 shadcn 生成的组件与目录属于生成产物：没有用户的明确指令，不得修改、删除、重命名或重写其内容（含格式化、import 路径调整）。
- 若确实需要调整生成组件，须先向用户说明原因并取得明确同意；能通过主题变量、`components.json` 或调用方 `className` 解决时，优先在生成文件之外处理。

## 路径别名与导入规范

- 项目已配置 `@/*` 路径别名指向 `src/`，统一维护在 `tsconfig.json`、`tsconfig.app.json`、`vite.config.ts` 与 `components.json`；新增或调整别名时需同步更新这几处。
- 相对路径引用达到三层（`../../../`）及以上时，必须改用 `@/` 别名导入，例如 `@/components/ui/button`、`@/lib/utils`、`@/editor/stores/components`。
- 一层至两层的相对导入（`./`、`../`、`../../`）保持不变。

## Others

Please use chinese as default language for communication。
