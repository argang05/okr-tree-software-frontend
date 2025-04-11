'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';
import axios from 'axios';

// Create the context
const UserContext = createContext();

// User provider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Store user data in localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  }, [user]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        // Check if token exists
        const token = Cookies.get('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Decode token to get user info (JWT payload)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // If token valid and has empId, get user details
        if (payload && payload.sub) {
          try {
            // Get additional user information from API
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
            
            const config = {
              headers: {
                Authorization: `Bearer ${token}`
              }
            };
            
            // Try to fetch user information by empId
            const userDetailsResponse = await axios.get(
              `${API_BASE_URL}/users/${payload.sub}`, 
              config
            );
            
            if (userDetailsResponse.data) {
              // Set full user details from API
              setUser({
                ...userDetailsResponse.data,
                empId: payload.sub,
                role: payload.role
              });
            } else {
              // Try to get user from localStorage as fallback
              const storedUser = localStorage.getItem('user_data');
              if (storedUser) {
                try {
                  const parsedUser = JSON.parse(storedUser);
                  // Check if it's the same user
                  if (parsedUser.empId === payload.sub) {
                    setUser(parsedUser);
                    return;
                  }
                } catch (parseError) {
                  console.error('Error parsing stored user data:', parseError);
                }
              }
              
              // Fallback to basic info from token
              setUser({
                empId: payload.sub,
                role: payload.role
              });
            }
          } catch (apiError) {
            console.error('Error fetching user details:', apiError);
            
            // Try to get user from localStorage as fallback
            const storedUser = localStorage.getItem('user_data');
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                // Check if it's the same user
                if (parsedUser.empId === payload.sub) {
                  setUser(parsedUser);
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing stored user data:', parseError);
              }
            }
            
            // Still set basic user from token even if API fails
            setUser({
              empId: payload.sub,
              role: payload.role
            });
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        Cookies.remove('token');
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authAPI.logout();
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/login');
  };

  // Update user function
  const updateUser = async (userData) => {
    try {
      if (!user) throw new Error('User not authenticated');
      setLoading(true);
      const response = await authAPI.updateUser(user.empId, userData);
      
      // Update user state with new data
      setUser(prev => ({
        ...prev,
        ...userData
      }));
      
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 