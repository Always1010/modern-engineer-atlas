import json,csv,pathlib
p=pathlib.Path(__file__).resolve().parent
parts=json.loads((p/'planning/catalog-data.json').read_text())
catalog=[];rows=[]
for pid,title,chapters in parts:
 catalog.append(f'### {pid} {title}\n')
 for cid,name,audience,life,interview,engineering,difficulty,sections,figures in chapters:
  catalog.append(f'#### {cid} {name}\n\n适读：{audience}。知识稳定度：{life}。面试重要度：{interview}。工程重要度：{engineering}。学习难度：{difficulty}。\n')
  for j,s in enumerate(sections.split('；'),1):catalog.append(f'- {cid}.{j:02d} {s}')
  catalog.append(f'\n配图重点：{figures}\n')
  rows.append([pid,cid,name,audience,life,interview,engineering,difficulty,figures])
(p/'planning/02-complete-catalog.md').write_text('\n'.join(catalog))
with (p/'planning/chapter-metadata.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['part_id','chapter_id','title','audience','lifecycle','interview_importance','engineering_importance','difficulty','illustration']);w.writerows(rows)
body='\n\n'.join((p/f).read_text().replace('](../assets/', '](assets/') for f in ['planning/01-position-and-map.md','planning/02-complete-catalog.md','planning/03-paths-and-workflow.md'])
body+='\n\n# 附录一 标准版本基线\n\n'+(p/'planning/version-baseline.md').read_text().replace('# 标准与技术版本基线\n','')
body+='\n\n# 附录二 技术证据来源\n\n'+(p/'evidence/sources.md').read_text().replace('# 技术来源台账\n','')
body+='\n\n# 附录三 招聘样本与研究限制\n\n'+(p/'evidence/jobs.md').read_text().replace('# 招聘样本与研究限制\n','')
(p/'Modern-Engineering-Book-Plan-V1.zh-CN.md').write_text(body)
print('parts',len(parts),'chapters',len(rows),'sections',sum(len(c[-2].split('；')) for _,_,cs in parts for c in cs),'chars',len(body))
body+='\n\n# 附录四 2025年岗位证据补充\n\n'+(p/'evidence/jobs-2025-supplement.md').read_text().replace('# 2025年官方招聘样本补充\n','')
body+='\n\n# 附录五 规划阅读术语速查\n\n'+(p/'planning/glossary.md').read_text().replace('# 规划阅读术语速查\n','')
(p/'Modern-Engineering-Book-Plan-V1.zh-CN.md').write_text(body)
