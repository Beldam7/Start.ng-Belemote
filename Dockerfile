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
ARG VITE_SITE_URL
ENV VITE_API_URL=$VITE_API_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

# ---- Stage 3: serve ----
FROM nginx:1.27-alpine
# nginx.conf is a template: the image fills in ${SSR_UPSTREAM} (only that name) when the container starts.
# SSR_UPSTREAM is the address of the startng-be API, which renders each game's page; set it in Coolify
# as a normal (runtime) variable if the API isn't at https://api.start.ng.
ENV SSR_UPSTREAM=https://api.start.ng NGINX_ENVSUBST_FILTER=SSR_
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
