# HeyForm MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants work with a
HeyForm instance over stdio. It talks to the server's GraphQL API, signing in with an email and password
and keeping the session cookie, the same way the dashboard does.

## Tools

| Tool               | What it does                                                             |
| ------------------ | ------------------------------------------------------------------------ |
| `list_workspaces`  | Workspaces (teams) of the signed-in user, with their projects            |
| `list_forms`       | Forms in a project (active or trash), with submission counts             |
| `get_form`         | One form with its draft fields and hidden fields                         |
| `list_submissions` | Submissions of a form, paginated (10 to 30 per page, the server's limit) |
| `create_form`      | Create an empty draft form in a project (not published)                  |

The read tools carry the MCP `readOnlyHint` annotation. `create_form` is the only tool that writes.

## Configuration

| Variable           | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `HEYFORM_URL`      | Base URL of your HeyForm server, e.g. `http://127.0.0.1:9157` |
| `HEYFORM_EMAIL`    | Email of the account to act as                                |
| `HEYFORM_PASSWORD` | Password of that account                                      |

The server acts with that account's permissions. Use a dedicated account if you do not want an assistant
to have access to everything you can see. Accounts that only sign in with a social login need a password
set first, and `DISABLE_LOGIN_WITH_PASSWORD` must not be enabled.

## Build and run

From the repository root:

```bash
pnpm install
pnpm --filter ./packages/mcp build
```

Then add it to your MCP client, for example:

```json
{
  "mcpServers": {
    "heyform": {
      "command": "node",
      "args": ["/path/to/heyform/packages/mcp/dist/index.js"],
      "env": {
        "HEYFORM_URL": "http://127.0.0.1:9157",
        "HEYFORM_EMAIL": "you@example.com",
        "HEYFORM_PASSWORD": "..."
      }
    }
  }
}
```

## Test

```bash
pnpm --filter ./packages/mcp test:unit
pnpm --filter ./packages/mcp type-check
```
