import cloudinary from '../../configs/cloudinary.js';
import statusCode from "../../utils/statusCodes.js";
import Trip from "../../models/components/tripModel.js";
// Makes a 400 error that your error middleware understands
const badRequest = (message) => {
  const error = new Error(message);
  error.status = statusCode.BAD_REQUEST;
  return error;
};

// "meals" and "roadmap" come as JSON strings in FormData, so turn them back into arrays
const parseJson = (value, name) => {
  try {
    return JSON.parse(value);
  } catch {
    throw badRequest(`${name} is missing or not valid.`);
  }
};

export const createTrip = async (req, res, next) => {
  let images = []; // images already on Cloudinary, so we can delete them if saving fails

  try {
    // 1. Wait for both images to finish uploading
    const results = await Promise.allSettled([req.uploads.banner, req.uploads.thumbnail]);
    const [banner, thumbnail] = results.map((r) => (r.status === "fulfilled" ? r.value : undefined));
    images = [banner, thumbnail].filter(Boolean);

    // 2. Check the images
    if (req.uploadError) throw badRequest(req.uploadError);
    if (results.some((r) => r.status === "rejected")) {
      throw new Error("Image upload failed. Please try again.");
    }
    if (!banner || !thumbnail) {
      throw badRequest("Banner image and small image are both required.");
    }

    // 3. Take only the fields we expect (so nobody can send isActive, tripIdentifier, etc.)
    const {
      from, to, guide, date,
      pickupTime, pickupLocation, dropTime, dropLocation,
      duration, pricePerHead, priceGroup2, priceGroup4,
      tripType, stays, travel, termsType, customTerms,
    } = req.body;

    // 4. Save the trip (the model creates the tripIdentifier and checks everything)
    const trip = await Trip.create({
      from, to, guide, date,
      pickupTime, pickupLocation, dropTime, dropLocation,
      duration, pricePerHead, priceGroup2, priceGroup4,
      tripType, stays, travel, termsType, customTerms,
      meals: req.body.meals ? parseJson(req.body.meals, "meals") : [],
      roadmap: parseJson(req.body.roadmap, "roadmap"),
      banner,
      thumbnail,
    });

    

    return res.status(201).json({
      success: true,
      message: "Trip added successfully.",
      data: trip,
    });
  } catch (err) {
    // Saving failed, so remove the images we already uploaded
    await Promise.all(images.map((img) => cloudinary.uploader.destroy(img.publicId))).catch(() => {});

    // Turn common database errors into clear 400 messages
    if (err.name === "ValidationError") {
      err.status = statusCode.BAD_REQUEST;
      err.message = Object.values(err.errors)[0].message;
    }
    if (err.code === 11000) {
      err.status = statusCode.BAD_REQUEST;
      err.message = "Trip identifier already exists. Please try again.";
    }

    return next(err);
  }
};


export const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      const error = new Error("Trip not found.");
      error.status = 404;
      return next(error);
    }

    return res.status(200).json({ success: true, data: trip });
  } catch (err) {
    return next(err);  
  }
};

