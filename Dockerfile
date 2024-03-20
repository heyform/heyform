FROM node:18.18-alpine3.17 as base

ARG APP_PATH=/app
WORKDIR $APP_PATH

RUN npm install -g pnpm
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

COPY package.json $APP_PATH/package.json
COPY pnpm-lock.yaml $APP_PATH/pnpm-lock.yaml
COPY pnpm-workspace.yaml $APP_PATH/pnpm-workspace.yaml
COPY packages/server $APP_PATH/packages/server
COPY packages/webapp $APP_PATH/packages/webapp

RUN pnpm install
RUN pnpm build
RUN pnpm --filter ./packages/webapp export

FROM node:18.18-alpine3.17 as runner

ARG APP_PATH=/app
WORKDIR $APP_PATH

RUN npm install -g pnpm
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

COPY --from=base $APP_PATH/packages/server/dist ./dist
COPY --from=base $APP_PATH/packages/server/mongoose ./mongoose
COPY --from=base $APP_PATH/packages/server/resources ./resources
COPY --from=base $APP_PATH/packages/server/static ./static
COPY --from=base $APP_PATH/packages/server/view ./view
COPY --from=base $APP_PATH/packages/server/.mongooserc.js ./.mongooserc.js
COPY --from=base $APP_PATH/packages/server/tsconfig.json ./tsconfig.json
COPY --from=base $APP_PATH/packages/server/package.json ./package.json

RUN pnpm install --prod

EXPOSE 8000
CMD ["pnpm", "start"]
