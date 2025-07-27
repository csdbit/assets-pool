# 图床系统 (Image Hosting System)

一个功能完整的图片托管服务，基于 React、TypeScript、Express.js 和 Prisma 构建。提供图片上传、存储、管理和分享功能，支持自动生成多种尺寸的图片版本。

## 功能特性

- 🖼️ **多尺寸图片处理** - 自动生成原图、大图、中图、小图多个版本
- 👤 **用户系统** - 注册、登录、个人资料管理，支持 JWT 认证
- 💾 **存储管理** - 用户存储配额控制（默认 1GB，可配置）
- 🔗 **图片分享** - 生成可分享链接，支持设置过期时间
- 🛡️ **权限控制** - 区分普通用户和管理员角色
- 🚦 **安全防护** - 速率限制、文件验证、CORS 保护
- 📊 **管理后台** - 管理员仪表盘，查看系统统计和用户管理
- ⚙️ **系统设置** - 动态配置管理（注册控制、存储限制等）

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- React Router DOM v7 路由管理
- Zustand 状态管理
- TailwindCSS UI 框架
- Lucide React 图标库

### 后端
- Express.js (CommonJS)
- Prisma ORM + MySQL 数据库
- JWT 身份验证
- Sharp 图片处理
- Express Rate Limit 速率限制
- Multer 文件上传

## 快速开始

### 环境要求

- Node.js >= 16
- MySQL >= 5.7
- pnpm 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd assets-pool
```

2. **安装依赖**
```bash
pnpm install
```

3. **环境配置**

复制 `.env.example` 文件为 `.env` 并配置：

```env
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/assets_pool"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-here"

# 服务器端口
PORT=3001
VITE_PORT=5173

# 其他配置见 .env.example
```

4. **初始化数据库**

方式一：使用 Prisma 迁移
```bash
npx prisma generate
npx prisma migrate dev
```


5. **启动开发服务器**
```bash
# 同时启动前端和后端
pnpm dev:full

# 或分别启动
pnpm dev        # 前端 (默认端口 5173)
pnpm dev:server # 后端 (默认端口 3001)
```

## 项目结构

```
assets-pool/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── store/             # Zustand 状态管理
│   ├── lib/               # 工具函数和 API 客户端
│   └── main.tsx           # 前端入口
├── server/                # 后端源代码
│   ├── routes/            # API 路由
│   ├── middleware/        # 中间件
│   ├── utils/             # 工具函数
│   ├── config/            # 配置文件
│   └── index.cjs          # 后端入口
├── prisma/                # 数据库相关
│   ├── schema.prisma      # 数据库模型
│   ├── init.sql          # 初始化 SQL
│   └── migrations/        # 数据库迁移
├── public/                # 静态资源
└── scripts/               # 工具脚本
```

## 常用命令

```bash
# 开发
pnpm dev:full              # 同时运行前后端
pnpm dev                   # 仅运行前端
pnpm dev:server           # 仅运行后端

# 构建
pnpm build                # 构建前端生产版本

# 代码检查
pnpm check               # TypeScript 类型检查
pnpm lint                # ESLint 代码检查

# 数据库
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

## API 端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录  
- `GET /api/auth/verify` - 验证登录状态

### 图片管理
- `POST /api/images/upload` - 上传图片
- `GET /api/images` - 获取图片列表
- `DELETE /api/images/:id` - 删除图片

### 用户管理
- `GET /api/users/profile` - 获取个人资料
- `PUT /api/users/profile` - 更新个人资料

### 管理员功能
- `GET /api/admin/dashboard` - 管理员仪表盘数据
- `GET /api/admin/users` - 用户列表管理

### 系统设置
- `GET /api/settings/public` - 获取公开系统设置

## 环境变量说明

完整的环境变量配置请参考 `.env.example` 文件，主要包括：

- 数据库连接配置
- JWT 认证配置
- 服务器端口配置
- 文件上传限制
- 存储配额设置
- 安全相关配置

## 开发指南

详细的开发指南请参考 [CLAUDE.md](./CLAUDE.md) 文件。

## 许可证

© 2025 图床系统. 保留所有权利.