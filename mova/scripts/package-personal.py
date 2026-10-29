"""Build a Windows desktop archive from a validated app and verified official Node runtime."""
from pathlib import Path
import hashlib
import json
import os
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
release = root / '.local/personal-release'
cache = root / '.local/distribution-cache'
destination = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/MOVA-Pret-a-ouvrir-Windows.zip')
runtime = json.loads((cache / 'node-runtime.json').read_text())
node_zip = cache / runtime['file']
assert hashlib.sha256(node_zip.read_bytes()).hexdigest() == runtime['sha256'], 'SHA-256 Node non conforme'
assert (release / 'app.mjs').is_file() and (release / 'web/index.html').is_file()
skip = {'.local', '.cache', '.bin', '__pycache__'}
assert not (release / 'database/PG_VERSION').exists(), 'Ne pas inclure une base utilisateur'
destination.parent.mkdir(parents=True, exist_ok=True)
temporary = destination.with_suffix('.zip.building')
with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED) as output:
    for parent, folders, files in os.walk(release):
        folders[:] = sorted(d for d in folders if d not in skip)
        for name in sorted(files):
            file = Path(parent) / name
            if file.is_symlink() or name.startswith('.env') or name.endswith('.log'):
                continue
            output.write(file, 'MOVA/' + file.relative_to(release).as_posix())
    for name in ['OUVRIR-MOVA.cmd', 'OUVRIR-MOVA.txt']:
        text = (root / 'distribution' / name).read_text()
        output.writestr('MOVA/' + name, text.replace('\r\n', '\n').replace('\n', '\r\n').encode('ascii'))
    with zipfile.ZipFile(node_zip) as node:
        assert node.testzip() is None
        binary = next(name for name in node.namelist() if name.endswith('/node.exe'))
        content = node.read(binary)
        assert content[:2] == b'MZ'
        output.writestr('MOVA/.runtime/node.exe', content)
        license_file = next(name for name in node.namelist() if name.rsplit('/', 1)[-1].upper() == 'LICENSE')
        output.writestr('MOVA/Node-LICENSE.txt', node.read(license_file))
    provenance = {'purpose': 'MOVA personal local pilot; Windows binary not executed in Linux validation', 'node': runtime, 'node_executable_sha256': hashlib.sha256(content).hexdigest(), 'database': '@electric-sql/pglite 0.5.13', 'application_sha256': hashlib.sha256((release / 'app.mjs').read_bytes()).hexdigest(), 'runtime_dependencies': json.loads((root / 'distribution/package.json').read_text())['dependencies']}
    output.writestr('MOVA/PROVENANCE.json', json.dumps(provenance, indent=2, ensure_ascii=False))
with zipfile.ZipFile(temporary) as check:
    assert check.testzip() is None
    assert 'MOVA/.runtime/node.exe' in check.namelist()
    assert 'MOVA/node_modules/@electric-sql/pglite/dist/pglite.wasm' in check.namelist()
    assert not any('/database/base/' in name or '/.local/' in name or name.endswith('/application.lock') for name in check.namelist())
temporary.replace(destination)
destination.with_suffix('.zip.sha256').write_text(hashlib.sha256(destination.read_bytes()).hexdigest() + '  ' + destination.name + '\n')
print(f'Archive Windows autonome : {destination}, {destination.stat().st_size / 1048576:.1f} Mio ; CRC et SHA-256 verifies.')
