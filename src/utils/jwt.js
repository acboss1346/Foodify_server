import jwt from "jsonwebtoken";

// Use a fallback secret key for development if the environment variable is missing
const jwtSecret = process.env.JWT_SECRET || 'a_very_strong_default_secret_key'; 

export const signToken = (payload) => {
  // The token is configured to expire in 7 days, matching your utility file
  return jwt.sign(payload, jwtSecret, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, jwtSecret);
};