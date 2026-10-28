import express from 'express';
import checkForAuth from '../middlewares/Authentication/checkForAuth.js';
import { requireVerifiedEmail } from '../middlewares/verifications/requireVerifiedEmail.js';
import { createUser, getCurrentUser, loginUser, logoutUser } from '../controllers/users/userController.js';

const userRouter = express.Router()



userRouter.post('/create',requireVerifiedEmail,createUser)
userRouter.post('/login',loginUser)
userRouter.post('/logout',checkForAuth,logoutUser)
userRouter.get('/get-current-user',checkForAuth,getCurrentUser)

    

export default userRouter