# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22.23.2-alpine3.23

FROM ${NODE_IMAGE} AS toolchain

ARG APP_PATH=/app
WORKDIR $APP_PATH

# Keep the package manager and native build toolchain in a shared layer. Both
# dependency stages inherit this layer, while the final runtime image does not.
RUN npm install -g pnpm@9.15.9
RUN apk add --no-cache python3 make g++

FROM toolchain AS fetched

ARG APP_PATH=/app

# Fetching depends only on dependency metadata. Source-only changes can reuse
# this layer and the BuildKit-backed pnpm store.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml $APP_PATH/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --frozen-lockfile --store-dir=/pnpm/store

FROM fetched AS build

ARG APP_PATH=/app

# Copy package manifests before source files so dependency installation remains
# cached when application code changes.
COPY packages/server/package.json $APP_PATH/packages/server/package.json
COPY packages/webapp/package.json $APP_PATH/packages/webapp/package.json
COPY packages/form-renderer/package.json $APP_PATH/packages/form-renderer/package.json
COPY packages/shared-types-enums/package.json $APP_PATH/packages/shared-types-enums/package.json
COPY packages/answer-utils/package.json $APP_PATH/packages/answer-utils/package.json
COPY scripts/build-shared.js $APP_PATH/scripts/build-shared.js
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    HEYFORM_SKIP_SHARED_BUILD=1 pnpm install --offline --frozen-lockfile --store-dir=/pnpm/store

COPY packages/server $APP_PATH/packages/server
COPY packages/webapp $APP_PATH/packages/webapp
COPY packages/form-renderer $APP_PATH/packages/form-renderer
COPY packages/shared-types-enums $APP_PATH/packages/shared-types-enums
COPY packages/answer-utils $APP_PATH/packages/answer-utils
COPY packages/server/view/index.html $APP_PATH/packages/webapp/index.html

RUN mkdir -p $APP_PATH/packages/server/static/upload
RUN pnpm build:shared
RUN pnpm --filter ./packages/server build
RUN pnpm --filter ./packages/webapp build
RUN mkdir -p $APP_PATH/packages/server/static && \
    cp -R $APP_PATH/packages/webapp/dist/static/. $APP_PATH/packages/server/static/ && \
    cp $APP_PATH/packages/webapp/dist/index.html $APP_PATH/packages/server/view/index.html

FROM fetched AS prod-deps

ARG APP_PATH=/app
ENV NODE_ENV=production

COPY packages/server/package.json $APP_PATH/packages/server/package.json
COPY packages/shared-types-enums/package.json $APP_PATH/packages/shared-types-enums/package.json
COPY packages/answer-utils/package.json $APP_PATH/packages/answer-utils/package.json
COPY scripts/build-shared.js $APP_PATH/scripts/build-shared.js
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod --offline --frozen-lockfile --force \
      --filter server... --store-dir=/pnpm/store

FROM ${NODE_IMAGE} AS runner

ARG APP_PATH=/app
ENV NODE_ENV=production
WORKDIR $APP_PATH

# Only production dependencies and build output enter the runtime image. pnpm,
# Python, make, and g++ remain in the intermediate stages.
COPY --from=prod-deps $APP_PATH/node_modules $APP_PATH/node_modules
COPY --from=prod-deps $APP_PATH/packages/server/package.json $APP_PATH/packages/server/package.json
COPY --from=prod-deps $APP_PATH/packages/server/node_modules $APP_PATH/packages/server/node_modules
COPY --from=prod-deps $APP_PATH/packages/answer-utils/node_modules $APP_PATH/packages/answer-utils/node_modules
COPY --from=build $APP_PATH/packages/answer-utils/package.json $APP_PATH/packages/answer-utils/package.json
COPY --from=build $APP_PATH/packages/answer-utils/dist $APP_PATH/packages/answer-utils/dist
COPY --from=build $APP_PATH/packages/shared-types-enums/package.json $APP_PATH/packages/shared-types-enums/package.json
COPY --from=build $APP_PATH/packages/shared-types-enums/dist $APP_PATH/packages/shared-types-enums/dist

COPY --from=build $APP_PATH/packages/server/dist $APP_PATH/packages/server/dist
COPY --from=build $APP_PATH/packages/server/resources $APP_PATH/packages/server/resources
COPY --from=build $APP_PATH/packages/server/static $APP_PATH/packages/server/static
COPY --from=build $APP_PATH/packages/server/view $APP_PATH/packages/server/view
COPY --from=build $APP_PATH/packages/server/src $APP_PATH/packages/server/src
COPY --from=build $APP_PATH/packages/server/tsconfig.json $APP_PATH/packages/server/tsconfig.json

WORKDIR $APP_PATH/packages/server
RUN test -f ./dist/main.js || test -f ./dist/src/main.js || test -f ./dist/packages/server/main.js

EXPOSE 9157
CMD ["sh", "-c", "if [ -f ./dist/main.js ]; then node --enable-source-maps ./dist/main.js; elif [ -f ./dist/src/main.js ]; then node --enable-source-maps ./dist/src/main.js; else node --enable-source-maps ./dist/packages/server/main.js; fi"]
