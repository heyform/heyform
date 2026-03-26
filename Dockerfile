FROM node:18.20.0-alpine3.19 AS base

ARG APP_PATH=/app
WORKDIR $APP_PATH

RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++

COPY package.json $APP_PATH/package.json
COPY pnpm-lock.yaml $APP_PATH/pnpm-lock.yaml
COPY pnpm-workspace.yaml $APP_PATH/pnpm-workspace.yaml
COPY packages/server $APP_PATH/packages/server
COPY packages/shared-types-enums $APP_PATH/packages/shared-types-enums
RUN mkdir -p $APP_PATH/packages/server/static/upload
COPY packages/webapp $APP_PATH/packages/webapp
COPY packages/form-renderer $APP_PATH/packages/form-renderer
COPY packages/server/view/index.html $APP_PATH/packages/webapp/index.html

RUN pnpm install
RUN pnpm --filter @heyform-inc/shared-types-enums build
RUN pnpm build:server
RUN pnpm build:webapp
RUN mkdir -p $APP_PATH/packages/server/static
RUN cp -R $APP_PATH/packages/webapp/dist/static/. $APP_PATH/packages/server/static/
RUN cp $APP_PATH/packages/webapp/dist/index.html $APP_PATH/packages/server/view/index.html

FROM node:18.20.0-alpine3.19 AS runner

ARG APP_PATH=/app
WORKDIR $APP_PATH

RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++

COPY package.json $APP_PATH/package.json
COPY pnpm-lock.yaml $APP_PATH/pnpm-lock.yaml
COPY packages/server/package.json $APP_PATH/packages/server/package.json

RUN printf "packages:\n  - 'packages/server'\n" > $APP_PATH/pnpm-workspace.yaml
RUN pnpm install --prod --frozen-lockfile --filter ./packages/server...

COPY --from=base $APP_PATH/packages/shared-types-enums $APP_PATH/packages/shared-types-enums
COPY --from=base $APP_PATH/packages/server/dist $APP_PATH/packages/server/dist
COPY --from=base $APP_PATH/packages/server/resources $APP_PATH/packages/server/resources
COPY --from=base $APP_PATH/packages/server/static $APP_PATH/packages/server/static
COPY --from=base $APP_PATH/packages/server/view $APP_PATH/packages/server/view
COPY --from=base $APP_PATH/packages/server/src $APP_PATH/packages/server/src
COPY --from=base $APP_PATH/packages/server/tsconfig.json $APP_PATH/packages/server/tsconfig.json

WORKDIR $APP_PATH/packages/server
RUN test -f ./dist/main.js || test -f ./dist/src/main.js || test -f ./dist/packages/server/main.js

EXPOSE 9157
CMD ["sh", "-c", "if [ -f ./dist/main.js ]; then node --enable-source-maps ./dist/main.js; elif [ -f ./dist/src/main.js ]; then node --enable-source-maps ./dist/src/main.js; else node --enable-source-maps ./dist/packages/server/main.js; fi"]
