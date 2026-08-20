import React from "react";
import ReactDOM from "react-dom/client";
import { StoreProvider } from "./store";
import { App } from "./App";
import "reactflow/dist/style.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);
