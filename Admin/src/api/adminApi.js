import axios from "axios";

const adminApi = axios.create({
    baseURL : `http://localhost:8080/admin`,
    withCredentials:true
}) 

export default adminApi