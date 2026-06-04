-- 在 Supabase SQL Editor 中执行以下 SQL 来初始化数据库

-- 1. 创建 wishes 表
CREATE TABLE IF NOT EXISTS wishes (
  id BIGSERIAL PRIMARY KEY,
  user_name VARCHAR(10) NOT NULL,
  message VARCHAR(100) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用 RLS (Row Level Security)
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- 3. 允许任何人读取
CREATE POLICY "允许任何人查看" ON wishes
  FOR SELECT USING (true);

-- 4. 允许任何人插入（生产环境建议限制）
CREATE POLICY "允许任何人发布" ON wishes
  FOR INSERT WITH CHECK (true);

-- 5. 开启 Realtime 订阅
ALTER PUBLICATION supabase_realtime ADD TABLE wishes;

-- 6. 在 Supabase Storage 中手动创建 bucket:
--    名称: wish-images
--    公开访问: 开启
--    文件大小限制: 5MB
--    允许的 MIME 类型: image/jpeg, image/png, image/webp
