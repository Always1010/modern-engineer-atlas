# 样稿覆盖与内容迁移对照

本表是推广修订前的编辑设计，不是已经执行的正文迁移。正式35节、阅读指南、索引和代码附件仍保持原状。未被样稿展开的知识继续保留在当前源节；下表指定学习落点，后续只改变进入时机或基础解释，不据此删去接口、特殊条件或版本信息。

## 三组样稿的边界

| 样稿 | 本轮已写出的基础链 | 继续保留的完整规则 |
| --- | --- | --- |
| 初始化与类型推导 | 初值/赋值、整数写法、局部int、窄化首例、auto、const、引用、名字及括号名字的decltype | 类构造选择、完整窄化、聚合、auto&&、decltype(auto)返回、常量求值、静态初始化 |
| 对象生命周期与RAII | 局部对象/借用、简单struct、构造析构、explicit、清理责任、单对象new/delete、unique_ptr/get/具体移动、最小异常展开 | 特殊成员、继承多态、完整移动与转发、共享所有权、数组删除器、手工重用、分配器、完整异常安全 |
| 容器与迭代器 | vector<int>、长度容量、范围for、begin/end、区间、位置插删、成功操作失效、find | 其他顺序/关联容器、完整接口、类型相关异常保证、类别及适配器、完整算法条件、C++20 ranges |

三组之间仍有明确的基础先修：样稿02之前还需指针取址/解引用、普通函数、局部块；样稿03之前还需数组下标、if、普通for和范围for。样稿01不承担这些教学，三组组合也不冒充从零覆盖全部C++基础。正式推广时应先补齐其间桥接条目。

## 概念进入时机

| 概念 | 第一次给出的最小意义 | 首次实际使用 | 完整规则去向 |
| --- | --- | --- | --- |
| 初始化 | 建立新对象状态 | 样稿01的count | R03初始化类别及各形式 |
| 类构造 | 建立类对象时初始化成员 | 样稿02的Record | R07构造，随后回到R03类初始化差异 |
| 引用 | 同一对象的别名 | 样稿01的int& alias | R05绑定、临时及寿命 |
| 左值 | 本例表达式标识已有对象 | 样稿01的decltype((source)) | R04完整值类别，接引用与移动 |
| 借用 | 访问别处保活的对象 | 样稿02的borrowed | R05返回借用；各容器类型的失效规则 |
| 析构 | 销毁类对象时执行清理 | 样稿02的Record/Active | R07析构与子对象顺序，R11终止边界 |
| RAII | 取得资源与管理对象初始化连接、销毁时释放 | 样稿02的资源责任和unique_ptr | R09管理器、删除器、共享状态 |
| move | 允许后续按类型规则接收源状态 | 样稿02移动unique_ptr | R08值类别、重载及类型特定状态 |
| 异常/栈展开 | 失败传向匹配处理器，销毁已建立自动对象 | 样稿02的Active/try | R11构造失败、传播与安全保证 |
| 容量 | 不重分配可容纳的数量 | 样稿03的reserve/resize | R13扩容、分配与异常条件 |
| 迭代器/尾后 | 访问位置及结束位置 | 样稿03的begin/end、*it | R15类别、适配器与ranges |
| 失效 | 旧位置不能继续用于原访问 | 样稿03的clear/erase | R13及R14各类型完整保证 |
| 算法返回位置 | 在有效区间中查找，失败返回last | 样稿03的find | R16谓词、排序/二分/堆等前提 |

这些最小解释允许复现于例子入口，但完整规则只维护一处。前向引用如果只是告知后续用途，可以保留；如果当前判断或代码操作依赖它，必须在使用之前给足当前范围的意义和条件。

## 受影响条目的逐项保留去向

下表覆盖直接承接三组样稿的10个源节的所有二级、三级标题。没有展开的条目仍有原始维护位置；点击标题可回到现有内容。其他25节的处理按[全书审查](dependency-audit.zh-CN.md)逐节表和具体记录执行，完整内容默认保留。

