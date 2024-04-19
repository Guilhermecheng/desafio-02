import { z } from 'zod'
import { knex } from '../database'
// import { z } from 'zod'
// import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-if-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  // get all meals of a user
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals').where('user_id', sessionId).select()

    if (meals) {
      return {
        meals,
      }
    } else {
      return {
        message: 'Ainda não há refeições cadastradas.',
      }
    }
  })

  // get specific  meal
  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const getMealSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealSchema.parse(request.params)

    const meal = knex('meals')
      .where({
        user_id: sessionId,
        id,
      })
      .first()

    return meal
  })

  // user metrics - still nemissing best streak
  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals').where('user_id', sessionId).select()
      const total = meals.length

      const inDiet = meals.filter((meal) => meal.is_in_diet === 1).length
      const outDiet = total - inDiet

      const { bestOnDietSequence } = meals.reduce(
        (acc, meal) => {
          if (meal.is_in_diet === 1) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      const streak = bestOnDietSequence

      return {
        total,
        inDiet,
        outDiet,
        streak,
      }
    },
  )

  // create a new meal for the user
  app.post(
    '/create',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      if (!sessionId) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const mealSchema = z.object({
        name: z.string(),
        description: z.string(),
        isInDiet: z.boolean(),
      })

      const { name, description, isInDiet } = mealSchema.parse(request.body)

      await knex('meals').insert({
        id: randomUUID(),
        user_id: sessionId,
        name,
        is_in_diet: isInDiet,
        description,
        created_at: String(new Date()),
      })

      return reply.status(201).send()
    },
  )

  // edit specific meal
  app.put(
    '/edit/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getMealSchema = z.object({
        id: z.string().uuid(),
      })

      const mealEditSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isInDiet: z.boolean().optional(),
      })

      const { id } = getMealSchema.parse(request.params)
      const { name, description, isInDiet } = mealEditSchema.parse(request.body)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals')
        .where({
          user_id: sessionId,
          id,
        })
        .update({
          name,
          is_in_diet: isInDiet,
          description,
        })

      return reply.status(204).send()
    },
  )

  // delete a meal
  app.delete(
    '/delete/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getMealSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealSchema.parse(request.params)

      const meal = await knex('meals').where({ id }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals')
        .where({
          user_id: sessionId,
          id,
        })
        .delete()

      return reply.status(204).send()
    },
  )
}
