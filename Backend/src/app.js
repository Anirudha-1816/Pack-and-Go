import configDotenv  from 'dotenv'
import express from 'express'
import connectToDataBase from './configs/dataBaseConnection.js'
import userRouter from './routes/usersRoute.js'
import componentRouter from './routes/components/componentsRoutes.js'
import cors from 'cors'
import errorMiddleWare from './middlewares/errorHandlerMiddleware.js'
import cookieParser from 'cookie-parser'
import contactRouter from './routes/contactRoutes.js'
import verificationRoutes from './routes/verifications/optVerificationRoute.js'
import tripRouter from './routes/trips/trips.js'
import bookingRouter from './routes/components/bookings/bookingsRoutes.js'
import adminRouter from './routes/admin/adminRoutes.js'
import paymentRouter from './routes/payments/paymentRoutes.js'
import swaggerUi from 'swagger-ui-express'
import openApiSpec from './docs/openapi.js'
import {
  handleStripeWebhook,
} from './controllers/payments/paymentController.js'


const app = express()
configDotenv.config()
connectToDataBase()

const allowedOrigins = [
  "https://pack-and-go-eight.vercel.app",
  "https://pack-and-k839aye2k-singhanirudha1816-2385s-projects.vercel.app",
  'https://pack-and-rde2ta65j-singhanirudha1816-2385s-projects.vercel.app/',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://pack-and-go-admin.vercel.app'
];


app.set("trust proxy", 1);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

// Stripe needs the unparsed request bytes to check its webhook signature.
app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
)

app.use(express.json())


app.use('/users',userRouter)
app.use('/components',componentRouter)
app.use('/contacts',contactRouter)
app.use('/otp',verificationRoutes)
app.use('/trip',tripRouter)
app.use('/booking',bookingRouter)
app.use('/admin',adminRouter)
app.use('/api/payments',paymentRouter)

app.use(errorMiddleWare)

export default app
