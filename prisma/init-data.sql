-- 插入初始标签数据
INSERT IGNORE INTO Tag (name, createdAt) VALUES 
('风景', NOW()),
('人物', NOW()),
('动物', NOW()),
('建筑', NOW()),
('美食', NOW()),
('科技', NOW());

-- 插入管理员用户（密码: admin123 的 bcrypt 哈希值）
INSERT IGNORE INTO User (email, username, password, role, emailVerified, storageLimit, createdAt, updatedAt) VALUES 
('admin@example.com', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', true, 10737418240, NOW(), NOW());

-- 插入测试用户（密码: user123 的 bcrypt 哈希值）
INSERT IGNORE INTO User (email, username, password, role, emailVerified, storageLimit, createdAt, updatedAt) VALUES 
('user@example.com', 'testuser', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER', true, 1073741824, NOW(), NOW());

SELECT 'Database initialization completed!' as message;
SELECT COUNT(*) as tag_count FROM Tag;
SELECT COUNT(*) as user_count FROM User;