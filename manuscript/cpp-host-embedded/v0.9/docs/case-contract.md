# 温度节点与工站共同教学约定

版本：case-contract-0.1。日期：2026-10-06。状态：编辑冻结的教学契约；没有编译、运行、联调或硬件验证。凡需具体厂商能力、额定值、时序、持久化或安全保证，均须另有目标环境证据。

## 数据与身份

- temperature_mC：毫摄氏度，25000 = 25.000°C；进程模型可用明确支持的32位有符号整数，N02最简int例仍保留目标范围前提
- sequence：设备采样计数，在线路温度帧中为32位无符号整数，按模2^32回绕；不是永久唯一标识、命令编号或工件编号
- generation：工站建立连接时创建的会话代际；本协议温度帧不发送它。接收入口把字节/操作与所属会话关联，旧代际不可进入新测试。不得从sequence变化推导generation
- device_id：物理节点身份；workpiece_id：被测工件身份；attempt_id：一次测试尝试身份；command_id：一次业务动作身份，安全重试保持原身份
- station_id、work_order_id、plan_version、limit_version、submission_id、calibration_version分别用于工位、工单、计划、限值、外部提交及校准身份，不能用sequence替代
- source_time：来源端时间，必须额外说明时钟域和采样时刻；received_at：工站接收UTC时刻。超时和经过时间另用独立命名的单调时钟观察；二者不得未经同步直接相减。本基础温度帧不含二者
- 基础帧不带设备身份、状态位、校准身份和命令身份；这些须在会话核验/独立扩展消息中获得。没有相应证据时，不得把基本读数直接作为生产合格结果

## 有界温度教学帧

所有“字节”限定为8位octet。最大payload为64字节，总帧长12+payload_length，最多76字节。格式按偏移逐字段定义，与C++结构体布局、sizeof、pack或主机字节序无关。

| 偏移 | 长度 | 字段 | 约定 |
| --- | --- | --- | --- |
| 0 | 2 | sync | A5 5A |
| 2 | 1 | version | 01 |
| 3 | 1 | type | 01为温度 |
| 4 | 2 | payload_length | 小端无符号，0至64 |
| 6 | 4 | sequence | 小端无符号样本计数 |
| 10 | N | payload | type决定解释 |
| 10+N | 2 | crc | 低字节在前 |

温度type=01严格要求payload_length=4。payload为32位二补码小端temperature_mC。25000十六进制000061A8，线路payload为A8 61 00 00；-1000对应18 FC FF FF。这些是编码推导，不是已运行抓包。

CRC参数完全固定：width16、poly0x1021、init0xFFFF、refin=false、refout=false、xorout0x0000。通常称CRC-16/CCITT-FALSE或CRC-16/IBM-3740。处理区间从version偏移2到payload末尾，包含type、length和sequence，不包含sync和CRC自身。CRC计算寄存器按MSB-first推进，CRC结果在线路上以小端顺序写出；输入反射设置和存储字节序是两件事。ASCII字节串123456789的约定核对值为0x29B1，其CRC线路存储为B1 29。这里仅给已知参数检查值，没有执行代码验证。

CRC用于检错，不提供认证、机密性或抗恶意篡改。未知version立即按不支持处理；未知type可在完整长度与CRC通过后跳过。解析器必须限制候选长度、保留量、工作量和等待时间。CRC失败或非法头从当前候选起点后一个字节继续寻找sync，防止跳过重叠帧头；一次合法完整帧只接纳一次。到期未完整的候选会被放弃并继续重新同步，断开时清空解析状态。

## 工程与展示边界

Windows为上位机主讲环境，Linux为第二验证目标。Qt6.8 API说明沿用样章；未固定并执行补丁、编译器和操作系统镜像组合。C++20为概念基线，std::expected只在明确标注C++23时介绍，不用于C++20主实现。MCU端不假设完整桌面标准库、异常、RTTI或std::thread可用。

所有示例、命令、故障注入方案和预期结果都属教学文稿。本版未编译或运行软件与固件示例；文档处理和格式检查不属于代码验证。

补充约定：boot_id用于设备一次启动/运行代际，须通过确切协议取得，不能以sequence归零冒充。serial_number是工件追溯序列号，应核对与device_id的绑定；fixture_id为治具身份。received_at统一指工站接收UTC，超时和经过时间另用单调时钟。基础帧没有boot_id、设备状态或上述追溯字段；不得在现有type01四字节payload中私自追加。
