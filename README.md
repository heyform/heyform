<div align="center">
  <h1 align="center">
    <img alt="heyform logo" height="60" src="https://heyform.net/static/logo.svg">
  </h1>
  <p>HeyForm is a form builder to craft customized surveys, questionnaires, quizzes, polls, etc. Sign up with HeyForm & create beautiful yet interactive free online forms.</p>
</div>

<p align="center">
  <a target="_blank" href="https://heform.net">Home</a> | <a target="_blank" href="https://heyform.net/help">Help</a> | <a target="_blank" href="https://heyform.net/blog">Blog</a> | <a target="_blank" href="https://heyform.net/templates">Templates</a> | <a target="_blank" href="https://twitter.com/HeyformHQ">Twitter</a>
</p>

## Structure

```
.
└── packages
    ├── answer-utils       (form submission utils for server and webapp)
    ├── shared-types-enums (shared types/enums for server and webapp)
    ├── utils              (common utils for server and webapp)
    ├── server             (node server)
    └── webapp             (react webapp)
```

## Environment variables

Add a `.env` file in `packages/server` directory.

| Name                               | Type    | Required | Description                                                                                                |
|:-----------------------------------|:--------|:---------|:-----------------------------------------------------------------------------------------------------------|
| APP_LISTEN_PORT                    | Number  |          | Port to listen (default is 8000)                                                                           |
| APP_LISTEN_HOSTNAME                | String  |          | Hostname (default is 127.0.0.1), for docker it should be `0.0.0.0`                                         |
| APP_HOMEPAGE_URL                   | String  |          | Homepage URL (default is http://127.0.0.1:8000)                                                            |
| COOKIE_MAX_AGE                     | String  |          | Cookie max age (default is one year)                                                                       |
| COOKIE_DOMAIN                      | String  | ✅        | Cookie domain                                                                                              |
| SESSION_KEY                        | String  | ✅        | Session encryption key                                                                                     |
| SESSION_MAX_AGE                    | String  |          | Session max age (default is 15 days)                                                                       |
| UPLOAD_FILE_TYPES                  | String  |          | Upload file types (e.g. .jpg,.png,.bmp,.zip)                                                               |
| UPLOAD_FILE_SIZE                   | Number  |          | Upload file size (default is 10mb)                                                                         |
| FORM_ENCRYPTION_KEY                | String  | ✅        | Form encryption key                                                                                        |
| BCRYPT_SALT                        | Number  |          | Bcrypt salt (default is 10)                                                                                |
| MONGO_URI                          | String  | ✅        | MongoDB URI, for docker it should be like `mongodb://mongo:27017/heyform`                                  |
| MONGO_USER                         | String  |          | MongoDB user                                                                                               |
| MONGO_PASSWORD                     | String  |          | MongoDB password                                                                                           |
| MONGO_SSL_CA_PATH                  | String  |          | MongoDB SSL CA path                                                                                        |
| REDIS_HOST                         | String  |          | Redis host (default is '127.0.0.1'), for docker it should be `redis`                                       |
| REDIS_PORT                         | Number  |          | Redis port (default is 6379)                                                                               |
| REDIS_PASSWORD                     | String  |          | Redis password                                                                                             |
| REDIS_DB                           | Number  |          | Redis DB (default is 0)                                                                                    |
| VERIFY_USER_EMAIL                  | Boolean |          | Whether to verify the email address of newly registered users                                              |
| SMTP_FROM                          | String  |          | SMTP from (e.g. `Heyform <support@heyform.net>`)                                                           |
| SMTP_HOST                          | String  |          | SMTP host                                                                                                  |
| SMTP_PORT                          | Number  |          | SMTP port                                                                                                  |
| SMTP_USER                          | String  |          | SMTP user                                                                                                  |
| SMTP_PASSWORD                      | String  |          | SMTP password                                                                                              |
| GOOGLE_RECAPTCHA_KEY               | String  |          | [Google reCAPTCHA key](https://cloud.google.com/recaptcha-enterprise/docs/create-key-website)              |
| GOOGLE_RECAPTCHA_SECRET            | String  |          | Google reCAPTCHA secret                                                                                    |
| GEETEST_CAPTCHA_ID                 | String  |          | [Geetest captcha 4 ID](https://docs.geetest.com/captcha/overview/guide#Step-1-Get-your-captcha-ID-and-KEY) |
| GEETEST_CAPTCHA_KEY                | String  |          | Geetest captcha 4 key                                                                                      |
| AKISMET_KEY                        | String  |          | Akismet key                                                                                                |
| APPLE_LOGIN_TEAM_ID                | String  |          | Apple login team ID                                                                                        |
| APPLE_LOGIN_WEB_CLIENT_ID          | String  |          | Apple login web client ID                                                                                  |
| APPLE_LOGIN_KEY_ID                 | String  |          | Apple login key ID                                                                                         |
| APPLE_LOGIN_PRIVATE_KEY_PATH       | String  |          | Apple login private key path                                                                               |
| GOOGLE_LOGIN_CLIENT_ID             | String  |          | Google login client ID                                                                                     |
| GOOGLE_LOGIN_CLIENT_SECRET         | String  |          | Google login client secret                                                                                 |
| STRIPE_PUBLISHABLE_KEY             | String  |          | [Stripe Publishable Key](https://docs.stripe.com/keys)                                                     |
| STRIPE_SECRET_KEY                  | String  |          | Stripe secret key                                                                                          |
| STRIPE_CONNECT_CLIENT_ID           | String  |          | Stripe connect client ID                                                                                   |
| STRIPE_WEBHOOK_SECRET_KEY          | String  |          | Stripe payment webhook secret key                                                                          |
| BULL_JOB_ATTEMPTS                  | Number  |          | Bull job attempts (default is 3)                                                                           |
| BULL_JOB_TIMEOUT                   | String  |          | Bull job timeout (default is one minute)                                                                   |
| BULL_JOB_BACKOFF_DELAY             | Number  |          | Bull job backoff delay (default is 3000)                                                                   |
| BULL_JOB_BACKOFF_TYPE              | String  |          | Bull job backoff type (default is 'fixed')                                                                 |
| INVITE_CODE_EXPIRE_DAYS            | Number  |          | Invite code expire days (default is 7)                                                                     |
| FORM_REPORT_RATE                   | String  |          | Form report rate (default is 5 seconds)                                                                    |
| VERIFICATION_CODE_EXPIRE           | String  |          | Verification code expire (default is 10 minutes)                                                           |
| VERIFICATION_CODE_LIMIT            | Number  |          | Verification code limit (default is 5)                                                                     |
| ACCOUNT_DELETION_SCHEDULE_INTERVAL | String  |          | Account deletion schedule interval (default is 2 days)                                                     |
| UNSPLASH_CLIENT_ID                 | String  |          | Unsplash client ID                                                                                         |

## Deploy

```bash
docker-compose up -d
```

## Development

### Requirements

* [Node.js v18.x](https://nodejs.org/en/download/)
* [Yarn v1.x](https://yarnpkg.com/getting-started/install)
* [MongoDB v4.x](https://www.mongodb.com/try/download/community)
* [Redis v6.x](https://redis.io/download)

### Setup

```bash
yarn install
yarn build:deps

# Migrate database
yarn workspace server migrate:seed
```

### Run dev server

Node server will run on `http://127.0.0.1:8000` and webapp will run on `http://127.0.0.1:3000`.

```bash
yarn dev
```

## License

[GPL-3.0](LICENSE).
