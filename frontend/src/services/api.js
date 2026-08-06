import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const mlApi = axios.create({
  baseURL: ML_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken
          })
          localStorage.setItem('access_token', response.data.access)
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`
          return api(originalRequest)
        }
      } catch (err) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Resume endpoints
export const resumeAPI = {
  analyze: (file) => {
    const formData = new FormData()
    formData.append('resume', file)
    return mlApi.post('/resume/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resumes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: () => api.get('/resumes/'),
  latest: () => api.get('/resumes/latest/'),
  delete: (id) => api.delete(`/resumes/${id}/`),
}

// Aptitude endpoints
export const aptitudeAPI = {
  getQuestions: (section) => api.get('/aptitude/questions/', { params: { section } }),
  getBySection: (section) => api.get(`/aptitude/questions/by_section/?section=${section}`),
  submitTest: (data) => api.post('/aptitude/attempts/', data),
  getHistory: () => api.get('/aptitude/attempts/history/'),
}

// Technical endpoints
export const technicalAPI = {
  getQuestions: (category, difficulty) => api.get('/technical/questions/', { 
    params: { category, difficulty } 
  }),
  getByCategory: (category) => api.get(`/technical/questions/by_category/?category=${category}`),
  submitAnswer: (data) => api.post('/technical/answers/', data),
  getHistory: () => api.get('/technical/answers/'),
}

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
}

// Recommendations endpoints
export const recommendationAPI = {
  getAll: () => api.get('/recommendations/'),
}

export default api
