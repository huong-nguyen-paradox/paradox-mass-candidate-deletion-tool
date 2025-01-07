const errorHandler = (err, req, res, next) => {
  console.log("In error handler");
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
})};

export default errorHandler;