### R02 类型与对象

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [基础类型分类](../../chapters/R02-types-objects.zh-CN.md#基础类型分类) | 首次学习变量之前；样稿01将int/double列作先修。 |
| [整数类型的大小与范围](../../chapters/R02-types-objects.zh-CN.md#整数类型的大小与范围) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [字符、布尔与空指针类型](../../chapters/R02-types-objects.zh-CN.md#字符布尔与空指针类型) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [浮点类型](../../chapters/R02-types-objects.zh-CN.md#浮点类型) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [类型性质查询与定宽整数](../../chapters/R02-types-objects.zh-CN.md#类型性质查询与定宽整数) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [枚举类型](../../chapters/R02-types-objects.zh-CN.md#枚举类型) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [数组与类型别名](../../chapters/R02-types-objects.zh-CN.md#数组与类型别名) | 元素/下标先进入；衰变、数组指针与整个数组引用在基本借用之后。 |
| [存储期、对象生命周期与作用域](../../chapters/R02-types-objects.zh-CN.md#存储期对象生命周期与作用域) | 局部对象部分接样稿02；静态、线程与动态存储期仍在本条目完整维护。 |
| [常见进程存储区域](../../chapters/R02-types-objects.zh-CN.md#常见进程存储区域) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [sizeof、alignof 与对象表示](../../chapters/R02-types-objects.zh-CN.md#sizeofalignof-与对象表示) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [类型特征与字节复制](../../chapters/R02-types-objects.zh-CN.md#类型特征与字节复制) | 简单类、类型特征、静态断言之后，继续维护平凡可复制条件。 |
| [placement new 与存储重用](../../chapters/R02-types-objects.zh-CN.md#placement-new-与存储重用) | 构造析构、指针、new/delete及对齐之后；保留显式销毁和存储重用规则。 |
| [对象复制与序列化](../../chapters/R02-types-objects.zh-CN.md#对象复制与序列化) | 继续保留在类型与对象的规则入口；基础类型先进入，存储机制后查；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [结构化绑定](../../chapters/R02-types-objects.zh-CN.md#结构化绑定) | auto、引用与简单类之后进入基础拆解；tuple协议和高级约束继续保留。 |

### R03 初始化与类型推导

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [初始化类别](../../chapters/R03-initialization-deduction.zh-CN.md#初始化类别) | 样稿01先用整数对照名称；完整分类表接构造基础之后。 |
| [默认初始化与值初始化](../../chapters/R03-initialization-deduction.zh-CN.md#默认初始化与值初始化) | 样稿01解释局部int/空列表；类对象与用户提供构造的完整差异继续维护。 |
| [直接初始化与拷贝初始化](../../chapters/R03-initialization-deduction.zh-CN.md#直接初始化与拷贝初始化) | 整数写法在样稿01；构造/explicit差异接样稿02，重载选择完整规则保留。 |
| [列表初始化与窄化](../../chapters/R03-initialization-deduction.zh-CN.md#列表初始化与窄化) | 样稿01解释浮点转整数；完整窄化条件与常量表达式豁免保留本条目。 |
| [initializer_list 与构造选择](../../chapters/R03-initialization-deduction.zh-CN.md#initializer_list-与构造选择) | 容器基本构造之后；不可复制元素部分还需移动、unique_ptr与插入基础。 |
| [聚合初始化与成员默认值](../../chapters/R03-initialization-deduction.zh-CN.md#聚合初始化与成员默认值) | 简单struct成员之后；聚合定义的版本差异仍完整维护。 |
| [auto](../../chapters/R03-initialization-deduction.zh-CN.md#auto) | 样稿01含按值、const与auto&；auto&&/列表特殊规则分别接引用推导和列表基础。 |
| [decltype 与 decltype(auto)](../../chapters/R03-initialization-deduction.zh-CN.md#decltype-与-decltypeauto) | 样稿01含名字与括号名字；完整三类推导、返回借用接值类别和函数返回。 |
| [推导返回类型](../../chapters/R03-initialization-deduction.zh-CN.md#推导返回类型) | 普通函数与auto之后；引用返回风险接借用生命周期。 |
| [const 与 constexpr](../../chapters/R03-initialization-deduction.zh-CN.md#const-与-constexpr) | 样稿01含const与副本；常量表达式及constexpr函数接普通函数与常量求值。 |
| [consteval 与 constinit](../../chapters/R03-initialization-deduction.zh-CN.md#consteval-与-constinit) | 保持C++20标识，接常量求值与静态初始化，不能从样稿中推断已覆盖。 |
| [静态初始化与局部 static](../../chapters/R03-initialization-deduction.zh-CN.md#静态初始化与局部-static) | 存储期、构造析构与必要线程认识之后完整维护。 |

### R05 指针与引用

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [指针声明、取址与解引用](../../chapters/R05-pointers-references.zh-CN.md#指针声明取址与解引用) | 样稿02之前先学；样稿02只复用这些操作，不替代其完整教学。 |
| [nullptr 与可选借用](../../chapters/R05-pointers-references.zh-CN.md#nullptr-与可选借用) | 普通if和函数之后；先明确无目标状态，再用可选参数。 |
| [左值引用与右值引用](../../chapters/R05-pointers-references.zh-CN.md#左值引用与右值引用) | 基本int&接样稿01；右值引用接最小值类别，完整绑定条件继续维护。 |
| [const 与多级指针](../../chapters/R05-pointers-references.zh-CN.md#const-与多级指针) | 继续保留在借用、指针与引用的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [数组区间与指针算术](../../chapters/R05-pointers-references.zh-CN.md#数组区间与指针算术) | 继续保留在借用、指针与引用的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [临时对象与寿命延长](../../chapters/R05-pointers-references.zh-CN.md#临时对象与寿命延长) | 继续保留在借用、指针与引用的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [返回借用与非拥有成员](../../chapters/R05-pointers-references.zh-CN.md#返回借用与非拥有成员) | 简单类、成员与函数返回之后；string例还需相应最小接口。 |
| [类型访问与配套例子](../../chapters/R05-pointers-references.zh-CN.md#类型访问与配套例子) | 继续保留在借用、指针与引用的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |

### R07 类与对象生命周期

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [class、struct 与访问控制](../../chapters/R07-classes-lifetime.zh-CN.md#classstruct-与访问控制) | 样稿02先给公开struct与成员；访问控制完整条目继续保留。 |
| [数据成员、成员函数与 const](../../chapters/R07-classes-lifetime.zh-CN.md#数据成员成员函数与-const) | 简单记录之后；const成员函数和隐含对象参数不由样稿替代。 |
| [运算符重载与 friend](../../chapters/R07-classes-lifetime.zh-CN.md#运算符重载与-friend) | 构造析构与基本值语义之后，不再先于构造解释。 |
| [构造函数与成员初始化](../../chapters/R07-classes-lifetime.zh-CN.md#构造函数与成员初始化) | 样稿02先解释普通成员初始化；委托、默认构造及完整选择继续维护。 |
| [析构函数](../../chapters/R07-classes-lifetime.zh-CN.md#析构函数) | 样稿02含自动销毁观察；虚析构、不抛清理等在相应基础之后完整维护。 |
| [特殊成员函数](../../chapters/R07-classes-lifetime.zh-CN.md#特殊成员函数) | 简单类和复制基础之后；默认/删除/隐式生成条件保留。 |
| [构造与销毁顺序](../../chapters/R07-classes-lifetime.zh-CN.md#构造与销毁顺序) | 普通成员顺序先讲；完整基类/虚基类顺序接组合继承与对象模型。 |
| [组合与继承](../../chapters/R07-classes-lifetime.zh-CN.md#组合与继承) | 继续保留在类与对象模型的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [虚函数、override 与 final](../../chapters/R07-classes-lifetime.zh-CN.md#虚函数override-与-final) | 继续保留在类与对象模型的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [抽象类与虚析构](../../chapters/R07-classes-lifetime.zh-CN.md#抽象类与虚析构) | 继续保留在类与对象模型的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [完整对象、子对象与多态实现](../../chapters/R07-classes-lifetime.zh-CN.md#完整对象子对象与多态实现) | 继续保留在类与对象模型的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [切片、克隆与外部表示](../../chapters/R07-classes-lifetime.zh-CN.md#切片克隆与外部表示) | 切片接继承；拥有者clone接unique_ptr；外部表示继续接序列化规则。 |
| [配套对象模型例子](../../chapters/R07-classes-lifetime.zh-CN.md#配套对象模型例子) | 继续保留在类与对象模型的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |

### R08 拷贝与移动

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [拷贝与移动操作分类](../../chapters/R08-copy-move.zh-CN.md#拷贝与移动操作分类) | 继续保留在复制、移动与转发的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [拷贝构造](../../chapters/R08-copy-move.zh-CN.md#拷贝构造) | 继续保留在复制、移动与转发的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [拷贝赋值](../../chapters/R08-copy-move.zh-CN.md#拷贝赋值) | 继续保留在复制、移动与转发的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [移动构造与移动赋值](../../chapters/R08-copy-move.zh-CN.md#移动构造与移动赋值) | 样稿02用已定义unique_ptr解释具体责任转交；用户类型特殊成员规则继续维护。 |
| [std::move](../../chapters/R08-copy-move.zh-CN.md#stdmove) | 样稿02含允许作为转交源的用途；完整类型转换与重载机制接值类别。 |
| [移动后状态与借用](../../chapters/R08-copy-move.zh-CN.md#移动后状态与借用) | 样稿02限定unique_ptr同一动态int；通用状态与借用规则继续按类型维护。 |
| [转发引用与引用折叠](../../chapters/R08-copy-move.zh-CN.md#转发引用与引用折叠) | 函数模板语法、推导、引用和值类别之后；解除模板基础先修转发的循环。 |
| [std::forward](../../chapters/R08-copy-move.zh-CN.md#stdforward) | 函数模板推导和引用折叠之后，保留包装接口与转交区别。 |
| [拷贝消除与返回对象](../../chapters/R08-copy-move.zh-CN.md#拷贝消除与返回对象) | 继续保留在复制、移动与转发的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [noexcept 与 move_if_noexcept](../../chapters/R08-copy-move.zh-CN.md#noexcept-与-move_if_noexcept) | 异常说明、复制移动与容器操作之后，保留退回复制与保证条件。 |

### R09 RAII 与内存管理库

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [RAII 资源对象](../../chapters/R09-raii-memory.zh-CN.md#raii-资源对象) | 样稿02先观察普通自动析构，再解释取得/释放责任；数组拥有者例后置。 |
| [new 与 delete](../../chapters/R09-raii-memory.zh-CN.md#new-与-delete) | 样稿02含单个动态int；数组、配对、失败与完整规则继续维护。 |
| [智能指针分类](../../chapters/R09-raii-memory.zh-CN.md#智能指针分类) | 样稿02只选独占拥有者；共享/弱引用模型各自单独展开。 |
| [unique_ptr 构造与访问](../../chapters/R09-raii-memory.zh-CN.md#unique_ptr-构造与访问) | 样稿02含make_unique/get/借用；构造重载、空状态和接口摘要保留。 |
| [unique_ptr 转移、reset 与 release](../../chapters/R09-raii-memory.zh-CN.md#unique_ptr-转移reset-与-release) | 移动基础接样稿02；reset/release完整契约保留，不混同get。 |
| [unique_ptr 数组与删除器](../../chapters/R09-raii-memory.zh-CN.md#unique_ptr-数组与删除器) | 单个对象独占责任之后，保留数组与自定义释放策略。 |
| [shared_ptr 构造、共享与访问](../../chapters/R09-raii-memory.zh-CN.md#shared_ptr-构造共享与访问) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [weak_ptr 构造、lock 与 expired](../../chapters/R09-raii-memory.zh-CN.md#weak_ptr-构造lock-与-expired) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [make_unique、make_shared 与 allocate_shared](../../chapters/R09-raii-memory.zh-CN.md#make_uniquemake_shared-与-allocate_shared) | 样稿02提前给scalar make_unique的最小用途；所有工厂完整条目仍集中维护。 |
| [控制状态、循环与并发](../../chapters/R09-raii-memory.zh-CN.md#控制状态循环与并发) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [enable_shared_from_this](../../chapters/R09-raii-memory.zh-CN.md#enable_shared_from_this) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [allocator 与 allocator_traits](../../chapters/R09-raii-memory.zh-CN.md#allocator-与-allocator_traits) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [memory_resource 与 polymorphic_allocator](../../chapters/R09-raii-memory.zh-CN.md#memory_resource-与-polymorphic_allocator) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [monotonic_buffer_resource 与池资源](../../chapters/R09-raii-memory.zh-CN.md#monotonic_buffer_resource-与池资源) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [配套所有权例子](../../chapters/R09-raii-memory.zh-CN.md#配套所有权例子) | 继续保留在资源与内存管理的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |

### R11 错误处理与异常安全

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [throw 与异常对象](../../chapters/R11-errors-exception-safety.zh-CN.md#throw-与异常对象) | 普通函数后可先学最小失败流程；样稿02给一组匹配try/catch。 |
| [try、catch 与重新抛出](../../chapters/R11-errors-exception-safety.zh-CN.md#trycatch-与重新抛出) | 样稿02仅含匹配处理；捕获次序、传播与重抛继续维护。 |
| [栈展开与构造失败](../../chapters/R11-errors-exception-safety.zh-CN.md#栈展开与构造失败) | 样稿02含已完成构造的自动对象清理；部分构造失败规则继续维护。 |
| [标准异常类型](../../chapters/R11-errors-exception-safety.zh-CN.md#标准异常类型) | 继续保留在失败表示与异常安全的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [noexcept 说明符](../../chapters/R11-errors-exception-safety.zh-CN.md#noexcept-说明符) | 继续保留在失败表示与异常安全的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [noexcept 运算符](../../chapters/R11-errors-exception-safety.zh-CN.md#noexcept-运算符) | 继续保留在失败表示与异常安全的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [析构与终止边界](../../chapters/R11-errors-exception-safety.zh-CN.md#析构与终止边界) | 继续保留在失败表示与异常安全的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [error_code 与状态返回](../../chapters/R11-errors-exception-safety.zh-CN.md#error_code-与状态返回) | 继续保留在失败表示与异常安全的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [错误表示比较](../../chapters/R11-errors-exception-safety.zh-CN.md#错误表示比较) | 继续保留在失败表示与异常安全的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [异常安全保证](../../chapters/R11-errors-exception-safety.zh-CN.md#异常安全保证) | 构造析构、资源责任、失败流程之后进入保证层次。 |
| [暂存与强保证提交](../../chapters/R11-errors-exception-safety.zh-CN.md#暂存与强保证提交) | vector复制/追加/swap与保证层次之后，保留完整提交机制。 |

### R13 顺序容器

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [顺序容器分类](../../chapters/R13-sequence-containers.zh-CN.md#顺序容器分类) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [操作成本](../../chapters/R13-sequence-containers.zh-CN.md#操作成本) | 基本操作之后比较选型；复杂度最小定义前置到第一张成本表。 |
| [复杂度与额外空间](../../chapters/R13-sequence-containers.zh-CN.md#复杂度与额外空间) | O记号、计量单位及摊还的最小解释先于成本表；完整比较留本条目。 |
| [std::array](../../chapters/R13-sequence-containers.zh-CN.md#stdarray) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [array 的初始化、访问与遍历](../../chapters/R13-sequence-containers.zh-CN.md#array-的初始化访问与遍历) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [array 的修改与失效](../../chapters/R13-sequence-containers.zh-CN.md#array-的修改与失效) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::vector](../../chapters/R13-sequence-containers.zh-CN.md#stdvector) | 样稿03只走int基础链；完整接口、限制与其他元素类型继续维护。 |
| [vector 的构造与初始化](../../chapters/R13-sequence-containers.zh-CN.md#vector-的构造与初始化) | 基础列表先讲；区间构造接begin/end与半开区间之后。 |
| [vector 的访问与遍历](../../chapters/R13-sequence-containers.zh-CN.md#vector-的访问与遍历) | 样稿03含下标、at与范围for；front/back/data的契约保留。 |
| [vector 的插入、删除与替换](../../chapters/R13-sequence-containers.zh-CN.md#vector-的插入删除与替换) | 样稿03含单位置insert/erase返回值；区间、原位与替换接口保留。 |
| [vector 的核心接口](../../chapters/R13-sequence-containers.zh-CN.md#vector-的核心接口) | 正常用例之后供查阅，摘要不充当基础学习的首个说明。 |
| [数量构造与初始化列表](../../chapters/R13-sequence-containers.zh-CN.md#数量构造与初始化列表) | 初始化与vector基础之后，保留数量/列表构造差异。 |
| [reserve 与 resize](../../chapters/R13-sequence-containers.zh-CN.md#reserve-与-resize) | 样稿03先区别容量与元素数量；默认值及增长契约继续维护。 |
| [动态数组扩容](../../chapters/R13-sequence-containers.zh-CN.md#动态数组扩容) | 容量与有效位置之后，继续维护重分配模型。 |
| [vector 的失效与异常保证](../../chapters/R13-sequence-containers.zh-CN.md#vector-的失效与异常保证) | 样稿03先定义位置再归纳int的成功操作失效；完整类型条件保留。 |
| [元素操作的异常保证](../../chapters/R13-sequence-containers.zh-CN.md#元素操作的异常保证) | 完整复制移动、异常层次之后，保持条件精度。 |
| [顺序容器的遍历删除](../../chapters/R13-sequence-containers.zh-CN.md#顺序容器的遍历删除) | erase返回位置及有效区间之后；erase-remove、C++20辅助等继续保留。 |
| [std::deque](../../chapters/R13-sequence-containers.zh-CN.md#stddeque) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [deque 的构造与操作](../../chapters/R13-sequence-containers.zh-CN.md#deque-的构造与操作) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [deque 的存储与失效](../../chapters/R13-sequence-containers.zh-CN.md#deque-的存储与失效) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::list](../../chapters/R13-sequence-containers.zh-CN.md#stdlist) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [list 的构造与常用成员](../../chapters/R13-sequence-containers.zh-CN.md#list-的构造与常用成员) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [list 的位置与 splice](../../chapters/R13-sequence-containers.zh-CN.md#list-的位置与-splice) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::forward_list](../../chapters/R13-sequence-containers.zh-CN.md#stdforward_list) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [forward_list 的构造与成员](../../chapters/R13-sequence-containers.zh-CN.md#forward_list-的构造与成员) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [forward_list 的前驱与 splice_after](../../chapters/R13-sequence-containers.zh-CN.md#forward_list-的前驱与-splice_after) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [元素地址与业务句柄](../../chapters/R13-sequence-containers.zh-CN.md#元素地址与业务句柄) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [拥有者与所指对象](../../chapters/R13-sequence-containers.zh-CN.md#拥有者与所指对象) | unique_ptr及容器位置之后；不把容器元素地址与动态目标地址混同。 |
| [典型现象与检查点](../../chapters/R13-sequence-containers.zh-CN.md#典型现象与检查点) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [参考资料](../../chapters/R13-sequence-containers.zh-CN.md#参考资料) | 继续保留在顺序容器的完整接口与操作契约入口；所需基础满足后进入。本轮样稿不替代这项规则。 |

### R15 迭代器与 ranges

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [std::begin 与 std::end](../../chapters/R15-iterators-ranges.zh-CN.md#stdbegin-与-stdend) | 样稿03先给vector成员begin/end；数组和非成员泛型入口继续维护。 |
| [半开区间与尾后位置](../../chapters/R15-iterators-ranges.zh-CN.md#半开区间与尾后位置) | 样稿03在位置操作前解释；完整合法区间规则继续维护。 |
| [迭代器类别与访问成本](../../chapters/R15-iterators-ranges.zh-CN.md#迭代器类别与访问成本) | 最小位置/区间模型之后，不作为vector首例共同先修。 |
| [比较与导航成本](../../chapters/R15-iterators-ranges.zh-CN.md#比较与导航成本) | 基本next/distance先比较；lower_bound成本接分区前提之后。 |
| [std::iterator_traits](../../chapters/R15-iterators-ranges.zh-CN.md#stditerator_traits) | 最小迭代器及模板类型查询之后。 |
| [std::advance、std::next、std::prev 与 std::distance](../../chapters/R15-iterators-ranges.zh-CN.md#stdadvancestdnextstdprev-与-stddistance) | 能力类别之后，完整负偏移/复杂度条件保留。 |
| [std::reverse_iterator](../../chapters/R15-iterators-ranges.zh-CN.md#stdreverse_iterator) | 正向半开区间之后，保留base与逆向访问差别。 |
| [插入迭代器](../../chapters/R15-iterators-ranges.zh-CN.md#插入迭代器) | 容器插入与算法输出之后，保留各适配器前提。 |
| [ranges 算法与投影](../../chapters/R15-iterators-ranges.zh-CN.md#ranges-算法与投影) | 保持C++20标识，接普通算法、可调用对象与最小range模型。 |
| [range、sentinel 与 borrowed_range](../../chapters/R15-iterators-ranges.zh-CN.md#rangesentinel-与-borrowed_range) | 保持C++20标识，接区间与借用生命周期，完整模型仍在此维护。 |
| [views 与惰性管线](../../chapters/R15-iterators-ranges.zh-CN.md#views-与惰性管线) | ranges基础之后，保留惰性求值、拥有/借用及寿命条件。 |
| [组合应用与参考资料](../../chapters/R15-iterators-ranges.zh-CN.md#组合应用与参考资料) | 继续保留在迭代器能力与ranges的完整规则入口；所需基础满足后进入。本轮样稿不替代这项规则。 |

### R16 算法库

| 当前条目（保留位置） | 首次学习或后续进入时机 |
| --- | --- |
| [比较器与谓词](../../chapters/R16-algorithms.zh-CN.md#比较器与谓词) | 排序/关联键前最小解释；完整严格弱序保留。 |
| [std::find、std::find_if 与计数](../../chapters/R16-algorithms.zh-CN.md#stdfindstdfind_if-与计数) | 样稿03含find返回位置与末端判断；谓词/计数接口继续保留。 |
| [std::all_of、std::any_of 与 std::none_of](../../chapters/R16-algorithms.zh-CN.md#stdall_ofstdany_of-与-stdnone_of) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::for_each](../../chapters/R16-algorithms.zh-CN.md#stdfor_each) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::copy、std::copy_if 与填充](../../chapters/R16-algorithms.zh-CN.md#stdcopystdcopy_if-与填充) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::transform](../../chapters/R16-algorithms.zh-CN.md#stdtransform) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::remove、std::remove_if 与 std::unique](../../chapters/R16-algorithms.zh-CN.md#stdremovestdremove_if-与-stdunique) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::sort 与 std::stable_sort](../../chapters/R16-algorithms.zh-CN.md#stdsort-与-stdstable_sort) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::min_element 与 std::max_element](../../chapters/R16-algorithms.zh-CN.md#stdmin_element-与-stdmax_element) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::nth_element 与 std::partial_sort](../../chapters/R16-algorithms.zh-CN.md#stdnth_element-与-stdpartial_sort) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::partition 与 std::stable_partition](../../chapters/R16-algorithms.zh-CN.md#stdpartition-与-stdstable_partition) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::lower_bound、std::upper_bound 与等价范围](../../chapters/R16-algorithms.zh-CN.md#stdlower_boundstdupper_bound-与等价范围) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [有序集合算法](../../chapters/R16-algorithms.zh-CN.md#有序集合算法) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [堆算法](../../chapters/R16-algorithms.zh-CN.md#堆算法) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [二分查找的分区条件](../../chapters/R16-algorithms.zh-CN.md#二分查找的分区条件) | 第一次lower_bound之前最小解释，完整反例及前提继续维护。 |
| [堆的结构与操作条件](../../chapters/R16-algorithms.zh-CN.md#堆的结构与操作条件) | 第一次堆算法之前最小解释；完整操作继续维护。 |
| [排序、选择与分区的结果差异](../../chapters/R16-algorithms.zh-CN.md#排序选择与分区的结果差异) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::accumulate、std::inner_product 与 std::iota](../../chapters/R16-algorithms.zh-CN.md#stdaccumulatestdinner_product-与-stdiota) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::reduce 与 std::transform_reduce](../../chapters/R16-algorithms.zh-CN.md#stdreduce-与-stdtransform_reduce) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [std::inclusive_scan 与 std::exclusive_scan](../../chapters/R16-algorithms.zh-CN.md#stdinclusive_scan-与-stdexclusive_scan) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [执行策略](../../chapters/R16-algorithms.zh-CN.md#执行策略) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |
| [组合应用与参考资料](../../chapters/R16-algorithms.zh-CN.md#组合应用与参考资料) | 继续保留在算法的完整操作与前提入口；所需基础满足后进入。本轮样稿不替代这项规则。 |

## 推广实施与协作安排

1. 先选三组中一组作为正式试点，按本表将原条目分成基础进入内容与完整规则入口；主编负责学习顺序与术语维护位置，暂不整体重排目录。
2. 主编补齐样稿之间的普通函数、指针、分支与循环桥接，并调整阅读指南深链。基础模板先于转发，位置模型先于容器失效，保持R源ID稳定。
3. 两名只读审查助手分别复核语言/标准库链、并发/系统链；可按adaptive-workflow安排gpt-6.1-sol/high与gpt-5.6-sol/high。两者只给证据，统一由主编改稿，避免同时写同一维护位置。
4. 主编逐项核对原条目、图、接口、例子、版本条件与索引都有去向，更新正式定义回链；独立渲染复核者检查章号、目录、PDF分页和图示，不改语义。
5. 正式试点评审通过后按审查优先级推广P1，再处理P2和定义缺口候选。每批保持可回退的差异，静态核对代码与匹配版本来源；遵守仓库不编译/运行C++的约定。

本轮已完成第一个评审输入：全书证据、三组完整局部样稿与原内容去向。后续作者/技术审查/渲染分工是实施建议；本轮没有创建新的用户聊天，也没有更换正式源稿。读者是否更容易掌握，仍需要读者按各组先修进行试读，记录首次卡住的位置和自检回答。
