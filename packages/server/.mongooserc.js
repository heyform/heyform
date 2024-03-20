const fs = require('fs')
const path = require('path')
const { loadEnv } = require('./dist/utils/env')

loadEnv(process.env.NODE_ENV || 'development', __dirname)

require('ts-node').register({
  disableWarnings: true,
  transpileOnly: true
})

module.exports = {
  config: {
    url: process.env.MONGO_URI,
    options: {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASSWORD,
      sslCA: process.env.MONGO_SSL_CA_PATH
        ? [fs.readFileSync(process.env.MONGO_SSL_CA_PATH)]
        : undefined,
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    }
  },
  'migrations-path': path.join(__dirname, 'mongoose/migrations'),
  'seeders-path': path.join(__dirname, 'mongoose/seeders')
}
