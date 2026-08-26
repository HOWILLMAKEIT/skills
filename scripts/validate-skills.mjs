#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const ignoredDirectories = new Set([
  '.git',
  '.github',
  'docs',
  'integrations',
  'learn-by-running-code-workspace',
  'node_modules',
  'scripts',
])

const skillDirectories = readdirSync(repoRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !ignoredDirectories.has(entry.name))
  .map(entry => entry.name)
  .filter(name => existsSync(join(repoRoot, name, 'SKILL.md')))
  .sort()

const errors = []
const seenNames = new Set()
const allowedFrontmatterKeys = new Set([
  'allowed-tools',
  'description',
  'license',
  'metadata',
  'name',
])
const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')

if (skillDirectories.length === 0) {
  errors.push('No root skills found; expected <name>/SKILL.md')
}

for (const directoryName of skillDirectories) {
  const skillPath = join(repoRoot, directoryName, 'SKILL.md')
  const content = readFileSync(skillPath, 'utf8')
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)

  if (!frontmatterMatch) {
    errors.push(`${directoryName}: missing YAML frontmatter`)
    continue
  }

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m)
  const frontmatterKeys = [...frontmatter.matchAll(/^([A-Za-z0-9_-]+):/gm)]
    .map(match => match[1])

  for (const key of frontmatterKeys) {
    if (!allowedFrontmatterKeys.has(key)) {
      errors.push(`${directoryName}: unsupported frontmatter key ${key}`)
    }
  }

  if (!nameMatch) {
    errors.push(`${directoryName}: missing single-line name field`)
    continue
  }

  const skillName = nameMatch[1].trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) {
    errors.push(`${directoryName}: invalid kebab-case skill name ${skillName}`)
  }
  if (skillName !== directoryName) {
    errors.push(`${directoryName}: frontmatter name is ${skillName}`)
  }
  if (seenNames.has(skillName)) {
    errors.push(`${directoryName}: duplicate skill name ${skillName}`)
  }
  seenNames.add(skillName)

  if (!descriptionMatch || !descriptionMatch[1].trim()) {
    errors.push(`${directoryName}: missing non-empty description field`)
  }

  if (
    !readme.includes(`(${directoryName}/)`) &&
    !readme.includes(`(./${directoryName}/)`)
  ) {
    errors.push(`${directoryName}: README skill table does not link to this directory`)
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`)
  process.exit(1)
}

console.log(`OK: ${skillDirectories.length} skill(s): ${skillDirectories.join(', ')}`)
