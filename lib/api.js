import axios from 'axios';
import Cookies from 'js-cookie';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  // Register a new user
  register: (userData) => api.post('/users/register', userData),
  
  // Login user
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    if (response.data && response.data.token) {
      Cookies.set('token', response.data.token, { expires: 7 });
    }
    return response;
  },
  
  // Logout user
  logout: () => {
    Cookies.remove('token');
  },
  
  // Update user details
  updateUser: (empId, userData) => api.put(`/users/${empId}`, userData),
  
  // Get user's tasks
  getUserTasks: (empId) => api.get(`/users/${empId}/tasks`),
  
  // Get all user empId:name mappings
  getUsersMap: () => api.get('/users/empid-name-map'),
};

// Objectives API
export const objectivesAPI = {
  // Create a new root objective
  createObjective: (objectiveData) => api.post('/objectives', objectiveData),
  
  // Create a sub-objective
  createSubObjective: (parentId, objectiveData) => api.post(`/objectives?parentId=${parentId}`, objectiveData),
  
  // Get OKR tree by parent ID
  getOKRTree: (parentId = 1) => api.get(`/objectives/tree/${parentId}`),
  
  // Get objective by ID
  getObjectiveById: (id) => api.get(`/objectives/${id}`),
  
  // Update objective
  updateObjective: (id, objectiveData) => api.put(`/objectives/${id}`, objectiveData),
  
  // Delete objective
  deleteObjective: (id) => api.delete(`/objectives/${id}`),
};

// Tasks API
export const tasksAPI = {
  // Add task to objective
  addTaskToObjective: (objectiveId, taskData) => api.post(`/tasks/${objectiveId}`, taskData),
  
  // Get all tasks by objective
  getTasksByObjective: (objectiveId) => api.get(`/tasks/objective/${objectiveId}`),
  
  // Update a task
  updateTask: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  
  // Delete a task
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
};

export default api; 