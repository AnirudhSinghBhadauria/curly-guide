import mongoose from "mongoose";
import { jwt } from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
      toLowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      toLowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      trim: true,
      index: true,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
      toLowercase: true,
    },
    coverImage: {
      type: String,
      toLowercase: true,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

userSchema.methods.generateAccessToken(async function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
});

userSchema.methods.generateRefreshToken(async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
});

export const User = mongoose.model("User", userSchema);
