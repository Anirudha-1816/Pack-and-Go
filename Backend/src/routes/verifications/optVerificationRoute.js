import express from 'express'
import { createOtp, verifyOtp } from '../../controllers/Verivications/otpVerificationController.js'

const verificationRoutes =  express.Router()

verificationRoutes.post('/verify', verifyOtp)
verificationRoutes.post('/create', createOtp)


export default verificationRoutes