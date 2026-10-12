// Evidence-driven editorial inventory. Does not edit any reviewed source.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadModel, headings} from '../../tools/document-model.mjs';
const root = path.dirname(fileURLToPath(import.meta.url)), edition = path.resolve(root, '../..');
const baseline = JSON.parse((await fs.readFile(path.join(root, 'source-baseline.json'), 'utf8')).replace(/^\uFEFF/, ''));
for (const item of baseline.files) {
  const bytes = await fs.readFile(path.join(edition, item.path));
  if (createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error('Reviewed source changed: ' + item.path);
}
const model = await loadModel(edition);
const records = new Map(model.chapters.map(c => [c.id, c]));
const guide = await fs.readFile(path.join(edition, 'reading-guide.zh-CN.md'), 'utf8');
records.set('guide', {id: 'guide', source: 'reading-guide.zh-CN.md', text: guide, headings: headings(guide, 'guide')});
// id, priority, kind, source, section, evidence, definition targets, reason, action, status
const rows = [
['A01','P2','层次混合','R01','作用域、命名空间与链接属性','非模板非',[['R03','const 与 constexpr']], '链接基础同时进入 const、volatile 与模板例外，初学者还未获得这些限定的意义。', '先保留普通函数的跨文件关系；const/inline 的完整例外放到相应概念之后查阅。'],
['A02','P2','层次混合','R01','单一定义规则与多文件程序','相同记号序列',[['R07','class、struct 与访问控制'],['R10','实例化与定义可见性']], '两文件正常组织之后立即解释类、模板、名字查找与无须诊断的例外，超出首个构建任务。', '基础路径在普通函数的正确组织处收束，复杂 ODR 条件作为独立规则入口保留。'],
['A03','P1','例子硬依赖','R02','数组与类型别名','int (&whole)[3]',[['R05','指针声明、取址与解引用'],['R05','左值引用与右值引用']], '第一次数组例同时要求读懂指针衰变和整个数组引用，正式指针与引用定义在后面。', '先用数组元素、下标和固定长度建立模型；指针衰变及数组引用放到基本借用之后。'],
['A04','P2','例子硬依赖','R02','类型特征与字节复制','static_assert(std::is_trivially_copyable_v<Record>)',[['R07','class、struct 与访问控制'],['R10','if constexpr 与 static_assert']], '字节复制例依赖类成员、模板实例和静态断言，且任务需要平凡可复制的语义基础。', '对象基础只介绍类型与普通对象；字节复制保留为后续对象表示专题，入口列明具体先修。'],
['A05','P1','例子硬依赖','R02','placement new 与存储重用','first->~Cell();',[['R07','构造函数与成员初始化'],['R07','析构函数'],['R09','new 与 delete']], '手工槽位例在构造、析构、普通动态分配之前组合 placement new、转换、对齐和显式析构。', '迁到对象生命周期、指针与资源管理之后；保留存储与对象不同的基础认识，不在早期展示全套手工机制。'],
['A06','P1','例子硬依赖','R02','结构化绑定','auto& [left, right]',[['R03','auto'],['R05','左值引用与右值引用'],['R17','std::tuple']], '结构化绑定先使用 auto、引用和 tuple 协议；其中 auto 自己也尚未介绍。', '基础拆解安排到 auto、引用和简单类之后；tuple 定制协议与非聚合类例留作后续规则。'],
['A07','P1','层次混合','R03','初始化类别','可考虑 explicit 构造',[['R07','构造函数与成员初始化']], '第一张类别表以构造选择和 explicit 解释形式，读者尚未认识构造函数。', '先讲整数初值、赋值与常用写法，再归纳形式；类构造差异接到样稿02。'],
['A08','P2','例子硬依赖','R03','initializer_list 与构造选择','列出多个 `unique_ptr`',[['R08','std::move'],['R09','unique_ptr 构造与访问'],['R13','vector 的插入、删除与替换']], '初始化列表的限制一次依赖独占所有权、不可复制、移动和原位添加。', '数量与列表的正常差异放到容器构造；不可复制元素的限制在移动、智能指针和容器之后展开。'],
['A09','P1','先修循环','R03','auto','auto&& reference',[['R05','左值引用与右值引用'],['R08','转发引用与引用折叠']], 'auto 首例同时使用引用和转发规则，而引用节又将初始化作为先修。', '按值 auto 先教；auto& 在最小引用定义后教；auto&& 在模板推导与值类别之后教。'],
['A10','P1','先修循环','R03','decltype 与 decltype(auto)','按[值类别]',[['R04','值类别'],['R05','左值引用与右值引用']], '完整 decltype 依赖值类别与引用，R04 又把整个 R03 列为先修。', '先给未加括号名字的查询；括号名字用局部左值定义桥接，完整三类及返回借用规则稍后展开。'],
['A11','P1','先修循环','R04','值类别','int&& rr = 8;',[['R05','左值引用与右值引用'],['R08','std::move']], '值类别例要读懂右值引用、move、decltype 和类型断言，引用节又以值类别为整节先修。', '最小左值/计算结果模型支撑基本引用；将五类关系及 move/type_traits 机制例放到引用与移动基础之后。'],
['A12','P1','例子硬依赖','R05','nullptr 与可选借用','if (value != nullptr)',[['R06','if 与 else'],['R06','函数声明、定义与调用']], '可选借用的首个实际操作要用条件与函数，而控制语句正式入口在后面的 R06。', '普通条件、循环与按值函数进入基础主线；之后再扩展可选指针参数。单个首例函数预览不等于完整控制流已教。'],
['A13','P2','例子硬依赖','R05','返回借用与非拥有成员','struct Owner { std::string text; };',[['R07','数据成员、成员函数与 const'],['R12','std::string']], '返回成员借用的例子依赖类成员和字符串接口；整节先修未指出所需的局部模型。', '基础借用先用整数；成员借用例接到简单类之后，若保留字符串则就地说明类型与 size/data 所需接口。'],
['A14','P2','例子硬依赖','R06','std::invoke','&Counter::add',[['R07','数据成员、成员函数与 const'],['R10','模板参数类别']], '普通语句与函数中，成员调用组合例提前使用类成员指针，接口摘要还采用转发及参数包。', '普通函数与局部 lambda 先学；成员指针 invoke 例放到类之后，复杂接口摘要在正常调用之后供查阅。'],
['A15','P1','节内逆序','R07','运算符重载与 friend','explicit Distance(int n)',[['R07','构造函数与成员初始化']], '重载例中的构造函数及成员初始化出现在本节正式构造函数说明之前。', '调整为类成员→构造→析构→基本复制→运算符重载；保留原正常值语义例。'],
['A16','P2','节内逆序','R07','构造与销毁顺序','最派生类',[['R07','组合与继承'],['R07','虚函数、override 与 final']], '对象构造顺序从虚基类和最派生类开始，继承与多态在后面的条目才展开。', '先讲普通成员的声明顺序与逆序销毁；完整基类顺序在组合、继承及相关对象模型之后。'],
['A17','P2','例子硬依赖','R07','切片、克隆与外部表示','std::unique_ptr<Cloneable>',[['R09','unique_ptr 构造与访问']], 'clone 的拥有者返回值需要智能指针；这又是后面以类与移动为先修的资源节内容。', '简单切片可先解释，拥有者 clone 接口移到 unique_ptr 基础之后，不将它作为掌握类的门槛。'],
['A18','P1','先修循环','R08','移动构造与移动赋值','auto source = std::make_unique<int>(42);',[['R09','unique_ptr 构造与访问']], '移动基础用尚未定义的智能指针展开释放责任，智能指针入口又要求已学移动。', '先教独占拥有者的建立、借用和清理，再就地介绍这种类型的责任转交；完整移动规则继续集中维护。'],
['A19','P1','先修循环','R08','转发引用与引用折叠','template<class T> void f(T&&)',[['R10','函数模板'],['R10','模板实参推导']], '转发引用需要函数模板推导，而模板节入口反过来要求先修转发。', '把函数/类模板的基本语法从完整泛型机制中拆出，先于转发；转发只作为高级包装接口的先修。'],
['A20','P1','节内逆序','R09','RAII 资源对象','std::unique_ptr<int[]> data;',[['R09','unique_ptr 构造与访问'],['R09','unique_ptr 数组与删除器'],['R09','make_unique、make_shared 与 allocate_shared']], '解释 RAII 的第一个例子组合了后面才教的 unique_ptr、数组与工厂。', '用已懂的构造析构先观察自动清理，再定义所有权、动态资源及 scalar unique_ptr；数组随后展开。'],
['A21','P1','入口过度先修','R10','模板与编译期编程','[转发]',[['R08','转发引用与引用折叠']], '最简单函数模板不需要转发，但节首整节先修使模板基础与转发构成双向门槛。', '基础模板入口只需要类型、普通函数与简单类；推导/包装接口再分别依赖引用、值类别及转发。'],
['A22','P2','入口过度先修','R11','错误处理与异常安全','[移动]',[['R08','拷贝与移动操作分类'],['R09','RAII 资源对象']], '基本 throw/try/catch 不要求完整移动规则；整节先修会让 RAII 中所需的最小异常认识过于昂贵。', '异常基本流程在普通函数后可以单独进入；栈展开接构造析构与 RAII，强保证再接容器与移动。'],
['A23','P2','例子硬依赖','R11','暂存与强保证提交','target.swap(staged);',[['R13','std::vector'],['R13','vector 的插入、删除与替换']], '强保证提交例要理解尚未正式展开的 vector 复制、追加与交换，而容器又使用异常保证。', '先给基本失败表示与清理；容器正常操作后再读完整暂存提交机制，不把它设为使用容器的共同先修。'],
['G01','P2','导航逆序','guide','阶段一：写出并解释一个小程序','遇到类型疑问回查',[['R02','基础类型分类'],['R03','初始化类别']], '指南从 R01 跳到初始化类别，把类型降为疑问回查；R03 入口却要求 R02，且当前目标是复杂类别表。', '阶段一显式安排最小类型、变量、整数初始化，然后常用表达式、分支循环与普通函数；避免要求全文 R02。'],
['G02','P1','导航逆序','guide','阶段二：管理对象、借用和资源','[返回借用]',[['R05','指针声明、取址与解引用'],['R07','class、struct 与访问控制']], '阶段二直接从左右值引用进入返回成员借用，既跳过指针基本操作，也在简单类之前进入 Owner 成员例。', '改为指针/基本引用→简单类与构造析构→成员借用→资源清理→独占拥有者→基本转交；栈展开需要最小异常桥接。'],
['L01','P1','例子硬依赖','R13','vector 的构造与初始化','values.begin() + 1',[['R15','std::begin 与 std::end'],['R15','半开区间与尾后位置']], '容器先使用位置、区间构造、插删与迭代器递增，读者尚未建立位置及尾后模型。', 'vector 首先展示默认/列表/下标/追加；在首个区间或位置参数之前补 begin/end、*it、++it 和有效偏移。'],
['L02','P1','先修循环','R15','迭代器与 ranges','借用与容器失效先修',[['R13','vector 的失效与异常保证']], '迭代器入口要求容器失效，而失效表本身需要迭代器模型；指南也把失效放在半开区间前。', '位置基础只依赖数组与借用；容器修改后再学类型特定失效，类别/ranges 留在后续泛型能力层。'],
['L03','P1','入口过度先修','R14','关联容器与容器适配器','区间和迭代器先修见',[['R15','半开区间与尾后位置'],['R16','比较器与谓词']], '当前关联容器排在迭代器及比较器之前，实际区间循环需要这两类基础。', '首次路线先学最小迭代器；在首个 set 前给默认排序及键等价的最小解释，不要求全部算法。'],
['L04','P1','例子硬依赖','R14','std::multiset','range.first',[['R17','std::pair']], 'pair 的 first/second 用于范围边界，map 元素又用 second，而 pair 的具体成员入口在 R17。', '首次使用前解释 pair 保存两项及成员名；区分映射键值与区间端点，完整工具类型仍集中维护。'],
['L05','P2','节内逆序','R13','操作成本','尾部摊还 O(1)',[['R13','复杂度与额外空间']], '成本表先使用 O 与摊还，增长上界和计量单位的共同定义在后文。', '把复杂度最小解释前置到第一张成本表；成本比较本身仍在正常操作后供选型。'],
['L06','P2','层次混合','R15','比较与导航成本','分区前提成立时',[['R16','二分查找的分区条件']], '导航能力比较先借 lower_bound 及分区解释成本，正式算法前提稍后才展开。', '首个导航比较用 next/distance；二分成本移到分区定义之后，或保留精确的后查入口。'],
['L07','P2','节内逆序','R19','std::chrono::steady_clock','duration_cast<std::chrono::microseconds>',[['R19','duration_cast、time_point_cast 与舍入']], '取时间差的首例同时使用后面才定义的单位转换。', '首例只观察 elapsed；定义指定单位转换后再取微秒计数，或者就地补其最小用途。'],
['L08','P1','定义定位与桥接','R33','std::endian 与 std::byteswap','little/big/native',[['R02','sizeof、alignof 与对象表示'],['R24','字节序与字段编码']], '入口把对象表示指向 R24，正式定义在 R02；大小端枚举需要 R24 的字节序意义。', '对象表示回链 R02；在 endian 前给多字节值的字节排列及一个最小例，完整编码留 R24。'],
['L09','P2','定义缺口候选','R17','variant 的修改与 visit','std::decay_t<decltype(x)>',[['R10','if constexpr 与 static_assert']], 'visit 首个实际例同时使用未展开的 decay_t 与编译期分支；不是简单的名称预告。', '首例用共同可调用操作；异型转字符串例在类型特征之后展开，或就地解释去引用与顶层 const。','候选补定义'],
['L10','P2','定义缺口候选','R35','path 的规范化与输出','解析符号链接',[], '规范化、状态查询和递归条件需要区分链接与目标；正文未找到符号链接的概念定义。', '在 canonical/status 前说明符号链接保存另一名称，区分查询链接本身与跟随目标。','候选补定义'],
['L11','P2','定义缺口候选','R19','std::chrono::time_point','纪元',[], 'time_point 的初始化结果用纪元解释，但正文没有建立计时零点的最小定义；ratio 也只以名称出现。', '补纪元是时钟计时零点、单调性是读数不倒退、ratio 是编译期有理数刻度；不扩成整节模板先修。','候选补定义'],
['S01','P3','已化解预告','R21','std::mutex','std::lock_guard<std::mutex>',[['R21','std::lock_guard']], '独立复核确认例后已解释作用域释放、同锁保护和 RAII；后面的完整接口不是理解首例的必要前置。', '保留例子，按需加完整条目回链；不得计为确认依赖问题。','复核排除'],
['S02','P2','局部定义桥接','R21','std::scoped_lock','死锁',[], '循环等待已出现，但 scoped_lock 的价值以死锁表述，缺少术语与已有情形的对应。', '首次使用死锁时给循环等待导致无法继续的最小例，保留只处理取得阶段的边界。'],
['S03','P1','导航逆序','R22','数据竞争与 happens-before','至少一方非原子',[['R22','原子对象与操作类别']], '指南先深链到数据竞争，再跳 std::atomic，两次都绕过原子操作类别定义；判定条件却依赖非原子的意义。', '入口先补原子/非原子最小区别，或改指南深链；保留先问题后工具的教学目标。'],
['S04','P2','节内逆序','R22','原子等待与通知（C++20）','release',[['R22','内存序'],['R22','release/acquire 发布']], 'C++20 等待条目提前以 release/acquire 规定普通数据发布条件，而完整内存序解释在后面。', '发布机制例接在内存序之后；基础等待先使用默认序并明确通知不能代替条件。'],
['S05','P2','局部定义桥接','R25','Linux/POSIX：创建、执行与回收进程','async-signal-safe',[], '平台 fork 限制中的函数集合没有就地含义，影响受限路径正确使用；它是后查项内部的必要条件。', '在 fork 后 exec 前的语境解释 POSIX 允许调用的受限函数集合，并提供平台资料入口。'],
['S06','P2','局部定义桥接','R25','Linux/POSIX：mmap 与 munmap','打开的 fd',[['R26','系统调用与打开文件实体']], '映射 API 要区分路径、打开句柄、映射和视图，但 fd/HANDLE 的资源实体到下一节才正式解释。', '平台映射前分别定义 fd 与不透明 HANDLE 的最小用途；打开关闭和完整 API 留 R26，不交换两节。'],
['S07','P3','已有前置定义','R27','符号与名称修饰','ABI',[['R02','整数类型的大小与范围'],['R27','ABI 与所有权边界']], '独立复核确认 R02 已定义 ABI；R27 的后文是深化，不是第一次定义。', '全书顺读保留；独立查阅可增加回链，不计为确认依赖问题。','复核排除']
];
function locate(id, title, evidence) {
  const m = records.get(id); if (!m) throw new Error('Missing source ' + id);
  const h = m.headings.find(h => h.title === title); if (!h) throw new Error('Missing heading ' + id + ': ' + title);
  const lines = m.text.replaceAll('\r', '').split('\n');
  const start = lines.findIndex(l => /^#{1,3} /.test(l) && l.replace(/^#{1,3} /, '') === title);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (new RegExp('^#{1,' + h.level + '} ').test(lines[i])) {end = i; break;}
  const offset = evidence ? lines.slice(start, end).findIndex(l => l.includes(evidence)) : 0;
  if (offset < 0) throw new Error('Missing evidence ' + id + ': ' + evidence);
  const line = start + offset + 1;
  return {sourceId: id, source: m.source, heading: title, headingLine: start + 1, line, fragment: h.slug, evidence: evidence || null};
}
const findings = rows.map(([id, priority, kind, sourceId, title, evidence, targets, reason, action, status]) => ({id, priority, kind, status: status || '需处理', location: locate(sourceId, title, evidence), targets: targets.map(([id, h]) => locate(id, h)), reason, action}));
// One full-read coverage record for every source section, including sections with no confirmed problem.
const coverageNotes = {
R01:['类型名字、基本表达式、输出预览','基本构建可进入；链接/ODR例外密度较高','保留首个程序与多文件普通组织，拆出复杂规则。'],
R02:['变量、基础类型','对象基础与手工存储机制混在同节','数组先只讲元素；对象表示与重用后置。'],
R03:['基础类型、变量','构造、引用、值类别及移动依赖集中','按样稿01拆基础写法与后续机制。'],
R04:['整数初值、常用表达式','普通运算清楚；值类别例先修过密','普通算术逻辑先进入；引用和三类完整模型分层。'],
R05:['基础初始化、指针操作、简单条件函数','简单解引用可读；数组/临时/成员例需要额外基础','基本引用不以前置全部值类别为门槛。'],
R06:['常用表达式、基本条件','普通控制流清楚；成员可调用组合偏早','分开普通函数、局部lambda与类相关回调。'],
R07:['简单类、成员、基本引用函数','重载及完整子对象顺序早于其本节定义','构造析构前置；多态拥有者clone稍后接资源。'],
R08:['类、引用、最小值类别','智能指针与转发模板形成跨节循环','独占责任的具体移动与完整泛型规则分别进入。'],
R09:['构造析构、指针、最小异常','RAII 首例尚未教其使用的管理工具','按样稿02先观察清理，再介绍拥有者。'],
R10:['普通函数、简单类','基础函数模板明确；先修转发过宽','基础模板只需函数；泛型包装再要求转发。'],
R11:['普通函数、构造析构','异常流程完整；强保证例需要后续容器','基本失败与清理先进入；提交机制后查。'],
R12:['引用、生命周期、const、基本复制','拥有者→视图→范围顺序基本充分','保留；关联键和异步只作为有条件预告。'],
R13:['基本容器、引用、对象寿命','位置操作与失效先于迭代器模型','按样稿03解除循环；复杂度解释先于成本表。'],
R14:['最小迭代器、比较与pair','先修指向后续；pair成员未先解释','先位置与键等价，补pair两成员。'],
R15:['数组、借用、最小容器','位置首例清楚；容器失效不应作为基础门槛','基础区间先于失效；导航比较别提前引入二分。'],
R16:['有效区间、迭代器能力、lambda','比较器先定义，整体可保留','跳读lower_bound时一并进入分区前提。'],
R17:['初始化、借用、异常、基本移动','pair/optional等入口清楚；visit首例元编程密','保留顺序；降低visit首例的额外负担。'],
R18:['字符区间、状态返回、字符串','解析候选、结果状态与完整消费明确','保留；基础解析无需完整系统错误机制。'],
R33:['基本数值、对象表示','位工具的对象表示回链与端序桥接需调整','R02承担对象表示；endian前给最小字节排列。'],
R19:['数值类型、时长时点','主线合理；单位转换先用后教','先elapsed再换单位，补纪元与刻度。'],
R34:['字符串、条件循环、RAII','流状态→文件读写→定位顺序成立','保留；持久化机制是后查。'],
R35:['error_code、迭代器、文件','遍历就地条件充分；符号链接概念缺口候选','保留；在跟随链接操作前解释链接与目标。'],
R20:['函数lambda、基本移动、RAII、异常','线程→结果状态→future/async链清楚','保留；共享保护接R21，平台取消后查。'],
R21:['对象寿命、RAII、线程','就地共同同步规则已化解对R22的依赖','保留锁例的最小解释；补死锁术语映射。'],
R22:['线程、锁、原子操作类别','整节顺读基本成立；指南跳过原子定义','调整深链；release/acquire先于发布等待组合。'],
R23:['所有权、future、锁与队列','执行器/任务/就绪完成就地定义充分','保留与平台API分层，不报导航回环为循环。'],
R24:['对象、数组、容器、原子正确性','硬件模型和语言保证划界清楚','保留；页表与ABI深化可后查。'],
R25:['对象、指针、线程、资源','进程/映射主线清楚，平台实体有局部缺口','mmap前补fd，Windows前补HANDLE及受限调用语境。'],
R26:['RAII、错误表示、文件实体','fd/HANDLE、短读写、就绪完成就地充分','保留；与映射/调度是职责回查。'],
R27:['声明定义、翻译单元、基础ABI、资源','主体可保留；ABI前置已在R02成立','排除首次定义指控，独立查阅可加回链。'],
R28:['字节、字节序','协议层逐步建立，socket API后置合理','保留协议→平台操作顺序。'],
R29:['协议、错误、资源、就绪完成','短收发→分帧→背压→期限依赖成立','保留；更详细接口覆盖另行处理。'],
R30:['多文件构建、符号库ABI','target与交付链成立','保留；CMake与二进制回查不是先修循环。'],
R31:['基本构建、函数循环、array/optional','基础会话可进入，现场工具层次明确','保留；完整工具组合按任务选读。'],
R32:['算法、时间、缓存、内存I/O指标','指标→测量→对照→剖析链成立','保留；线程/连接调查是导航回查。']
};
const coverage = model.chapters.map(c => {
  const note = coverageNotes[c.id]; if (!note) throw new Error('Unreviewed source ' + c.id);
  return {id: c.id, number: c.number, title: c.headings[0].title, source: c.source, lines: c.text.replaceAll('\r','').split('\n').length, headings: c.headings.length, readScope: '全文', prerequisites: note[0], assessment: note[1], recommendation: note[2], findingIds: findings.filter(f=>f.location.sourceId===c.id).map(f=>f.id)};
});
if (coverage.length !== 35 || new Set(coverage.map(c=>c.id)).size !== 35 || Object.keys(coverageNotes).length !== 35) throw new Error('Coverage mismatch');
const statusCounts = {};
for (const f of findings) statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
const audit = {date:'2026-10-10', scope:{chapters:7, sections:35, readingGuide:true, purpose:'首次学习所需概念、例子与导航依赖；不代替全书技术勘误或真实读者实验'}, classification:{P1:'基础路径阻塞或循环，优先处理',P2:'局部桥接、过量先修或例子密度，随后处理',P3:'已化解或独立查阅增强，不计确认问题'}, statusCounts, sourceBaseline:'source-baseline.json', coverage, findings};
await fs.writeFile(path.join(root,'dependency-audit.json'),JSON.stringify(audit,null,2)+'\n','utf8');
const link = loc => '[' + loc.sourceId + ' · ' + loc.heading + '](' + '../../' + loc.source.replaceAll('\\','/') + '#' + loc.fragment + ')';
let report = '# 全书学习依赖审查\n\n2026-10-10。审查对象为当前 C++ 与计算机基础图解参考手册 v0.2 的7章35节，以及首次学习指南。R编号是稳定源ID，实际章、节编号来自当前catalog。\n\n主要断点集中在语言基础、所有权与泛型、容器位置三个区域。需要按概念与具体操作拆先修，而不是把全部前向引用改成后向引用。后半本书的协议、系统与工具主线多可保留。\n\n## 覆盖与判断边界\n\n35个源节已逐节阅读全文，核对问题所指向的定义落点；记录包含段落、代码、图的相关概念与导航路径。概念首次提及、足以使用的最小解释、完整机制定义分别判断。图若只是机制概览、文字已限定范围，不自动要求先掌握图中所有后续实体。\n\n本轮形成'+findings.length+'条审查记录：'+statusCounts['需处理']+'条需处理，'+statusCounts['候选补定义']+'条定义缺口候选，'+statusCounts['复核排除']+'条经复核排除。候选项需要在推广修订时决定首次学习是否覆盖，不冒充已有后文定义。P1/P2是编辑优先级，不是代码缺陷等级。记录不代表整本书所有概念已逐项建成完备图，也不等于实测读者一定能独立掌握。\n\n审查按[编辑规范](../../EDITORIAL-SPEC.md)和[技术文章与书稿风格规范](../../../../../docs/technical-article-style.md)进行；正文未替换，目录、索引和公共样式未改。43个现有源稿及结构/样式文件的初始哈希保存在[source-baseline.json](source-baseline.json)，再生成本报告时核对未变。\n\n## 优先处理的依赖链\n\n| 当前回环或断点 | 基础路径的拆解 | 样稿验证范围 |\n| --- | --- | --- |\n| 初始化/auto/decltype ↔ 引用与值类别 | 整数初始化与按值auto → 基本引用 → 局部左值/decltype → 完整值类别与转发 | 样稿01给出前3步；完整高级规则保留后续去向 |\n| 类初始化 ↔ 构造函数 | 基础类型正常写法 → 简单类 → 构造 → explicit与初始化差异 | 样稿01回链样稿02的具体解释 |\n| 移动 ↔ unique_ptr；RAII首例依赖未教工具 | 自动析构 → 资源责任 → unique_ptr建立与借用 → 具体责任转交 → 完整移动规则 | 样稿02先教当前工具，再用它解释转交 |\n| 转发 ↔ 模板 | 普通函数 → 基础函数/类模板 → 推导与引用 → 转发包装 | 本轮给迁移建议，未写第四组样稿 |\n| 容器 ↔ 迭代器失效 | 基本vector → 长度容量 → 位置与区间 → 插删 → 失效 → 算法 | 样稿03连续展示；不要求先背失效表 |\n| 失败清理 ↔ 完整异常安全与容器提交 | 最小异常流程 → 析构清理 → 容器操作 → 强保证提交 | 样稿02解释最小异常；强保证后查 |\n\nR21→R22不是未解循环：R21已就地说明共享可变状态的共同规则。R23↔R26、R25↔R26、R27↔R30、R31↔R32的多数回链分别是抽象/平台或调查分工；只有实际操作缺失的局部实体需要补足。\n\n## 建议的首次学习路线\n\n这是一条按条目进入的路线，不是整节重排决定。每一阶段先安排能支撑后续操作的最小知识，完整规则由唯一维护位置提供。\n\n1. R01首个程序与构建 → R02基础类型和变量 → R03整数初始化与按值auto → R04常用算术/比较/逻辑 → R06条件、循环、普通函数。\n2. R05基本指针与左值引用 → R02局部对象生命周期 → R07简单类、成员、构造析构 → R05成员借用 → R09动态资源和独占拥有者 → R08最小转交 → R11最小异常与清理。\n3. R12拥有字符串 → R13 array/vector基本构造、访问与容量 → R15最小位置和半开区间 → R13插删与对应失效 → R16基本查找/排序及比较前提 → R14关联容器；pair的两项模型在第一次使用前补齐。\n4. R20线程与结果 → R21共同同步、锁与谓词等待 → R22原子/非原子最小区别、数据竞争、基本原子 → 完整内存序 → R23异步调度。\n5. 按任务进入数值、时间、流、文件系统、机器、进程、网络、构建、调试与性能；位工具的端序、映射的fd/HANDLE等必要实体就地补足。\n\n模板基础可以在普通函数与简单类之后进入；转发和类型特征在引用、值类别之后展开。它们不应成为先用string/vector保存数据的共同门槛。允许轻量预告，要求例子使用前所需规则就地成立。\n\n## 逐节全文覆盖\n\n| 当前节与源ID | 入口评价 | 处理建议 |\n| --- | --- | --- |\n';
for (const c of coverage) report += '| '+c.number+' '+c.title+'（'+c.id+'） | '+c.assessment+' | '+c.recommendation+' |\n';
report += '\n## 逐项问题与处理建议\n\n每项定位使用真实标题和本轮源行号。行号随后续编辑会变，标题/源ID是维护定位；完整机器记录还包含定义目标锚点与原句片段。\n';
for (const [title, prefix] of [['语言与对象','A'],['阅读指南','G'],['标准库与数据','L'],['并发与系统','S']]) {
  report += '\n### '+title+'\n';
  for (const f of findings.filter(f=>f.id.startsWith(prefix))) {
    report += '\n#### '+f.id+' '+f.location.heading+'\n\n'+f.priority+' · '+f.kind+' · '+f.status+'。位置：'+link(f.location)+'，源行'+f.location.line+'。\n\n';
    report += '原文定位：`'+f.location.evidence.replaceAll('`','')+'`。'+f.reason+'\n\n';
    report += (f.targets.length?'定义落点：'+f.targets.map(link).join('；')+'。\n\n':'未找到可供回查的正文定义；应补局部模型，不虚构后文已教。\n\n');
    report += '处理：'+f.action+'\n';
  }
}
report += '\n## 可保留的衔接\n\n- R01首个程序就地解释函数声明、输出与main；输出流全部机制无需前置。\n- R12先拥有string，再讲string_view借用和寿命；容器/异步引用多是应用预告。\n- R13 reserve/resize用实际元素状态区分空间与长度，是可复用的正例。\n- R16在排序前定义比较器；二分分区条件有独立解释，跳读时需一起进入。\n- R17 optional<bool>把存在状态与值真假分开；R18把解析候选与提交分开，均可保留。\n- R21共同同步规则先于完整内存模型；锁管理器早期例已有足够的清理解释。\n- R23先定义就绪/完成，再由R26给平台API；R28协议先于R29 socket，宏观顺序成立。\n- R31/R32的调查互链服务于不同现场问题，不需要为了消除箭头而交换章节。\n\n## 样稿与实施边界\n\n三组正文见[样稿入口](README.md)，内容保留/迁移去向见[迁移对照](migration-plan.zh-CN.md)。样稿只验证局部基础链，不覆盖原节的全部接口、特殊条件与高版本扩展；未展示的知识有明确保留去向，不当作删除建议。\n\n样稿经两名只读审查助手复核，我负责整合。标准库审查使用gpt-6.1-sol/high，系统审查使用gpt-5.6-sol/high，均fork_turns=none。复核后排除了S01、S07，简化了强制重分配示例，补足迭代偏移边界与移动借用的适用范围。\n\n未编译或运行任何C++例子。新例的语义做静态与C++17匹配资料核对，来源存于[references.json](references.json)。HTML/PDF、链接、字体及页图检查单独记录在[验证记录](verification.zh-CN.md)，不与代码执行混写。下一阶段才能把通过评审的基础组织推广到正式源稿。\n';
await fs.writeFile(path.join(root,'dependency-audit.zh-CN.md'),report,'utf8');
console.log(JSON.stringify({coverage:coverage.length,findings:findings.length,statusCounts,unchangedReviewedFiles:baseline.files.length}));
