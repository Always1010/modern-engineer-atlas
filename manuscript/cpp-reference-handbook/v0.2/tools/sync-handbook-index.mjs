import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadModel,plain} from './document-model.mjs';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {catalog,chapters}=await loadModel(edition);
const chapter=id=>{const c=chapters.find(c=>c.id===id);if(!c)throw new Error('Missing index chapter '+id);return c;};
const link=(c,h,label)=>'['+(label||plain(h.title))+']('+c.source+'#'+h.slug+')';
const entry=(id,key,label)=>{const c=chapter(id);
 const choices=c.headings.filter(h=>h.level>1&&plain(h.title).toLowerCase()===plain(key).toLowerCase());
 if(choices.length!==1)throw new Error('Missing or ambiguous index entry '+id+' '+key);
 return link(c,choices[0],label);};
const aliases=catalog.indexAliases||[];
for(const a of aliases)entry(a.chapter,a.heading);
const sorted=rows=>rows.sort((a,b)=>a.term.localeCompare(b.term,'en',{sensitivity:'base'})||a.chapter.localeCompare(b.chapter));
const table=rows=>'\n| 名称 / 别名 | 直接入口 |\n| --- | --- |\n'+sorted(rows).map(a=>'| `'+a.term+'` | '+entry(a.chapter,a.heading)+' |\n').join('');
const symbols=new Map();
for(const c of chapters)for(const h of c.headings.filter(h=>h.level===2)){
 const names=[...h.title.matchAll(/std::[A-Za-z_][A-Za-z_0-9]*(?:::[A-Za-z_][A-Za-z_0-9]*)*/g)].map(m=>m[0]);
 if(!names.length)names.push(...(h.title.match(/\b(?:unique_ptr|shared_ptr|weak_ptr|make_unique|make_shared|allocate_shared|enable_shared_from_this|allocator_traits|allocator|memory_resource|polymorphic_allocator|monotonic_buffer_resource)\b/g)||[]).map(n=>(/memory_resource|polymorphic_allocator|monotonic_buffer_resource/.test(n)?'std::pmr::':'std::')+n));
 for(const term of names)if(!symbols.has(term))symbols.set(term,{term,chapter:c.id,heading:h.title});
}
for(const a of aliases.filter(a=>a.kind==='symbol'))symbols.set(a.term,a);
const groups=(selected,predicate=()=>true)=>selected.map(c=>{
 const entries=c.headings.filter(h=>h.level===2&&predicate(h));
 return entries.length?'\n### '+c.title+'\n\n'+entries.map(h=>link(c,h)).join(' · ')+'\n':'';
}).join('');
let md='# 附录：对象与任务索引\n\n已知名称时查 B 的字母序符号，已知问题时查 C 的任务。A 提供中英概念别名，E 按头文件拆开入口。HTML 可点击；完整 PDF 自动标出直接入口的页码。release 等同名接口按所属类型区分，知识只在正文维护。\n';
md+='\n## A 语言规则与概念\n'+groups(chapters.filter(c=>Number(c.id.slice(1))<=11),h=>!h.title.includes('std::'));
md+='\n### 中英概念别名\n'+table(aliases.filter(a=>a.kind==='concept'));
md+='\n## B 符号与成员接口（按名称排序）\n'+table([...symbols.values()]);
md+='\n## C 常用任务\n\n| 任务 | 直接入口 |\n| --- | --- |\n';
const tasks=[
 ['选择初始化写法','R03','初始化类别'],['查询类型范围与表示','R02','整数类型的大小与范围'],['进行显式转换','R04','显式转换分类'],
 ['表达指针与借用','R05','指针声明、取址与解引用'],['编写函数和回调','R06','函数声明、定义与调用'],['管理独占资源','R09','unique_ptr 构造与访问'],
 ['访问字符串与字符视图','R12','std::string'],['选择顺序容器','R13','顺序容器分类'],['构造与修改动态数组','R13','std::vector'],
 ['按键查询与插入','R14','std::map'],['遍历区间','R15','半开区间与尾后位置'],['排序','R16','std::sort 与 std::stable_sort'],['二分查找与边界','R16','std::lower_bound、std::upper_bound 与等价范围'],
 ['表示缺失结果','R17','std::optional'],['解析数值文本','R18','std::from_chars'],['生成随机数','R33','std::mt19937'],
 ['测量时间间隔','R19','std::chrono::steady_clock'],['读取文件','R34','std::ifstream'],['写入文件','R34','std::ofstream'],['组合路径与遍历目录','R35','std::filesystem::path'],
 ['等待异步结果','R20','std::future'],['管理可延迟锁定','R21','std::unique_lock'],['谓词等待与通知','R21','std::condition_variable'],
 ['查原子操作和同步关系','R22','std::atomic'],['理解任务与关闭','R23','任务与执行环境'],['理解地址空间','R25','虚拟地址空间与常见区域'],
 ['查底层读写与部分完成','R26','部分完成与错误'],['加载POSIX共享库','R27','Linux/POSIX：dlopen、dlsym 与 dlclose'],['加载Windows动态库','R27','Windows：LoadLibraryExW、GetProcAddress 与 FreeLibrary'],['了解连接与协议','R28','TCP 字节流与报文段'],
 ['查消息收发接口','R29','Linux/POSIX：send 与 recv'],['组织构建目标','R30','可执行目标与库目标'],['设置断点并观察变量','R31','GDB：一次最小调试会话'],
 ['设计性能对照','R32','Benchmark：比较两个实现']
];
for(const [task,id,key] of tasks)md+='| '+task+' | '+entry(id,key)+' |\n';
md+='\n## D 系统、并发模型与网络实体\n'+groups(chapters.filter(c=>Number(c.id.slice(1))>=23&&Number(c.id.slice(1))<=29));
md+='\n## E 版本、平台与头文件\n\nC++17 是本书核心编写基线，不表示所有接口都在 C++17 首次引入。C++20/23 扩展在对应条目处标记；读取代码须区分语言模式和标准库设施支持。OS 接口不是标准 C++ 接口，数据布局与类型宽度也需区分标准要求和实现选择。\n\n| 头文件/范围 | 对象入口 |\n| --- | --- |\n';
const headers=[
 ['`<memory>`：独占/共享所有权','R09','unique_ptr 构造与访问'],['`<memory>`：分配器','R09','allocator 与 allocator_traits'],
 ['`<string>`','R12','std::string'],['`<string_view>`','R12','std::string_view'],['`<span>`（C++20）','R12','std::span'],
 ['`<array>`','R13','std::array'],['`<vector>`','R13','std::vector'],['`<deque>`','R13','std::deque'],['`<list>`','R13','std::list'],['`<forward_list>`','R13','std::forward_list'],
 ['`<map>`','R14','std::map'],['`<set>`','R14','std::set'],['`<unordered_map>`','R14','std::unordered_map'],['`<unordered_set>`','R14','std::unordered_set'],['`<stack>`','R14','std::stack'],['`<queue>`','R14','std::queue'],
 ['`<iterator>`','R15','迭代器类别与访问成本'],['`<ranges>`（C++20）','R15','ranges 算法与投影'],['`<algorithm>`','R16','std::sort 与 std::stable_sort'],['`<numeric>`','R16','std::accumulate、std::inner_product 与 std::iota'],
 ['`<utility>`','R17','std::pair'],['`<tuple>`','R17','std::tuple'],['`<optional>`','R17','std::optional'],['`<variant>`','R17','std::variant'],['`<any>`','R17','std::any'],['`<expected>`（C++23）','R17','std::expected'],
 ['`<charconv>`','R18','std::from_chars'],['`<format>`（C++20）','R18','std::format'],['`<limits>`','R33','std::numeric_limits'],['`<random>`','R33','std::mt19937'],['`<bitset>`','R33','std::bitset'],['`<bit>`（C++20）','R33','std::bit_cast'],
 ['`<chrono>`','R19','std::chrono::duration'],['`<istream>`','R34','流的类型与状态'],['`<ostream>`','R34','流的类型与状态'],['`<fstream>`：输入','R34','std::ifstream'],['`<fstream>`：输出','R34','std::ofstream'],['`<sstream>`','R34','std::istringstream'],
 ['`<filesystem>`','R35','std::filesystem::path'],['`<thread>`','R20','std::thread'],['`<future>`','R20','std::future'],['`<stop_token>`（C++20）','R20','停止状态与令牌（C++20）'],
 ['`<mutex>`','R21','std::mutex'],['`<shared_mutex>`','R21','std::shared_mutex'],['`<condition_variable>`','R21','std::condition_variable'],['`<atomic>`','R22','std::atomic'],
 ['Linux/POSIX 与 Win32','R26','系统调用与打开文件实体'],['网络协议与平台 socket','R29','socket、地址与两种基本流程']
];
for(const [name,id,key] of headers)md+='| '+name+' | '+entry(id,key)+' |\n';
md+='\n## F 工具与命令入口\n\n| 工具/操作 | 正文入口 |\n| --- | --- |\n';
const commands=[['GCC/Clang 编译参数','R01','编译与运行命令'],['符号、依赖及二进制工具','R27','二进制调查工具'],['CMake 配置/构建','R30','配置、构建与产物'],
 ['CMake target 使用要求','R30','使用要求：PRIVATE、PUBLIC、INTERFACE'],['CMake 安装/导出','R30','安装目录与导出目标'],['GDB 启动与最小会话','R31','GDB：一次最小调试会话'],
 ['GDB break/next/step/continue','R31','断点、步进与继续'],['GDB/LLDB 变量、栈和线程','R31','变量、调用栈与线程'],['Sanitizer 构建语法及报告','R31','Sanitizer：内存与未定义行为检查'],
 ['基准比较及结果记录','R32','Benchmark：比较两个实现'],['perf / WPR / WPA 调查入口','R32','Profiler：定位时间与事件']];
for(const [name,id,key] of commands)md+='| '+name+' | '+entry(id,key)+' |\n';
await fs.writeFile(path.join(edition,'appendices.zh-CN.md'),md);
console.log(JSON.stringify({tasks:tasks.length,headers:headers.length,commands:commands.length,symbols:symbols.size,conceptAliases:aliases.filter(a=>a.kind==='concept').length}));
