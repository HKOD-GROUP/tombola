import base64
def b64(p): return 'data:image/png;base64,'+base64.b64encode(open(p,'rb').read()).decode()
K,C,TF,TD=[b64(n+'-trim.png') for n in ('keychain-t','cap-t','tshirt-face','tshirt-dos')]
packs={
 'pack-10':('#ECECEC',[(K,620,-6,0)]),
 'pack-20':('#ECECEC',[(TF,660,-3,0),(K,440,8,120)]),
 'pack-50':('#ECECEC',[(TF,600,-4,0),(C,330,3,-120),(K,380,9,140)]),
 'pack-80':('#ECECEC',[(TD,520,-6,0),(TF,540,3,0),(C,280,4,-120),(K,330,10,140)]),
}
for name,(bg,items) in packs.items():
    imgs=''.join(f'<img src="{s}" style="height:{h}px;transform:translateY({dy}px) rotate({r}deg);filter:drop-shadow(0 26px 28px rgba(42,31,45,.22));margin:0 -14px">' for s,h,r,dy in items)
    open(name+'.html','w').write(f'''<!doctype html><html><body style="margin:0;width:1600px;height:1000px;overflow:hidden;position:relative;background:{bg}">
<div style="position:absolute;width:760px;height:760px;border-radius:50%;background:#fff;opacity:.55;right:-160px;top:-260px"></div>
<div style="position:absolute;width:620px;height:620px;border-radius:50%;background:#fff;opacity:.45;left:-180px;bottom:-300px"></div>
<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:24px">{imgs}</div></body></html>''')
