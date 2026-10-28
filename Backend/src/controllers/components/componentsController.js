import statusCode from "../../utils/statusCodes.js";

// Components imports -
import NavbarModel from "../../models/components/navbarModel.js";
import Trip from "../../models/components/tripModel.js";

//Global components imports -
import Buttons from "../../models/global/buttonModel.js";
import ContentBlocks from "../../models/global/contentBlockModel.js";

import Bookings from "../../models/Bookings/bookingModel.js";


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
export const getTrips = getComponents(Trip)

//Nav bar
export const createNav = createComponents(NavbarModel)
export const getNav = getComponents(NavbarModel)

// Buttons 
export const createButton = createComponents(Buttons)
export const getButton = getComponents(Buttons)

// Buttons 
export const createContentBlocks = createComponents(ContentBlocks)
export const getContentBlocks = getComponents(ContentBlocks)


//Bookings 

export const createBooking  = createComponents(Bookings)
