import { apiError } from "../utils/api-error.js";
import { controllerHandeler } from "../utils/async-handeler.js";
import { User } from "../models/user-model.js";

const registerUser = controllerHandeler(async (req, res) => {
  // get user details from frontend using body!
  // sanitazation of details given by user! (not empty)
  // check if user already exists!
  // check for images and avtaar
  // upload them to cloudinary
  // create final user object in db!
  // remove password and refersh token feild from response!
  // check for user creation
  // return response

  const { fullname, email, username, password } = req.body;

  /* generally there is one validation file that contains functions that we call in different
  files and validate different feilds! */

  if (
    [fullname, email, username, password].some((feild) => feild?.trim() === "") // if any of these things are empty!
  ) {
    throw new apiError(404, "Something is empty!");
  }

  const ifUserAlreadyExists = User.findOne({
    // this $ is for filtering query and checks if any
    $or: [{ username }, { email }],
  });

  if (ifUserAlreadyExists) throw new apiError(404, "User already exists!");

  // checking for images! - this files comes from the multer middleware (upload) that we have attached to the routes!
  const avatarImageLocalPath = req.files?.avtaar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarImageLocalPath) throw new apiError(404, "Avatar image not found!");

  // upload to cloudinary!

  // res.status(200).json({
  //   email,
  //   username,
  //   fullname,
  // });
});

export { registerUser };
