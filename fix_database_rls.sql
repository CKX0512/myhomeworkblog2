-- ============================================
-- 修复数据库 RLS 策略
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 检查并启用 RLS（如果未启用）
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略（如果存在）
DROP POLICY IF EXISTS "Allow public read" ON posts;
DROP POLICY IF EXISTS "Allow public insert" ON posts;
DROP POLICY IF EXISTS "Allow public update" ON posts;
DROP POLICY IF EXISTS "Allow public delete" ON posts;
DROP POLICY IF EXISTS "Allow authenticated insert" ON posts;
DROP POLICY IF EXISTS "Allow authenticated update" ON posts;
DROP POLICY IF EXISTS "Allow authenticated delete" ON posts;

DROP POLICY IF EXISTS "Allow public read" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON users;
DROP POLICY IF EXISTS "Allow authenticated update" ON users;

DROP POLICY IF EXISTS "Allow public read" ON comments;
DROP POLICY IF EXISTS "Allow public insert" ON comments;
DROP POLICY IF EXISTS "Allow authenticated insert" ON comments;

-- 3. 为 posts 表创建策略
-- 允许所有人读取文章
CREATE POLICY "Allow public read posts" 
ON posts FOR SELECT 
USING (true);

-- 允许已认证用户插入文章
CREATE POLICY "Allow authenticated insert posts" 
ON posts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 允许作者更新自己的文章
CREATE POLICY "Allow author update own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 允许作者删除自己的文章
CREATE POLICY "Allow author delete own posts" 
ON posts FOR DELETE 
USING (auth.uid() = author_id);

-- 4. 为 users 表创建策略
-- 允许所有人读取用户信息（用于显示作者名）
CREATE POLICY "Allow public read users" 
ON users FOR SELECT 
USING (true);

-- 允许已认证用户插入自己的用户记录
CREATE POLICY "Allow authenticated insert users" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的信息
CREATE POLICY "Allow user update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. 为 comments 表创建策略
-- 允许所有人读取评论
CREATE POLICY "Allow public read comments" 
ON comments FOR SELECT 
USING (true);

-- 允许已认证用户插入评论
CREATE POLICY "Allow authenticated insert comments" 
ON comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 允许用户更新自己的评论
CREATE POLICY "Allow user update own comments" 
ON comments FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的评论
CREATE POLICY "Allow user delete own comments" 
ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- 验证策略
-- ============================================
-- 运行以下查询来验证策略是否已创建：

-- SELECT * FROM pg_policies WHERE tablename = 'posts';
-- SELECT * FROM pg_policies WHERE tablename = 'users';
-- SELECT * FROM pg_policies WHERE tablename = 'comments';

