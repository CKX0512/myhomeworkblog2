# Netlify 部署指南

## 🚀 快速部署步骤

### 1. 连接 GitHub 仓库到 Netlify

1. **登录 Netlify**
   - 访问 [Netlify](https://www.netlify.com)
   - 使用 GitHub 账号登录

2. **添加新站点**
   - 点击 **"Add new site"** → **"Import an existing project"**
   - 选择 **"Deploy with GitHub"**
   - 授权 Netlify 访问你的 GitHub 仓库
   - 选择仓库：`myhomeworkblog2`（或你的仓库名）
   - 选择分支：`main`

3. **配置构建设置**
   - Netlify 会自动检测到 `netlify.toml` 文件
   - 确认以下设置：
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - 如果自动检测失败，手动输入上述设置

### 2. 配置环境变量（重要！）

在部署之前，**必须配置 Supabase 环境变量**：

1. **在 Netlify 站点设置中**
   - 进入你的站点 → **Site settings** → **Environment variables**
   - 点击 **"Add a variable"**

2. **添加以下环境变量：**

   | 变量名 | 值 |
   |--------|-----|
   | `VITE_SUPABASE_URL` | 你的 Supabase 项目 URL |
   | `VITE_SUPABASE_ANON_KEY` | 你的 Supabase 匿名密钥 |

3. **获取 Supabase 配置信息：**
   - 登录 [Supabase Dashboard](https://app.supabase.com)
   - 选择你的项目
   - 进入 **Settings** → **API**
   - 复制：
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon public** key → `VITE_SUPABASE_ANON_KEY`

4. **保存并重新部署**
   - 添加环境变量后，点击 **"Save"**
   - 进入 **Deploys** 标签页
   - 点击 **"Trigger deploy"** → **"Clear cache and deploy site"**

### 3. 等待部署完成

- Netlify 会自动开始构建和部署
- 构建时间通常为 1-3 分钟
- 部署完成后，你会看到一个绿色的成功提示
- 你的网站 URL 格式为：`https://你的站点名.netlify.app`

## ✅ 验证部署

### 1. 检查网站是否正常运行

访问你的 Netlify URL，应该能看到：
- 首页正常显示
- 导航栏有"登录"和"注册"按钮

### 2. 测试注册功能

1. 点击 **"注册"** 按钮
2. 填写注册信息：
   - 用户名
   - 邮箱
   - 密码
3. 点击注册
4. 应该看到成功提示并跳转到登录页

### 3. 测试登录功能

1. 使用刚才注册的邮箱和密码登录
2. 登录成功后，导航栏应该显示用户名
3. "写文章"按钮应该可见

## 🔧 常见问题

### 问题 1: 构建失败

**可能原因：**
- 环境变量未配置
- 依赖安装失败
- 代码错误

**解决方法：**
1. 检查 **Deploys** 标签页中的构建日志
2. 确认环境变量已正确配置
3. 检查 `package.json` 中的依赖是否正确

### 问题 2: 网站显示空白

**可能原因：**
- 环境变量未正确配置
- Supabase 连接失败

**解决方法：**
1. 打开浏览器控制台（F12）查看错误
2. 确认环境变量在 Netlify 中已正确设置
3. 检查 Supabase 项目是否处于活跃状态

### 问题 3: 注册/登录功能不工作

**可能原因：**
- Supabase 环境变量错误
- CORS 配置问题
- Supabase 数据库未正确设置

**解决方法：**
1. 检查浏览器控制台的错误信息
2. 验证 Supabase 环境变量是否正确
3. 确认 Supabase 数据库中 `users` 表已创建
4. 检查 Supabase Dashboard → **Authentication** → **Settings** 中的配置

### 问题 4: 路由不工作（刷新页面 404）

**解决方法：**
- 确认 `netlify.toml` 文件存在且包含重定向规则
- 如果文件存在，重新部署站点

## 📝 更新代码

当你更新代码后：

1. **推送到 GitHub**
   ```bash
   git add .
   git commit -m "更新说明"
   git push origin main
   ```

2. **Netlify 自动部署**
   - Netlify 会自动检测到新的推送
   - 自动开始新的构建和部署
   - 你可以在 **Deploys** 标签页查看进度

3. **手动触发部署**
   - 如果需要手动触发，进入 **Deploys** 标签页
   - 点击 **"Trigger deploy"** → **"Clear cache and deploy site"**

## 🔒 安全提示

1. **不要提交 `.env` 文件**
   - `.env` 文件已在 `.gitignore` 中
   - 环境变量只在 Netlify 中配置

2. **使用环境变量**
   - 所有敏感信息（如 Supabase 密钥）都通过 Netlify 环境变量配置
   - 不要硬编码在代码中

3. **定期更新依赖**
   - 定期运行 `npm audit` 检查安全漏洞
   - 及时更新依赖包

## 🎯 部署检查清单

部署前确认：

- [ ] GitHub 仓库已推送最新代码
- [ ] Netlify 已连接 GitHub 仓库
- [ ] 环境变量 `VITE_SUPABASE_URL` 已配置
- [ ] 环境变量 `VITE_SUPABASE_ANON_KEY` 已配置
- [ ] Supabase 数据库中 `users` 表已创建
- [ ] `netlify.toml` 文件存在且配置正确
- [ ] 构建成功完成
- [ ] 网站可以正常访问
- [ ] 注册功能正常
- [ ] 登录功能正常

## 📚 相关资源

- [Netlify 文档](https://docs.netlify.com/)
- [Supabase 文档](https://supabase.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

---

**部署完成后，你就可以在任何地方访问你的博客了！** 🎉

