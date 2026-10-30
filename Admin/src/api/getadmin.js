import axios from  'axios'

const apiUsers = axios.create({
    // baseURL : `${import.meta.env.VITE_API_URL}/users`,
    baseURL : `http://localhost:8080/users`,
    withCredentials : true
}) 

export default apiUsers;