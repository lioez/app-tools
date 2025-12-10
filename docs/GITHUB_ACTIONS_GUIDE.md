# GitHub Actions 自动化部署指南

本文档将帮助你了解如何使用 GitHub Actions 自动化部署项目到 Cloudflare Pages。

## 📖 目录

- [什么是 GitHub Actions](#什么是-github-actions)
- [工作流程概述](#工作流程概述)
- [配置步骤](#配置步骤)
- [Secrets 配置](#secrets-配置)
- [工作流文件详解](#工作流文件详解)
- [常见问题](#常见问题)
- [本地测试](#本地测试)

---

## 什么是 GitHub Actions

GitHub Actions 是 GitHub 提供的 CI/CD（持续集成/持续部署）服务。它可以：

- **自动化构建**：当你推送代码时，自动运行构建命令
- **自动化测试**：运行测试确保代码质量
- **自动化部署**：将构建产物部署到服务器或云平台

### 核心概念

| 概念 | 说明 |
|------|------|
| **Workflow（工作流）** | 自动化流程的定义，存放在 `.github/workflows/` 目录下的 YAML 文件 |
| **Event（事件）** | 触发工作流的条件，如 `push`、`pull_request` 等 |
| **Job（作业）** | 工作流中的一组步骤，可以并行或串行执行 |
| **Step（步骤）** | 作业中的单个任务，可以是命令或 Action |
| **Action（动作）** | 可复用的工作流组件，如 `actions/checkout@v4` |
| **Runner（运行器）** | 执行工作流的服务器，GitHub 提供免费的 Ubuntu/Windows/macOS 运行器 |

---

## 工作流程概述

我们的部署流程如下：

```
┌─────────────────┐
│  推送代码到     │
│  main/master    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│  触发工作流     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  1. 检出代码    │
│  2. 安装 Node   │
│  3. 安装依赖    │
│  4. 下载模型    │
│  5. 构建项目    │
│  6. 部署到 CF   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare     │
│  Pages 上线     │
└─────────────────┘
```

---

## 配置步骤

### 第一步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 填写仓库名称，如 `app-tools`
4. 选择 `Public` 或 `Private`
5. 点击 `Create repository`

### 第二步：推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/你的用户名/app-tools.git

# 添加所有文件（.gitignore 会排除模型文件）
git add .

# 提交
git commit -m "初始提交"

# 推送到 main 分支
git push -u origin main
```

### 第三步：配置 Cloudflare

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 `Workers & Pages`
3. 创建一个新的 Pages 项目（可以先手动创建一个空项目）

### 第四步：获取 Cloudflare 凭证

#### 获取 Account ID

1. 登录 Cloudflare Dashboard
2. 点击右上角的账户图标
3. 在 URL 中可以看到 Account ID，格式如：`https://dash.cloudflare.com/xxxxxxxx`
4. 或者在 `Workers & Pages` → `Overview` 右侧可以看到

#### 创建 API Token

1. 进入 [API Tokens 页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 `Create Token`
3. 选择 `Edit Cloudflare Workers` 模板
4. 或者自定义权限：
   - `Account` → `Cloudflare Pages` → `Edit`
   - `Zone` → `Zone` → `Read`（如果需要自定义域名）
5. 点击 `Continue to summary` → `Create Token`
6. **立即复制 Token**（只显示一次！）

### 第五步：配置 GitHub Secrets

1. 进入你的 GitHub 仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加以下两个 Secret：

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | 你的 Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare Account ID |

![GitHub Secrets 配置示意](https://docs.github.com/assets/cb-28266/images/help/repository/actions-secret-new.png)

---

## Secrets 配置

### 什么是 Secrets？

Secrets 是 GitHub 提供的安全存储敏感信息的方式。它们：

- ✅ 加密存储
- ✅ 不会在日志中显示
- ✅ 只能在工作流中使用
- ✅ 无法被查看，只能更新或删除

### 在工作流中使用 Secrets

```yaml
# 使用语法
${{ secrets.SECRET_NAME }}

# 示例
apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## 工作流文件详解

我们的工作流文件位于 `.github/workflows/deploy-to-cloudflare.yml`：

```yaml
name: 部署到Cloudflare Pages  # 工作流名称，显示在 GitHub Actions 页面

# 触发条件
on:
  push:
    branches:
      - main      # 推送到 main 分支时触发
      - master    # 推送到 master 分支时触发
  pull_request:
    branches:
      - main      # PR 到 main 分支时触发（用于预览）
      - master

# 环境变量
env:
  WORK_DIR: ./iconcraft-pro---智能图标工坊  # 工作目录

# 作业定义
jobs:
  deploy:
    runs-on: ubuntu-latest  # 使用最新的 Ubuntu 运行器

    # 权限设置
    permissions:
      contents: read      # 读取仓库内容
      deployments: write  # 写入部署状态

    # 步骤
    steps:
      # 步骤1：检出代码
      - name: Checkout代码
        uses: actions/checkout@v4
        # 这个 Action 会将你的仓库代码下载到运行器

      # 步骤2：设置 Node.js
      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: '20'  # 使用 Node.js 20
          cache: 'npm'        # 缓存 npm 依赖，加速后续构建
          cache-dependency-path: ${{ env.WORK_DIR }}/package-lock.json

      # 步骤3：安装依赖
      - name: 安装依赖
        working-directory: ${{ env.WORK_DIR }}
        run: npm ci  # 使用 ci 命令，更快更可靠

      # 步骤4：下载模型文件
      - name: 下载模型文件
        working-directory: ${{ env.WORK_DIR }}
        run: npm run download-models
        # 从 node_modules 复制模型文件到 public/models

      # 步骤5：构建
      - name: 构建应用
        working-directory: ${{ env.WORK_DIR }}
        run: npm run build

      # 步骤6：部署
      - name: 部署到Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: ${{ env.WORK_DIR }}
          command: pages deploy dist --project-name=iconcraft-pro
```

### 关键点说明

| 配置项 | 说明 |
|--------|------|
| `working-directory` | 指定命令执行的目录 |
| `npm ci` | 比 `npm install` 更快，严格按照 `package-lock.json` 安装 |
| `cache: 'npm'` | 缓存 `node_modules`，加速后续构建 |
| `pages deploy` | Cloudflare Pages 部署命令 |
| `--project-name` | Cloudflare Pages 项目名称 |

---

## 常见问题

### Q1: 工作流没有触发？

**检查项：**
1. 确保 `.github/workflows/` 目录和文件名正确
2. 确保推送到了正确的分支（main 或 master）
3. 检查 YAML 语法是否正确

### Q2: 构建失败 - 找不到 package-lock.json？

**解决方案：**
```bash
# 在本地生成 package-lock.json
cd iconcraft-pro---智能图标工坊
npm install
git add package-lock.json
git commit -m "添加 package-lock.json"
git push
```

### Q3: 部署失败 - API Token 无效？

**检查项：**
1. 确保 Token 有正确的权限
2. 确保 Secret 名称完全匹配（区分大小写）
3. 尝试重新生成 Token

### Q4: 模型文件下载失败？

**可能原因：**
- `@imgly/background-removal-data` 包未正确安装
- 检查 `package.json` 中是否包含该依赖

### Q5: 如何查看构建日志？

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 点击具体的工作流运行记录
4. 展开各个步骤查看详细日志

### Q6: 如何手动触发部署？

可以添加手动触发选项：

```yaml
on:
  push:
    branches: [main, master]
  workflow_dispatch:  # 添加这行，允许手动触发
```

然后在 Actions 页面点击 `Run workflow` 按钮。

---

## 本地测试

### 测试模型下载脚本

```bash
cd iconcraft-pro---智能图标工坊

# 安装依赖
npm install

# 运行模型下载脚本
npm run download-models

# 检查模型文件是否存在
ls public/models/
```

### 测试完整构建

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

---

## 添加更多工具

当你添加新的工具到 `app-tools` 仓库时：

1. 在仓库根目录创建新的工具文件夹
2. 如果需要单独部署，可以创建新的工作流文件
3. 或者修改现有工作流支持多项目部署

### 多项目部署示例

```yaml
jobs:
  deploy-iconcraft:
    # ... iconcraft 部署配置

  deploy-other-tool:
    # ... 其他工具部署配置
```

---

## 有用的链接

- [GitHub Actions 官方文档](https://docs.github.com/cn/actions)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)

---

## 需要帮助？

如果遇到问题，可以：

1. 查看 GitHub Actions 运行日志
2. 检查 Cloudflare Dashboard 中的部署状态
3. 在仓库中创建 Issue 寻求帮助

祝你部署顺利！🚀
