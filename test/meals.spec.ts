import { app } from '../src/app'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
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

  it('should be able to create a new meal for a user', async () => {
    await request(app.server)
      .post('/users/create')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)
  })
})
