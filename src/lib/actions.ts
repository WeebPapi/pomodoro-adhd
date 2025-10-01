import redis from "@/lib/redis"

export async function addMessage(message: string) {
  const key = "chat:messages"
  const score = Date.now()
  const member = JSON.stringify({ message, time: score })

  await redis.zadd(key, score, member)
}

export async function getLatestMessage() {
  const key = "chat:messages"

  const results = await redis.zrevrange(key, 0, 0)

  if (results.length > 0) {
    return JSON.parse(results[0])
  }
  return null
}
