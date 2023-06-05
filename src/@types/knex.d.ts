// eslint-disable-next-line no-unused-vars
import { knex } from 'knex'

declare module 'knest/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      title: string
      amount: number
      created_at: string
      session_id?: string
    }
  }
}
