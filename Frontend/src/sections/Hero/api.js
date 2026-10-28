import axios from "axios";
import apiComponents from "../../apis/apiComponents";





export const getButtons = async () => {
  const { data } = await apiComponents.get("/buttons");

  return Array.isArray(data?.data)
    ? data.data[0] ?? null
    : data?.data ?? null;
};

export const getHeroData = async () => {
  const { data } = await apiComponents.get("/content-blocks");

  const contentBlocks = Array.isArray(data?.data)
    ? data.data
    : data?.data
      ? [data.data]
      : [];

  return contentBlocks.find(
    (item) =>
      item.componentIdentifier === "hero-section" &&
      item.isActive
  ) ?? null;
};
