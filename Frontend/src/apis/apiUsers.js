import axios from  'axios'

const apiUsers = axios.create({
    baseURL : '${import.meta.env.VITE_API_URL}/users',
    withCredentials : true
}) 

export default apiUsers;