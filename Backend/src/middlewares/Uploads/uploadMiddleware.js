import Busboy from "busboy";
import { uploadMedia } from "../../services/cloudinaryService.js";

export const uploadTripImages = (req, res, next) => {
  const contentType = req.headers["content-type"];

  if (!contentType?.includes("multipart/form-data")) {
    return res.status(400).json({
      success: false,
      message: "Content-Type must be multipart/form-data", 
    });
  }

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 2, // banner + thumbnail
      fields: 30, // the form sends 19 fields
      fileSize: 5 * 1024 * 1024, // 5 MB, same as the form check
    },
  });

  req.body = {};
  req.uploads = {}; // will hold { banner: Promise, thumbnail: Promise }
  let problem = null; // the first problem we find

  // Normal text fields
  busboy.on("field", (name, value) => {
    req.body[name] = value;
  });

  busboy.on("file", (name, file, info) => {
    // Only the two image fields are allowed
    const allowed = ["banner", "thumbnail"].includes(name);
    const isImage = info.mimeType.startsWith("image/");

    if (!allowed || !isImage) {
      problem = problem || `"${name}" must be an image (banner or thumbnail).`;
      file.resume(); // throw this file away
      return;
    }

    // Busboy gives us a file that is cut off if it is too big
    file.on("limit", () => {
      problem = problem || `${name} must be under 5 MB.`;
    });

    // Start the Cloudinary upload right now, while busboy is still reading the file
    const upload = uploadMedia(file, "image");
    upload.catch(() => {}); // stops a crash warning, the controller handles the error
    req.uploads[name] = upload;
  });

  busboy.on("filesLimit", () => {
    problem = problem || "Only 2 images are allowed.";
  });

  busboy.on("error", next);

  busboy.on("close", () => {
    req.uploadError = problem;
    next();
  });

  req.pipe(busboy);
};