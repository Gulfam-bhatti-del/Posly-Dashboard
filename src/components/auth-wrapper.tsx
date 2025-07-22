"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { AuthForm } from "./auth-form"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!user) {
    return <AuthForm />
  }
  return <>{children}</>
}
