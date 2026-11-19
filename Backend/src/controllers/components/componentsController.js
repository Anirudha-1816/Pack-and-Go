import statusCode from "../../utils/statusCodes.js";
import { buildPublicTripsQuery, publicTripFilter } from "../../constants/tripConstants.js";

// Components imports -
import NavbarModel from "../../models/components/navbarModel.js";
import Trip from "../../models/components/tripModel.js";
import OperatorTrip from "../../models/components/operatorTripModel.js";

//Global components imports -
import Buttons from "../../models/global/buttonModel.js";
import ContentBlocks from "../../models/global/contentBlockModel.js";

import City from "../../models/global/citiesModel.js";


//Reusable controller for creating components 
export const createComponents = (Model) => async (req, res, next) => {
  try {
    const data = req.body;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      const error = new Error("Invalid request: creation failed");
      error.status = statusCode.BAD_REQUEST;
      error.extraDetails = "Data is missing";
      return next(error);
    }

    const document = await Model.create(data);

    return res.status(statusCode.CREATED).json({
      success: true,
      message: "Document(s) created successfully",
    });
  } catch (err) {
    return next(err);
  }
};

//Reusable controller for getting components

export const getComponents = (Model)=> async (req,res,next)=>{

    try {
    const document = await Model.find().sort({order: 1 , createdAt: -1 })

    if(!document){
        const error = new Error('No document found');
        error.status = statusCode.NOT_FOUND
        error.extraDetails = 'No such as document is listed on dataBase'

        return next(error)
    }

    res.status(statusCode.OK).json({
        success : true,
        data : document 
    })

    } catch (err){
        next(err)
        
    }

}


// Hero slide
// export const createHeroSlide = createComponents(HeroSlide)
export const getTrips = async (req, res, next) => {
  try {
    // Public API: only show active, approved trips with future dates
    // Uses tolerant filter that includes old documents without status/isActive fields
    const trips = await Trip.find(buildPublicTripsQuery()).sort({
      date: 1,
      createdAt: -1,
    });

    return res.status(statusCode.OK).json({
      success: true,
      data: trips,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /components/events
 * Public API: returns approved events (from Trip collection) with operator's location as city
 * Filters: status "approved", isActive true, future dates only
 * Populates operator to get location (used as city)
 */
export const getEvents = async (req, res, next) => {
  try {
    // Public API: only show active, approved trips with future dates
    // Uses tolerant filter that includes old documents without status/isActive fields
    const trips = await Trip.find(buildPublicTripsQuery())
      .populate("operator", "name location")
      .sort({ date: 1, createdAt: -1 });

    // Transform to add city from operator's location
    const events = trips.map((trip) => ({
      ...trip.toObject(),
      city: trip.operator?.location || trip.from || "",
    }));

    return res.status(statusCode.OK).json({
      success: true,
      data: events,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /components/destinations
 * Public API: returns unique destinations from approved trips for the hero carousel
 * Each destination has banner image, title, and place (from "to" field)
 */
export const getDestinations = async (req, res, next) => {
  try {
    // Get approved, active, future trips with banner images
    const trips = await Trip.find(buildPublicTripsQuery())
      .select("banner thumbnail from to title destination tripType")
      .sort({ date: 1, createdAt: -1 });

    // Aggregate unique destinations by "to" city
    const seen = new Set();
    const destinations = [];

    for (const trip of trips) {
      const place = trip.to || trip.destination;
      const key = place?.trim().toLowerCase();

      if (!key || seen.has(key)) continue;
      seen.add(key);

      // Use banner for main image, thumbnail as fallback
      const imageUrl = trip.banner?.url || trip.thumbnail?.url;
      if (!imageUrl) continue; // skip if no image

      destinations.push({
        id: trip._id,
        type: "image",
        src: imageUrl,
        title: trip.title || place,
        place: place,
        tripType: trip.tripType,
      });
    }

    // Limit to 8 destinations for carousel
    return res.status(statusCode.OK).json({
      success: true,
      data: destinations.slice(0, 8),
    });
  } catch (err) {
    return next(err);
  }
};

//Nav bar
export const createNav = createComponents(NavbarModel)
export const getNav = getComponents(NavbarModel)


//Nav bar
export const createCity = createComponents(City)
export const getCity = getComponents(City)

// Buttons 
export const createButton = createComponents(Buttons)
export const getButton = getComponents(Buttons)

// Buttons 
export const createContentBlocks = createComponents(ContentBlocks)
export const getContentBlocks = getComponents(ContentBlocks)


