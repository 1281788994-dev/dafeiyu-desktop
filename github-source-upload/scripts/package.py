"""用 Electron 官方预编译发行包打包，无需用户安装 Node/Python。"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import plistlib
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '45.1.0'
APP_VERSION = '1.1.2'
CACHE = ROOT / '.runtime-cache'
DIST = ROOT / 'dist'
TARGETS = {
    'mac-arm64': ('darwin', 'arm64', '大肥鱼桌宠-Mac-Apple芯片'),
    'mac-x64': ('darwin', 'x64', '大肥鱼桌宠-Mac-Intel'),
    'windows-x64': ('win32', 'x64', '大肥鱼桌宠-Windows-x64'),
}

def verify(filename):
    lines = (CACHE / 'SHASUMS256.txt').read_text().splitlines()
    expected = next(line.split()[0] for line in lines if line.split()[-1].lstrip('*') == filename)
    digest = hashlib.sha256((CACHE / filename).read_bytes()).hexdigest()
    if digest != expected:
        raise ValueError(f'{filename} 校验失败，拒绝使用。预期 {expected}，实际 {digest}')
    print(f'SHA256 verified: {filename}', flush=True)

def build(target, archive=True):
    platform, arch, label = TARGETS[target]
    filename = f'electron-v{VERSION}-{platform}-{arch}.zip'
    verify(filename)
    destination = DIST / f'{label}-v{APP_VERSION}'
    if destination.exists():
        raise FileExistsError(f'{destination} 已存在，请使用新的输出目录或归档旧版本。')
    destination.mkdir(parents=True)
    subprocess.run(['/usr/bin/ditto', '-x', '-k', str(CACHE / filename), str(destination)], check=True)
    if platform == 'darwin':
        bundle = destination / '大肥鱼桌宠.app'
        (destination / 'Electron.app').rename(bundle)
        resources = bundle / 'Contents' / 'Resources'
        shutil.copytree(ROOT / 'app', resources / 'app')
        shutil.copy2(ROOT / 'app' / 'assets' / 'icon.icns', resources / 'dafeiyu.icns')
        info_path = bundle / 'Contents' / 'Info.plist'
        with info_path.open('rb') as f: info = plistlib.load(f)
        info.update(CFBundleDisplayName='大肥鱼桌宠', CFBundleName='大肥鱼桌宠',
                    CFBundleIdentifier='com.dafeiyu.desktop', CFBundleShortVersionString=APP_VERSION,
                    CFBundleVersion=APP_VERSION, CFBundleIconFile='dafeiyu.icns', NSHumanReadableCopyright='大肥鱼桌宠 · 社区二创')
        with info_path.open('wb') as f: plistlib.dump(info, f)
        subprocess.run(['/usr/bin/codesign', '--force', '--deep', '--sign', '-', str(bundle)], check=True)
        subprocess.run(['/usr/bin/codesign', '--verify', '--deep', '--strict', str(bundle)], check=True)
    else:
        shutil.copytree(ROOT / 'app', destination / 'resources' / 'app')
        (destination / 'electron.exe').rename(destination / '大肥鱼桌宠.exe')
        if (destination / 'electron_wer.dll').exists():
            (destination / 'electron_wer.dll').rename(destination / '大肥鱼桌宠_wer.dll')
    shutil.copy2(ROOT / '使用说明.txt', destination / '使用说明.txt')
    shutil.copy2(ROOT / 'NOTICE.txt', destination / '素材与开源说明.txt')
    if archive:
        output = DIST / f'{label}-v{APP_VERSION}.zip'
        subprocess.run(['/usr/bin/ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', str(destination), str(output)], check=True)
        print(f'Created: {output}', flush=True)
    return destination

def archive_existing(target):
    platform, arch, label = TARGETS[target]
    destination = DIST / f'{label}-v{APP_VERSION}'
    if not destination.is_dir(): raise FileNotFoundError(destination)
    output = DIST / f'{label}-v{APP_VERSION}.zip'
    if output.exists(): raise FileExistsError(output)
    if platform == 'darwin':
        subprocess.run(['/usr/bin/ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', str(destination), str(output)], check=True)
    else:
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for f in sorted(destination.rglob('*')):
                if f.is_file(): z.write(f, f.relative_to(DIST))
    print(f'Created: {output}', flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', choices=['all', *TARGETS], default='all')
    parser.add_argument('--no-archive', action='store_true')
    parser.add_argument('--archive-only', action='store_true')
    args = parser.parse_args()
    DIST.mkdir(exist_ok=True)
    for target in TARGETS if args.target == 'all' else [args.target]:
        if args.archive_only: archive_existing(target)
        else: build(target, not args.no_archive)
