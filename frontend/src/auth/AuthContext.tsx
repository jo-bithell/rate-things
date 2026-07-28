import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  updateProfile: (email: string, displayName: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'ratethings_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const storedUser = localStorage.getItem(USER_KEY)
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const persist = (token: string, user: User) => {
    setToken(token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password)
    persist(token, user)
  }

  const register = async (email: string, password: string, displayName: string) => {
    const { token, user } = await api.register(email, password, displayName)
    persist(token, user)
  }

  const updateProfile = async (email: string, displayName: string) => {
    const { token, user } = await api.updateProfile(email, displayName)
    persist(token, user)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword)
  }

  const deleteAccount = async (password: string) => {
    await api.deleteAccount(password)
    logout()
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateProfile, changePassword, deleteAccount, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
