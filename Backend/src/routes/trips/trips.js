import express from "express";
import { uploadTripImages } from "../../middlewares/Uploads/uploadMiddleware.js";
import { getTripById,createTrip, deleteTripById } from "../../controllers/Trips/tripController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";
import checkForAdmin from "../../middlewares/Authentication/checkForAdmin.js";

const tripRouter = express.Router();

// Add your admin login check before uploadTripImages, so only admins can create trips
tripRouter.get("/get/:id", getTripById);
tripRouter.post("/create",checkForAuth,checkForAdmin,uploadTripImages, createTrip);
tripRouter.delete("/delete/:id",checkForAuth,checkForAdmin, deleteTripById);



export default tripRouter;