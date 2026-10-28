import axios from  'axios'

const apiUsers = axios.create({
    baseURL : 'http://localhost:8080/users',
    withCredentials : true
}) 

export default apiUsers;