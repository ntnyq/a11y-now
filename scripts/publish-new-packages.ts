#!/usr/bin/env tsx
/**
 * 首发 npm 上尚不存在的 workspace 新包(默认首发版本 0.1.0)。
 *
 * 背景:发布链路已切 Trusted Publishing(零 token),但从未上架的新包不一定能
 * 直接走 OIDC 首发——本脚本用于本地手动首发(需 npm 登录 + 2FA),之后用
 * `pnpm trust:new` 为新包补配 trust,后续版本即可全量走 OIDC。
 *
 * 用法:
 *   pnpm publish:new                          # 检测 404 新包 → 构建 → publint/attw → 逐包发布
 *   pnpm publish:new --dry-run                # 全流程演练,publish 走 --dry-run(不上传、免 OTP)
 *   pnpm publish:new --skip-build             # dist 已是最新时跳过 pnpm build
 *   pnpm publish:new --first-version=0.1.0    # 首发版本(默认 0.1.0)
 *   pnpm publish:new --otp=123456             # 直接传 2FA OTP,免交互提示
 *   pnpm publish:new @a11y-now/plugin-spacing # 只处理指定包(仍须在 npm 上 404)
 *
 * 说明:
 * - 发布用 `pnpm --filter <name> publish`,workspace:* 依赖按 pnpm 惯例转换为当前精确版本;
 * - package.json 的 version 仅在发布期间临时改写为首发版本,结束后按原字节还原
 *   (无论成败),下次 `bumpp -r` 会把所有包一起带到同一新版本。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import {
  die,
  listPublishablePackages,
  parseManifest,
  ROOT,
  run,
} from './workspace'

const { positionals, values: opts } = parseArgs({
  allowPositionals: true,
  options: {
    'dry-run': { default: false, type: 'boolean' },
    'first-version': { default: '0.1.0', type: 'string' },
    otp: { type: 'string' },
    'skip-build': { default: false, type: 'boolean' },
  },
})

function runInherit(cmd: string, args: string[]): void {
  const res = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' })
  if (res.error) {
    die(`无法执行 ${cmd}:${res.error.message}`)
  }
  if (res.status !== 0) {
    die(`命令失败(exit ${res.status}):${cmd} ${args.join(' ')}`)
  }
}

const firstVersion = opts['first-version']
if (!/^\d+\.\d+\.\d+$/u.test(firstVersion)) {
  die(`--first-version 需为 x.y.z 形式,收到:${firstVersion}`)
}

if (!opts['dry-run'] && !opts.otp && !process.stdin.isTTY) {
  die(
    '发布需交互输入 2FA OTP,非交互 shell 会 EOTP 退出——请在终端运行,或改用 --otp= / --dry-run',
  )
}

const packages = listPublishablePackages()
const byName = new Map(packages.map(pkg => [pkg.name, pkg]))
const candidates =
  positionals.length > 0
    ? positionals.map(name => {
        const pkg = byName.get(name)
        if (!pkg) {
          die(`workspace 中没有可发布包 ${name}`)
        }
        return pkg
      })
    : packages

console.log(`检查 ${candidates.length} 个包在 npm 上的状态……`)
const missing = []
for (const pkg of candidates) {
  const res = run('npm', ['view', pkg.name, 'version'])
  if (res.status === 0) {
    if (positionals.length > 0) {
      die(`${pkg.name} 已上架(${res.stdout.trim()}),本脚本只做首发`)
    }
  } else if (res.stderr.includes('E404')) {
    missing.push(pkg)
  } else {
    die(
      `查询 ${pkg.name} 失败(疑似网络/registry 异常),中止以防误判:\n${res.stderr}`,
    )
  }
}

if (missing.length === 0) {
  console.log('✔ npm 上没有缺席的包,无事可做')
  process.exit(0)
}

console.log(
  `\n待首发 ${missing.length} 个新包(目标版本 ${firstVersion}${opts['dry-run'] ? ',dry-run' : ''}):`,
)
for (const pkg of missing) {
  console.log(`  - ${pkg.name}(package.json 当前 ${pkg.version})`)
}

if (run('git', ['status', '--porcelain']).stdout.trim()) {
  console.log(
    '\n⚠ 工作区有未提交变更(发布带 --no-git-checks;version 的临时改写会原样还原)',
  )
}

if (opts['skip-build']) {
  console.log('\n跳过构建(--skip-build)')
} else {
  console.log('\n构建全部包……')
  runInherit('pnpm', ['build'])
}

for (const pkg of missing) {
  console.log(`\n校验 ${pkg.name}(publint + attw)……`)
  runInherit('pnpm', ['--filter', pkg.name, 'exec', 'publint', '--strict'])
  runInherit('pnpm', [
    '--filter',
    pkg.name,
    'exec',
    'attw',
    '--pack',
    '.',
    '--profile',
    'esm-only',
  ])
}

const published = []
for (const pkg of missing) {
  const manifestPath = join(pkg.path, 'package.json')
  const raw = readFileSync(manifestPath, 'utf8')
  const manifest = parseManifest(raw)
  const needsRewrite = manifest['version'] !== firstVersion
  console.log(`\n发布 ${pkg.name}@${firstVersion}……`)
  if (needsRewrite) {
    manifest['version'] = firstVersion
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  let res = null
  try {
    res = spawnSync(
      'pnpm',
      [
        '--filter',
        pkg.name,
        'publish',
        '--no-git-checks',
        ...(opts['dry-run'] ? ['--dry-run'] : []),
        ...(opts.otp ? [`--otp=${opts.otp}`] : []),
      ],
      { cwd: ROOT, stdio: 'inherit' },
    )
  } finally {
    if (needsRewrite) {
      writeFileSync(manifestPath, raw)
    }
  }
  if (res.error) {
    die(`无法执行 pnpm publish:${res.error.message}`)
  }
  if (res.status !== 0) {
    die(`发布 ${pkg.name} 失败(exit ${res.status});package.json 已还原`)
  }
  published.push(pkg.name)
}

if (!opts['dry-run']) {
  console.log('\n上架核验……')
  for (const name of published) {
    const res = run('npm', ['view', `${name}@${firstVersion}`, 'version'])
    if (res.status === 0 && res.stdout.trim() === firstVersion) {
      console.log(`  ✔ ${name}@${firstVersion}`)
    } else {
      console.log(
        `  ⚠ ${name}@${firstVersion} 暂未查到(registry 传播可能有延迟,稍后重查)`,
      )
    }
  }
}

console.log(
  `\n完成:${published.length} 个包${opts['dry-run'] ? '通过 dry-run 演练' : `已首发 ${firstVersion}`}`,
)
if (!opts['dry-run']) {
  console.log(
    '下一步:pnpm trust:new 为新包补配 Trusted Publishing,之后发版即可全量走 OIDC',
  )
}
