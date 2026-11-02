import express from 'express'
import {
	getAllBookingsForAdmin,
	getMyBookings,
} from '../../../controllers/bookings/bookingControllers.js'
import checkForAuth from '../../../middlewares/Authentication/checkForAuth.js'
import checkForAdmin from '../../../middlewares/Authentication/checkForAdmin.js'
 
const bookingRouter = express.Router()

bookingRouter.get('/get',checkForAuth,getMyBookings)
bookingRouter.get('/admin/get',checkForAuth,checkForAdmin,getAllBookingsForAdmin)


export default bookingRouter