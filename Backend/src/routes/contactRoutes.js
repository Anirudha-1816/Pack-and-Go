import express from 'express'
import { createContacts } from '../controllers/contacts/contactsControllers.js'
import checkForAuth from '../middlewares/Authentication/checkForAuth.js'

const contactRouter = express.Router()

contactRouter.post('/create-contacts',checkForAuth,createContacts)

export default contactRouter