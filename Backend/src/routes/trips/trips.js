import express from "express";
import { uploadTripImages } from "../../middlewares/Uploads/uploadMiddleware.js";
import { createTrip } from "../../controllers/Trips/tripController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import checkForAdmin from "../../middlewares/Authentication/checkForAdmin.js";
import { getTripById } from "../../controllers/Trips/tripController.js";

const tripRouter = express.Router();

// Add your admin login check before uploadTripImages, so only admins can create trips
tripRouter.get("/get/:id", getTripById);
tripRouter.post("/create",checkForAuth,checkForAdmin,uploadTripImages, createTrip);



export default tripRouter;