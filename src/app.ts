import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { usersRoutes } from './routes/users'

export const app = fastify()

app.register(cookie)

app.get('/', () => {
  return 'Hello World!'
})

app.register(usersRoutes, {
  prefix: 'users',
})
