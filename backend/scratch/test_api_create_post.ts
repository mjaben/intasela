import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) return console.log('No user');

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'super-secret-key');

  try {
    const res = await fetch('http://localhost:3001/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: 'Test post from API' })
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
