import express from 'express'
import { loginOperators } from '../controllers/operators/operatorsControllers.js'

const operatorsRouter = express.Router()

operatorsRouter.post('/login', loginOperators)

export default operatorsRouter