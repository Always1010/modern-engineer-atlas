from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
p=Path(__file__).resolve().parent/'assets'
im=Image.new('RGB',(1500,1140),'white');d=ImageDraw.Draw(im)
f='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
ft=ImageFont.truetype(f,34);sm=ImageFont.truetype(f,24);big=ImageFont.truetype(f,42)
d.text((70,35),'知识先修与交叉联系概览',font=big,fill='#102b43')
nodes=[(70,135,1430,235,'需求与证据  C01 / C23 / C25','约束、不变量、验证方法与学习出口'),(70,300,1430,400,'公共基础  C02—C04','数据结构、算法、数据表达和必要数学'),(70,465,680,590,'语言与对象  C09—C15','生命周期、值语义、容器与接口'),(820,465,1430,590,'执行与机器  C05—C08','CPU、虚拟内存、OS、编译与ABI'),(70,655,1430,760,'跨层能力  C16—C27','并发、性能、调试、构建、安全与可靠交付'),(70,835,485,975,'设备与系统','C28—C32 / C48—C52'),(542,835,958,975,'服务与数据','C33—C37 / C53—C56'),(1015,835,1430,975,'计算与工具','C38—C47')]
for x1,y1,x2,y2,t,sub in nodes:
 d.rounded_rectangle((x1,y1,x2,y2),radius=14,fill='#f0f5f8',outline='#425e74',width=2)
 d.text((x1+25,y1+18),t,font=ft,fill='#102b43');d.text((x1+25,y1+65),sub,font=sm,fill='#3e5260')
def arrow(x,y,x2,y2):
 d.line((x,y,x2,y2),fill='#486b83',width=4);d.polygon([(x2,y2),(x2-9,y2-16),(x2+9,y2-16)],fill='#486b83')
arrow(750,235,750,300);arrow(375,400,375,465);arrow(1125,400,1125,465);arrow(375,590,375,655);arrow(1125,590,1125,655)
for x in [277,750,1222]:arrow(x,760,x,835)
for x in range(688,810,15):d.line((x,525,x+8,525),fill='#835f36',width=3)
d.polygon([(683,525),(696,517),(696,533)],fill='#835f36');d.polygon([(817,525),(804,517),(804,533)],fill='#835f36')
d.text((665,610),'交叉解释 ≠ 同一语义',font=sm,fill='#835f36')
d.text((70,1020),'所有方向回到 C57 / C58：追问、故障演练、设计取舍与项目证据',font=sm,fill='#102b43')
d.text((70,1070),'本图为学习导航，非岗位互斥分类；细粒度先修及可选边见依赖表',font=sm,fill='#526572')
im.save(p/'knowledge-map.png')
