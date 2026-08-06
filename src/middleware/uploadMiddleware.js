import multer from "multer";

const storage = multer.memoryStorage(); // buffer stays in memory, never touches disk

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WEBP, or PDF files are allowed"));
  }
}

export const uploadSingleFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
}).single("proof"); // field name the client must use in the form-data 