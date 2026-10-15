import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import Docs from "./Docs";
import { serveConnect } from "./games";
import NotFound from "./NotFound";
import "./styles.css";

// The app's pages. Keep these in step with the locations in nginx.conf.
const HOME_PATHS = ["/", "/index.html"];
const APPROVE_PATH = /^\/approve\/[\w-]{8,40}\/?$/; // the homepage, with "put this game live?" on top
const DOCS_PATHS = ["/docs", "/docs/"];

// /connect is loaded invisibly by games, so it renders nothing.
if (location.pathname === "/connect") {
  serveConnect();
} else {
  const path = location.pathname;
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {HOME_PATHS.includes(path) || APPROVE_PATH.test(path) ? (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
          <App />
        </GoogleOAuthProvider>
      ) : DOCS_PATHS.includes(path) ? (
        <Docs />
      ) : (
        <NotFound />
      )}
    </React.StrictMode>
  );
}
