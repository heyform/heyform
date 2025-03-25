# HeyForm Server

This is the server component of the HeyForm application.

## Environment Configuration

The server requires certain environment variables to be set for proper operation. A `.env` file in the root of the server package is used to configure these variables.

### Setting Up Environment Variables

1. Create a `.env` file in the server package directory based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and fill in the required values:

### Required Environment Variables

The following variables are **required** for basic functionality:

#### Core Application
- `NODE_ENV`: Set to `development`, `production`, or `test`
- `APP_LISTEN_PORT`: Port the server listens on (default: 8080)
- `APP_LISTEN_HOSTNAME`: Hostname/IP to bind the server to (default: 127.0.0.1)
- `APP_HOMEPAGE`: Public-facing URL for the application

#### Security & Encryption
- `KEY1`, `KEY2`, `KEY3`: Random keys for security (generate strong random strings for production)
- `SESSION_MAX_AGE`: Maximum age of sessions (default: 15d)

#### Database
- `MONGO_URI`: MongoDB connection string

#### Image Processing
- `BUNNY_CACHE_DIR`: Directory for caching processed images (default: ./cache/bunny)

### Optional Environment Variables

The remaining variables in the `.env.example` file are optional and only required for specific features:

- **Email Notifications**: Configure the `SMTP_*` variables if you want to send emails.
- **Social Login**: Set up the `APPLE_LOGIN_*` and `GOOGLE_LOGIN_*` variables for social login features.
- **Spam Protection**: Configure `AKISMET_KEY`, `GEETEST_CAPTCHA_*`, or `GOOGLE_RECAPTCHA_*` for spam protection.
- **Payment Processing**: Set up `STRIPE_*` variables if you want to accept payments.
- **External Integrations**: Configure the various integration variables if you're using those services:
  - **Lark/Feishu**: Set `LARK_APP_ID` and `LARK_APP_SECRET` for Lark integration
  - **OpenAI**: Configure `OPENAI_*` variables for AI features
  - **Changelog**: Set up `CHANGELOG_*` variables for the changelog feature
  - **Cloudflare**: Configure `CLOUDFLARE_*` variables for Cloudflare integration
  - **And others**: Caddy, Teable, etc.

## Troubleshooting

If you encounter errors like "Missing `url` property" or "ERR_INVALID_ARG_TYPE", check that all required environment variables are properly set. The server includes fallbacks for some variables, but certain features may not work correctly without proper configuration.

## Running the Server

```bash
# Install dependencies
npm install

# Run the server in development mode
npm run dev

# Build the server for production
npm run build

# Run the server in production mode
npm run start
```