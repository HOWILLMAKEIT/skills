#!/usr/bin/env python3
"""Versioned artifact storage. Standard library only; no network or generation."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile

SKILL_ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {'generated-original', 'editable-pptx', 'prompt', 'reference-notes',
            'generation-record', 'source', 'export', 'preview', 'qa'}
HANDOFF_REQUIRED = {'reference', 'reference-notes', 'prompt', 'handoff'}
ROLES = REQUIRED | HANDOFF_REQUIRED | {'metadata'}
FOLDERS = ('references', 'references/images', 'prompts', 'handoff', 'generated',
           'generation', 'editable', 'source', 'exports', 'previews', 'qa')


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def root_path(value):
    root = Path(value).expanduser().resolve()
    if root == SKILL_ROOT or SKILL_ROOT in root.parents:
        raise ValueError('Task artifacts must be outside the installed skill.')
    return root


def member(root, relative):
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts or not rel.parts:
        raise ValueError('Destination must be a nonempty relative path without ..')
    target = root / rel
    resolved = target.resolve()
    if root not in resolved.parents:
        raise ValueError('Destination escapes the artifact directory.')
    if rel.as_posix() == 'manifest.json':
        raise ValueError('manifest.json is reserved for the artifact index.')
    return target


def read_manifest(root):
    with (root / 'manifest.json').open(encoding='utf-8') as stream:
        data = json.load(stream)
    if data.get('schema_version') != 1 or not isinstance(data.get('files'), list):
        raise ValueError('Unsupported or malformed manifest.')
    return data


def write_manifest(root, data):
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=root,
                                     prefix='.manifest-', delete=False) as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
        tmp = Path(stream.name)
    tmp.replace(root / 'manifest.json')


def initialize(value):
    root = root_path(value)
    if (root / 'manifest.json').exists():
        read_manifest(root)
        return root
    root.mkdir(parents=True, exist_ok=True)
    for folder in FOLDERS:
        target = member(root, folder)
        target.mkdir(exist_ok=True)
    write_manifest(root, {'schema_version': 1,
        'created_at': datetime.now(timezone.utc).isoformat(), 'files': []})
    return root


def add(value, source, role, relative):
    if role not in ROLES:
        raise ValueError('Unknown artifact role.')
    root = root_path(value)
    data = read_manifest(root)
    src = Path(source).expanduser().resolve(strict=True)
    if not src.is_file():
        raise ValueError('Source must be a file.')
    dest = member(root, relative)
    rel = Path(relative).as_posix()
    original = next((x for x in data['files'] if x['path'] == rel), None)
    sha = digest(src)
    if original:
        if original['sha256'] != sha or original['role'] != role:
            raise ValueError('Registered artifacts are immutable; use a new version path.')
        if not dest.is_file() or digest(dest) != sha:
            raise ValueError('Registered artifact is missing or modified.')
        return original
    if role == 'editable-pptx' and dest.suffix.lower() != '.pptx':
        raise ValueError('Editable PPT artifacts require a .pptx extension.')
    if role == 'generated-original' and dest.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
        raise ValueError('Generated originals must retain a supported image extension.')
    if dest.exists():
        if not dest.is_file() or digest(dest) != sha:
            raise ValueError('Refusing to overwrite different existing content.')
    else:
        dest.parent.mkdir(parents=True, exist_ok=True)
        # Exclusive creation prevents overwriting an existing version.
        with src.open('rb') as inp, dest.open('xb') as out:
            shutil.copyfileobj(inp, out)
    if digest(dest) != sha:
        raise ValueError('Source changed during copy; artifact was not registered.')
    item = {'path': rel, 'role': role, 'sha256': sha, 'bytes': dest.stat().st_size}
    data['files'].append(item)
    write_manifest(root, data)
    return item


def verify(value, complete=False, stage=None):
    if stage not in {None, 'handoff'}:
        raise ValueError('Unknown verification stage.')
    if complete and stage is not None:
        raise ValueError('Choose either complete delivery or a workflow stage.')
    root = root_path(value)
    data = read_manifest(root)
    errors = []
    seen = set()
    for item in data['files']:
        rel = item['path']
        if rel in seen:
            errors.append('Duplicate manifest path: ' + rel)
        seen.add(rel)
        path = member(root, rel)
        if not path.is_file():
            errors.append('Missing: ' + rel)
        elif digest(path) != item['sha256']:
            errors.append('Hash mismatch: ' + rel)
    roles = {x['role'] for x in data['files']}
    required = set()
    if complete:
        required = REQUIRED
    elif stage == 'handoff':
        required = HANDOFF_REQUIRED
    missing = sorted(required - roles)
    errors.extend('Missing role: ' + role for role in missing)
    return {'ok': not errors, 'file_count': len(data['files']),
            'complete_roles_checked': complete, 'errors': errors,
            'stage_roles_checked': stage,
            'scope': 'File preservation only; generation provenance and visual quality need review.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('init'); p.add_argument('root')
    p = sub.add_parser('add'); p.add_argument('root'); p.add_argument('source')
    p.add_argument('--role', required=True, choices=sorted(ROLES)); p.add_argument('--to', required=True)
    p = sub.add_parser('verify'); p.add_argument('root')
    checks = p.add_mutually_exclusive_group()
    checks.add_argument('--complete', action='store_true')
    checks.add_argument('--stage', choices=['handoff'])
    args = parser.parse_args()
    try:
        if args.command == 'init':
            result = {'root': str(initialize(args.root)), 'initialized': True}
        elif args.command == 'add':
            result = add(args.root, args.source, args.role, args.to)
        else:
            result = verify(args.root, args.complete, args.stage)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result.get('ok', True) else 1
    except (OSError, ValueError, KeyError) as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
