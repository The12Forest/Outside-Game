# syntax=docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

# Dependencies first, so this layer stays cached when only app code changes.
# NOTE: package-lock.json is gitignored in this repo, so `npm ci` is not
# possible; `npm install` is used instead. Commit a lockfile for reproducible
# builds and this can be tightened up.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# Application code (secrets and runtime data are excluded via .dockerignore)
COPY . .

# Runtime data directories. log.js creates LOG/ and the image router creates
# Images/, but creating them here keeps the layout explicit.
RUN mkdir -p LOG Images

# init.js binds 80/443 by default and reads ./Cert/key.pem + ./Cert/cert.pem at
# startup using relative paths, so the working directory MUST stay /app.
# Cert/ is gitignored and .dockerignore'd, so it must be mounted at runtime:
#   docker run -p 80:80 -p 443:443 -v "$PWD/Cert:/app/Cert:ro" <image>
# The container fails fast at startup if the mount is missing.
EXPOSE 80 443

CMD ["node", "init.js"]
