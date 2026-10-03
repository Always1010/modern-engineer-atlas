import argparse
import csv
import json
from pathlib import Path


def main():
 parser=argparse.ArgumentParser(description='Build the manuscript and catalog views from source files.')
 parser.add_argument('--output-dir', type=Path, default=Path('build'), help='directory for generated files')
 args=parser.parse_args()
 root=Path(__file__).resolve().parent
 out=args.output_dir if args.output_dir.is_absolute() else root/args.output_dir
 out.mkdir(parents=True,exist_ok=True)
 parts=json.loads((root/'planning/catalog-data.json').read_text(encoding='utf-8'))
 catalog=[];rows=[]
 for pid,title,chapters in parts:
  catalog.append(f'### {pid} {title}\n')
  for cid,name,audience,life,interview,engineering,difficulty,sections,figures in chapters:
   catalog.append(f'#### {cid} {name}\n\n适读：{audience}。知识稳定度：{life}。面试重要度：{interview}。工程重要度：{engineering}。学习难度：{difficulty}。\n')
   for j,s in enumerate(sections.split('；'),1):catalog.append(f'- {cid}.{j:02d} {s}')
   catalog.append(f'\n配图重点：{figures}\n')
   rows.append([pid,cid,name,audience,life,interview,engineering,difficulty,figures])
 (out/'catalog.md').write_text('\n'.join(catalog),encoding='utf-8')
 with (out/'chapter-metadata.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.writer(f);w.writerow(['part_id','chapter_id','title','audience','lifecycle','interview_importance','engineering_importance','difficulty','illustration']);w.writerows(rows)
 body='\n\n'.join((root/f).read_text(encoding='utf-8').replace('](../assets/', '](assets/') for f in ['planning/01-position-and-map.md'])
 body+='\n\n'+(out/'catalog.md').read_text(encoding='utf-8')
 body+='\n\n'+(root/'planning/03-paths-and-workflow.md').read_text(encoding='utf-8')
 body+='\n\n# 附录一 标准版本基线\n\n'+(root/'planning/version-baseline.md').read_text(encoding='utf-8').replace('# 标准与技术版本基线\n','')
 body+='\n\n# 附录二 技术证据来源\n\n'+(root/'evidence/sources.md').read_text(encoding='utf-8').replace('# 技术来源台账\n','')
 body+='\n\n# 附录三 招聘样本与研究限制\n\n'+(root/'evidence/jobs.md').read_text(encoding='utf-8').replace('# 招聘样本与研究限制\n','')
 body+='\n\n# 附录四 2025年岗位证据补充\n\n'+(root/'evidence/jobs-2025-supplement.md').read_text(encoding='utf-8').replace('# 2025年官方招聘样本补充\n','')
 body+='\n\n# 附录五 规划阅读术语速查\n\n'+(root/'planning/glossary.md').read_text(encoding='utf-8').replace('# 规划阅读术语速查\n','')
 (out/'book.md').write_text(body,encoding='utf-8')
 section_count=sum(len(c[-2].split('；')) for _,_,cs in parts for c in cs)
 print(json.dumps({'output_dir':str(out),'parts':len(parts),'chapters':len(rows),'sections':section_count,'manuscript':str(out/'book.md')},ensure_ascii=False))


if __name__ == '__main__':
 main()
