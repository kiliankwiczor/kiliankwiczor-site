"""Package only project sources for desktop use; never include local account data."""
from pathlib import Path
import hashlib
import os
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1] if len(sys.argv) > 1 else root.parent / 'MOVA-Windows.zip').resolve()
skip_directories = {'node_modules', '.git', '.local', '.expo', 'dist', 'dist-native', 'dist-desktop', 'coverage', 'test-results', 'playwright-report', '__pycache__', '.aws', '.codex', '.agents'}
secret_suffixes = {'.pem', '.key', '.p12', '.keystore', '.sqlite', '.log', '.zip'}
destination.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for parent, directories, names in os.walk(root):
        directories[:] = sorted(d for d in directories if d not in skip_directories)
        for name in sorted(names):
            file = Path(parent) / name
            if file.is_symlink() or file.resolve() == destination:
                continue
            if (name.startswith('.env') and name != '.env.example') or file.suffix in secret_suffixes:
                continue
            archive.write(file, 'MOVA/' + file.relative_to(root).as_posix())
with zipfile.ZipFile(destination) as archive:
    if archive.testzip() is not None:
        raise RuntimeError('Archive corrompue')
    names = archive.namelist()
    assert 'MOVA/DEMARRER-MOVA.cmd' in names
    assert 'MOVA/package-lock.json' in names
    assert not any('/.local/' in n or '/node_modules/' in n for n in names)
checksum = hashlib.sha256(destination.read_bytes()).hexdigest()
destination.with_suffix('.zip.sha256').write_text(checksum + '  ' + destination.name + '\n')
print(f'{destination}: {len(names)} fichiers source, {destination.stat().st_size} octets, CRC vérifié.')
