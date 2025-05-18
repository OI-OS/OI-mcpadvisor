/**
 * 路径工具函数
 * 提供统一的路径解析方法，兼容 ESM 和 Jest 测试环境
 */

import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 检测当前是否在 Jest 测试环境中
 * @returns 如果在 Jest 环境中返回 true，否则返回 false
 */
export function isJestEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined;
}

/**
 * 获取当前文件的路径
 * 使用 import.meta.url 获取 ESM 模块的文件 URL，并转换为文件路径
 * 在 Jest 环境中使用替代方案
 * 
 * @param metaUrl 当前模块的 import.meta.url，在 Jest 环境中可以传入 null
 * @returns 当前文件的绝对路径
 */
export function getFilePath(metaUrl: string | null = null): string {
  // 在 Jest 环境中使用工作目录
  if (isJestEnvironment() || !metaUrl) {
    return process.cwd();
  }
  
  try {
    return fileURLToPath(metaUrl);
  } catch (error) {
    // 如果转换失败，返回工作目录
    return process.cwd();
  }
}

/**
 * 获取当前文件所在的目录路径
 * 
 * @param metaUrl 当前模块的 import.meta.url，在 Jest 环境中可以传入 null
 * @returns 当前文件所在目录的绝对路径
 */
export function getDirPath(metaUrl: string | null = null): string {
  return path.dirname(getFilePath(metaUrl));
}

/**
 * 获取项目根目录路径
 * 在源代码中，根目录通常是当前目录的几级父目录
 * 在测试环境中，可能需要特殊处理
 * 
 * @param metaUrl 当前模块的 import.meta.url，在 Jest 环境中可以传入 null
 * @param levelsUp 需要向上回溯的目录级数
 * @returns 项目根目录的绝对路径
 */
export function getProjectRootPath(metaUrl: string | null = null, levelsUp: number = 0): string {
  let currentDir = getDirPath(metaUrl);
  
  // 在 Jest 环境中，工作目录已经是项目根目录
  if (isJestEnvironment()) {
    return process.cwd();
  }
  
  // 向上回溯指定级数的目录
  for (let i = 0; i < levelsUp; i++) {
    currentDir = path.dirname(currentDir);
  }
  
  return currentDir;
}

/**
 * 获取数据目录路径
 * 
 * @param metaUrl 当前模块的 import.meta.url，在 Jest 环境中可以传入 null
 * @returns 数据目录的绝对路径
 */
export function getDataDirPath(metaUrl: string | null = null): string {
  // 在 Jest 环境中，直接使用项目根目录下的 data 目录
  if (isJestEnvironment()) {
    return path.join(process.cwd(), 'data');
  }
  
  // 从源代码目录回溯到项目根目录，然后定位到 data 目录
  const srcDir = getDirPath(metaUrl);
  const projectRoot = path.resolve(srcDir, '../../');
  return path.join(projectRoot, 'data');
}

/**
 * 获取 MCP 服务器列表文件的路径
 * 
 * @param metaUrl 当前模块的 import.meta.url，在 Jest 环境中可以传入 null
 * @returns MCP 服务器列表文件的绝对路径
 */
export function getMcpServerListPath(metaUrl: string | null = null): string {
  return path.join(getDataDirPath(metaUrl), 'mcp_server_list.json');
}

/**
 * 获取 node_modules 中的包路径
 * 用于在包安装后访问其中的文件
 * 
 * @param packageName 包名
 * @param relativePath 包内的相对路径
 * @returns 包内文件的绝对路径
 */
export function getNodeModulesPath(packageName: string, relativePath: string): string {
  return path.resolve(process.cwd(), 'node_modules', packageName, relativePath);
}
