import axios from  'axios'

export const tripsBaseUrlApi = axios.create({
    // baseURL : `${import.meta.env.VITE_API_URL}/trips`,   //For production
    baseURL : `http://localhost:8080/trip`,    // for local host
    withCredentials : true,
}) 
// Get all trips
export const getAllTrips = async () => {
  
  const { data } = await axios.get(
    "http://localhost:8080/components/get-trips",
    { withCredentials: true }
  );

  return Array.isArray(data)
    ? data
    : data.trips || data.data || [];
};

// Delete a trip by ID
export const deleteTrip = async (tripId) => {

  const { data } = await axios.delete(
    `http://localhost:8080/trip/delete/${tripId}`,
    { withCredentials: true }
  );

  return Array.isArray(data)
    ? data
    : data.trips || data.data || [];
};




