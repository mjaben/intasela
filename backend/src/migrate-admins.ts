import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating admins...');

  // 1. Ensure Super Admin role exists
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

  // 2. Create the SystemAdmin
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
  } else {
    console.log('Admin already exists in SystemAdmin table.');
  }

  // 3. Delete from User table if exists
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
