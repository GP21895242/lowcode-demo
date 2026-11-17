import { useEffect, useState } from "react";
import CardTemplateDesignPage from "./pages/card-template-design-page";
import EditorPage from "./pages/editor-page";
import PageList from "./pages/page-list";

type Route =
  | { name: "list" }
  | { name: "edit"; pageId: string }
  | { name: "preview"; pageId: string; fromEdit: boolean }
  | { name: "cardTemplateDesign"; templateId: string; from?: string };

function readRoute(): Route {
  const hash = window.location.hash.slice(1) || "/pages";
  const [path, query = ""] = hash.split("?");
  if (path === "/" || path === "/pages") return { name: "list" };

  const templateMatch = path.match(/^\/card-templates\/([^/]+)\/design\/?$/);
  if (templateMatch) {
    try {
      return {
        name: "cardTemplateDesign",
        templateId: decodeURIComponent(templateMatch[1]),
        from: new URLSearchParams(query).get("from") ?? undefined,
      };
    } catch {
      return { name: "list" };
    }
  }

  const match = path.match(/^\/pages\/([^/]+)(?:\/(edit|preview))?\/?$/);
  if (!match) return { name: "list" };

  try {
    const pageId = decodeURIComponent(match[1]);
    if (match[2] === "preview") {
      return {
        name: "preview",
        pageId,
        fromEdit: new URLSearchParams(query).get("from") === "edit",
      };
    }
    return { name: "edit", pageId };
  } catch {
    return { name: "list" };
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/pages");
    }

    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route.name === "cardTemplateDesign") {
    return (
      <CardTemplateDesignPage
        key={route.templateId}
        templateId={route.templateId}
        from={route.from}
      />
    );
  }
  if (route.name === "edit") {
    return <EditorPage key={route.pageId} pageId={route.pageId} view="edit" />;
  }
  if (route.name === "preview") {
    return (
      <EditorPage
        key={route.pageId}
        pageId={route.pageId}
        view="preview"
        fromEdit={route.fromEdit}
      />
    );
  }

  return <PageList />;
}
