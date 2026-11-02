import axios from  'axios'

export const tripsBaseUrlApi = axios.create({
    // baseURL : `${import.meta.env.VITE_API_URL}/trips`,   //For production
    baseURL : `http://localhost:8080/trip`,    // for local host
    withCredentials : true,
}) 
// Get all trips
export const getAllTrips = async () => {
  const { data } = await tripsBaseUrlApi.get("/manage");

  return Array.isArray(data)
    ? data
    : data.trips || data.data || [];
};

export const updateTripVisibility = async (tripId, isActive) => {
  const { data } = await tripsBaseUrlApi.patch(`/visibility/${tripId}`, {
    isActive,
  });

  return data;
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




