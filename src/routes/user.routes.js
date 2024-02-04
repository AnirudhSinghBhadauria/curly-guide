import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer-middleware.js";

const routes = Router();

routes.route("/register").post(
  upload.fields([
    // middleware injections
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);
// rotues.route('/login').get(getUser) - get req to login controller
// http://localhost:8080/users.register - post request on register user route!

export default routes;
