import { Router } from "express";
import { registerUser, getAllUsers } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer-middleware.js";

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

// rotues.route('/login').get(getUser) - get req to login controller
// http://localhost:8080/users.register - post request on register user route!

export default routes;
