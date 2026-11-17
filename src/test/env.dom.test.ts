import { describe, expect, it } from "vite-plus/test";

describe("happy-dom 测试环境", () => {
  it("提供页面运行时依赖的浏览器 API", () => {
    expect(typeof window.matchMedia).toBe("function");
    expect(typeof window.ResizeObserver).toBe("function");
    expect(typeof window.PointerEvent).toBe("function");
    expect(typeof window.localStorage.setItem).toBe("function");
    expect(typeof window.history.replaceState).toBe("function");
  });

  it("支持 hash 路由与 localStorage 读写", () => {
    window.history.replaceState(null, "", "#/pages/demo/preview?region=east");
    expect(window.location.hash).toBe("#/pages/demo/preview?region=east");

    localStorage.setItem("lowcode-test", "ok");
    expect(localStorage.getItem("lowcode-test")).toBe("ok");
  });
});
