# 图床系统产品需求文档 (PRD)

## 1. 产品概述

### 1.1 产品定位
一个基于 Web 的图片托管服务系统，为用户提供图片上传、存储、管理和分享功能。系统自动生成多种尺寸的图片版本，满足不同场景的使用需求。

### 1.2 目标用户
- 个人用户：需要稳定图片存储和分享服务
- 开发者：需要图片托管服务支持其应用
- 内容创作者：需要管理和分发图片资源

### 1.3 核心价值
- 自动生成多尺寸图片，优化加载性能
- 统一的图片管理后台
- 稳定可靠的图片存储服务
- 简单易用的 API 接口

## 2. 技术架构

### 2.1 技术栈
- **数据库**: MySQL
- **ORM**: Prisma
- **后端框架**: Node.js (推荐 Express/Fastify/NestJS)
- **图片处理**: Sharp 或 ImageMagick
- **存储方案**: 本地存储/云存储（如 OSS、S3）
- **前端框架**: React/Vue/Next.js

### 2.2 系统架构
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端界面   │────▶│   API 服务   │────▶│  MySQL DB   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  图片处理    │
                    │   服务       │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  文件存储    │
                    └─────────────┘
```

## 3. 功能需求

### 3.1 用户系统

#### 3.1.1 用户注册
- 支持邮箱注册
- 用户名唯一性验证
- 密码强度要求（至少8位，包含字母和数字）
- 邮箱验证功能

#### 3.1.2 用户登录
- 邮箱/用户名 + 密码登录
- JWT Token 认证
- 记住登录状态
- 登录失败次数限制

#### 3.1.3 用户权限
- 普通用户：上传、查看、管理自己的图片
- 管理员：管理所有用户和图片

### 3.2 图片上传功能

#### 3.2.1 上传方式
- 单张上传
- 批量上传（最多20张）
- 拖拽上传
- 粘贴上传

#### 3.2.2 图片处理
- **原图**: 保留原始文件
- **大图**: 1920px (宽度)
- **中图**: 800px (宽度)
- **小图**: 300px (宽度)
- 保持原始宽高比
- 支持格式：JPG、PNG、GIF、WebP

#### 3.2.3 上传限制
- 单张图片大小限制：20MB
- 用户存储空间限制：可配置
- 支持的图片格式验证

### 3.3 图片管理功能

#### 3.3.1 图片列表
- 网格视图/列表视图切换
- 分页显示
- 按上传时间排序
- 搜索功能（按名称、标签）

#### 3.3.2 图片操作
- 查看图片详情
- 编辑图片信息（名称、描述、标签）
- 删除图片（软删除）
- 批量操作
- 复制图片链接

#### 3.3.3 图片分享
- 生成分享链接
- 设置链接有效期
- 访问密码保护
- 查看分享统计

### 3.4 后台管理系统

#### 3.4.1 仪表盘
- 存储空间使用情况
- 上传统计（今日/本周/本月）
- 热门图片展示
- 系统状态监控

#### 3.4.2 个人中心
- 个人信息管理
- 密码修改
- API Key 管理
- 使用统计

## 4. 数据库设计 (Prisma Schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  username        String    @unique
  password        String
  role            Role      @default(USER)
  emailVerified   Boolean   @default(false)
  storageUsed     BigInt    @default(0)
  storageLimit    BigInt    @default(1073741824) // 1GB default
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  images          Image[]
  apiKeys         ApiKey[]
  shares          Share[]
}

model Image {
  id              Int       @id @default(autoincrement())
  userId          Int
  filename        String
  originalName    String
  mimeType        String
  size            BigInt
  width           Int?
  height          Int?
  hash            String    @unique
  description     String?   @db.Text
  isDeleted       Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id])
  versions        ImageVersion[]
  tags            Tag[]     @relation("ImageTags")
  shares          Share[]
  
  @@index([userId])
  @@index([hash])
}

model ImageVersion {
  id              Int       @id @default(autoincrement())
  imageId         Int
  type            VersionType
  filename        String
  path            String
  size            BigInt
  width           Int
  height          Int
  createdAt       DateTime  @default(now())
  
  image           Image     @relation(fields: [imageId], references: [id], onDelete: Cascade)
  
  @@unique([imageId, type])
  @@index([imageId])
}

model Tag {
  id              Int       @id @default(autoincrement())
  name            String    @unique
  images          Image[]   @relation("ImageTags")
  createdAt       DateTime  @default(now())
}

model Share {
  id              Int       @id @default(autoincrement())
  userId          Int
  imageId         Int
  token           String    @unique
  password        String?
  expiresAt       DateTime?
  viewCount       Int       @default(0)
  createdAt       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  image           Image     @relation(fields: [imageId], references: [id])
  
  @@index([token])
  @@index([userId])
}

model ApiKey {
  id              Int       @id @default(autoincrement())
  userId          Int
  key             String    @unique
  name            String
  lastUsedAt      DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  user            User      @relation(fields: [userId], references: [id])
  
  @@index([key])
}

enum Role {
  USER
  ADMIN
}

enum VersionType {
  ORIGINAL
  LARGE
  MEDIUM
  SMALL
}
```

## 5. API 设计

### 5.1 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新 Token

### 5.2 图片相关
- `POST /api/images/upload` - 上传图片
- `GET /api/images` - 获取图片列表
- `GET /api/images/:id` - 获取图片详情
- `PUT /api/images/:id` - 更新图片信息
- `DELETE /api/images/:id` - 删除图片
- `GET /api/images/:id/:version` - 获取指定版本图片

### 5.3 分享相关
- `POST /api/shares` - 创建分享
- `GET /api/shares/:token` - 访问分享
- `DELETE /api/shares/:id` - 取消分享

### 5.4 用户相关
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息
- `GET /api/users/stats` - 获取使用统计

## 6. 非功能性需求

### 6.1 性能要求
- 图片上传响应时间 < 3秒
- 缩略图生成采用异步队列处理
- 支持 CDN 加速
- 图片懒加载

### 6.2 安全要求
- HTTPS 传输
- 图片防盗链
- SQL 注入防护
- XSS 防护
- 文件类型严格校验
- 敏感信息加密存储

### 6.3 可用性要求
- 系统可用性 > 99.9%
- 支持横向扩展
- 定期备份
- 错误监控和告警

### 6.4 兼容性要求
- 支持主流浏览器
- 响应式设计
- 支持移动端访问

## 7. 部署和运维

### 7.1 部署架构
- Docker 容器化部署
- 支持 Kubernetes 编排
- 负载均衡配置
- 自动化部署脚本

### 7.2 监控指标
- 系统资源使用率
- API 响应时间
- 错误率统计
- 用户活跃度

### 7.3 日志管理
- 访问日志
- 错误日志
- 操作审计日志

## 8. 后续优化方向

1. **AI 功能集成**
   - 图片智能标签
   - 内容审核
   - 相似图片检测

2. **高级功能**
   - 图片编辑器
   - 水印功能
   - 图片压缩优化

3. **社交功能**
   - 用户关注
   - 图片收藏
   - 评论系统

4. **商业化功能**
   - 付费会员体系
   - 存储空间套餐
   - API 调用计费