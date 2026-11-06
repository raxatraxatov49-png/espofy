
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";

// ESPOFIY — TELEGRAM MINI APP SETTINGS
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  if (typeof tg.disableVerticalSwipes === "function") {
    tg.disableVerticalSwipes();
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
