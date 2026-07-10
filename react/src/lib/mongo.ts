import { MongoClient } from 'mongodb'

declare const process: {
  env: {
    MONGODB_URI?: string
    MONGODB_URL?: string
    MONGODB_DB?: string
    [key: string]: string | undefined
  }
}

const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || ''
const dbName = process.env.MONGODB_DB || 'healthsync'

type Cached = {
  client: MongoClient
  db: ReturnType<MongoClient['db']>
}

declare global {
  var __HS_MONGO_CACHED: Cached | undefined
}

export async function getDb() {
  if (!uri) return null
  if (globalThis.__HS_MONGO_CACHED) return globalThis.__HS_MONGO_CACHED.db

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  globalThis.__HS_MONGO_CACHED = { client, db }
  return db
}

export default getDb
