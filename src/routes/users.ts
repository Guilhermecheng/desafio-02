import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/create', async (request, reply) => {
    const userSchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    const { name, email } = userSchema.parse(request.body)

    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      email,
    })

    return reply.status(201).send()
  })
}
