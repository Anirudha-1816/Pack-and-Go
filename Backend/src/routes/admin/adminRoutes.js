import express from 'express'
import { loginAdmin } from '../../controllers/admin/adminController.js'
import { loginRateLimiter } from '../../middlewares/Limiters/rateLimitersMiddleware.js'

const adminRouter = express.Router()

adminRouter.post('/admin-login',loginRateLimiter,loginAdmin)


export default adminRouter