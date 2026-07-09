"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UserProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
let UserProcessor = UserProcessor_1 = class UserProcessor extends bullmq_1.WorkerHost {
    logger = new common_1.Logger(UserProcessor_1.name);
    async process(job) {
        this.logger.debug(`Processing job ${job.id} of type ${job.name} with data:`, job.data);
        switch (job.name) {
            case 'send-welcome-email': {
                const { email, username } = job.data;
                this.logger.log(`[Email Service] Simulating welcome email sent to ${username} at ${email}`);
                await new Promise((resolve) => setTimeout(resolve, 2000));
                this.logger.log(`[Email Service] Welcome email processing complete for ${email}`);
                break;
            }
            case 'process-profile-image': {
                this.logger.log(`[Image Service] Processing profile image for user ${job.data.userId}`);
                break;
            }
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
        return { status: 'completed' };
    }
};
exports.UserProcessor = UserProcessor;
exports.UserProcessor = UserProcessor = UserProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('user-tasks')
], UserProcessor);
//# sourceMappingURL=users.processor.js.map