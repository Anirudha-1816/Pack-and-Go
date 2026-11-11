import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../configs/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "PackAndGo/Operators",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadOperatorImage = upload.single("media");