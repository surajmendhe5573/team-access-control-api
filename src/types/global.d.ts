export interface ResponseResult<T = unknown[] | object> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    error?: string | object;
}

declare global {}
