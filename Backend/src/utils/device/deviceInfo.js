
import { UAParser } from "ua-parser-js";

export const getDeviceInfo = (userAgent) => {
  const parser = new UAParser(userAgent || "");
  const result = parser.getResult();

  return {
    deviceType: result.device.type || "unknown",

    operatingSystem:
      [
        result.os.name,
        result.os.version,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown",

    browser:
      [
        result.browser.name,
        result.browser.version,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown",
  };
}; 