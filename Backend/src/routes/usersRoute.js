import express from 'express';
import checkForAuth from '../middlewares/Authentication/checkForAuth.js';
import { requireVerifiedEmail } from '../middlewares/verifications/requireVerifiedEmail.js';
import { createUser, getCurrentUser, loginUser, logoutUser, updatePassword, getThemePreference, updateThemePreference } from '../controllers/users/userController.js';
import  { loginRateLimiter, otpRateLimiter } from '../middlewares/Limiters/rateLimitersMiddleware.js';
import { checkHeaders } from '../controllers/check.js';

import { validateRequest } from '../middlewares/validations/validateRequest.js';
import { userRegisterSchema } from '../validations/users/user.validation.js';

const userRouter = express.Router()



userRouter.get('/check',checkHeaders)
userRouter.post(
  '/create',
  otpRateLimiter,
  validateRequest(userRegisterSchema),
//   requireVerifiedEmail,
  createUser
);
userRouter.post('/login',loginRateLimiter,loginUser)
userRouter.post('/logout',checkForAuth,logoutUser)
userRouter.get('/get-current-user',checkForAuth,getCurrentUser)
userRouter.put('/update-password',checkForAuth,updatePassword)
userRouter.get('/theme-preference', checkForAuth, getThemePreference)
userRouter.put('/theme-preference', checkForAuth, updateThemePreference)

export default userRouter