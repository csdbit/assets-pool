import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
      storageLimit: BigInt(10 * 1024 * 1024 * 1024), // 10GB for admin
    },
  })

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'testuser',
      password: userPassword,
      role: 'USER',
      emailVerified: true,
    },
  })

  // 创建一些标签
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: '风景' },
      update: {},
      create: { name: '风景' },
    }),
    prisma.tag.upsert({
      where: { name: '人物' },
      update: {},
      create: { name: '人物' },
    }),
    prisma.tag.upsert({
      where: { name: '动物' },
      update: {},
      create: { name: '动物' },
    }),
    prisma.tag.upsert({
      where: { name: '建筑' },
      update: {},
      create: { name: '建筑' },
    }),
  ])

  console.log('数据库初始化完成！')
  console.log('管理员账户:', { email: 'admin@example.com', password: 'admin123' })
  console.log('测试用户账户:', { email: 'user@example.com', password: 'user123' })
  console.log('创建的标签:', tags.map(tag => tag.name))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })