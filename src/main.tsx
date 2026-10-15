import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { serveConnect } from "./games";
import "./styles.css";

// /connect is loaded invisibly by games, so it renders nothing.
if (location.pathname === "/connect") {
  serveConnect();
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
        <App />
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}
