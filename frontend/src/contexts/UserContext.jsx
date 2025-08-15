import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiService } from '../services/api'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize user context
  useEffect(() => {
    initializeUserContext()
  }, [])

  const initializeUserContext = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all users
      await loadAllUsers()

      // Load current user from localStorage
      const savedUserId = localStorage.getItem('currentUserId')
      if (savedUserId) {
        const user = await getUserById(parseInt(savedUserId))
        if (user) {
          setCurrentUser(user)
        } else {
          // Clear invalid user ID
          localStorage.removeItem('currentUserId')
        }
      }

    } catch (error) {
      console.error('Failed to initialize user context:', error)
      setError('Failed to initialize user management')
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsers = async () => {
    try {
      const response = await apiService.get('/users')
      if (response.data.success) {
        setUsers(response.data.users)
        return response.data.users
      } else {
        throw new Error(response.data.message || 'Failed to load users')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setError('Failed to load users')
      setUsers([])
      return []
    }
  }

  const getUserById = async (userId) => {
    try {
      const response = await apiService.get(`/users/${userId}`)
      if (response.data.success) {
        return response.data.user
      } else {
        throw new Error(response.data.message || 'User not found')
      }
    } catch (error) {
      console.error('Failed to get user by ID:', error)
      return null
    }
  }

  const createUser = async (username, displayName, preferences = {}) => {
    try {
      setError(null)

      const response = await apiService.post('/users', {
        username: username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        displayName: displayName.trim(),
        preferences: {
          theme: 'dark',
          notifications: true,
          ai_personality: {},
          email_access: false,
          ...preferences
        }
      })

      if (response.data.success) {
        const newUser = response.data.user
        
        // Add to users list
        setUsers(prev => [...prev, newUser])
        
        // Set as current user
        await switchUser(newUser.id)
        
        return newUser
      } else {
        throw new Error(response.data.message || response.data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create user'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const switchUser = async (userId) => {
    try {
      setError(null)

      if (currentUser && currentUser.id === userId) {
        return currentUser // Already selected
      }

      // Find user in local list or fetch from API
      let user = users.find(u => u.id === userId)
      if (!user) {
        user = await getUserById(userId)
        if (!user) {
          throw new Error('User not found')
        }
        // Add to users list if not present
        setUsers(prev => {
          const exists = prev.find(u => u.id === userId)
          return exists ? prev : [...prev, user]
        })
      }

      // Update user activity
      await updateUserActivity(userId)

      // Set as current user
      setCurrentUser(user)
      localStorage.setItem('currentUserId', userId.toString())

      return user
    } catch (error) {
      console.error('Failed to switch user:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to switch user'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateUserActivity = async (userId) => {
    try {
      await apiService.post(`/users/${userId}/activity`)
    } catch (error) {
      console.warn('Failed to update user activity:', error)
      // Don't throw error as this is not critical
    }
  }

  const updateUserPreferences = async (userId, preferences) => {
    try {
      setError(null)

      const response = await apiService.put(`/users/${userId}`, {
        preferences
      })

      if (response.data.success) {
        const updatedUser = response.data.user
        
        // Update in users list
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))
        
        // Update current user if it's the same
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser)
        }
        
        return updatedUser
      } else {
        throw new Error(response.data.message || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update preferences'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteUser = async (userId) => {
    try {
      setError(null)

      if (currentUser && currentUser.id === userId) {
        throw new Error('Cannot delete the currently active user')
      }

      const response = await apiService.delete(`/users/${userId}`)

      if (response.data.success) {
        // Remove from users list
        setUsers(prev => prev.filter(u => u.id !== userId))
        return true
      } else {
        throw new Error(response.data.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const clearCurrentUser = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUserId')
  }

  const refreshUsers = async () => {
    await loadAllUsers()
  }

  const refreshCurrentUser = async () => {
    if (currentUser) {
      const updatedUser = await getUserById(currentUser.id)
      if (updatedUser) {
        setCurrentUser(updatedUser)
      }
    }
  }

  const isLoggedIn = () => {
    return currentUser !== null
  }

  const getUserContext = () => {
    if (!currentUser) {
      return null
    }
    
    return {
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      preferences: currentUser.preferences
    }
  }

  const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' }
    }
    
    if (username.length < 2) {
      return { valid: false, error: 'Username must be at least 2 characters long' }
    }
    
    if (username.length > 50) {
      return { valid: false, error: 'Username cannot exceed 50 characters' }
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters and numbers' }
    }
    
    return { valid: true }
  }

  const validateDisplayName = (displayName) => {
    if (!displayName || typeof displayName !== 'string') {
      return { valid: false, error: 'Display name is required' }
    }
    
    if (displayName.trim().length < 1) {
      return { valid: false, error: 'Display name cannot be empty' }
    }
    
    if (displayName.length > 255) {
      return { valid: false, error: 'Display name cannot exceed 255 characters' }
    }
    
    return { valid: true }
  }

  const isUsernameAvailable = (username) => {
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const existingUser = users.find(u => u.username === cleanUsername)
    return !existingUser
  }

  const value = {
    // State
    currentUser,
    users,
    loading,
    error,
    
    // Actions
    createUser,
    switchUser,
    updateUserPreferences,
    deleteUser,
    clearCurrentUser,
    refreshUsers,
    refreshCurrentUser,
    
    // Utilities
    isLoggedIn,
    getUserContext,
    validateUsername,
    validateDisplayName,
    isUsernameAvailable,
    
    // Error handling
    setError
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}