import { apiError } from "../utils/api-error.js";
import { controllerHandeler } from "../utils/async-handeler.js";
import { User } from "../models/user-model.js";
import { uploadOnCloudinary } from "../utils/cloudinary-file-upload.js";
import { apiResponse } from "../utils/api-response.js";
import jwt from "jsonwebtoken";
import { options } from "../constants.js";
import { deleteLocalFile } from "../utils/delete-local-file.js";
import mongoose from "mongoose";

// Generate Refresh And Access Tokens
const generateRefreshAndAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // using schema custom methods, made in user model
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

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
  if ((!username && !email) || !password)
    throw new apiError(403, "Username or Email is required!");

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new apiError(403, "User not registered! Please sign up!");
  // console.log(user);

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

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        `${loggedInUser.username} logged in succesfully!`,
      ),
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
      $unset: {
        refreshToken: 1, // this unset the refreshToken feild,
      },
    },
    { new: true },
  );

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

/* After access token expires we again check the refresh Token with what is saved in the db in user model!
 if the incoming token from user cookies matches what is in db, we will create new access and refresh Token for the user and save it in db and client cookies! */

const refreshTokens = controllerHandeler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) throw new apiError(401, "Unauthorized Access!");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!decodedToken) throw new apiError(401, "Unauthorized Access!");

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new apiError(401, "Invalid authorization token!");

    if (user.refreshToken !== incomingRefreshToken)
      throw new apiError(401, "Unauthorized Access!");

    const { refreshToken, accessToken } = await generateRefreshAndAccessTokens(
      user._id,
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken },
          "Access token and Refersh tokens refreshed succesfully!",
        ),
      );
  } catch (error) {
    throw new apiError(404, "Invalid refresh token!");
  }
});

const changeUserPassword = controllerHandeler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const userId = req.user?._id;
  const user = await User.findById(userId);
  if (!user) throw new apiError(401, "Unauthorized Access!");

  const isPasswordCorrect = await isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new apiError(401, "Old Password is wrong!");

  // Changing new password in the user model!
  user.password = newPassword;
  // Saving the model change
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new apiResponse(200, {}, "Password Changed Succesfully!"));
});

const getCurrentUser = controllerHandeler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "User found succesfully!"));
});

const updateProfile = controllerHandeler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email)
    throw new apiError(401, "Both email and fullname are required!");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true, // this new will ensure that uppdated data is saved in this variable;
    },
  ).select("-password");

  return res
    .status(201)
    .json(new apiResponse(201, user, "Profile updated succesfully!"));
});

const updateUserAvatar = controllerHandeler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new apiError(401, "Currupt file path!");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new apiError(401, "Error while uploading new avatar");

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  // Unlink local file!
  await deleteLocalFile(avatarLocalPath);

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { updatedAvatar: updatedUser.avatar },
        "Display picture updated succesfully!",
      ),
    );
});

const updateUserCoverImage = controllerHandeler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) throw new apiError(401, "Currupt Image Uploaded!");

  const updatedCoverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!updatedCoverImage.url)
    throw new apiError(503, "Error while uploading image to cloudinary!");

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: updatedCoverImage.url,
      },
    },
    { new: true },
  );

  // Unlink local file!
  await deleteLocalFile(coverImageLocalPath);

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { updatedCoverImage: updatedUser.coverImage },
        "Cover Image updated successfully!",
      ),
    );
});

const getUserChannelProfile = controllerHandeler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new apiError(401, "Username is missing");

  // Aggregation pripelines!
  const channel = User.aggregate([
    {
      // task - filetering the username!
      $match: {
        // This match will bring only username feild in the documents of User model! - basically filtering only username feild!
        username: username?.toLowerCase(),
      },
    },
    {
      // task - finds how many subscribers a channel has!
      $lookup: {
        from: "subscriptions", // This refers to subscriptions model! (saved in db as plural and toLowerCase!
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", // ----- 1
      },
    },
    {
      // task - finds how many channels I have subscribed
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo", // ---- 2
      },
    },
    {
      $addFields: {
        subscribersCount: {
          // counts the subscribers and subscribedTo!
          $size: "$subscribers", // ----- 1  - counts the no. of documents!
        },
        channelsSubscribedCount: {
          // counts the subscribers and subscribedTo!
          $size: "$subscribedTo", // ---- 2
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscribedTo: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  // Aggregation pripelines always returns result in arrays of objects! threfore, channle is an array!
  if (!channel?.length) throw new apiError(401, "Channel does not exists!");

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully!"),
    );
});

const getWatchHistory = controllerHandeler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.objectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully!",
      ),
    );
});

export {
  registerUser,
  getAllUsers,
  userLogin,
  userLogout,
  refreshTokens,
  changeUserPassword,
  getCurrentUser,
  updateProfile,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
