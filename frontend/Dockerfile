# ============================================================
# STAGE 1: Build the React app with Vite
# ============================================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
# VITE_API_BASE_URL is passed as a build arg (defaults to http://localhost:8080)
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ============================================================
# STAGE 2: Serve the static build with Nginx
# ============================================================
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the web port
EXPOSE 80

# Health check for the nginx container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
