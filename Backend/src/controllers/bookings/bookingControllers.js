
import Bookings from "../../models/Bookings/bookingModel.js";
import statusCode from "../../utils/statusCodes.js";

// Get all bookings for the logged-in user
export const getMyBookings = async (req, res,next) => {
  try {
    const userId = req.user.userId;

    if(!userId){
        const error = new Error('Something went wrong ')
        error.status = statusCode.UNAUTHORIZED
        error.extraDetails = 'UserId is not found PLease log in first'
        

        return next(error)
    }

    const bookings = await Bookings.find({ user: userId })
      .populate({
        path: "trip",
        select:
          "tripIdentifier from to date duration banner thumbnail pickupTime pickupLocation dropTime dropLocation pricePerHead priceGroup2 priceGroup4 tripType",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    next(err)
  }
};
