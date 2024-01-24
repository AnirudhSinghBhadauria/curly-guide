import mongoose from "mongoose";

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

export const User = mongoose.model("User", userSchema);
