#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const tag = process.argv[2]

if (!tag) {
  console.error('Usage: node scripts/check-release.mjs vX.Y.Z')
  process.exit(1)
}

const semverTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/
if (!semverTag.test(tag)) {
  console.error(`Release tag must be semantic versioning with a v prefix: ${tag}`)
  process.exit(1)
}

const packagePath = join(repoRoot, 'integrations', 'deepseek-harness', 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
const tagVersion = tag.slice(1)

if (packageJson.version !== tagVersion) {
  console.error(
    `Tag ${tag} does not match ${packageJson.name} version ${packageJson.version}. ` +
    `Update package.json to ${tagVersion} before creating the tag.`,
  )
  process.exit(1)
}

console.log(`OK: ${tag} matches ${packageJson.name}@${packageJson.version}`)
