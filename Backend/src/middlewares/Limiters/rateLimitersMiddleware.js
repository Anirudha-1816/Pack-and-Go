import {RateLimiterMemory ,BurstyRateLimiter } from 'rate-limiter-flexible'
import statusCode from '../../utils/statusCodes.js';


const steadyLogin =  new RateLimiterMemory({points : 5 ,duration : 60});
const burstyLogin = new RateLimiterMemory({points : 20, duration : 600})
const limiterLogin =  new BurstyRateLimiter(steadyLogin,burstyLogin)

export const loginRateLimiter = async (req, res, next) => {
  try {

   await limiterLogin.consume(req.ip);
    console.log(req.ip)
    next();


  } catch (err) {

    if (err && typeof err.msBeforeNext === "number") {
      return next({

        statusCode: statusCode.TOO_MANY_REQUESTS,
        message: "Too many login attempts. Please try again later.",
        extraDetails: {
          retryAfter: Math.ceil(err.msBeforeNext / 1000),
        
        },
      });
    }

    next(err);
  }
};




const otpLimiter = new RateLimiterMemory({
  points: 5,
  duration: 300, // 5 minutes
  blockDuration: 300, // Block for 5 minutes
});

const paymentLimiter = new RateLimiterMemory({ points: 10, duration: 60 });

export const paymentRateLimiter = async (req, res, next) => {
  try {
    await paymentLimiter.consume(req.user?.userId || req.ip);
    next();
  } catch (err) {
    if (typeof err?.msBeforeNext === "number") {
      return res.status(statusCode.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many payment requests. Please try again later.",
      });
    }

    next(err);
  }
};

export const otpRateLimiter = async (req, res, next) => {
  try {
    const key = req.ip;

    console.log(`userid: ${key}`)

    await otpLimiter.consume(key);

    next();
  } catch (err) {
    if (err && typeof err.msBeforeNext === "number") {
      return res.status(429).json({
        success: false,
        message: "Too many OTP verification attempts. Please try again later.",
        extraDetails: {
          retryAfter: Math.ceil(err.msBeforeNext / 1000),
        },
      });
    }

    next(err);
  }
};
