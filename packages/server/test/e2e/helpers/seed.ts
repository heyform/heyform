import mongoose from 'mongoose'

/**
 * Direct Mongo access for setting up and inspecting E2E fixtures.
 */

interface ConnectOpts {
  mongoUri?: string
}

function resolveUri(opts: ConnectOpts): string {
  return (
    opts.mongoUri ??
    process.env.E2E_MONGO_URI ??
    process.env.MONGO_URI ??
    'mongodb://127.0.0.1:27018/heyform'
  )
}

export interface SeedTeamMemberInput {
  teamId: string
  memberId: string
  /** 0=OWNER, 1=ADMIN, 2=COLLABORATOR, 3=MEMBER */
  role: number
}

export async function seedTeamMember(input: SeedTeamMemberInput, opts: ConnectOpts = {}) {
  const connection = await mongoose.createConnection(resolveUri(opts)).asPromise()
  try {
    await connection.collection('teammembermodels').updateOne(
      { teamId: input.teamId, memberId: input.memberId },
      {
        $set: { teamId: input.teamId, memberId: input.memberId, role: input.role, lastSeenAt: 0 }
      },
      { upsert: true }
    )
  } finally {
    await connection.close()
  }
}

export async function seedProjectMember(
  input: { projectId: string; memberId: string },
  opts: ConnectOpts = {}
) {
  const connection = await mongoose.createConnection(resolveUri(opts)).asPromise()
  try {
    await connection
      .collection('projectmembermodels')
      .updateOne(
        { projectId: input.projectId, memberId: input.memberId },
        { $set: { projectId: input.projectId, memberId: input.memberId } },
        { upsert: true }
      )
  } finally {
    await connection.close()
  }
}

export async function readStoredApiKey(id: string, opts: ConnectOpts = {}) {
  const connection = await mongoose.createConnection(resolveUri(opts)).asPromise()
  try {
    return await connection.collection('apikeys').findOne({ _id: new mongoose.Types.ObjectId(id) })
  } finally {
    await connection.close()
  }
}

export async function setStoredApiKeyExpiry(id: string, expiresAt: number, opts: ConnectOpts = {}) {
  const connection = await mongoose.createConnection(resolveUri(opts)).asPromise()
  try {
    const result = await connection
      .collection('apikeys')
      .updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { expiresAt } })
    return result.matchedCount
  } finally {
    await connection.close()
  }
}

export async function deleteStoredUser(id: string, opts: ConnectOpts = {}) {
  const connection = await mongoose.createConnection(resolveUri(opts)).asPromise()
  try {
    const result = await connection
      .collection('usermodels')
      .deleteOne({ _id: new mongoose.Types.ObjectId(id) })
    return result.deletedCount
  } finally {
    await connection.close()
  }
}

export async function setStoredUserStatus(
  id: string,
  status: { isBlocked: boolean; isDeletionScheduled: boolean },
  opts: ConnectOpts = {}
) {
  const connection = await mongoose.createConnection(resolveUri(opts)).asPromise()
  try {
    const result = await connection
      .collection('usermodels')
      .updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: status })
    return result.matchedCount
  } finally {
    await connection.close()
  }
}
