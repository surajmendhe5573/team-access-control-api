// import { JwtPayload } from '../modules/auth/auth.types.js';

// declare global {
//     namespace Express {
//         interface Request {
//             validated?: unknown;
//             user?: JwtPayload;
//         }

//         interface Response {
//             success: (message?: string | null, data?: unknown, statusCode?: number) => void;
//             fail: (
//                 message?: string | null,
//                 statusCode?: number,
//                 extras?: Record<string, unknown>,
//             ) => void;
//         }
//     }
// }

// export {};

import { OrganizationMembershipContext } from '../middlewares/authorization.js';
import { JwtPayload } from '../modules/auth/auth.types.js';

declare global {
    namespace Express {
        interface Request {
            validated?: unknown;
            user?: JwtPayload;
            organizationMembership?: OrganizationMembershipContext;
        }

        interface Response {
            success: (message?: string | null, data?: unknown, statusCode?: number) => void;
            fail: (
                message?: string | null,
                statusCode?: number,
                extras?: Record<string, unknown>,
            ) => void;
        }
    }
}

export {};
