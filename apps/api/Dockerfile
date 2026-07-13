FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --workspace apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build --workspace apps/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --workspace apps/api --include-workspace-root --omit=dev
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/assets apps/api/assets
COPY migrations migrations

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
