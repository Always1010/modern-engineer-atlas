import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadModel,plain} from './document-model.mjs';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chapters}=await loadModel(edition);
const chapter=id=>{const c=chapters.find(c=>c.id===id);if(!c)throw new Error('Missing index chapter '+id);return c;};
const link=(c,h,label)=>'['+(label||plain(h.title))+']('+c.source+'#'+h.slug+')';
const entry=(id,key,label)=>{const c=chapter(id);const choices=c.headings.filter(h=>h.level>1&&plain(h.title).toLowerCase().includes(key.toLowerCase()));
 if(!choices.length)throw new Error('Missing precise index entry '+id+' '+key);
 const h=choices.find(h=>plain(h.title).toLowerCase()===key.toLowerCase())||choices[0];return link(c,h,label);};
const groups=(selected,predicate=()=>true)=>selected.map(c=>{
 const entries=c.headings.filter(h=>h.level===2&&predicate(h));
 return entries.length?'\n### '+c.title+'\n\n'+entries.map(h=>link(c,h)).join(' · ')+'\n':'';
}).join('');
let md='# 附录：对象与任务索引\n\n索引指向正文具体条目，知识只在正文维护。章序随目录生成，链接使用稳定对象锚点。\n';
md+='\n## A 语言规则与概念\n'+groups(chapters.filter(c=>Number(c.id.slice(1))<=11),h=>!h.title.includes('std::'));
md+='\n## B 标准库对象与接口\n'+groups(chapters.filter(c=>(Number(c.id.slice(1))>=12&&Number(c.id.slice(1))<=22)||Number(c.id.slice(1))>=33));
md+=groups(chapters.filter(c=>['R06','R08','R09','R10'].includes(c.id)),h=>h.title.includes('std::')||/unique_ptr|shared_ptr|weak_ptr|allocator|memory_resource|polymorphic_allocator|monotonic_buffer_resource/.test(h.title));
md+='\n## C 常用任务\n\n| 任务 | 直接入口 |\n| --- | --- |\n';
const tasks=[
 ['选择初始化写法','R03','初始化'],['查询类型范围与表示','R02','整数'],['进行显式转换','R04','显式转换'],
 ['表达指针与借用','R05','指针'],['编写函数和回调','R06','函数'],['管理独占资源','R09','unique_ptr'],
 ['访问字符串与字符视图','R12','string'],['选择顺序容器','R13','分类'],['构造与修改动态数组','R13','vector'],
 ['按键查询与插入','R14','map'],['遍历区间','R15','区间'],['排序或二分查找','R16','sort'],
 ['表示缺失结果','R17','optional'],['解析数值文本','R18','from_chars'],['生成随机数','R33','mt19937'],
 ['测量时间间隔','R19','clock'],['读取或写入文件','R34','ifstream'],['组合路径与遍历目录','R35','path'],
 ['等待异步结果','R20','future'],['管理可延迟锁定','R21','unique_lock'],['谓词等待与通知','R21','condition_variable'],
 ['查原子操作和同步关系','R22','atomic'],['理解任务与关闭','R23','任务'],['理解地址空间','R25','虚拟'],
 ['查底层读写与部分完成','R26','部分完成'],['加载POSIX共享库','R27','dlopen'],['加载Windows动态库','R27','LoadLibraryExW'],['了解连接与协议','R28','TCP'],
 ['查消息收发接口','R29','recv'],['组织构建目标','R30','可执行目标'],['设置断点并观察变量','R31','GDB'],
 ['设计性能对照','R32','Benchmark']
];
for(const [task,id,key] of tasks)md+='| '+task+' | '+entry(id,key)+' |\n';
md+='\n## D 系统、并发模型与网络实体\n'+groups(chapters.filter(c=>Number(c.id.slice(1))>=23&&Number(c.id.slice(1))<=29));
md+='\n## E 版本、平台与头文件\n\nC++17 是本书核心编写基线，不表示所有接口都在 C++17 首次引入。C++20/23 扩展在对应条目处标记；读取代码须区分语言模式和标准库设施支持。OS 接口不是标准 C++ 接口，数据布局与类型宽度也需区分标准要求和实现选择。\n\n| 头文件/范围 | 对象入口 |\n| --- | --- |\n';
const headers=[
 ['`<memory>`','R09','unique_ptr'],['`<string>` / `<string_view>` / `<span>`','R12','string'],
 ['`<vector>` / `<array>` / `<deque>` / `<list>` / `<forward_list>`','R13','分类'],
 ['`<map>` / `<set>` / `<unordered_map>` / `<unordered_set>`','R14','分类'],
 ['`<iterator>` / `<ranges>`','R15','迭代器'],['`<algorithm>` / `<numeric>`','R16','比较器'],
 ['`<utility>` / `<tuple>`','R17','tuple'],['`<optional>` / `<variant>` / `<any>` / `<expected>`','R17','optional'],
 ['`<charconv>` / `<format>`','R18','from_chars'],['`<limits>` / `<random>` / `<bitset>` / `<bit>`','R33','numeric_limits'],
 ['`<chrono>`','R19','duration'],['`<istream>` / `<ostream>` / `<fstream>` / `<sstream>`','R34','流'],
 ['`<filesystem>`','R35','path'],['`<thread>` / `<future>` / `<stop_token>`','R20','thread'],
 ['`<mutex>` / `<shared_mutex>` / `<condition_variable>`','R21','互斥量'],['`<atomic>`','R22','atomic'],
 ['Linux/POSIX 与 Win32','R26','系统调用'],['网络协议与平台 socket','R29','socket']
];
for(const [name,id,key] of headers)md+='| '+name+' | '+entry(id,key)+' |\n';
md+='\n## F 工具与命令入口\n\n| 工具/操作 | 正文入口 |\n| --- | --- |\n';
const commands=[['GCC/Clang 编译参数','R01','编译'],['符号、依赖及二进制工具','R27','工具'],['CMake 配置/构建','R30','配置、构建'],
 ['CMake target 使用要求','R30','PRIVATE'],['CMake 安装/导出','R30','安装'],['GDB 启动与最小会话','R31','GDB'],
 ['GDB break/next/step/continue','R31','断点'],['GDB/LLDB 变量、栈和线程','R31','变量'],['Sanitizer 构建语法及报告','R31','Sanitizer'],
 ['基准比较及结果记录','R32','Benchmark'],['perf / WPR / WPA 调查入口','R32','Profiler']];
for(const [name,id,key] of commands)md+='| '+name+' | '+entry(id,key)+' |\n';
await fs.writeFile(path.join(edition,'appendices.zh-CN.md'),md);
console.log(JSON.stringify({tasks:tasks.length,headers:headers.length,commands:commands.length}));
