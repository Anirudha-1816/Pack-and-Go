import axios from "axios";

const apiComponents = axios.create({
    baseURL : '${import.meta.env.VITE_API_URL}/components',
    withCredentials:true
}) 

export default apiComponents