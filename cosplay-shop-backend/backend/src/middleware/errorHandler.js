export const errorHandler = (err, req, res, next) => {
  console.error(err)

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message })
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized" })
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  })
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
