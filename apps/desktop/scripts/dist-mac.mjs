import { spawn, execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: rootDir })
      .toString()
      .trim()
      .slice(0, 7)
  } catch {
    return 'dev'
  }
}

function getElectronVersion() {
  const pkg = JSON.parse(
    readFileSync(join(rootDir, 'package.json'), 'utf-8')
  )
  return pkg.devDependencies.electron.replace('^', '')
}

function findElectronBuilder() {
  const localPath = join(rootDir, 'node_modules/.bin/electron-builder')
  if (existsSync(localPath)) {
    return localPath
  }
  return 'electron-builder'
}

async function run() {
  const electronVersion = getElectronVersion()
  const buildVersion = getGitSha()
  const isUnsigned = process.argv.includes('--unsigned')
  const builderCmd = findElectronBuilder()

  console.log(`Building TodoList...`)
  console.log(`Electron version: ${electronVersion}`)
  console.log(`Build version: ${buildVersion}`)
  console.log(`Unsigned: ${isUnsigned}`)

  const args = [
    builderCmd,
    '--mac',
    '--publish', 'never'
  ]

  if (isUnsigned) {
    args.push('--config', 'mac.identity=null')
    args.push('--config', 'mac.hardenedRuntime=false')
  }

  const builder = spawn(args[0], args.slice(1), {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: isUnsigned ? 'false' : 'true',
      ELECTRON_VERSION: electronVersion,
      BUILD_VERSION: buildVersion
    }
  })

  builder.on('exit', code => {
    process.exit(code ?? 0)
  })
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
