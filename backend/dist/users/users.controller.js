"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
let UsersController = class UsersController {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async getProfile(username, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) { }
        }
        const profile = await this.usersService.getProfileByUsername(username, currentUserId);
        if (!profile) {
            throw new common_1.NotFoundException('User not found');
        }
        return profile;
    }
    async updateProfile(req, updateData) {
        const userId = req.user.id;
        return this.usersService.updateProfile(userId, updateData);
    }
    async followUser(req, username) {
        const followerId = req.user.id;
        return this.usersService.followUser(followerId, username);
    }
    async unfollowUser(req, username) {
        const followerId = req.user.id;
        return this.usersService.unfollowUser(followerId, username);
    }
    async getFollowers(username) {
        return this.usersService.getFollowers(username);
    }
    async getFollowing(username) {
        return this.usersService.getFollowing(username);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile/:username'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':username/follow'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "followUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':username/follow'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unfollowUser", null);
__decorate([
    (0, common_1.Get)(':username/followers'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)(':username/following'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowing", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService, jwt_1.JwtService])
], UsersController);
//# sourceMappingURL=users.controller.js.map