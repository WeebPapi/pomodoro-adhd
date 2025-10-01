"use client"
import Image from "next/image"
import { trpc } from "./_trpc/client"
import { useState } from "react"
import PomodoroTimer from "@/components/PomodoroTimer"

export default function Home() {
  const [userMessage, setUserMessage] = useState("")

  const { data, isLoading, error } = trpc.getMessage.useQuery(undefined, {
    refetchInterval: 5000,
  })
  const mutation = trpc.addMessage.useMutation()
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6 flex justify-center items-center">
      <PomodoroTimer />
    </div>
  )
}
