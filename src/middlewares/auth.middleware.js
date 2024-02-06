import { User } from "../models/user-model.js";
import { apiError } from "../utils/api-error.js";
import { controllerHandeler } from "../utils/async-handeler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = controllerHandeler(async (req, res, next) => {
  try {
    const bearerToken = req.header("Authorization").split(" ")[1]; // incase of a mobile application!

    const token = req.cookies.accessToken || bearerToken;
    if (!token) throw new apiError(401, "Unauthorized request!");

    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    ); // token: {_id, username, fullname, email} saved in usermodel

    if (!user) throw new apiError(403, "Invalid access token!");

    req.user = user; // adding actual user doc to req, that we will use in controllers!
    next();
  } catch (error) {
    throw new apiError(401, "Invalid access token!");
  }
});
