import {
  MONGO_PASSWORD,
  MONGO_SSL_CA,
  MONGO_URI,
  MONGO_USER
} from '@environments'
import { clone } from '@heyform-inc/utils'
import {
  MongooseModuleOptions,
  MongooseOptionsFactory
} from '@nestjs/mongoose/dist/interfaces/mongoose-options.interface'
import { Logger } from '@utils'
import * as mongoose from 'mongoose' // Setup migrations logger

// Setup migrations logger
const logger = new Logger('MongooseModule')
mongoose.set(
  'debug',
  (collection: string, method: string, query: any, doc: any) => {
    const newQuery = clone(query)

    // Hide passwords from query logs
    if (newQuery.password) {
      newQuery.password = '******'
    }

    logger.info(
      [collection, method, JSON.stringify(newQuery), JSON.stringify(doc)].join(
        ' '
      )
    )
  }
)

export class MongoService implements MongooseOptionsFactory {
  createMongooseOptions():
    | Promise<MongooseModuleOptions>
    | MongooseModuleOptions {
    return {
      uri: MONGO_URI,
      user: MONGO_USER,
      pass: MONGO_PASSWORD,
      sslCA: MONGO_SSL_CA,
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    }
  }
}
