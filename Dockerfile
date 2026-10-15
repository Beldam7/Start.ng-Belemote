# ---- Stage 1: malware gate (build fails here if any signature matches) ----
FROM alpine:3.20 AS malware-scan
WORKDIR /scan
COPY . .
RUN sh malware-scan.sh /scan && touch /scan/.scan-passed

# ---- Stage 2: build ----
FROM node:20-alpine AS build
WORKDIR /app
# Forces the scan stage to pass BEFORE npm runs any install scripts
COPY --from=malware-scan /scan/.scan-passed /tmp/.scan-passed
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# Vite bakes these in at build time. In Coolify, tick Build Variable for both.
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ---- Stage 3: serve ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
