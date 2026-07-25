import { NextFunction, Request, Response } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
type SyncFunction = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Wraps an ASYNC Express route handler and automatically forwards any
 * thrown/rejected errors to next() → global error handler.
 * Use for all async controllers (database calls, API requests, etc.)
 */
export const catchAsync = (fn: AsyncFunction) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch((err: unknown) => {
            const error = err instanceof Error ? err : new Error('Unexpected error');
            next(error);
        });
    };
};

/**
 * Wraps a SYNC Express route handler and automatically forwards any
 * thrown errors to next() → global error handler.
 * Use for synchronous middleware or route handlers.
 */
export const catchSync = (fn: SyncFunction) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            fn(req, res, next);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unexpected error');
            next(error);
        }
    };
};
