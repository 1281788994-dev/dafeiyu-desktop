"""从真实运行精灵表提取静态分镜，供 README 和使用说明展示。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs' / 'images'
OUTPUT.mkdir(parents=True, exist_ok=True)
font_path = '/System/Library/Fonts/STHeiti Medium.ttc'
font = ImageFont.truetype(font_path, 18)
title_font = ImageFont.truetype(font_path, 24)
atlas = Image.open(ROOT / 'app/assets/spritesheet.png').convert('RGBA')
actions = [
 ('tail', '抱电脑甩尾',3,[0,1,2,3],['回头','尾巴抬起','尾巴摆动','回到原位']),
 ('catch','抛、跳、接、工作',4,[0,1,2,3,4],['抛出电脑','开心跳起','双手接住','坐回去','继续工作']),
 ('stretch','伸个懒腰',9,[0,1,2,4,5],['认真办公','打哈欠','伸懒腰','放松肩膀','继续工作']),
 ('sleep','抱电脑打盹',10,[0,1,2,3,4,5],['工作中','有点困','闭上眼睛','打个盹','醒过来','继续工作']),
 ('stand','抱电脑站起跳',11,[0,1,2,3,4],['坐着办公','站起来','抱电脑跳起','站稳落地','坐回去']),
 ('gag','电脑事故小剧场',12,[0,1,2,3,4],['抛电脑','开心跳起','电脑摔坏','赶紧修好','继续工作'])
]
for name,title,row,columns,labels in actions:
    image=Image.new('RGB',(len(columns)*208+32,300),'#f0f4fc')
    draw=ImageDraw.Draw(image)
    draw.text((24,16),title,font=title_font,fill='#253756')
    for index,(column,label) in enumerate(zip(columns,labels)):
        x=16+index*208
        draw.rounded_rectangle((x+2,55,x+202,291),radius=14,fill='#ffffff')
        frame=atlas.crop((column*192,row*208,(column+1)*192,(row+1)*208))
        image.paste(frame,(x+8,57),frame)
        box=draw.textbbox((0,0),label,font=font)
        draw.text((x+104-(box[2]-box[0])/2,269),label,font=font,fill='#253756')
    image.save(OUTPUT/f'{name}-storyboard.png')
print('已生成六张真实素材静态分镜')
