const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  EMAIL_PASS,
  EMAIL_USER,
  FRONTEND_URL,
  JWT_SECRET,
} = require("../utils/config");

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1d" });
};

//getting token

const getTokenFrom = (req) => {
  const authorization = req.get("authorization");

  if (authorization && authorization.startsWith("bearer ")) {
    return authorization.replace("bearer ", "");
  }
};

// Register User
const registerUser = async (req, res) => {
  try {
    //getting data from FE
    const { name, lName, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !lName || !password || !phone) {
      res.status(400).json({ message: "all fields are mandotary" });
      return;
    }

    // Check if user email already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    //generating random string

    const randomString =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const link = `${FRONTEND_URL}/confirm/${randomString}`;

    // Create new user
    const user = await User.create({
      name,
      email,
      lName,
      password,
      phone,
      verifyToken: randomString,
    });

    //sending email for Confirm account

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const sendMail = async () => {
      const info = await transporter.sendMail({
        from: `"Udhayasooriyan" <${EMAIL_PASS}>`,
        to: user.email,
        subject: "Confirm account",
        text: link,
      });
    };

    sendMail();

    //sending data to FE
    res
      .status(201)
      .json({ message: `account created successfully ${user.name}` });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Confirm User
const confirmUser = async (req, res) => {
  try {
    //getting data from FE using ID params
    const verifyToken = req.params.id;

    const matchedUser = await User.findOne({ verifyToken });

    //if student not found throw error
    if (matchedUser === null || matchedUser.verifyToken === "") {
      return res
        .status(400)
        .json({ message: "user not exists or link expired" });
    }

    //confirming and updating account
    matchedUser.isVerified = true;

    matchedUser.verifyToken = "";

    await User.findByIdAndUpdate(matchedUser._id, matchedUser);

    //sending data to FE
    res.status(201).json({
      message: `${matchedUser.name} account has been verified successfully`,
    });
    //
  } catch (error) {
    return res
      .status(400)
      .json({ message: "student not exists or link expired" });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    //getting data from FE

    const { email, password } = req.body;

    // Validate Request
    if (!email || !password) {
      res.status(400).json({ message: "all fields are mandotary" });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "user not exist/Please Sign-up" });
    }

    // User exists, check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    // if user password does not match send error
    if (!passwordIsCorrect) {
      return res.status(401).json({ message: "password incorrect" });
    }

    // if user not verified send error
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Account not verfied, kindly check your Email" });
    }

    //   Generate Token
    const token = generateToken(user._id);

    //format user data before sending
    const formatUser = {
      _id: user._id,
      name: user.name,
      lName: user.lName,
      email: user.email,
      photo: user.photo,
      phone: user.phone,
      bio: user.bio,
    };

    //sending data to FE

    res.status(200).json({
      token,
      formatUser,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    //verify the user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    //getting data from FE

    const { name, email, lName, phone, bio } = req.body;

    const matchedUser = await User.findOne({ email });

    if (matchedUser.id !== decodedToken.id) {
      return res.status(401).json({ message: "user not " });
    }

    matchedUser.name = name;
    matchedUser.lName = lName;
    matchedUser.phone = phone;
    matchedUser.bio = bio;

    const updatedUser = await matchedUser.save();

    //sending data to FE

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      lName: updatedUser.lName,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Update User photo
const updateUserPhoto = async (req, res) => {
  try {
    //verify user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    //getting data from FE

    const { email, photo } = req.body;

    const matchedUser = await User.findOne({ email });

    if (!matchedUser) {
      return res.status(401).json({ message: "user not exist" });
    }

    if (matchedUser.id !== decodedToken.id) {
      return res.status(401).json({ message: "user not authorized" });
    }

    matchedUser.photo = photo;

    const updatedUser = await matchedUser.save();

    //sending data to FE

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      lName: updatedUser.lName,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    //getting data from FE

    const { email, oldpassword, password } = req.body;

    const matchedUser = await User.findOne({ email });

    if (!matchedUser) {
      return res.status(401).json({ message: "user not exist" });
    }

    //verify user token

    const token = getTokenFrom(req);

    if (!token) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.id) {
      return res
        .status(401)
        .json({ message: "session timeout please login again" });
    }

    if (matchedUser.id !== decodedToken.id) {
      return res.status(401).json({ message: "user not authorized" });
    }

    // check if old password matches password in DB
    const passwordIsCorrect = await bcrypt.compare(
      oldpassword,
      matchedUser.password
    );

    // Save new password
    if (matchedUser && passwordIsCorrect) {
      matchedUser.password = password;

      await matchedUser.save();

      //getting data from FE

      res.status(200).send("Password updated successfully");
    } else {
      res.status(400);
      return res.status(401).json({ message: "old password incorrect" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    //getting data from FE

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "User not exists" });
      return;
    }

    // Delete token if it exists in DB
    let token = await Token.findOne({ userId: user._id });

    if (token) {
      await token.deleteOne();
    }

    // Create Reste Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

    // Hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save Token to DB
    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
    }).save();

    // Construct Reset Url
    const resetUrl = `${FRONTEND_URL}/resetpassword/${resetToken}`;

    // Reset Email
    const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>

      <a href=${resetUrl} target="_blank">${resetUrl}</a>

      <p>Regards...</p>
      <p>Inventory Team</p>
    `;
    const subject = "Password Reset Request";

    //sending email for Confirm account

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const sendMail = async () => {
      const info = await transporter.sendMail({
        from: `"Udhayasooriyan" <${EMAIL_PASS}>`,
        to: user.email,
        subject,
        html: message,
      });
    };

    //sending mail with reset link

    sendMail();

    return res
      .status(201)
      .json({ message: `Mail has been send to ${user.email}` });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    //getting data & id from FE

    const { password } = req.body;

    const { resetToken } = req.params;

    // Hash token, then compare to Token in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // fIND tOKEN in DB
    const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
      res.status(400).json({ message: "Link Expired, Please try again" });
      return;
    }

    // Find user
    const user = await User.findOne({ _id: userToken.userId });

    user.password = password;

    await user.save();

    await userToken.deleteOne();

    //sending response data to FE

    res.status(200).json({
      message: "Password updated Successfully, Please Login",
    });
    //
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  confirmUser,
  loginUser,
  updateUser,
  updateUserPhoto,
  changePassword,
  forgotPassword,
  resetPassword,
};