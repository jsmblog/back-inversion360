export const handleError = (err, res, provider) => {
  const statusCode = err.response?.status || 500;
  const errorData = err.response?.data || { message: err.message };
  
  return res.status(statusCode).json({
    error: errorData,
    provider
  });
}