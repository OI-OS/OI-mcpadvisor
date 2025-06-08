FROM node:22.12-alpine AS builder

RUN apk add --no-cache curl

# Install pnpm directly without using corepack
RUN npm install -g pnpm@9.15.0

COPY ./ /app

WORKDIR /app

# Use pnpm for installation with store cache
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:22.12-alpine AS release

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/data /app/data

ENV NODE_ENV=production

# Install pnpm directly without using corepack
RUN npm install -g pnpm@9.15.0

# Use pnpm for production installation
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

ENTRYPOINT ["node", "build/index.js"]
