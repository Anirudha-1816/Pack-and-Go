import jwt from 'jsonwebtoken'
import statusCode from '../../utils/statusCodes.js';

const checkForAuth = async (req,res,next) => {

    try {
        
        const token = req.cookies.token;
        
        if(!token){
            const error = new Error('Invalid User')
            error.status = statusCode.UNAUTHORIZED
            error.extraDetails = 'Please Login First'

            return next(error)

        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        // console.log(' check decoded :- ',  decoded)

        req.user =decoded

        next()

    } catch (err) {

        next(err)
        
    }
    
}

export default checkForAuth