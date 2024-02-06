import { apiError } from "../utils/api-error.js";
import { controllerHandeler } from "../utils/async-handeler.js";
import { User } from "../models/user-model.js";
import { uploadOnCloudinary } from "../utils/cloudinary-file-upload.js";
import { apiResponse } from "../utils/api-response.js";

const generateRefreshAndAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // using schema custom methods, made in user model
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefershToken();

    // saving generated refresh token to database!
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // just save this in db dont need to validate the whole schema!

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(503, "Something went wrong while generating tokens!");
  }
};

// Home Controller
const getAllUsers = controllerHandeler(async (req, res) => {
  res
    .status(200)
    .json(new apiResponse(200, { message: "done with this" }, "done"));
});

// registerUser Controller
const registerUser = controllerHandeler(async (req, res) => {
  // Algorithm for registering user to our youtube fake clone!

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

  const ifUserAlreadyExists = await User.findOne({
    // this $ is for filtering query and checks if any
    $or: [{ username }, { email }],
  });

  if (ifUserAlreadyExists) throw new apiError(404, "User already exists!");

  // checking for images! - this files comes from the multer middleware (upload) that we have attached to the routes!
  const avatarImageLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // In case user doesnt send the cover image which is not required!
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarImageLocalPath) throw new apiError(404, "Avatar image not found!");

  // upload to cloudinary!
  const avatar = await uploadOnCloudinary(avatarImageLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new apiError(404, "Avatar image not found!");

  // entry to database!

  const user = await User.create({
    fullname,
    avatar,
    coverImage: coverImage || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser)
    throw new apiError(500, "something went wrong while registering user!");

  res
    .status(201)
    .json(new apiResponse(200, createdUser, "User created Succesfully!"));
});

// Login controller!
const userLogin = controllerHandeler(async (req, res) => {
  //  take username and password from user using body
  //  sanitize username and login
  //  find the user
  //  if user exists, check password
  //  generate tokens (access and refersh token for user)!
  //  send cookies
  //  send success response

  const { username, email, password } = req.body;
  if ((!username && !email) || !email?.includes("@") || !password)
    throw new apiError(403, "Invalid input!");

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new apiError(403, "User not registered! Please sign up!");

  // checking password!
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new apiError(403, "Incorrect password!");

  const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
    user._id,
  );

  // As the above 'user' is not updated we will again find the update user document!
  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password",
  );
  // user.save({ validateBeforeSave: false });  would have done the same thing!

  // sending cookies back to client!
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      apiResponse(200, { user: loggedInUser, accessToken, refreshToken }),
      "User logged in succesfully!",
    );
  /* also sending refreshToken and accessToken in json resposne as the backend maybe
  used for any application too! */
});

// Logout controller!

const userLogout = controllerHandeler(async (req, res) => {
  // remove the token cookies
  // remove 'refreshToken' from document of user!

  const loggedinUser = req.user;

  await User.findOneAndUpdate(
    loggedinUser._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new apiResponse(
        201,
        {
          success: true,
          message: `${loggedinUser.fullname} logged out!`,
        },
        "User logged out succesfully!",
      ),
    );
});

export { registerUser, getAllUsers, userLogin, userLogout };
