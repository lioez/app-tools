/**
 * 下载 @imgly/background-removal 模型文件脚本
 *
 * 此脚本会从 npm 包中复制模型文件到 public/models 目录
 * 用于 CI/CD 构建时自动获取模型文件，避免将大型文件提交到 Git
 */

import { existsSync, mkdirSync, cpSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 项目根目录
const projectRoot = resolve(__dirname, '..');

// 目标目录
const targetDir = resolve(projectRoot, 'public', 'models');

// 源目录 - 从 node_modules 中的 @imgly/background-removal-data 包获取
const sourceDir = resolve(projectRoot, 'node_modules', '@imgly', 'background-removal-data', 'dist');

console.log('🚀 开始下载/复制模型文件...');
console.log(`📁 源目录: ${sourceDir}`);
console.log(`📁 目标目录: ${targetDir}`);

// 检查源目录是否存在
if (!existsSync(sourceDir)) {
  console.error('❌ 错误: 源目录不存在，请先运行 npm install');
  console.error(`   期望路径: ${sourceDir}`);
  process.exit(1);
}

// 创建目标目录
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
  console.log('✅ 创建目标目录');
}

// 复制所有文件
try {
  const files = readdirSync(sourceDir);
  console.log(`📦 找到 ${files.length} 个文件需要复制`);

  cpSync(sourceDir, targetDir, { recursive: true });

  console.log('✅ 模型文件复制完成！');

  // 显示复制的文件数量
  const copiedFiles = readdirSync(targetDir);
  console.log(`📊 共复制 ${copiedFiles.length} 个文件到 public/models`);
} catch (error) {
  console.error('❌ 复制文件时出错:', error.message);
  process.exit(1);
}
