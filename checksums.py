import argparse
import hashlib
from pathlib import Path


def digest(path):
    value=hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda:handle.read(1024*1024),b''): value.update(chunk)
    return value.hexdigest()


def write_checksums(output, files):
    output.parent.mkdir(parents=True,exist_ok=True)
    lines=[]
    for path in files:
        if not path.is_file() or path.stat().st_size==0: raise SystemExit(f'missing or empty file: {path}')
        lines.append(f'{digest(path)}  {path.name}')
    output.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(f'checksums written: {output}')


def verify_checksums(checksum_file):
    base=checksum_file.parent; checked=0
    for line in checksum_file.read_text(encoding='utf-8').splitlines():
        if not line.strip(): continue
        expected,name=line.split('  ',1); path=base/name
        if not path.is_file() or digest(path)!=expected: raise SystemExit(f'checksum mismatch: {name}')
        checked+=1
    if checked==0: raise SystemExit('checksum file is empty')
    print(f'checksums verified: {checked}')


def main():
    parser=argparse.ArgumentParser(description='Create or verify SHA-256 checksums for release files.')
    subparsers=parser.add_subparsers(dest='command',required=True)
    writer=subparsers.add_parser('write'); writer.add_argument('--output',type=Path,required=True); writer.add_argument('files',type=Path,nargs='+')
    verifier=subparsers.add_parser('verify'); verifier.add_argument('checksum_file',type=Path)
    args=parser.parse_args()
    if args.command=='write': write_checksums(args.output,args.files)
    else: verify_checksums(args.checksum_file)


if __name__ == '__main__':
    main()
