#!/usr/bin/env node
/**
 * 为尚未走过 Trusted Publishing(OIDC)的包配置 npm trust(GitHub Actions)。
 *
 * 免登录检测:最新版本带 provenance attestations 的包视为已配好并实测过 OIDC
 * (OIDC 发布必带 provenance),其余列为待配——包括 npm 404 未上架的包,
 * 以及已上架但最新版无 provenance 的包(如刚用 publish:new 手动首发的新包)。
 * 注意:已配 trust 但还没用 OIDC 发过版的包也会被检出,重复执行可能产生重复
 * trust 条目;不确定时先用 `npm trust list <pkg>`(需 2FA)核对,或 --print 过目。
 *
 * 用法:
 *   pnpm trust:new              # 检测 → 确认 → 逐包 npm trust github(需 TTY;首次 2FA 后可勾 5 分钟豁免)
 *   pnpm trust:new --print      # 只打印将要执行的命令,不执行
 *   pnpm trust:new --dry-run    # 透传 npm trust github --dry-run(仍需登录 + 2FA)
 *   pnpm trust:new --yes        # 跳过本脚本与 npm 的确认提示(透传 --yes)
 *   pnpm trust:new <pkg...>     # 跳过检测,直接为指定包配置
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

const ROOT = resolve(import.meta.dirname, '..')
const PUBLISH_DIRS = new Set([
  'packages',
  'packages-plugins',
  'packages-frameworks',
  'packages-themes',
])
const WORKFLOW_FILE = 'release.yml'

const { positionals, values: opts } = parseArgs({
  allowPositionals: true,
  options: {
    'dry-run': { default: false, type: 'boolean' },
    print: { default: false, type: 'boolean' },
    yes: { default: false, type: 'boolean' },
  },
})

function die(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' })
  if (res.error) {
    die(`无法执行 ${cmd}:${res.error.message}`)
  }
  return res
}

function listPublishablePackages() {
  const res = run('pnpm', ['m', 'ls', '--json', '--depth', '-1'])
  if (res.status !== 0) {
    die(`pnpm m ls 失败:\n${res.stderr}`)
  }
  return JSON.parse(res.stdout).filter(
    pkg =>
      pkg.name &&
      pkg.private === false &&
      PUBLISH_DIRS.has(relative(ROOT, pkg.path).split(sep)[0]),
  )
}

const repoUrl =
  JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).repository
    ?.url ?? ''
const repoSlug = /github\.com[/:](?<slug>[\w.-]+\/[\w.-]+?)(?:\.git)?$/u.exec(
  repoUrl,
)?.groups?.slug
if (!repoSlug) {
  die(`无法从根 package.json repository.url 解析 owner/repo:${repoUrl}`)
}

const packages = listPublishablePackages()
const byName = new Map(packages.map(pkg => [pkg.name, pkg]))

const targets = []
if (positionals.length > 0) {
  for (const name of positionals) {
    if (!byName.has(name)) {
      die(`workspace 中没有可发布包 ${name}`)
    }
    targets.push({ name, reason: '手动指定' })
  }
} else {
  console.log(
    `检测 ${packages.length} 个包的 provenance 状态(OIDC 发布必带 provenance)……`,
  )
  for (const pkg of packages) {
    const res = run('npm', ['view', pkg.name, 'dist.attestations', '--json'])
    if (res.status === 0) {
      if (!res.stdout.trim()) {
        targets.push({ name: pkg.name, reason: '已上架但最新版无 provenance' })
      }
    } else if (res.stderr.includes('E404')) {
      targets.push({
        name: pkg.name,
        reason: '未上架(若 npm 拒绝未上架包,先 pnpm publish:new 再重跑)',
      })
    } else {
      die(
        `查询 ${pkg.name} 失败(疑似网络/registry 异常),中止以防误判:\n${res.stderr}`,
      )
    }
  }
}

if (targets.length === 0) {
  console.log('✔ 所有包最新版本均带 provenance,看起来无需配置')
  process.exit(0)
}

const trustArgs = name => [
  'trust',
  'github',
  name,
  '--repository',
  repoSlug,
  '--file',
  WORKFLOW_FILE,
  '--allow-publish',
  ...(opts['dry-run'] ? ['--dry-run'] : []),
  ...(opts.yes ? ['--yes'] : []),
]

console.log(
  `\n待配置 Trusted Publishing 的包(repo ${repoSlug},workflow ${WORKFLOW_FILE}):`,
)
for (const target of targets) {
  console.log(`  - ${target.name}(${target.reason})`)
}
console.log('\n将执行:')
for (const target of targets) {
  console.log(`  npm ${trustArgs(target.name).join(' ')}`)
}

if (opts.print) {
  process.exit(0)
}

if (!process.stdin.isTTY) {
  die(
    'npm trust 需交互完成 2FA(非交互 shell 会 EOTP 退出),请在终端运行;只想看命令用 --print',
  )
}

if (!opts.yes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const reply = await rl.question(
    `\n确认为以上 ${targets.length} 个包配置?首次会弹 2FA(可勾选 5 分钟豁免)[y/N] `,
  )
  rl.close()
  const answer = reply.trim().toLowerCase()
  if (answer !== 'y' && answer !== 'yes') {
    die('已取消')
  }
}

for (const target of targets) {
  console.log(`\n配置 ${target.name} ……`)
  const res = spawnSync('npm', trustArgs(target.name), {
    cwd: ROOT,
    stdio: 'inherit',
  })
  if (res.error) {
    die(`无法执行 npm trust:${res.error.message}`)
  }
  if (res.status !== 0) {
    die(
      `npm trust github ${target.name} 失败(exit ${res.status})。` +
        '若因包未上架被拒:先 pnpm publish:new 首发再重跑本脚本;若 EOTP:确认在交互终端运行',
    )
  }
}

if (!opts['dry-run']) {
  console.log('\n核验(npm trust list,沿用 2FA 豁免窗口)……')
  for (const target of targets) {
    console.log(`\n${target.name}:`)
    const res = spawnSync('npm', ['trust', 'list', target.name], {
      cwd: ROOT,
      stdio: 'inherit',
    })
    if (res.status !== 0) {
      console.log('  ⚠ trust list 未通过(可能 2FA 豁免过期),稍后手动核验')
    }
  }
}

console.log(
  `\n完成:${targets.length} 个包${opts['dry-run'] ? '走完 npm --dry-run' : '已配置 trust'};下次 tag 发版即全量走 OIDC`,
)
