import axios from "axios";

const baseApi = axios.create({
    // baseURL : `${import.meta.env.VITE_API_URL}`,
    baseURL : `http://localhost:8080`,
    withCredentials:true
}) 

export default baseApi