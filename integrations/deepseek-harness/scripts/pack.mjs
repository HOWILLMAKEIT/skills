#!/usr/bin/env node
// Pack this bundle for npm publish: copy every root skill of the repository
// (any top-level directory containing SKILL.md, excluding integrations/) into
// ./skills, then exit. Run from integrations/deepseek-harness before `npm publish`.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const bundleRoot = join(here, '..')
const repoRoot = join(bundleRoot, '..', '..')
const outDir = join(bundleRoot, 'skills')

const skills = readdirSync(repoRoot, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== 'integrations' && e.name !== '.git')
  .map(e => e.name)
  .filter(name => existsSync(join(repoRoot, name, 'SKILL.md')))

if (skills.length === 0) {
  console.error('pack: no root skills found (expected <name>/SKILL.md at repo root)')
  process.exit(1)
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
for (const name of skills) {
  cpSync(join(repoRoot, name), join(outDir, name), { recursive: true })
  console.log(`pack: ${name}`)
}
console.log(`pack: ${skills.length} skill(s) -> integrations/deepseek-harness/skills/`)
