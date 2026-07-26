// import type { NextFunction, Request, Response } from 'express';

// export default function errorHandler(
//     err: Error,
//     req: Request,
//     res: Response,
//     _next: NextFunction,
// ): void {
//     console.error(err.stack);

//     res.status(500).json({
//         status: false,
//         message: err.message || 'Internal Server Error',
//         timestamp: new Date().toISOString(),
//         data: null,
//         route: req.originalUrl,
//     });
// }
import type { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
    statusCode?: number;
}

export default function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction,
): void {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        status: false,
        message: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
        data: null,
        route: req.originalUrl,
    });
}