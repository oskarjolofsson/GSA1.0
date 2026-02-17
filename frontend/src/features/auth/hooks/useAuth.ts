import { useContext } from 'react'
import { AuthContext } from '../context/AuthProvider'
import { AuthContextType } from '../types'

export function useAuth(): AuthContextType {
    return useContext(AuthContext);
}