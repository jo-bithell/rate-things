import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (displayName: string, password: string) => Promise<void>
  register: (password: string, displayName: string) => Promise<string>
  updateProfile: (displayName: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  uploadProfileImage: (file: File) => Promise<void>
  removeProfileImage: () => Promise<void>
  bootstrapAdmin: () => Promise<void>
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

  const login = async (displayName: string, password: string) => {
    const { token, user } = await api.login(displayName, password)
    persist(token, user)
  }

  const register = async (password: string, displayName: string) => {
    // No auto-login - every new registration is pending until an admin approves it.
    const { message } = await api.register(password, displayName)
    return message
  }

  const updateProfile = async (displayName: string) => {
    const { token, user } = await api.updateProfile(displayName)
    persist(token, user)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword)
  }

  const deleteAccount = async (password: string) => {
    await api.deleteAccount(password)
    logout()
  }

  const updateStoredUser = (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }

  const uploadProfileImage = async (file: File) => {
    updateStoredUser(await api.uploadProfileImage(file))
  }

  const removeProfileImage = async () => {
    updateStoredUser(await api.deleteProfileImage())
  }

  const bootstrapAdmin = async () => {
    const { token, user } = await api.bootstrapAdmin()
    persist(token, user)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        changePassword,
        deleteAccount,
        uploadProfileImage,
        removeProfileImage,
        bootstrapAdmin,
        logout,
      }}
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
