import { spawnSync } from 'node:child_process'
import type { SpawnSyncReturns } from 'node:child_process'
import { relative, resolve, sep } from 'node:path'

interface PublishablePackage {
  /**
   * 发布包在 npm registry 中的完整名称。
   */
  name: string
  /**
   * workspace 包目录的绝对路径。
   */
  path: string
  /**
   * 显式为 false 的发布资格标记。
   */
  private: false
  /**
   * package.json 中声明的当前包版本。
   */
  version: string
}

/**
 * 仓库根目录的绝对路径，用作 workspace 命令的工作目录。
 */
export const ROOT: string = resolve(import.meta.dirname, '..')
/**
 * 允许发布 npm 包的一级 workspace 目录。
 */
const PUBLISH_DIRS = new Set([
  'packages',
  'packages-plugins',
  'packages-frameworks',
  'packages-themes',
])

/**
 * 输出错误信息并以状态码 1 终止当前进程。
 *
 * @param message - 要输出的错误说明。
 * @returns 不会返回；当前进程会退出。
 */
export function die(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

/**
 * 在仓库根目录同步执行命令，启动失败时终止当前进程。
 *
 * @param cmd - 要执行的程序名。
 * @param args - 传给程序的独立命令行参数。
 * @returns 包含退出状态和 UTF-8 标准输出、标准错误的执行结果。
 */
export function run(cmd: string, args: string[]): SpawnSyncReturns<string> {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' })
  if (res.error) {
    die(`无法执行 ${cmd}:${res.error.message}`)
  }
  return res
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 保留 manifest 的全部字段,供发布期间临时改写版本。
 *
 * @param raw - package.json 的原始 JSON 文本。
 * @returns 保留所有字段的 manifest 对象；非对象内容会终止进程。
 * @throws {SyntaxError} JSON 文本无效时抛出。
 */
export function parseManifest(raw: string): Record<string, unknown> {
  const manifest: unknown = JSON.parse(raw)
  if (!isRecord(manifest)) {
    die('package.json 内容需为对象')
  }
  return manifest
}

function isPublishablePackage(pkg: unknown): pkg is PublishablePackage {
  if (
    !isRecord(pkg) ||
    typeof pkg['name'] !== 'string' ||
    !pkg['name'] ||
    pkg['private'] !== false
  ) {
    return false
  }
  if (typeof pkg['path'] !== 'string' || typeof pkg['version'] !== 'string') {
    die(`workspace 包 ${pkg['name']} 缺少有效的 path 或 version`)
  }
  const [directory] = relative(ROOT, pkg['path']).split(sep)
  return directory !== undefined && PUBLISH_DIRS.has(directory)
}

/**
 * 从 pnpm workspace 列表中筛选允许发布的包。
 *
 * @returns 发布目录中显式标记为非私有的 workspace 包列表。
 * @throws {SyntaxError} pnpm 输出的 JSON 文本无效时抛出。
 */
export function listPublishablePackages(): PublishablePackage[] {
  const res = run('pnpm', ['m', 'ls', '--json', '--depth', '-1'])
  if (res.status !== 0) {
    die(`pnpm m ls 失败:\n${res.stderr}`)
  }
  const packages: unknown = JSON.parse(res.stdout)
  if (!Array.isArray(packages)) {
    die('pnpm m ls 返回的内容需为数组')
  }
  return packages.filter(pkg => isPublishablePackage(pkg))
}
