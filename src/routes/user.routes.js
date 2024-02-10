import { Router } from "express";
import {
  registerUser,
  getAllUsers,
  userLogin,
  userLogout,
  refreshTokens,
  updateUserAvatar,
  updateUserCoverImage,
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

// rotues.route('/login').get(getUser) - get req to login controller
// http://localhost:8080/users.register - post request on register user route!

// Protected Routes!!
routes.route("/logout").post(verifyJWT, userLogout);
routes.route("/refresh-tokens").post(refreshTokens);

// Update profile images!
routes
  .route("/avatar")
  .post(verifyJWT, upload.single("avatar"), updateUserAvatar);

routes
  .route("/coverImage")
  .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default routes;
