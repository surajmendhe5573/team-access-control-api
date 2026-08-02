import 'dotenv/config';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/env.js';
import errorHandler from './middlewares/default/errorHandler.js';
import notFound from './middlewares/default/notFound.js';
import { responseFormatter } from './middlewares/default/responseFormatter.js';
import authRoutes from './modules/auth/auth.routes.js';
import memberRoutes from './modules/members/member.route.js';
import organizationRoutes from './modules/organizations/organization.routes.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            const allowedOrigins = config.cors.origins;

            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.use(responseFormatter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Server is running! Welcome to the backend');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/:id/members', memberRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
