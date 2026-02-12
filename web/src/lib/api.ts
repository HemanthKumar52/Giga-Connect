import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })

        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth APIs
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
}

// User APIs
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  getUser: (id: string) => api.get(`/users/${id}`),
  searchFreelancers: (params: any) => api.get('/users/freelancers', { params }),
  addSkill: (data: any) => api.post('/users/me/skills', data),
  removeSkill: (skillId: string) => api.delete(`/users/me/skills/${skillId}`),
  addExperience: (data: any) => api.post('/users/me/experience', data),
  addEducation: (data: any) => api.post('/users/me/education', data),
  addPortfolio: (data: any) => api.post('/users/me/portfolio', data),
}

// Job APIs
export const jobApi = {
  list: (params?: any) => api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  myJobs: (status?: string) => api.get('/jobs/my-jobs', { params: { status } }),
}

// Proposal APIs
export const proposalApi = {
  submit: (data: any) => api.post('/proposals', data),
  get: (id: string) => api.get(`/proposals/${id}`),
  update: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  withdraw: (id: string) => api.delete(`/proposals/${id}`),
  myProposals: (status?: string) => api.get('/proposals/my-proposals', { params: { status } }),
  jobProposals: (jobId: string) => api.get(`/proposals/job/${jobId}`),
  accept: (id: string) => api.post(`/proposals/${id}/accept`),
  reject: (id: string) => api.post(`/proposals/${id}/reject`),
}

// Contract APIs
export const contractApi = {
  list: (role: 'client' | 'freelancer', status?: string) =>
    api.get('/contracts/my-contracts', { params: { role, status } }),
  get: (id: string) => api.get(`/contracts/${id}`),
  submitMilestone: (contractId: string, milestoneId: string, data: any) =>
    api.post(`/contracts/${contractId}/milestones/${milestoneId}/submit`, data),
  approveMilestone: (contractId: string, milestoneId: string) =>
    api.post(`/contracts/${contractId}/milestones/${milestoneId}/approve`),
  addReview: (contractId: string, data: any) => api.post(`/contracts/${contractId}/reviews`, data),
}

// Chat APIs
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),
  getMessages: (conversationId: string, page?: number) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params: { page } }),
  sendMessage: (conversationId: string, data: any) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),
  createConversation: (data: any) => api.post('/chat/conversations', data),
}

// Product APIs
export const productApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  purchase: (id: string) => api.post(`/products/${id}/purchase`),
  myProducts: () => api.get('/products/my-products'),
  myPurchases: () => api.get('/products/my-purchases'),
}

// Feed APIs
export const feedApi = {
  getFeed: (page?: number) => api.get('/feed', { params: { page } }),
  createPost: (data: any) => api.post('/feed/posts', data),
  likePost: (id: string) => api.post(`/feed/posts/${id}/like`),
  addComment: (postId: string, data: any) => api.post(`/feed/posts/${postId}/comments`, data),
  follow: (userId: string) => api.post(`/feed/follow/${userId}`),
  suggestions: () => api.get('/feed/suggestions'),
}

// Payment APIs
export const paymentApi = {
  fundEscrow: (data: any) => api.post('/payments/escrow/fund', data),
  releasePayment: (contractId: string, milestoneId: string) =>
    api.post(`/payments/escrow/${contractId}/release/${milestoneId}`),
  transactions: (page?: number) => api.get('/payments/transactions', { params: { page } }),
  earnings: () => api.get('/payments/earnings'),
}

// Search APIs
export const searchApi = {
  global: (query: string, type?: string) => api.get('/search', { params: { query, type } }),
  autocomplete: (q: string) => api.get('/search/autocomplete', { params: { q } }),
  trending: () => api.get('/search/trending'),
}

// Notification APIs
export const notificationApi = {
  list: (page?: number) => api.get('/notifications', { params: { page } }),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  unreadCount: () => api.get('/notifications/unread-count'),
}
