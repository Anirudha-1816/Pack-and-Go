import express from 'express'
import { loginAdmin, logoutAdmin } from '../../controllers/admin/adminController.js'
import { loginRateLimiter } from '../../middlewares/Limiters/rateLimitersMiddleware.js'
import checkForAuth from '../../middlewares/Authentication/checkForAuth.js'

const adminRouter = express.Router()

adminRouter.post('/admin-login',loginRateLimiter,loginAdmin)
adminRouter.post('/logout', checkForAuth, logoutAdmin)


export default adminRouter