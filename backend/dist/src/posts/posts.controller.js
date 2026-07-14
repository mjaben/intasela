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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const posts_service_1 = require("./posts.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
let PostsController = class PostsController {
    postsService;
    jwtService;
    constructor(postsService, jwtService) {
        this.postsService = postsService;
        this.jwtService = jwtService;
    }
    async getFeed(authHeader, type) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) {
            }
        }
        return this.postsService.getFeed(currentUserId, type);
    }
    async getOrbitFeed(type, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) { }
        }
        return this.postsService.getOrbitFeed(currentUserId, type);
    }
    async getBookmarks(req) {
        return this.postsService.getBookmarks(req.user.id);
    }
    async getPostsByUsername(username, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) { }
        }
        return this.postsService.getPostsByUsername(username, currentUserId);
    }
    async getRepliesByUsername(username, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) { }
        }
        return this.postsService.getRepliesByUsername(username, currentUserId);
    }
    async getLikesByUsername(username, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) { }
        }
        return this.postsService.getLikesByUsername(username, currentUserId);
    }
    async getPostById(id, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) {
            }
        }
        return this.postsService.getPostById(parseInt(id), currentUserId);
    }
    async createPost(req, body) {
        return this.postsService.createPost(req.user.id, body.content, body.parentId, body.quotedPostId, {
            mediaUrl: body.mediaUrl,
            thumbnailUrl: body.thumbnailUrl,
            mediaType: body.mediaType,
            videoWidth: body.videoWidth,
            videoHeight: body.videoHeight,
            videoDuration: body.videoDuration
        });
    }
    async toggleEngagement(req, id, body) {
        return this.postsService.toggleEngagement(req.user.id, parseInt(id), body.type);
    }
    async incrementView(id, authHeader) {
        let currentUserId;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.verify(token);
                currentUserId = decoded.sub;
            }
            catch (e) { }
        }
        return this.postsService.incrementView(parseInt(id), currentUserId);
    }
    async deletePost(req, id) {
        return this.postsService.deletePost(parseInt(id), req.user.id);
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('orbit'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getOrbitFeed", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('bookmarks'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getBookmarks", null);
__decorate([
    (0, common_1.Get)('user/:username'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPostsByUsername", null);
__decorate([
    (0, common_1.Get)('user/:username/replies'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getRepliesByUsername", null);
__decorate([
    (0, common_1.Get)('user/:username/likes'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getLikesByUsername", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPostById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/engage'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "toggleEngagement", null);
__decorate([
    (0, common_1.Post)(':id/view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "incrementView", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deletePost", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService,
        jwt_1.JwtService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map