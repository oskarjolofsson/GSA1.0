import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'
import { AuthContextType } from '../types'

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }

    return context
}