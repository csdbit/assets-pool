// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 异步错误捕获包装器
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code } = err;

  // Prisma 错误处理
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'Duplicate field value';
    code = 'DUPLICATE_ERROR';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    code = 'NOT_FOUND';
  }

  // JWT 错误处理
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Multer 错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    code = 'FILE_TOO_LARGE';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    code = 'UNEXPECTED_FILE';
  }

  // 开发环境下输出错误堆栈
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // 生产环境下隐藏系统错误细节
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Something went wrong';
    code = 'INTERNAL_ERROR';
  }

  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 处理
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  AppError,
  catchAsync,
  errorHandler,
  notFoundHandler
};