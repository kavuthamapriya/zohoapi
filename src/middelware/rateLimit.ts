import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6, // limit each IP to 5 requests
  message: 'Too many requests from this IP, please try again after an hour',
});

export default limiter;
