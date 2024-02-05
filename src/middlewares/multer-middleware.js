import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // file - original file to be uploaded!
    cb(null, "./public/temp"); // destination where temp files are saved on server
  },
  filename: function (req, file, cb) {
    // to add custom suffix to filename
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
