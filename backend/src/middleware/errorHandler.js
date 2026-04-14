import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: "Internal server error"
  });
}
