import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      const error = new Error("Only images are allowed");
      error.status = 415;
      cb(error);
    }
  },
});

const parseOperatorImage = upload.single("media");

export const uploadOperatorImage = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }

  parseOperatorImage(req, res, (error) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      error.status = 413;
    } else if (error?.code === "LIMIT_UNEXPECTED_FILE") {
      error.status = 400;
      error.message = "Only one profile image is allowed.";
    }

    next(error);
  });
};