import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  console.error('[ErrorHandler]', err.message, err.stack);

  // Prisma unique constraint
  if (err.code === 'P2002') {
    res.status(409).json({ success: false, message: 'A record with this value already exists.' });
    return;
  }

  // Prisma not found
  if (err.code === 'P2025') {
    res.status(404).json({ success: false, message: 'Record not found.' });
    return;
  }

  // JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message || 'Something went wrong.';

  res.status(statusCode).json({ success: false, message });
}
