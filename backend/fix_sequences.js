const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSequences() {
  try {
    console.log("Fixing Transaction sequence...");
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Transaction"', 'id'), coalesce(max(id),0) + 1, false) FROM "Transaction";`);
    
    console.log("Fixing Notification sequence...");
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Notification"', 'id'), coalesce(max(id),0) + 1, false) FROM "Notification";`);

    console.log("Fixing Post sequence...");
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Post"', 'id'), coalesce(max(id),0) + 1, false) FROM "Post";`);

    console.log("Sequences fixed successfully.");
  } catch (error) {
    console.error("Error fixing sequences:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSequences();
