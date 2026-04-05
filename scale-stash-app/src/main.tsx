import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import StashManager from "./components/StashManager";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element");

createRoot(root).render(
  <StrictMode>
    <StashManager />
  </StrictMode>
);
