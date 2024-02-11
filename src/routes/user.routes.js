import { Router } from "express";
import {
  registerUser,
  getAllUsers,
  userLogin,
  userLogout,
  refreshTokens,
  updateUserAvatar,
  updateUserCoverImage,
  changeUserPassword,
  getCurrentUser,
  updateProfile,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer-middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const routes = Router();

// Home route!
routes.route("/").get(getAllUsers);

// Register route
routes.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

routes.route("/login").post(userLogin);
routes.route("/refresh-tokens").post(refreshTokens);

// rotues.route('/login').get(getUser) - get req to login controller
// http://localhost:8080/users.register - post request on register user route!

// Protected Routes!!
routes.route("/logout").post(verifyJWT, userLogout);
routes.route("/change-password").post(verifyJWT, changeUserPassword);
routes.route("/user").get(verifyJWT, getCurrentUser);
routes.route("/profile").patch(verifyJWT, updateProfile);
routes.route("/channel/:username").post(verifyJWT, getUserChannelProfile);
routes.route("/history").get(verifyJWT, getWatchHistory);

// Update profile images!
routes
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

routes
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default routes;
