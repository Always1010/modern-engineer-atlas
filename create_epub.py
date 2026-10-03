import argparse
import json
import subprocess
from pathlib import Path


def main():
    parser=argparse.ArgumentParser(description='Prepare the manuscript and export EPUB3 with Pandoc.')
    parser.add_argument('--input',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--metadata',type=Path,default=Path('book-metadata.json'))
    parser.add_argument('--css',type=Path,default=Path('assets/epub.css'))
    parser.add_argument('--work-dir',type=Path,default=Path('build/epub'))
    parser.add_argument('--version',required=True)
    parser.add_argument('--date',required=True,help='release/build date in YYYY-MM-DD form')
    parser.add_argument('--pandoc',default='pandoc')
    args=parser.parse_args()
    root=Path(__file__).resolve().parent
    input_path=args.input if args.input.is_absolute() else root/args.input
    output_path=args.output if args.output.is_absolute() else root/args.output
    metadata_path=args.metadata if args.metadata.is_absolute() else root/args.metadata
    css_path=args.css if args.css.is_absolute() else root/args.css
    work_dir=args.work_dir if args.work_dir.is_absolute() else root/args.work_dir
    metadata=json.loads(metadata_path.read_text(encoding='utf-8'))
    work_dir.mkdir(parents=True,exist_ok=True); output_path.parent.mkdir(parents=True,exist_ok=True)

    lines=input_path.read_text(encoding='utf-8').splitlines(); out=[]; i=0
    while i<len(lines):
        line=lines[i]; i+=1
        if line.startswith('|'):
            rows=[line]
            while i<len(lines) and lines[i].startswith('|'): rows.append(lines[i]); i+=1
            header=[x.strip() for x in rows[0].strip('|').split('|')]
            for row in rows[2:]:
                cells=[x.strip() for x in row.strip('|').split('|')]
                if not cells: continue
                out+=['','**'+cells[0]+'**','']
                out+=['- '+h+'：'+c for h,c in zip(header[1:],cells[1:])]
            out.append('')
        else:
            out.append(line)
    epub_input=work_dir/'epub-input.md'; epub_input.write_text('\n'.join(out),encoding='utf-8')
    command=[args.pandoc,str(epub_input),'--from=markdown','--to=epub3','--standalone',f'--resource-path={root}',f'--css={css_path}', '--toc','--toc-depth=2',
             f"--metadata=lang:{metadata['language']}",f"--metadata=title:{metadata['title']}",f"--metadata=author:{metadata['author']}",f'--metadata=date:{args.date}',f'--metadata=version:{args.version}',f'--output={output_path}']
    subprocess.run(command,cwd=root,check=True)
    print(f'EPUB ready: {output_path}')


if __name__ == '__main__':
    main()
