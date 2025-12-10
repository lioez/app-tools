# 🚀 添加新工具完整指南

本指南详细说明如何将新工具添加到 `app-tools` 仓库并自动部署到 Cloudflare Pages。

## 📚 目录

- [工具集架构](#工具集架构)
- [域名与 Cloudflare Pages 项目](#域名与-cloudflare-pages-项目)
- [添加新工具的完整步骤](#添加新工具的完整步骤)
- [文件配置详解](#文件配置详解)
- [常见问题](#常见问题)

---

## 工具集架构

### 目录结构

```
app-tools/                           ← 仓库根目录
├── .github/
│   └── workflows/
│       ├── deploy-iconcraft-pro.yml ← 工具1的部署工作流
│       ├── deploy-tool2.yml         ← 工具2的部署工作流（未来添加）
│       └── _template.yml.example    ← 工作流模板（复制此文件创建新工作流）
│
├── iconcraft-pro---智能图标工坊/     ← 工具1的代码目录
│   ├── wrangler.toml                ← 工具1的部署配置
│   ├── package.json
│   ├── src/
│   ├── public/
│   ├── dist/                        ← 构建输出目录（部署时使用）
│   └── scripts/
│       └── download-models.js       ← 资源下载脚本（如果需要）
│
├── tool2/                           ← 工具2的代码目录（未来添加）
│   ├── wrangler.toml
│   ├── package.json
│   └── ...
│
├── wrangler.toml                    ← 根目录的 wrangler.toml（可选）
└── docs/
    └── GITHUB_ACTIONS_GUIDE.md
```

### 部署流程图

```
┌─────────────────────────────────────────────────────┐
│  你开发完工具，放到 app-tools/your-tool/          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  git add . && git commit && git push origin main  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  GitHub 监测到 your-tool/ 目录有变化               │
│  自动触发 deploy-your-tool.yml 工作流              │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────────┐  ┌──────────────────┐
   │ npm install │  │ npm run download │
   └────────┬────┘  │ (如果有资源文件) │
            │       └────────┬─────────┘
            └────────┬───────┘
                     ▼
            ┌──────────────────┐
            │  npm run build   │
            │ 生成 dist 文件夹 │
            └────────┬─────────┘
                     ▼
            ┌──────────────────────────────┐
            │ wrangler pages project create│
            │ 自动创建 CF Pages 项目       │
            └────────┬─────────────────────┘
                     ▼
            ┌──────────────────────────────┐
            │ wrangler pages deploy        │
            │ 上传 dist 到 Cloudflare      │
            └────────┬─────────────────────┘
                     ▼
            ┌──────────────────────────────┐
            │ https://your-tool.pages.dev  │
            │ 自动部署完成！               │
            └──────────────────────────────┘
```

---

## 域名与 Cloudflare Pages 项目

### 关于 `.pages.dev` 域名

#### 1. 域名冲突问题

**Q: 万一有人已经注册了 `iconcraft-pro.pages.dev` 怎么办？**

A: **不用担心！** 这有几个原因：

- ✅ Cloudflare Pages 项目名称在**你的账户内必须唯一**，全局不需要
- ✅ `https://iconcraft-pro.pages.dev` 是 Cloudflare 自动生成的，绑定到你的账户
- ✅ 每个 Cloudflare 账户的 `pages.dev` 子域是独立的，即使名字相同也不会冲突

**类比：** 就像 GitHub Pages，很多人都能有 `project-name.github.io`，但只要在自己的账户下就没问题。

#### 2. 项目命名规则

```
Cloudflare Pages 项目名 = 你在部署时指定的名称

# 以下三个项目各自独立部署到不同的 URL
- 项目1：iconcraft-pro → https://iconcraft-pro.pages.dev
- 项目2：image-compressor → https://image-compressor.pages.dev
- 项目3：pdf-converter → https://pdf-converter.pages.dev
```

#### 3. 绑定自定义域名

如果你有自己的域名，可以绑定到 Cloudflare Pages 项目：

1. 进入 Cloudflare Dashboard
2. 选择你的项目（如 `iconcraft-pro`）
3. `Custom domains` → `Add custom domain`
4. 输入你的域名（如 `tools.example.com`）
5. 按照提示配置 DNS 记录

然后就能通过自定义域名访问！

---

## 添加新工具的完整步骤

### 前提条件

- 有一个可工作的 Vite + React 项目（或类似的前端框架）
- 项目有 `package.json` 和 `npm build` 命令
- 项目构建后生成 `dist/` 目录

### 第一步：创建工具目录

假设你的新工具名叫 `image-compressor`：

```bash
# 在 app-tools 目录下创建新工具文件夹
mkdir "image-compressor"
cd "image-compressor"

# 创建基本的 React + Vite 项目
npm create vite@latest . -- --template react-ts
# 或者复制已有的项目文件到这里
```

### 第二步：创建工具专用的 `wrangler.toml`

在 **`image-compressor/`** 目录下创建 `wrangler.toml` 文件：

```toml
# image-compressor/wrangler.toml

name = "image-compressor"           # 项目名（会成为 URL 的一部分）
type = "javascript"
account_id = ""                     # 不需要填，GitHub Actions 会通过 Secrets 传入
workers_dev = true
route = ""
zone_id = ""

[env.production]
name = "image-compressor-prod"
route = ""
zone_id = ""

[build]
command = "npm run build"
cwd = "./"
watch_paths = ["src/**/*.ts", "src/**/*.tsx"]

[build.upload]
format = "service-worker"
```

**重要！** 每个工具必须有自己的 `wrangler.toml`，不能共用。

### 第三步：创建工作流文件

1. **复制模板文件**：
   ```bash
   # 从 .github/workflows/ 复制模板
   cp ".github/workflows/_template.yml.example" ".github/workflows/deploy-image-compressor.yml"
   ```

2. **编辑 `deploy-image-compressor.yml`**，修改以下地方（都标注了 `[修改]`）：

   ```yaml
   name: 部署 Image Compressor 到 Cloudflare Pages  # [修改] 改成你的工具名

   on:
     push:
       branches: [main, master]
       paths:
         - 'image-compressor/**'                    # [修改] 改成你的工具文件夹名
         - '.github/workflows/deploy-image-compressor.yml'  # [修改] 改成这个文件的名称
     pull_request:
       branches: [main, master]
       paths:
         - 'image-compressor/**'                    # [修改] 同上
         - '.github/workflows/deploy-image-compressor.yml'  # [修改] 同上
     workflow_dispatch:

   env:
     WORK_DIR: ./image-compressor                  # [修改] 改成你的工具文件夹名

   jobs:
     deploy:
       # ... 其他步骤不需要改 ...

       - name: 创建Cloudflare Pages项目（如不存在）
         run: wrangler pages project create image-compressor --production-branch=main || true  # [修改] 改成项目名
         env:
           CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
           CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

       - name: 部署到Cloudflare Pages
         uses: cloudflare/wrangler-action@v3
         with:
           apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
           accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
           command: pages deploy ${{ env.WORK_DIR }}/dist --project-name=image-compressor --commit-dirty=true  # [修改] 改成项目名
   ```

### 第四步：如果有额外资源文件（可选）

如果你的工具需要下载大型资源（如模型文件），参照 `iconcraft-pro` 的做法：

1. 创建 `image-compressor/scripts/download-resources.js`
2. 在 `package.json` 中添加脚本：
   ```json
   {
     "scripts": {
       "download-resources": "node scripts/download-resources.js",
       "build": "npm run download-resources && vite build"
     }
   }
   ```
3. 在工作流中的"构建应用"步骤会自动调用这个脚本

### 第五步：推送代码

```bash
# 返回仓库根目录
cd ../

# 添加新工具
git add image-compressor/
git add .github/workflows/deploy-image-compressor.yml

# 提交
git commit -m "新增: Image Compressor 工具"

# 推送
git push origin main
```

### 完成！

GitHub Actions 会自动：
1. 检测到 `image-compressor/` 目录有新文件
2. 触发 `deploy-image-compressor.yml` 工作流
3. 自动构建、创建项目、部署
4. 几分钟后，访问 `https://image-compressor.pages.dev` 查看结果

---

## 文件配置详解

### `package.json` 配置

```json
{
  "name": "image-compressor",
  "private": true,
  "version": "0.0.0",
  "type": "module",

  "scripts": {
    "dev": "vite",
    "build": "vite build",              // 必须有，生成 dist/
    "preview": "vite preview",

    // 如果有资源文件，添加：
    "download-resources": "node scripts/download-resources.js"
  },

  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },

  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

**关键点：**
- ✅ 必须有 `build` 脚本
- ✅ 必须生成 `dist/` 目录
- ✅ `name` 字段可以任意

### `wrangler.toml` 配置

```toml
name = "project-name-for-url"        # 最重要！这会成为 URL
type = "javascript"
account_id = ""                      # 留空，由 GitHub Actions 环境变量提供
workers_dev = true

[build]
command = "npm run build"            # 执行构建命令
cwd = "./"                           # 当前目录为工作目录

[build.upload]
format = "service-worker"            # Pages 使用的格式
```

**关键点：**
- ✅ `name` 字段决定了 Pages 项目的 URL
- ✅ 每个工具一个独立的 `wrangler.toml`
- ✅ 不要手动填 `account_id`

### 工作流文件 (.yml) 配置

```yaml
name: 部署 [工具名] 到 Cloudflare Pages    # 工作流显示名称

on:
  push:
    branches: [main, master]
    paths:
      - 'your-tool/**'                        # 只有这个目录改动时触发
      - '.github/workflows/deploy-your-tool.yml'
  pull_request:
    branches: [main, master]
    paths:
      - 'your-tool/**'
      - '.github/workflows/deploy-your-tool.yml'
  workflow_dispatch:                          # 允许手动触发

env:
  WORK_DIR: ./your-tool              # 工具目录，其他步骤会用到

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout代码
        uses: actions/checkout@v4

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ${{ env.WORK_DIR }}/package-lock.json

      - name: 安装依赖
        working-directory: ${{ env.WORK_DIR }}
        run: npm ci

      # 如果有资源下载脚本，取消下面的注释：
      # - name: 下载资源
      #   working-directory: ${{ env.WORK_DIR }}
      #   run: npm run download-resources

      - name: 构建应用
        working-directory: ${{ env.WORK_DIR }}
        run: npm run build

      - name: 安装Wrangler
        run: npm install -g wrangler

      - name: 创建Cloudflare Pages项目（如不存在）
        run: wrangler pages project create your-project-name --production-branch=main || true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: 部署到Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy ${{ env.WORK_DIR }}/dist --project-name=your-project-name --commit-dirty=true
```

**关键点：**
- ✅ `paths` 过滤很重要，避免无关文件变化也触发部署
- ✅ `WORK_DIR` 要和你的工具文件夹名一致
- ✅ `project-name` 必须和 `wrangler.toml` 中的 `name` 一致

---

## 常见问题

### Q1: 我想用不同的 URL 结构，比如 `tools.example.com/image-compressor`

**A:** Cloudflare Pages 默认是子域名模式。如果要用路径模式，需要：

1. 购买域名并在 Cloudflare 托管
2. 在 Pages 项目中绑定自定义域名
3. 配置重定向或代理

这比较复杂。建议继续用默认的 `image-compressor.pages.dev`。

### Q2: 部署失败，说"项目不存在"

**A:** 确保：
1. ✅ `wrangler.toml` 中的 `name` 字段正确
2. ✅ 工作流中两处 `--project-name` 的值相同
3. ✅ Cloudflare Secrets 配置正确（见下一个问题）

### Q3: 怎么检查 Secrets 是否正确配置？

**A:** 进入 GitHub 仓库：
1. `Settings` → `Secrets and variables` → `Actions`
2. 应该能看到两个 Secret：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

如果没有，按照 [GitHub Actions 指南](./GITHUB_ACTIONS_GUIDE.md) 的步骤添加。

### Q4: 工作流文件名有要求吗？

**A:** 没有硬性要求，但建议：
- ✅ 命名为 `deploy-工具名.yml` 便于识别
- ✅ 同一个仓库不要有重复的名字
- ✅ 避免特殊字符

### Q5: 能同时部署多个工具吗？

**A:** 能！每个工具一个工作流文件：

```
.github/workflows/
├── deploy-iconcraft-pro.yml     ← 工具1
├── deploy-image-compressor.yml  ← 工具2
├── deploy-pdf-converter.yml     ← 工具3
└── _template.yml.example        ← 模板
```

每个工作流独立运行，互不影响。

### Q6: `.gitignore` 应该怎么配置？

**A:** 每个工具的 `.gitignore`（在工具目录下）应该包含：

```
node_modules/
dist/
dist-ssr/
*.local

# 大型资源文件
public/models/        # 模型文件由脚本下载
downloads/            # 临时下载目录

# IDE
.vscode/*
.idea/
.DS_Store
```

### Q7: 工作流很慢，怎么优化？

**A:** 几个优化方案：

```yaml
- name: 缓存 npm 依赖  # 已默认启用
  uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: ${{ env.WORK_DIR }}/package-lock.json
```

还可以：
- 用 `npm ci` 替代 `npm install`（已在模板中）
- 生成 `package-lock.json` 并提交到 Git
- 避免在工作流中执行不必要的脚本

### Q8: 如何手动触发部署？

**A:** 工作流文件中已有 `workflow_dispatch` 事件，可以：

1. 进入 GitHub 仓库
2. `Actions` 标签 → 选择工作流
3. `Run workflow` 按钮

### Q9: 部署后不显示最新内容

**A:** 可能是浏览器缓存。尝试：
- ✅ 硬刷新：`Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
- ✅ 或 `Ctrl+F5`
- ✅ 检查 Cloudflare Dashboard 中的部署历史

### Q10: 能自动部署到多个云平台吗？

**A:** 能！可以在同一个工作流中添加多个部署步骤：

```yaml
- name: 部署到 Cloudflare
  uses: cloudflare/wrangler-action@v3
  # ...

- name: 部署到 Vercel
  uses: vercel/action@main
  # ...

- name: 部署到 Netlify
  uses: nwtgck/actions-netlify@v2
  # ...
```

---

## 快速检查清单

添加新工具时，用这个清单检查：

- [ ] 工具目录创建在 `app-tools/` 下
- [ ] 工具有 `package.json`
- [ ] 工具有 `wrangler.toml`（复制模板修改）
- [ ] 工具的 `.gitignore` 排除了大型文件
- [ ] 创建工作流文件 `.github/workflows/deploy-工具名.yml`
- [ ] 修改工作流文件中所有标注 `[修改]` 的地方
- [ ] 工作流中的 `--project-name` 和 `wrangler.toml` 的 `name` 一致
- [ ] `package.json` 有 `build` 脚本
- [ ] 本地测试 `npm run build` 能生成 `dist/` 目录
- [ ] 生成 `package-lock.json` 并提交到 Git
- [ ] `git add` 所有新文件
- [ ] `git commit && git push`
- [ ] 在 GitHub Actions 查看部署日志
- [ ] 访问 `https://project-name.pages.dev` 验证

---

## 总结

| 步骤 | 文件 | 要修改的内容 |
|------|------|----------|
| 1 | 工具目录 | 创建 `app-tools/your-tool/` |
| 2 | `wrangler.toml` | 改 `name` 字段 |
| 3 | 工作流 yml | 改 3 处 `[修改]` 的地方 |
| 4 | `package.json` | 确保有 `build` 脚本 |
| 5 | Git | `git push` 触发自动部署 |

就这么简单！🎉

---

## 需要帮助？

- 工作流问题：查看 [GitHub Actions 使用指南](./GITHUB_ACTIONS_GUIDE.md)
- Cloudflare 问题：查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- 部署失败：检查 GitHub Actions 的构建日志

祝你部署顺利！🚀
