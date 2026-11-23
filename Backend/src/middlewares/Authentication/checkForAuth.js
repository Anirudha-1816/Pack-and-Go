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
        // jwt.verify throws these for expired or invalid tokens. Return 401, not 500.
        if (
            err.name === "TokenExpiredError" ||
            err.name === "JsonWebTokenError" ||
            err.name === "NotBeforeError"
        ) {
            err.status = statusCode.UNAUTHORIZED
            err.message =
                err.name === "TokenExpiredError"
                    ? "Session expired. Please login again."
                    : "Invalid session. Please login again."
            err.extraDetails = "Please Login First"
        }

        next(err)
    }
    
}

export default checkForAuth