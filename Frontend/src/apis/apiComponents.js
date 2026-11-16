import axios from "axios";

const apiComponents = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/components`,
  withCredentials: true,
})

// Response interceptor: only treat 401/403 as auth failures
apiComponents.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isAuthError = status === 401 || status === 403

    if (isAuthError) {
      console.debug('Auth error intercepted (components):', status, error.response?.data?.message)
    }

    return Promise.reject(error)
  }
)

export default apiComponents