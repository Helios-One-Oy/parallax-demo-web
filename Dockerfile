# Northbound Dispatch web service. Written for CRACI's release job; not built on
# the Parallax dev box.
FROM mirror.gcr.io/library/node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM mirror.gcr.io/library/node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
