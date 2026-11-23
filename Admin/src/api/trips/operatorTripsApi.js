import adminApi from "../baseApi";

// GET /admin/operator-trips?status=pending|approved|rejected
export const fetchOperatorTrips = async (status) => {
  const params = status ? { status } : {};
  const { data } = await adminApi.get("/admin/operator-trips", { params });
  return Array.isArray(data.data) ? data.data : [];
};

// GET /admin/operator-trips/:id
export const fetchOperatorTripDetail = async (id) => {
  const { data } = await adminApi.get(`/admin/operator-trips/${id}`);
  return data.data;
};

// PATCH /admin/operator-trips/:id/approve
export const approveOperatorTrip = async (id) => {
  const { data } = await adminApi.patch(`/admin/operator-trips/${id}/approve`);
  return data;
};

// PATCH /admin/operator-trips/:id/reject
export const rejectOperatorTrip = async (id, rejectionReason) => {
  const { data } = await adminApi.patch(`/admin/operator-trips/${id}/reject`, {
    rejectionReason,
  });
  return data;
};

// DELETE /admin/operator-trips/:id
export const deleteOperatorTrip = async (id) => {
  const { data } = await adminApi.delete(`/admin/operator-trips/${id}`);
  return data;
};