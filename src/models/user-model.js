import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

// THis pre is like a middleware that would happen whenever a db object is made using this schema!

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Making methods and current context for a particular schema!
// Now these custom methods are available on the variables that we make using User model, eg.
// const user = User.findOne({....});
// user.isPasswordCorrect(password) can be used, similarly,
// user.generateRefreshToken() and user.generateAccessToken() can also be used!

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", userSchema);
