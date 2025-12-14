FROM node:18.20.0-alpine3.19 AS base

ARG APP_PATH=/app
WORKDIR $APP_PATH

RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++

COPY package.json $APP_PATH/package.json
COPY pnpm-lock.yaml $APP_PATH/pnpm-lock.yaml
COPY pnpm-workspace.yaml $APP_PATH/pnpm-workspace.yaml
COPY packages/server $APP_PATH/packages/server
RUN mkdir -p $APP_PATH/packages/server/static/upload
COPY packages/webapp $APP_PATH/packages/webapp
COPY packages/answer-utils $APP_PATH/packages/answer-utils
COPY packages/shared-types-enums $APP_PATH/packages/shared-types-enums
COPY packages/utils $APP_PATH/packages/utils
COPY packages/form-renderer $APP_PATH/packages/form-renderer
COPY packages/embed $APP_PATH/packages/embed

# Build process
RUN pnpm install
RUN pnpm build:server
RUN pnpm build:webapp

# Copy webapp public assets and bundles to server static directory
# Server mounts STATIC_DIR at /static, so files must live directly under $APP_PATH/packages/server/static
RUN cp -r $APP_PATH/packages/webapp/dist/static/* $APP_PATH/packages/server/static/

# Use the production-built HTML as the server view template, but keep server-side injection for config + locale
RUN cp $APP_PATH/packages/webapp/dist/index.html $APP_PATH/packages/server/view/index.html
RUN sed -i 's/const heyform = {};/const heyform = {{{json heyform}}};/' $APP_PATH/packages/server/view/index.html
RUN sed -i 's/const heyform={};/const heyform = {{{json heyform}}};/' $APP_PATH/packages/server/view/index.html
RUN sed -i "s/screenHeight: window.screen.height/screenHeight: window.screen.height, locale: '{{locale}}'/" $APP_PATH/packages/server/view/index.html

FROM node:18.20.0-alpine3.19 AS runner

ARG APP_PATH=/app
WORKDIR $APP_PATH

RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++

COPY --from=base $APP_PATH/packages/server/dist ./dist
COPY --from=base $APP_PATH/packages/server/resources ./resources
COPY --from=base $APP_PATH/packages/server/static ./static
COPY --from=base $APP_PATH/packages/server/view ./view
COPY --from=base $APP_PATH/packages/server/src ./src
COPY --from=base $APP_PATH/packages/server/tsconfig.json ./tsconfig.json
COPY --from=base $APP_PATH/packages/server/package.json ./package.json

RUN pnpm install --prod

EXPOSE 9157
CMD ["npm", "start"]
