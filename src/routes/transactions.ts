/* eslint-disable prettier/prettier */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto, { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkIfSessionExists } from '../middlewares/check-session-id-exists'

export const transactionsRoutes = async (app: FastifyInstance) => {
  app.get('/', { preHandler: [checkIfSessionExists] }, async (req, reply) => {
    const { sessionId } = req.cookies

    const transactions = await knex('transactions')
      .where('session_id', sessionId)  
      .select()

    return transactions
  })

  app.get('/:id', { preHandler: [checkIfSessionExists] }, async (req) => {
    const geTransactionsParamsSchema = z.object({
        id: z.string().uuid(),
    })

    const { id } = geTransactionsParamsSchema.parse(req.params)
    
    const { sessionId } = req.cookies
    
    const transaction = await knex('transactions')
      .where({
        session_id: sessionId,
        id,
      })
      .first()

    return { transaction }
  })

  app.get('/summary', { preHandler: [checkIfSessionExists] }, async (req) => {
    const { sessionId } = req.cookies

    const summary = await knex('transactions')
      .where('session_id', sessionId)
      .sum('amount', { as: 'amount' })
      .first()

    return summary
  })
  
  app.post('/', async (req, reply) => {
    const createTransactionBodySchema = z.object({
        title: z.string(),
        amount: z.number(),
        type: z.enum(['credit', 'debit']),
    })

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      })
    }

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    await knex('transactions').insert({
            id: crypto.randomUUID(),
            title,
            amount: type === 'credit' ? amount : - amount + 1,
            session_id: sessionId
        })

    return reply.status(201).send()
  })
}
