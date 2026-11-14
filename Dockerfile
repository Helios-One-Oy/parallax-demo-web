# Northbound Dispatch web service. The release job installs and compiles on the
# CRACI runner, where every download is recorded. The image only copies the result,
# so nothing is fetched while the image is built.
# The base is the fleet's own image, built by parallax-demo-base on a CRACI runner.
FROM ghcr.io/helios-one-oy/parallax-demo-base:22
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
