const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const JWT_SECRET = process.env.JWT_SECRET;
const BEURL = process.env.BEURL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const CLOUD_NAME = process.env.CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
const CLOUD_API_SECRET = process.env.CLOUD_API_SECRET;

module.exports = {
  MONGO_URI,
  PORT,
  EMAIL_USER,
  EMAIL_PASS,
  JWT_SECRET,
  BEURL,
  FRONTEND_URL,
  CLOUD_NAME,
  CLOUD_API_KEY,
  CLOUD_API_SECRET,
};