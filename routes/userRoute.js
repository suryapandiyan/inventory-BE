//router config

const userRouter = require("express").Router();

//getting user controllers

const {
  registerUser,
  confirmUser,
  loginUser,
  updateUser,
  updateUserPhoto,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

/*****************sign up new user*********************/

userRouter.post("/api/users/register", registerUser);

/*****************Confirm new user*********************/

userRouter.patch("/api/users/confirm/:id", confirmUser);

/****************** User Login ************************/

userRouter.post("/api/users/login", loginUser);

/****************Update user details*******************/

userRouter.patch("/api/users/updateuser", updateUser);

/*****************Update user photo********************/

userRouter.patch("/api/users/updateuserphoto", updateUserPhoto);

/****************Update user Password******************/

userRouter.patch("/api/users/changepassword", changePassword);

/*****************Forgot Password**********************/

userRouter.post("/api/users/forgotpassword", forgotPassword);

/*******************Reset Pasword**********************/

userRouter.patch("/api/users/resetpassword/:resetToken", resetPassword);

module.exports = userRouter;