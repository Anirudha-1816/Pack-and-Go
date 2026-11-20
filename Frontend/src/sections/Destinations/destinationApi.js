import apiComponents from "../../apis/apiComponents";

export const getDestinations = async () => {
  const { data } = await apiComponents.get("/destinations");

  return Array.isArray(data?.data)
    ? data.data
    : data?.data
      ? [data.data]
      : [];
};