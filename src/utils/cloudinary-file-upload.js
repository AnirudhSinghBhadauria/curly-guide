import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) throw new Error("Local file not found!");
    // upload file on cloudinary!
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // url of the file uploaded to cloudinary
    let fileUrl = response.url;
    // file uploaded succesfully! now unlink temp local file.
    return fileUrl;
  } catch (error) {
    // deleted file from our server in case of any file curruption!
    fs.unlinkSync(localFilePath);
  }
};
