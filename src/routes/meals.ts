import { z } from 'zod'
import { knex } from '../database'
// import { z } from 'zod'
// import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  // get all meals of a user
  app.get('/', async (request) => {
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
  app.get('/:id', async (request) => {
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
  app.get('/summary', async (request) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals').where('user_id', sessionId).select()
    const total = meals.length

    const inDiet = meals.filter((meal) => meal.is_in_diet === true).length
    const outDiet = total - inDiet

    const streaks = meals.reduce(
      function (meal, n) {
        if (n) meal[meal.length - 1]++
        else meal.push(0)
        return meal
      },
      [0],
    )

    const streak = Math.max(...streaks)

    return {
      total,
      inDiet,
      outDiet,
      streak,
    }
  })

  // create a new meal for the user
  app.post('/new', async (request, reply) => {
    const mealSchema = z.object({
      userId: z.string(),
      name: z.string(),
      description: z.string(),
      isInDiet: z.boolean(),
    })

    const { name, description, userId, isInDiet } = mealSchema.parse(
      request.body,
    )

    await knex('meals').insert({
      id: randomUUID(),
      user_id: userId,
      name,
      is_in_diet: isInDiet,
      description,
      created_at: String(new Date()),
    })

    return reply.status(201).send()
  })

  // app.post('/edit/:id', async (request, reply) => {
  //   const { sessionId } = request.cookies

  //   const getMealSchema = z.object({
  //     id: z.string().uuid(),
  //   })

  //   const mealEditSchema = z.object({
  //     name: z.string().optional(),
  //     descritption: z.string().optional(),
  //     is_in_diet: z.boolean().optional(),
  //   })

  //   const { id } = getMealSchema.parse(request.params)
  //   const editData = mealEditSchema.parse(request.body)

  //   const meal = knex('meals')
  //     .where({
  //       user_id: sessionId,
  //       id,
  //     })
  //     .first()
  // })
}
