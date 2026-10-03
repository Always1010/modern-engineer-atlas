from pathlib import Path
p=Path(__file__).resolve().parent
(p/'qa').mkdir(exist_ok=True)
lines=(p/'Modern-Engineering-Book-Plan-V1.zh-CN.md').read_text().splitlines();out=[];i=0
while i<len(lines):
 line=lines[i];i+=1
 if line.startswith('|'):
  rows=[line]
  while i<len(lines) and lines[i].startswith('|'):rows.append(lines[i]);i+=1
  header=[x.strip() for x in rows[0].strip('|').split('|')]
  for row in rows[2:]:
   cs=[x.strip() for x in row.strip('|').split('|')]
   out+=['', '**'+cs[0]+'**','']
   out += ['- '+h+'：'+c for h,c in zip(header[1:],cs[1:])]
  out.append('')
 else:out.append(line)
(p/'qa/epub-input.md').write_text('\n'.join(out))
