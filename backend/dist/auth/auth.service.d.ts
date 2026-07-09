import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
export declare class AuthService {
    private usersService;
    private jwtService;
    private userQueue;
    constructor(usersService: UsersService, jwtService: JwtService, userQueue: Queue);
    validateUser(identifier: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: any;
    }>;
    register(data: any): Promise<{
        access_token: string;
        user: any;
    }>;
}
