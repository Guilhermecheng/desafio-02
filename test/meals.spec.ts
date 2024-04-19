import { app } from '../src/app'
import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const user = await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: "It's a breakfast",
        isInDiet: true,
      })
      .expect(201)
  })

  it('should be able to get all meals from a user', async () => {
    const user = await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Eggs and coffee',
        isInDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Rice and beans',
        isInDiet: true,
      })
      .expect(201)

    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(response.body.meals).toHaveLength(2)
    expect(response.body.meals[0].name).toBe('Breakfast')
    expect(response.body.meals[1].name).toBe('Dinner')
  })

  it('should be able to show a single meal', async () => {
    const user = await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Yakisoba',
        isInDiet: false,
      })
      .expect(201)

    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const id = response.body.meals[0].id

    const specificMeal = await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(specificMeal.body).toEqual({
      id: expect.any(String),
      user_id: expect.any(String),
      name: 'Lunch',
      description: 'Yakisoba',
      is_in_diet: 0,
      created_at: expect.any(String),
    })
  })

  it('shoud be able to edit a meal', async () => {
    const user = await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Yakisoba',
        isInDiet: false,
      })
      .expect(201)

    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const id = response.body.meals[0].id

    await request(app.server)
      .put(`/meals/edit/${id}`)
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Not a Regular Lunch',
        description: 'Hamburguer and fries',
        isInDiet: false,
      })
      .expect(204)

    const specificMeal = await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(specificMeal.body).toEqual({
      id: expect.any(String),
      user_id: expect.any(String),
      name: 'Not a Regular Lunch',
      description: 'Hamburguer and fries',
      is_in_diet: 0,
      created_at: expect.any(String),
    })
  })

  it('should be able to show user metrics', async () => {
    const user = await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Yakisoba',
        isInDiet: false,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Breakfast',
        description: 'Eggs and coffee',
        isInDiet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Dinner',
        description: 'Rice and beans',
        isInDiet: true,
      })
      .expect(201)

    const response = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(response.body).toEqual({
      total: 3,
      inDiet: 2,
      outDiet: 1,
      streak: 2,
    })
  })

  it('should be possible to delete a meal', async () => {
    const user = await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals/create')
      // @ts-ignore
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'Lunch',
        description: 'Yakisoba',
        isInDiet: false,
      })
      .expect(201)

    const response = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const id = response.body.meals[0].id

    await request(app.server)
      .delete(`/meals/delete/${id}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(204)

    const deleteResp = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(deleteResp.body.meals).toHaveLength(0)
  })
})
