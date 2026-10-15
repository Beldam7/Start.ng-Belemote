import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { serveConnect } from "./games";
import NotFound from "./NotFound";
import "./styles.css";

// The app's pages. Keep this in step with the exact-match locations in nginx.conf.
const HOME_PATHS = ["/", "/index.html"];

// /connect is loaded invisibly by games, so it renders nothing.
if (location.pathname === "/connect") {
  serveConnect();
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {HOME_PATHS.includes(location.pathname) ? (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <NotFound />
      )}
    </React.StrictMode>
  );
}
