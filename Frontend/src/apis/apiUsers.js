import axios from 'axios'

const apiUsers = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/users`,
  withCredentials: true,
})

// Response interceptor: only treat 401/403 as auth failures
apiUsers.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isAuthError = status === 401 || status === 403

    // Don't reject on auth errors here - let the calling code handle them
    // but log for debugging
    if (isAuthError) {
      console.debug('Auth error intercepted:', status, error.response?.data?.message)
    }

    return Promise.reject(error)
  }
)

export default apiUsers