# startng-fe

React + Vite + TypeScript frontend for start.ng. Landing page with email/password and Google sign-in against startng-be.

```bash
cp .env.example .env   # set VITE_API_URL and VITE_GOOGLE_CLIENT_ID
npm install && npm run dev
```

## Deploy (Coolify)
Dockerfile build pack (nginx, port 80). VITE_API_URL and VITE_GOOGLE_CLIENT_ID are build-time, so mark them as
Build Variables in Coolify. GitHub secrets: COOLIFY_WEBHOOK_URL (optional COOLIFY_TOKEN); the
Deploy (Coolify) workflow runs only after Malware Scan (CI Gate) passes on main.
