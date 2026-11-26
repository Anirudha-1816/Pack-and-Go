import { getDeviceInfo } from "./deviceInfo.js";


export const getRequestInfo = (req) => {
  const userAgent = req.headers["user-agent"];

  const deviceInfo = getDeviceInfo(userAgent);

  return {
    ...deviceInfo,
    ipAddress: req.ip,
  };
};