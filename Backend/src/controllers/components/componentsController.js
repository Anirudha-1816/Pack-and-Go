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
import PackageCategory from "../../models/components/packageModel.js";


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

// Category
const badRequest = (message) => {
  const error = new Error(message);
  error.status = statusCode.BAD_REQUEST;
  return error;
};

/**
 * GET /admin/event-categories
 * Admin: returns all categories where isDeleted is false, sorted by order ascending
 */
export const getEventCategoriesForAdmin = async (req, res, next) => {
  try {
    const categories = await PackageCategory.find({ isDeleted: { $ne: true } }).sort({ order: 1 });

    return res.status(statusCode.OK).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /admin/event-categories
 * Admin: create a new category
 * Generates slug from name, checks for duplicates
 */
export const createEventCategory = async (req, res, next) => {
  try {
    const { name, description, icon, order } = req.body;

    if (!name || !description || !icon) {
      return next(badRequest("Name, description, and icon are required"));
    }

    if (typeof order !== "number" || order < 0) {
      return next(badRequest("Order must be a non-negative number"));
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existing = await PackageCategory.findOne({ slug });
    if (existing) {
      const error = new Error("A category with this name already exists");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }

    const category = await PackageCategory.create({
      name,
      slug,
      description,
      icon,
      order,
    });

    return res.status(statusCode.CREATED).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("A category with this name already exists");
      error.status = statusCode.BAD_REQUEST;
      return next(error);
    }
    return next(err);
  }
};

/**
 * PUT /admin/event-categories/:id
 * Admin: edit name, description, icon, order (slug is immutable)
 */
export const updateEventCategory = async (req, res, next) => {
  try {
    const { name, description, icon, order } = req.body;

    if (!name || !description || !icon) {
      return next(badRequest("Name, description, and icon are required"));
    }

    if (typeof order !== "number" || order < 0) {
      return next(badRequest("Order must be a non-negative number"));
    }

    const category = await PackageCategory.findByIdAndUpdate(
      req.params.id,
      { $set: { name, description, icon, order } },
      { new: true, runValidators: true }
    );

    if (!category) {
      const error = new Error("Category not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    return res.status(statusCode.OK).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /admin/event-categories/:id/toggle
 * Admin: flip isActive
 */
export const toggleEventCategory = async (req, res, next) => {
  try {
    const category = await PackageCategory.findById(req.params.id);

    if (!category) {
      const error = new Error("Category not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    category.isActive = !category.isActive;
    await category.save();

    const message = category.isActive ? "Category is now visible" : "Category is now hidden";

    return res.status(statusCode.OK).json({
      success: true,
      message,
      data: category,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /admin/event-categories/:id
 * Admin: soft delete - set isDeleted = true
 */
export const deleteEventCategory = async (req, res, next) => {
  try {
    const category = await PackageCategory.findById(req.params.id);

    if (!category) {
      const error = new Error("Category not found");
      error.status = statusCode.NOT_FOUND;
      return next(error);
    }

    category.isDeleted = true;
    await category.save();

    return res.status(statusCode.OK).json({
      success: true,
      message: "Category deleted",
      data: category,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /operator/event-categories
 * Operator: returns only active, non-deleted categories, sorted by order
 * Returns: { id, slug, name, description, icon }
 */
export const getEventCategoriesForOperator = async (req, res, next) => {
  try {
    const categories = await PackageCategory.find({
      isActive: true,
      isDeleted: { $ne: true },
    }).sort({ order: 1 });

    const data = categories.map((cat) => ({
      id: cat._id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
    }));

    return res.status(statusCode.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

export const createPackageCategory = createComponents(PackageCategory)
export const getPackageCategory = getComponents(PackageCategory)