import express from "express";
import { uploadTripImages } from "../../middlewares/Uploads/uploadMiddleware.js";
import { createOperatorTrip, getOperatorTripById, getOperatorTrips, deleteOperatorTripById } from "../../controllers/operators/operatorTripController.js";
import checkForAuth from "../../middlewares/Authentication/checkForAuth.js";

const operatorTripRouter = express.Router();

// All routes require authentication
operatorTripRouter.use(checkForAuth);

// Create operator trip
operatorTripRouter.post("/", uploadTripImages, createOperatorTrip);

// Get all operator trips
operatorTripRouter.get("/", getOperatorTrips);

// Get single operator trip by ID
operatorTripRouter.get("/:id", getOperatorTripById);

// Delete operator trip (soft delete)
operatorTripRouter.delete("/:id", deleteOperatorTripById);

export default operatorTripRouter;