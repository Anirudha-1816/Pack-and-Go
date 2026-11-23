import express from 'express'
import { createButton,
     createContentBlocks,
      createNav,
        getButton,
          getContentBlocks,
            getNav,
            getTrips,
            getEvents,
            getDestinations,
            createCity,
            getCity,
            getPackageCategory,
            createPackageCategory

             } from '../../controllers/components/componentsController.js'
import checkForAdmin from '../../middlewares/Authentication/checkForAdmin.js';
import checkForAuth from '../../middlewares/Authentication/checkForAuth.js';

const componentRouter = express.Router()

// Public GET routes
componentRouter.get("/get-trips", getTrips);
componentRouter.get("/events", getEvents);
componentRouter.get("/destinations", getDestinations);

componentRouter.get("/nav", getNav);
componentRouter.get("/city", getCity);
componentRouter.get("/buttons", getButton);
componentRouter.get("/content-blocks", getContentBlocks);
componentRouter.get("/packageCategory", getPackageCategory);

// Admin-only POST routes
componentRouter.post("/nav",  checkForAuth, checkForAdmin, createNav);
componentRouter.post("/city",  checkForAuth, checkForAdmin, createCity);
componentRouter.post("/buttons",  checkForAuth, checkForAdmin, createButton);
componentRouter.post("/content-blocks",  checkForAuth, checkForAdmin, createContentBlocks);
componentRouter.post("/packageCategory",  checkForAuth, checkForAdmin, createPackageCategory);


export default componentRouter;