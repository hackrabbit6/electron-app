#!/usr/bin/env node
/**
 * Interactive scaffolder for the Electron template.
 *
 * Picks a frontend framework, writes the matching renderer into place
 * (index.html, vite.config.ts, tsconfig.json, src/, …), and rebuilds
 * package.json from the base + the framework's deps.json.
 *
 * Usage:
 *   node scripts/setup.mjs                 # interactive
 *   node scripts/setup.mjs react           # non-interactive
 *   node scripts/setup.mjs vue --no-install
 *   node scripts/setup.mjs --yes svelte    # skip the overwrite confirmation
 *
 * No third-party dependencies — uses only Node built-ins.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..') // apps/desktop
const workspaceRoot = path.join(root, '..', '..')
const templatesDir = path.join(workspaceRoot, 'templates')

// Active renderer paths that a previous run may have written. Cleared before
// copying so switching frameworks never leaves stale files behind.
const ACTIVE_PATHS = [
  'src',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'svelte.config.js'
]

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
}

function listFrameworks() {
  return fs
    .readdirSync(templatesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort()
}

function parseArgs(argv) {
  const opts = { framework: null, install: true, yes: false }
  for (const arg of argv) {
    if (arg === '--no-install') opts.install = false
    else if (arg === '--yes' || arg === '-y') opts.yes = true
    else if (!arg.startsWith('-') && !opts.framework) opts.framework = arg
  }
  return opts
}

async function promptFramework(frameworks) {
  const rl = readline.createInterface({ input: stdin, output: stdout })
  try {
    console.log(`\n${C.bold}Choose a frontend framework:${C.reset}\n`)
    frameworks.forEach((fw, i) => {
      console.log(`  ${C.cyan}${i + 1}${C.reset}) ${fw}`)
    })
    console.log('')
    while (true) {
      const answer = (await rl.question(`Enter number [1-${frameworks.length}]: `)).trim()
      const byNumber = frameworks[Number(answer) - 1]
      if (byNumber) return byNumber
      if (frameworks.includes(answer.toLowerCase())) return answer.toLowerCase()
      console.log(`${C.yellow}Invalid choice, try again.${C.reset}`)
    }
  } finally {
    rl.close()
  }
}

async function confirm(message) {
  const rl = readline.createInterface({ input: stdin, output: stdout })
  try {
    const answer = (await rl.question(`${message} [y/N]: `)).trim().toLowerCase()
    return answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

function copyTemplate(framework) {
  const src = path.join(templatesDir, framework)

  // Remove previously generated active files.
  for (const p of ACTIVE_PATHS) {
    fs.rmSync(path.join(root, p), { recursive: true, force: true })
  }

  // Copy everything except deps.json (which is merged into package.json).
  fs.cpSync(src, root, {
    recursive: true,
    filter: (from) => path.basename(from) !== 'deps.json'
  })
}

function writePackageJson(framework) {
  const base = JSON.parse(
    fs.readFileSync(path.join(templatesDir, '_base.package.json'), 'utf-8')
  )
  const deps = JSON.parse(
    fs.readFileSync(path.join(templatesDir, framework, 'deps.json'), 'utf-8')
  )

  const pkg = {
    ...base,
    scripts: { ...base.scripts, ...(deps.scripts ?? {}) },
    dependencies: sortKeys({ ...base.dependencies, ...(deps.dependencies ?? {}) }),
    devDependencies: sortKeys({
      ...base.devDependencies,
      ...(deps.devDependencies ?? {})
    })
  }
  pkg.electronTemplate = { framework }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  )
}

function sortKeys(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))
}

function runInstall() {
  console.log(`\n${C.dim}Running pnpm install…${C.reset}\n`)
  const result = spawnSync('pnpm', ['install'], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  })
  return result.status === 0
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const frameworks = listFrameworks()

  if (opts.framework && !frameworks.includes(opts.framework)) {
    console.error(
      `${C.yellow}Unknown framework "${opts.framework}".${C.reset} Available: ${frameworks.join(', ')}`
    )
    process.exit(1)
  }

  const framework = opts.framework ?? (await promptFramework(frameworks))

  // Warn before clobbering an existing renderer.
  const hasActive = fs.existsSync(path.join(root, 'src'))
  if (hasActive && !opts.yes && !opts.framework) {
    const ok = await confirm(
      `${C.yellow}This overwrites the current renderer (src/, index.html, vite.config.ts, tsconfig.json).${C.reset} Continue?`
    )
    if (!ok) {
      console.log('Aborted.')
      process.exit(0)
    }
  }

  console.log(`\n${C.green}▸${C.reset} Scaffolding ${C.bold}${framework}${C.reset}…`)
  copyTemplate(framework)
  writePackageJson(framework)
  console.log(`${C.green}✓${C.reset} Wrote renderer and package.json`)

  const installed = opts.install ? runInstall() : false

  console.log(`\n${C.green}${C.bold}Done!${C.reset} Next steps:\n`)
  if (!installed) console.log(`  ${C.cyan}pnpm install${C.reset}`)
  console.log(`  ${C.cyan}pnpm dev${C.reset}        # start the app`)
  console.log(`  ${C.cyan}pnpm dist:mac${C.reset}   # package a macOS build\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
