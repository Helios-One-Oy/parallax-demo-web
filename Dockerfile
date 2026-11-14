# Northbound Dispatch web service. The release job installs and compiles on the
# CRACI runner, where every download is recorded. The image only copies the result,
# so nothing is fetched while the image is built.
FROM mirror.gcr.io/library/node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
