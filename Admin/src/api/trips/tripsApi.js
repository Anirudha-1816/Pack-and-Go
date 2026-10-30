import axios from  'axios'

export const tripsBaseUrlApi = axios.create({
    // baseURL : `${import.meta.env.VITE_API_URL}/trips`,   //For production
    baseURL : `http://localhost:8080/trips`,    // for local host
    withCredentials : true
}) 


export const getAllTrips = axios.get('http://localhost:8080/components/get-trips',
    {withCredentials : true}
)



