# Build static assets (same port convention as the API: Cloud Run uses PORT, default 8080)
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image: only Node + global `serve` + dist/ (no source or devDependencies)
FROM node:22-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 8080

# Match uvicorn pattern: bind to the port Cloud Run provides (defaults to 8080)
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
