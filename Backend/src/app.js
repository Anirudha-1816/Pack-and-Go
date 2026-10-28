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


const app = express()
configDotenv.config()
connectToDataBase()

app.use(cors({
  origin: [
    'https://pack-and-go-eight.vercel.app',
    "http://localhost:5173",
    "http://localhost:4173",
    'http://127.0.0.1:4173'
  ],
  credentials: true,
}));
app.use(express.json())


app.use(express.json())
app.use(cookieParser())



app.use('/users',userRouter)
app.use('/components',componentRouter)
app.use('/contacts',contactRouter)
app.use('/otp',verificationRoutes)
app.use('/trip',tripRouter)
app.use('/booking',bookingRouter)
app.use(errorMiddleWare)

export default app
