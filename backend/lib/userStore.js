const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const getDb = require('./mongo')
const { ObjectId } = require('mongodb')

// in-memory fallback
const usersMap = (globalThis).__HS_USERS ||= new Map()

async function findByEmail(email) {
  const db = await getDb()
  if (db) {
    const u = await db.collection('users').findOne({ email })
    if (!u) return null
    return { id: String(u._id), email: u.email, passwordHash: u.passwordHash, role: u.role, profile: u.profile }
  }
  for (const u of usersMap.values()) if (u.email === email) return u
  return null
}

async function findById(id) {
  const db = await getDb()
  if (db) {
    let filter
    try {
      filter = { $or: [{ _id: new ObjectId(id) }, { id }] }
    } catch (e) {
      filter = { id }
    }
    const u = await db.collection('users').findOne(filter)
    if (!u) return null
    return { id: String(u._id || u.id), email: u.email, passwordHash: u.passwordHash, role: u.role, profile: u.profile }
  }
  return usersMap.get(id) || null
}

async function createUser({ email, password, role, profile }) {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  const db = await getDb()
  if (db) {
    const res = await db.collection('users').insertOne({ email, passwordHash: hash, role, profile, createdAt: new Date() })
    return { id: String(res.insertedId), email, passwordHash: hash, role, profile }
  }

  const id = uuidv4()
  const user = { id, email, passwordHash: hash, role, profile }
  usersMap.set(id, user)
  return user
}

module.exports = { findByEmail, findById, createUser }
