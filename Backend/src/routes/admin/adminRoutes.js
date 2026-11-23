import express from 'express'
import { loginAdmin, logoutAdmin } from '../../controllers/admin/adminController.js'
import { loginRateLimiter } from '../../middlewares/Limiters/rateLimitersMiddleware.js'
import checkForAuth from '../../middlewares/Authentication/checkForAuth.js'
import checkForAdmin from '../../middlewares/Authentication/checkForAdmin.js'
import {
  getEventCategoriesForAdmin,
  createEventCategory,
  updateEventCategory,
  toggleEventCategory,
  deleteEventCategory,
} from '../../controllers/components/componentsController.js'
import adminSettingsRouter from './adminSettingsRoutes.js'

const adminRouter = express.Router()

adminRouter.post('/admin-login', loginRateLimiter, loginAdmin)
adminRouter.post('/logout', checkForAuth, logoutAdmin)

// Event categories admin routes
adminRouter.get('/event-categories', checkForAuth, checkForAdmin, getEventCategoriesForAdmin)
adminRouter.post('/event-categories', checkForAuth, checkForAdmin, createEventCategory)
adminRouter.put('/event-categories/:id', checkForAuth, checkForAdmin, updateEventCategory)
adminRouter.patch('/event-categories/:id/toggle', checkForAuth, checkForAdmin, toggleEventCategory)
adminRouter.delete('/event-categories/:id', checkForAuth, checkForAdmin, deleteEventCategory)

// Settings routes (policies, activity logs)
adminRouter.use('/', adminSettingsRouter)

export default adminRouter