import { ZodError } from "zod";

export function errorHandler(err, req, res, next) {
  console.error(err);
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }


  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Something went wrong",
  });
}