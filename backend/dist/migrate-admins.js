"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Migrating admins...');
    let role = await prisma.role.findFirst({
        where: { name: 'super_admin' }
    });
    if (!role) {
        role = await prisma.role.create({
            data: {
                name: 'super_admin',
                permissions: ["MANAGE_USERS", "MODERATE_CONTENT", "MANAGE_FINANCE", "MANAGE_SYSTEM"]
            }
        });
        console.log('Created super_admin role.');
    }
    const email = 'admin@intasela.com';
    const password = await bcrypt.hash('IntaselaAdmin2026!', 10);
    const existingAdmin = await prisma.systemAdmin.findUnique({
        where: { email }
    });
    if (!existingAdmin) {
        await prisma.systemAdmin.create({
            data: {
                email,
                password,
                firstName: 'System',
                lastName: 'Admin',
                roleId: role.id,
            }
        });
        console.log('Migrated admin@intasela.com to SystemAdmin table.');
    }
    else {
        console.log('Admin already exists in SystemAdmin table.');
    }
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        await prisma.user.delete({
            where: { email }
        });
        console.log('Deleted admin@intasela.com from public User table.');
    }
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=migrate-admins.js.map