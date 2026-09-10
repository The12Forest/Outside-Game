# syntax=docker/dockerfile:1

# --- Dependencies stage -------------------------------------------------------
# Pinned to $BUILDPLATFORM so npm runs natively (amd64 on GitHub runners) rather
# than under QEMU. Node's JIT crashes with SIGILL ("Illegal instruction") when
# emulated for arm64, so `npm install` must never run in the target platform.
#
# This is safe because every dependency here is pure JavaScript (express,
# socket.io, cookie-parser, qrcode) with no native addons, which makes the
# resulting node_modules portable across architectures.
FROM --platform=$BUILDPLATFORM node:22-alpine AS deps

WORKDIR /app

# NOTE: package-lock.json is gitignored in this repo, so `npm ci` is not
# possible; `npm install` is used instead. Commit a lockfile for reproducible
# builds and this can be tightened up.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# --- Runtime stage ------------------------------------------------------------
FROM node:22-alpine

WORKDIR /app

# Copy the pre-installed dependencies from the native stage.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Application code (secrets and runtime data are excluded via .dockerignore).
# Nothing below this point executes Node, so QEMU is never asked to JIT.
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
