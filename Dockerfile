FROM node:22.12-alpine AS builder

COPY ./ /app

WORKDIR /app

RUN corepack enable
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install
RUN pnpm run build

FROM node:22.12-alpine AS release

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder /app/data /app/data

ENV NODE_ENV=production

RUN corepack enable
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --prod --ignore-scripts

ENTRYPOINT ["node", "build/index.js"]
