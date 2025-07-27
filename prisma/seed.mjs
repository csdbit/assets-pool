import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')
  
  try {
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

    // 创建管理员用户
    const hashedAdminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedAdminPassword,
        role: 'ADMIN',
        storageLimit: BigInt(10 * 1024 * 1024 * 1024), // 10GB for admin
      },
    })

    // 创建测试用户
    const hashedUserPassword = await bcrypt.hash('user123', 12)
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        username: 'testuser',
        password: hashedUserPassword,
        role: 'USER',
        storageLimit: BigInt(1024 * 1024 * 1024), // 1GB for regular user
      },
    })

    console.log('数据库初始化完成！')
    console.log('创建的标签:', tags.map(tag => tag.name))
    console.log('创建的用户:')
    console.log('- 管理员:', admin.email, '/', admin.username)
    console.log('- 普通用户:', user.email, '/', user.username)
    console.log('\n提示：可以通过 Prisma Studio (http://localhost:5556) 查看和管理数据')
    console.log('\n测试账户信息：')
    console.log('- 管理员: admin@example.com / admin123')
    console.log('- 普通用户: user@example.com / user123')
    
  } catch (error) {
    console.error('初始化数据库时出错:', error)
    throw error
  }
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