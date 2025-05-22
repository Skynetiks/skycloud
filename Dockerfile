FROM node:22-alpine3.21 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

RUN apk add --no-cache ffmpeg tzdata

WORKDIR /skycloud

COPY prisma ./prisma
COPY package.json .
COPY pnpm-lock.yaml .

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY src ./src
COPY next.config.js ./next.config.js
COPY tsup.config.ts ./tsup.config.ts
COPY tsconfig.json ./tsconfig.json
COPY mimes.json ./mimes.json
COPY code.json ./code.json

ENV NEXT_TELEMETRY_DISABLED=1 \
  NODE_ENV=production

RUN SKYCLOUD_BUILD=true pnpm run build

FROM base

COPY --from=deps /skycloud/node_modules ./node_modules

COPY --from=builder /skycloud/build ./build
COPY --from=builder /skycloud/.next ./.next

COPY --from=builder /skycloud/mimes.json ./mimes.json
COPY --from=builder /skycloud/code.json ./code.json
COPY --from=builder /skycloud/generated ./generated


RUN pnpm build:prisma

# clean
RUN rm -rf /tmp/* /root/*

ENV NODE_ENV=production

ARG SKYCLOUD_GIT_SHA
ENV SKYCLOUD_GIT_SHA=${SKYCLOUD_GIT_SHA:-"unknown"}

CMD ["node", "--enable-source-maps", "build/server"]
