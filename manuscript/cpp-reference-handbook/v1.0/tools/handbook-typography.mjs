// Runs in the browser. Every transformation must preserve prose/code text.
export function applyTypography(sectionNumbers) {
  const main=document.querySelector('main');
  const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT),references=[];
  while(walker.nextNode()) {
    const n=walker.currentNode;
    if(!n.parentElement.closest('a,code,pre,h1,h2,h3,h4,script,style')&&/\bR\d\d\b|图\s*\d{1,2}[-－]\d+/.test(n.textContent))references.push(n);
  }
  for(const node of references) {
    const fragment=document.createDocumentFragment();
    for(const text of node.textContent.split(/\b(R\d\d)\b/)) {
      if(sectionNumbers[text]&&document.getElementById(text)) {
        const a=document.createElement('a');a.href='#'+text;a.textContent=sectionNumbers[text]+' 节';fragment.append(a);
      } else fragment.append(document.createTextNode(text.replace(/图\s*(\d{1,2})([-－]\d+)/g,(match,num,suffix)=>{
        const number=sectionNumbers['R'+num.padStart(2,'0')];return number?'图'+number+suffix:match;
      })));
    }
    node.replaceWith(fragment);
  }
  for(const a of main.querySelectorAll('a')) {
    const id=a.textContent.trim();if(/^R\d\d$/.test(id)&&sectionNumbers[id])a.textContent=sectionNumbers[id]+' 节';
  }
  const before=main.textContent;
  for(const code of main.querySelectorAll('code'))if(!code.closest('pre'))code.classList.add('prose-code');
  const nodes=[],english=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);
  while(english.nextNode()) {
    const n=english.currentNode;
    if(!n.parentElement.closest('pre,code,.version-chip,script,style')&&/[A-Za-z]/.test(n.textContent))nodes.push(n);
  }
  for(const node of nodes) {
    const fragment=document.createDocumentFragment(),source=node.textContent;let end=0;
    for(const m of source.matchAll(/C\+\+(?:11|14|17|20|23|26)|[A-Za-z][A-Za-z0-9_]*/g)) {
      fragment.append(document.createTextNode(source.slice(end,m.index)));
      const span=document.createElement('span');span.className='prose-english';span.lang='en';span.textContent=m[0];fragment.append(span);end=m.index+m[0].length;
    }
    fragment.append(document.createTextNode(source.slice(end)));node.replaceWith(fragment);
  }
  const types=new Set('bool char char8_t char16_t char32_t double float int long short signed unsigned void wchar_t'.split(' '));
  const keywords=new Set(('alignas alignof asm auto break case catch class concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do dynamic_cast else enum explicit export extern false for friend if inline mutable namespace new noexcept nullptr operator private protected public register reinterpret_cast requires return sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union using virtual volatile while').split(' '));
  for(const code of main.querySelectorAll('pre code.language-cpp')) {
    const source=code.textContent,fragment=document.createDocumentFragment();let end=0;
    const pattern=/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b/g;
    for(const m of source.matchAll(pattern)) {
      fragment.append(document.createTextNode(source.slice(end,m.index)));
      const token=m[0],kind=token.startsWith('//')||token.startsWith('/*')?'comment':/^["']/.test(token)?'string':/^\d/.test(token)?'number':types.has(token)?'type':keywords.has(token)?'keyword':null;
      if(kind){const span=document.createElement('span');span.className='syntax-'+kind;span.textContent=token;fragment.append(span);}else fragment.append(document.createTextNode(token));
      end=m.index+token.length;
    }
    fragment.append(document.createTextNode(source.slice(end)));code.replaceChildren(fragment);
    if(code.textContent!==source)throw new Error('Syntax colouring changed code');
  }
  if(main.textContent!==before)throw new Error('Typography changed text');
  for(const article of main.querySelectorAll('.book-section')) {
    const title=article.querySelector('h2');
    if(title?.nextElementSibling?.classList.contains('section-toc')) {
      const intro=title.nextElementSibling.nextElementSibling;if(intro?.tagName==='P')intro.classList.add('chapter-intro');
      const meta=intro?.nextElementSibling;
      if(meta?.tagName==='P'&&/^(?:版本(?:与先修)?|适用范围|范围|先修|基线|平台与先修|标准基线)[:：]/.test(meta.textContent))meta.classList.add('chapter-meta');
    }
    for(const h of [...article.querySelectorAll('h3')]) {
      const group=document.createElement('div');group.className='section-opening';h.before(group);group.append(h);
      let next=group.nextElementSibling;
      if(next?.tagName==='P'){group.append(next);next=group.nextElementSibling;}
      if(next?.tagName==='PRE'&&next.textContent.split('\n').length<=18)group.append(next);
      else if(next?.classList.contains('compact-table')&&next.querySelectorAll('tr').length<=5)group.append(next);
    }
  }
}
