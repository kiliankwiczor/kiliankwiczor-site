"""Fetch the pinned official Windows Node runtime with TLS and SHA-256 verification."""
from pathlib import Path
import hashlib
import json
import re
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'distribution/node-runtime.json').read_text())
version = manifest['version']
assert re.fullmatch(r'v24\.\d+\.\d+', version)
assert manifest['file'] == f'node-{version}-win-x64.zip'
base = f'https://nodejs.org/dist/{version}/'
assert manifest['source'] == base + manifest['file']
assert manifest['checksums_source'] == base + 'SHASUMS256.txt'
checksums = urllib.request.urlopen(manifest['checksums_source'], timeout=30).read()
published = dict((name, sha) for sha, name in (line.split() for line in checksums.decode().splitlines()))
assert published[manifest['file']] == manifest['sha256'], 'Le checksum officiel ne correspond pas au pin ; téléchargement refusé'
cache = root / '.local/distribution-cache'
cache.mkdir(parents=True, exist_ok=True)
target = cache / manifest['file']
if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != manifest['sha256']:
    with urllib.request.urlopen(manifest['source'], timeout=60) as response, target.open('wb') as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
assert hashlib.sha256(target.read_bytes()).hexdigest() == manifest['sha256'], 'SHA-256 non conforme'
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    node = archive.read(next(name for name in archive.namelist() if name.endswith('/node.exe')))
    assert node[:2] == b'MZ'
    offset = int.from_bytes(node[0x3c:0x40], 'little')
    assert node[offset:offset + 4] == b'PE\0\0'
    assert int.from_bytes(node[offset + 4:offset + 6], 'little') == 0x8664
(cache / 'node-runtime.json').write_text(json.dumps(manifest, indent=2) + '\n')
(cache / 'SHASUMS256.txt').write_bytes(checksums)
print('Node Windows officiel : version épinglée, SHA-256 et format Windows x64 vérifiés.')
