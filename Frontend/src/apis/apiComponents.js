import axios from "axios";

const apiComponents = axios.create({
    baseURL : 'http://localhost:8080/components',
    withCredentials:true
}) 

export default apiComponents