# AGENTS.md

Based on the [local development guide](https://docs.heyform.net/open-source/local-development).

## Requirements

- Node.js 22
- pnpm 9
- Docker and Docker Compose

## Environment variables

Copy the example file in each package. `.env.*` files are ignored by git.

```bash
cp packages/server/.env.example packages/server/.env.local
cp packages/webapp/.env.example packages/webapp/.env.local
```

- Server: see the [configuration docs](https://docs.heyform.net/configuration) for values. The example's `MONGO_URI` and `REDIS_*` defaults match the development Docker services.
- Webapp: the example already sets the values needed locally:
  - `VITE_HOMEPAGE_URL=http://127.0.0.1:3000`
  - `VITE_COOKIE_DOMAIN=127.0.0.1`
  - `VITE_PROXY_TARGET=http://127.0.0.1:9157`

## Run

Run from the repository root.

```bash
# Start MongoDB and Redis (keeps running, so use a separate terminal)
pnpm dev:database

pnpm install

# Build the shared packages, then start the server and webapp
pnpm dev
```

| Service | URL                     |
| ------- | ----------------------- |
| Server  | `http://127.0.0.1:9157` |
| Webapp  | `http://127.0.0.1:3000` |
| MongoDB | `127.0.0.1:27017`       |
| Redis   | `127.0.0.1:6379`        |

## Test and lint

```bash
pnpm --filter ./packages/server test:unit
pnpm --filter ./packages/webapp test:unit
pnpm --filter ./packages/mcp test:unit
pnpm lint
```

## Release

Release from an up-to-date `next`. Replace `3.0.6` with the new version.

1. Set `version` to `3.0.6` in `packages/server/package.json` and `packages/webapp/package.json`. These are the only files a release changes.
2. Commit and tag:

   ```bash
   git add packages/server/package.json packages/webapp/package.json
   git commit -m "release: v3.0.6"
   git tag v3.0.6
   ```

3. Push the commit and the tag. The tag triggers `publish-docker-image.yml`, which publishes `heyform/community-edition:v3.0.6` and `latest` to Docker Hub.

   ```bash
   git push origin next v3.0.6
   ```

4. Publish the GitHub release. The webapp's update badge reads the latest release from GitHub.

   ```bash
   gh release create v3.0.6 --title v3.0.6 --generate-notes
   ```
