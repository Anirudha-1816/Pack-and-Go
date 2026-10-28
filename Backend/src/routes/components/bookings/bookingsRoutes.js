import express from 'express'
import { getMyBookings } from '../../../controllers/bookings/bookingControllers.js'
import checkForAuth from '../../../middlewares/Authentication/checkForAuth.js'
 
const bookingRouter = express.Router()

bookingRouter.get('/get',checkForAuth,getMyBookings)


export default bookingRouter