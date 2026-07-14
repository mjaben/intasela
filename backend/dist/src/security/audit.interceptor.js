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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditLogInterceptor = class AuditLogInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, user } = req;
        const isStateChanging = method !== 'GET';
        return next.handle().pipe((0, operators_1.tap)({
            next: (res) => {
                if (isStateChanging) {
                    this.logAction(user?.id || 'anonymous', method, url, body, true);
                }
            },
            error: (err) => {
                if (isStateChanging) {
                    this.logAction(user?.id || 'anonymous', method, url, body, false);
                }
            },
        }));
    }
    async logAction(actorId, method, url, body, success) {
        try {
            let action = 'EXECUTE';
            if (method === 'POST')
                action = 'CREATE';
            if (method === 'PUT' || method === 'PATCH')
                action = 'UPDATE';
            if (method === 'DELETE')
                action = 'DELETE';
            const safeBody = { ...body };
            if (safeBody.password)
                safeBody.password = '***';
            await this.prisma.auditLog.create({
                data: {
                    actorId,
                    action,
                    resourceType: url,
                    requestPayload: safeBody,
                    success,
                }
            });
        }
        catch (e) {
            console.error('Failed to write audit log:', e);
        }
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit.interceptor.js.map