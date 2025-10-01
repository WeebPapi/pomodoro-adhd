import { addMessage, getLatestMessage } from "@/lib/actions"
import redis from "@/lib/redis"
import { initTRPC } from "@trpc/server"
import { z } from "zod"

const t = initTRPC.create()
export const appRouter = t.router({
  getMessage: t.procedure.query(() => getLatestMessage()),
  addMessage: t.procedure.input(z.string()).mutation((opts) => {
    const { input } = opts
    addMessage(input)
  }),
})

export type AppRouter = typeof appRouter
