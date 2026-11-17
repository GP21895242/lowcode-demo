import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "lowcode-pages";

const seededPage = {
  id: "page_e2e",
  name: "E2E 页面",
  schemaVersion: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  components: [
    {
      id: 1,
      name: "Page",
      props: {},
      desc: "页面",
      children: [
        {
          id: 2,
          name: "Button",
          props: { text: { type: "static", value: "E2E 按钮" } },
          desc: "按钮",
        },
      ],
    },
  ],
  variables: [],
  sources: [],
  relations: [],
  interactions: [],
  dismissedSuggestions: [],
};

async function seedPage(page: Page, record: typeof seededPage = seededPage) {
  await page.addInitScript(
    ([key, payload]) => {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    [STORAGE_KEY, { state: { pages: [record] }, version: 4 }] as const,
  );
}

test("页面列表展示默认页面并支持搜索", async ({ page }) => {
  await page.goto("/#/pages");

  await expect(page.getByRole("heading", { name: "页面管理" })).toBeVisible();
  await expect(page.getByRole("link", { name: "首页", exact: true })).toBeVisible();

  await page.getByLabel("查询页面").fill("不存在的页面");
  await expect(page.getByRole("heading", { name: "无匹配结果" })).toBeVisible();

  await page.getByLabel("查询页面").fill("首页");
  await expect(page.getByRole("link", { name: "首页", exact: true })).toBeVisible();
});

test("新建页面后进入编辑器", async ({ page }) => {
  await page.goto("/#/pages");

  await page.getByRole("button", { name: "新建页面" }).click();
  await page.getByLabel("页面名称").fill("E2E 新建页");
  await page.getByRole("button", { name: "创建并编辑" }).click();

  await expect(page).toHaveURL(/#\/pages\/[^/]+\/edit/);
  await expect(page.getByText("编辑：E2E 新建页")).toBeVisible();
  await expect(page.getByRole("button", { name: "组件库" })).toBeVisible();
  await expect(page.getByRole("button", { name: "保存", exact: true })).toBeVisible();
});

test("列表中的编辑入口打开对应页面", async ({ page }) => {
  await seedPage(page);
  await page.goto("/#/pages");

  const row = page.getByRole("row", { name: /E2E 页面/ });
  await row.getByRole("button", { name: "编辑" }).click();

  await expect(page).toHaveURL(/#\/pages\/page_e2e\/edit/);
  await expect(page.getByText("编辑：E2E 页面")).toBeVisible();
});

test("保存后可以进入预览并渲染页面组件", async ({ page }) => {
  await seedPage(page);
  await page.goto("/#/pages/page_e2e/edit");

  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("页面保存成功")).toBeVisible();

  await page.getByRole("button", { name: "预览", exact: true }).click();

  await expect(page).toHaveURL(/#\/pages\/page_e2e\/preview\?from=edit/);
  await expect(page.getByRole("button", { name: "编辑页面" })).toBeVisible();
  await expect(page.getByRole("button", { name: "E2E 按钮" })).toBeVisible();
});

test("删除页面需要确认并移除记录", async ({ page }) => {
  await seedPage(page);
  await page.goto("/#/pages");

  const row = page.getByRole("row", { name: /E2E 页面/ });
  await row.getByRole("button", { name: "删除" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "删除" }).click();

  await expect(page.getByText("页面已删除")).toBeVisible();
  await expect(page.getByRole("row", { name: /E2E 页面/ })).toHaveCount(0);
});

test("未知页面提示不存在并返回列表", async ({ page }) => {
  await page.goto("/#/pages/missing_page/preview");

  await expect(page.getByRole("heading", { name: "页面不存在" })).toBeVisible();
  await page.getByRole("button", { name: "返回列表" }).click();

  await expect(page).toHaveURL(/#\/pages$/);
  await expect(page.getByRole("heading", { name: "页面管理" })).toBeVisible();
});
