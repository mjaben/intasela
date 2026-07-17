import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'super-secret-key');

  try {
    const res = await fetch('http://localhost:3001/spaces', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Spaces count:', data.length);
    if (data.length > 0) {
      console.log('First space:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
