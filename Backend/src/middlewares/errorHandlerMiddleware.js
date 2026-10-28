import statusCode from '../utils/statusCodes.js'

const errorMiddleWare = (err,req,res,next)=>{

    const status = err.statusCode || err.status ||  statusCode.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Enteral error Please contactUs';
    const extraDetails = err.extraDetails
    res.status(status).json({
        success : false,
        message,
        extraDetails 
    });

}

export default errorMiddleWare