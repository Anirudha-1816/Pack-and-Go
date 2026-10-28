import express from 'express'
import { createButton,
     createContentBlocks,
      createNav,
        getButton,
          getContentBlocks,
            getNav,
            getTrips,
            createBooking
                
             } from '../../controllers/components/componentsController.js'

const componentRouter = express.Router()

componentRouter.get('/get-trips',getTrips)

componentRouter.post('/create-booking',createBooking)


componentRouter.route('/nav').get(getNav).post(createNav)
componentRouter.route('/buttons').get(getButton).post(createButton)
componentRouter.route('/content-blocks').get(getContentBlocks).post(createContentBlocks)


export default componentRouter;

