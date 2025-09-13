import React from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
// import "./index.css";
import ContentApp from "./ContentApp";

// Create a container for our React app
const root = document.createElement("div");
root.id = "__gmail_reply_assistant_container";
document.body.append(root);

// Initialize React app
createRoot(root).render(
  <StrictMode>
    <ContentApp />
  </StrictMode>
);
