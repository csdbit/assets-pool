const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'user@example.com'
      }
    });

    if (user) {
      console.log('User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Username:', user.username);
      console.log('- Status:', user.status);
      console.log('- Role:', user.role);
      console.log('- Created:', user.createdAt);
      console.log('- Updated:', user.updatedAt);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();