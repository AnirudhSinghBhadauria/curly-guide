import fs from "fs";
import { apiError } from "./api-error.js";

export const deleteLocalFile = async (localPath) => {
  try {
    await fs.unlinkSync(localPath);
  } catch (error) {
    throw new apiError(503, "Unable to unlink local file!");
  }
};
