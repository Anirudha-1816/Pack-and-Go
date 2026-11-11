import express from 'express'
import {
  createOperators,
  getAllOperatorsReq,
  loginOperators,
  updateOperatorRequestStatus,
} from '../controllers/operators/operatorsControllers.js'
import { uploadOperatorImage } from '../middlewares/Uploads/operatorUploadMiddleware.js'
import checkForAuth from '../middlewares/Authentication/checkForAuth.js'
import checkForAdmin from '../middlewares/Authentication/checkForAdmin.js'

const operatorsRouter = express.Router()

operatorsRouter.post('/register', uploadOperatorImage, createOperators)
operatorsRouter.post('/login', loginOperators)
operatorsRouter.get('/all', checkForAuth, checkForAdmin, getAllOperatorsReq)
operatorsRouter.patch(
  '/status/:id',
  checkForAuth,
  checkForAdmin,
  updateOperatorRequestStatus
)

export default operatorsRouter