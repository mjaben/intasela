import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(signInDto: Record<string, any>): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: Record<string, any>): Promise<{
        access_token: string;
        user: any;
    }>;
}
