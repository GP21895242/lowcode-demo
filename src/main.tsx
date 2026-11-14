import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ReactDOM from "react-dom/client";

import App from "./app";
import { Toaster } from "./components/ui/toast";
import { ConfirmDialogHost } from "./editor/common/confirm-dialog";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <DndProvider backend={HTML5Backend}>
    <App />
    <Toaster />
    <ConfirmDialogHost />
  </DndProvider>,
);
