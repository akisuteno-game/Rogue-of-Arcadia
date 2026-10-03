"use strict";
// ---- Arcadia: the bright, lively hub town (layout, decor, NPCs, ambient life) ----
const TOWN_W=32, TOWN_H=22;
const TOWN={
  cobA:'#e6d9b8', cobB:'#dccda8', cobLine:'#c2b28a',
  grassA:'#8ad073', grassB:'#80c46a', tuft:'#5fa552',
  forest:'#2f7d3f', forestDk:'#25662f', forestHi:'#4a9a52',
  wall:'#f6ead0', wallShade:'#d9c9a6', door:'#7a4a2a', window:'#8fd8f5',
  water:'#5cc8f0', waterHi:'#c4f0ff', stone:'#c9d0d8', stoneDk:'#98a3ae',
  trunk:'#8a5a2c', leaf:'#43a34e', leafHi:'#6cc873', leafDk:'#2f7d3a',
  roofs:['#e0644a','#4a86d9','#e5a93c','#9a63d0'],
  flowers:['#ff8fa3','#ffd166','#ffffff','#b8a1ff']
};

function treeShape(){
  return {seed:Math.random(), scale:0.75+Math.random()*0.6, lobes:2+Math.floor(Math.random()*3)};
}

function carvePath(grid,ax,ay,bx,by,seed){
  const dx=bx-ax, dy=by-ay, len=Math.hypot(dx,dy)||1;
  const nx=-dy/len, ny=dx/len;
  const steps=Math.ceil(len*1.4)+2;
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const wob=Math.sin(t*Math.PI)*Math.sin(t*6.2+seed)*2.1;
    const px=Math.round(ax+dx*t+nx*wob), py=Math.round(ay+dy*t+ny*wob);
    for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
      if(Math.abs(ox)+Math.abs(oy)>1) continue;
      const gx=px+ox, gy=py+oy;
      if(gy<1||gx<1||gy>=MH-1||gx>=MW-1) continue;
      if(grid[gy][gx]!==7 && grid[gy][gx]!==4) grid[gy][gx]=5;
    }
  }
}

function newTown(player){
  const grid=[]; for(let y=0;y<MH;y++) grid.push(new Array(MW).fill(1));
  const cx0=Math.floor(MW/2), cy0=Math.floor(MH/2);
  const seedA=Math.random()*10, seedB=Math.random()*10;
  const clearR=(ang)=>15*(1+0.34*Math.sin(ang*3+seedA)+0.16*Math.sin(ang*5+seedA*1.6));
  const plazaR=(ang)=>6.5*(1+0.3*Math.sin(ang*4+seedB)+0.16*Math.sin(ang*7+seedB*1.3));

  for(let ry=-17;ry<=17;ry++) for(let rx=-17;rx<=17;rx++){
    const gx=cx0+rx, gy=cy0+ry; if(gx<1||gy<1||gx>=MW-1||gy>=MH-1) continue;
    const dist=Math.hypot(rx,ry), ang=Math.atan2(ry,rx);
    if(dist<clearR(ang)) grid[gy][gx]=6;
  }
  for(let ry=-9;ry<=9;ry++) for(let rx=-9;rx<=9;rx++){
    const gx=cx0+rx, gy=cy0+ry;
    const dist=Math.hypot(rx,ry), ang=Math.atan2(ry,rx);
    if(dist<plazaR(ang)) grid[gy][gx]=5;
  }

  const decor=[]; const add=(kind,gx,gy,w,h,extra)=>decor.push(Object.assign({kind,x:gx,y:gy,w,h},extra||{}));
  const solid=(gx,gy,w,h)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++){ if(grid[gy+j]) grid[gy+j][gx+i]=7; } };

  const portalAng=-Math.PI/2+0.15, portalDist=clearR(portalAng)+3.5;
  const portalX=Math.round(cx0+Math.cos(portalAng)*portalDist), portalY=Math.round(cy0+Math.sin(portalAng)*portalDist);
  grid[portalY][portalX]=4;
  solid(portalX-2,portalY,1,1); add('pillar',portalX-2,portalY,1,1);
  solid(portalX+2,portalY,1,1); add('pillar',portalX+2,portalY,1,1);
  add('sign',portalX,portalY-1,1,1,{text:'迷宮の入り口'});
  carvePath(grid,cx0,cy0,portalX,portalY+1,1.1);

  const spawnAng=Math.PI/2-0.1, spawnDist=clearR(spawnAng)-2.5;
  const spawnX=cx0+Math.cos(spawnAng)*spawnDist, spawnY=cy0+Math.sin(spawnAng)*spawnDist;
  carvePath(grid,cx0,cy0,Math.round(spawnX),Math.round(spawnY),2.7);

  add('fountain',cx0-1,cy0-1,2,2); solid(cx0-1,cy0-1,2,2);
  const stallAng=0.7, stallDist=plazaR(0.7)+2.5;
  const stallX=Math.round(cx0+Math.cos(stallAng)*stallDist), stallY=Math.round(cy0+Math.sin(stallAng)*stallDist);
  solid(stallX,stallY,3,1); add('stall',stallX,stallY,3,1);
  carvePath(grid,cx0,cy0,stallX+1,stallY,0.4);

  const houseSpecs=[
    {ang:2.3,r:11,roof:0},{ang:3.6,r:12.5,roof:1},{ang:4.6,r:11.5,roof:2},
    {ang:0.15,r:12,roof:3},{ang:5.6,r:10.5,roof:0}
  ];
  for(const hs of houseSpecs){
    const cr=clearR(hs.ang), rr=Math.min(hs.r, cr-3);
    const hx=Math.round(cx0+Math.cos(hs.ang)*rr-2), hy=Math.round(cy0+Math.sin(hs.ang)*rr-1.5);
    solid(hx,hy,4,3); add('house',hx,hy,4,3,{roof:TOWN.roofs[hs.roof]});
    carvePath(grid,cx0,cy0,hx+2,hy+3,hs.ang*1.7);
  }

  [[2.9,7],[4.9,6.5],[1.5,7.5],[0.85,6.3],[5.9,7]].forEach(([ang,r])=>{
    const px=Math.round(cx0+Math.cos(ang)*r), py=Math.round(cy0+Math.sin(ang)*r);
    if(grid[py] && grid[py][px]===5){ solid(px,py,1,1); add('lamp',px,py,1,1); }
  });

  for(let ry=-19;ry<=19;ry++) for(let rx=-19;rx<=19;rx++){
    const gx=cx0+rx, gy=cy0+ry; if(gx<1||gy<1||gx>=MW-1||gy>=MH-1) continue;
    if(grid[gy][gx]!==1) continue;
    const dist=Math.hypot(rx,ry), ang=Math.atan2(ry,rx), edge=clearR(ang);
    const h=hash(gx,gy);
    if(dist>edge && dist<edge+3.5 && h%3===0){ solid(gx,gy,1,1); add('tree',gx,gy,1,1,treeShape()); }
    else if(dist>=edge+3.5 && dist<edge+9 && h%6===0){ solid(gx,gy,1,1); add('tree',gx,gy,1,1,treeShape()); }
  }
  for(let ry=-16;ry<=16;ry++) for(let rx=-16;rx<=16;rx++){
    const gx=cx0+rx, gy=cy0+ry; if(!grid[gy] || grid[gy][gx]!==6) continue;
    const dist=Math.hypot(rx,ry), ang=Math.atan2(ry,rx), edge=clearR(ang);
    if(edge-dist<2.2 && hash(gx,gy)%8===0){ solid(gx,gy,1,1); add('tree',gx,gy,1,1,treeShape()); }
  }

  const npcs=[{
    type:'merchant', name:'商人 マルコ', x:stallX+1.5, y:stallY+1.3, facing:-1, talkRange:2.8,
    lines:['いらっしゃい！旅のお供にどうだい？','冒険の準備はいいかい？','迷宮は危険だ。薬草は多めにね！','ゴールドが貯まったら見せておくれ。'],
    shop:['potion','sword','shield','charm']
  }];

  const critters=[];
  for(let i=0;i<8;i++){
    const a=Math.random()*Math.PI*2, r=4+Math.random()*10;
    critters.push({cx:cx0+Math.cos(a)*r, cy:cy0+Math.sin(a)*r, rx:2+Math.random()*3, ry:1.5+Math.random()*2,
      sx:0.4+Math.random()*0.5, sy:0.5+Math.random()*0.5, ph:Math.random()*6.28, t:Math.random()*10, x:0, y:0,
      color:TOWN.flowers[i%TOWN.flowers.length]});
  }

  player.x=spawnX; player.y=spawnY; player.kx=0; player.ky=0; player.flash=0;
  updateCamera(player, true);
  return {grid, monsters:[], items:[], npcs, decor, critters, stairsX:-1, stairsY:-1, depth:0, isTown:true};
}

function updateTown(dt){
  const p=state.player, f=state.floor;
  for(const c of f.critters){
    c.t+=dt;
    c.x=c.cx+Math.sin(c.t*c.sx+c.ph)*c.rx;
    c.y=c.cy+Math.cos(c.t*c.sy+c.ph*1.7)*c.ry;
  }
  let near=null;
  for(const n of f.npcs){ if(Math.hypot(n.x-p.x,n.y-p.y)<n.talkRange){ near=n; break; } }
  if(near!==state.nearNpc){
    state.nearNpc=near;
    if(near) openShop(near); else closeShop();
  }
  const tx=Math.floor(p.x), ty=Math.floor(p.y);
  if(f.grid[ty] && f.grid[ty][tx]===4){
    log('迷宮の入り口へ足を踏み入れた。');
    state.nearNpc=null; closeShop();
    state.floor=newFloor(1, p);
    updateHUD();
  }
}

// ---------- drawing ----------
function drawTownTile(x,y,t){
  const X=x*TS-camPX, Y=y*TS-camPY, h=hash(x,y);
  if(t===1){
    ctx.fillStyle=(h%2)?TOWN.forest:TOWN.forestDk; ctx.fillRect(X,Y,TS,TS);
    ctx.fillStyle=TOWN.forestHi;
    ctx.beginPath(); ctx.arc(X+6+(h%8),Y+7+(h%6),3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(X+13+(h%5),Y+13+(h%6),2.6,0,Math.PI*2); ctx.fill();
    return;
  }
  if(t===5||t===4){
    ctx.fillStyle=(h%2===0)?TOWN.cobA:TOWN.cobB; ctx.fillRect(X,Y,TS,TS);
    const stones=[[4,4],[13,3],[5,12],[14,13],[9,8],[3,16],[16,17]];
    for(let i=0;i<stones.length;i++){
      const sh=hash(x*7+i*31,y*13+i*17);
      const sx=X+stones[i][0]+(sh%3)-1, sy=Y+stones[i][1]+(sh%3)-1;
      const rr=2+(sh%2)*0.8;
      ctx.fillStyle=(sh%2)?TOWN.cobLine:'#cbb98f';
      ctx.beginPath(); ctx.ellipse(sx,sy,rr,rr*0.78,(sh%4)*0.5,0,Math.PI*2); ctx.fill();
    }
    return;
  }
  ctx.fillStyle=(h%2===0)?TOWN.grassA:TOWN.grassB; ctx.fillRect(X,Y,TS,TS);
  if(h%3===0){
    ctx.globalAlpha=0.25; ctx.fillStyle=(h%2)?TOWN.grassB:TOWN.grassA;
    ctx.beginPath(); ctx.arc(X+6+(h%9),Y+9+(h%7),3.4,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }
  if(h%4===0){
    ctx.fillStyle=TOWN.tuft;
    ctx.beginPath(); ctx.arc(X+4+(h%11),Y+6+(h%9),1.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(X+6+(h%9),Y+8+(h%7),1.0,0,Math.PI*2); ctx.fill();
  }
  if(h%7===0){
    const sw=Math.sin(tick*0.06+x)*1;
    ctx.fillStyle=TOWN.flowers[h%TOWN.flowers.length];
    ctx.beginPath(); ctx.arc(X+5+(h%10)+sw,Y+4+(h%11),1.6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffe66b';
    ctx.beginPath(); ctx.arc(X+5+(h%10)+sw,Y+4+(h%11),0.6,0,Math.PI*2); ctx.fill();
  }
}

function drawDecor(d){
  const X=d.x*TS-camPX, Y=d.y*TS-camPY, W=d.w*TS, H=d.h*TS;
  if(d.kind==='house'){
    const rh=Math.round(H*0.6);
    ctx.fillStyle='rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(X+W/2+2,Y+H+2,W/2+2,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#b5533d'; ctx.fillRect(X+W-16,Y-6,7,12);
    ctx.fillStyle=TOWN.wall; ctx.fillRect(X,Y,W,H);
    ctx.fillStyle=TOWN.wallShade; ctx.fillRect(X,Y+rh,3,H-rh); ctx.fillRect(X,Y+H-3,W,3);
    ctx.fillStyle=d.roof; ctx.fillRect(X-2,Y+3,W+4,rh-3);
    ctx.beginPath(); ctx.ellipse(X+W/2,Y+3,W/2+2,5,0,Math.PI,0); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.16)';
    for(let yy=8;yy<rh-3;yy+=6) ctx.fillRect(X-2,Y+yy,W+4,1);
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(X-2,Y+rh-3,W+4,3);
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(X+W/2,Y+2,W/2,3,0,Math.PI,0); ctx.fill();
    ctx.fillStyle=TOWN.door;
    ctx.beginPath(); ctx.moveTo(X+W/2-5,Y+H); ctx.lineTo(X+W/2-5,Y+H-8);
    ctx.arc(X+W/2,Y+H-8,5,Math.PI,0); ctx.lineTo(X+W/2+5,Y+H); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#e5c26a'; ctx.beginPath(); ctx.arc(X+W/2+3,Y+H-6,1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.window;
    ctx.beginPath(); ctx.arc(X+11,Y+rh+8,4.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(X+W-12,Y+rh+8,4.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(X+11,Y+rh+4); ctx.lineTo(X+11,Y+rh+12); ctx.moveTo(X+7,Y+rh+8); ctx.lineTo(X+15,Y+rh+8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X+W-12,Y+rh+4); ctx.lineTo(X+W-12,Y+rh+12); ctx.moveTo(X+W-16,Y+rh+8); ctx.lineTo(X+W-8,Y+rh+8); ctx.stroke();
    ctx.fillStyle='#8a5a2c'; ctx.fillRect(X+W/2,Y-9,1,10);
    ctx.fillStyle=d.roof;
    for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(X+W/2+2+i*2,Y-9+Math.round(Math.sin(tick*0.15+i)*1),2,0,Math.PI*2); ctx.fill(); }
    for(let i=0;i<3;i++){
      const t=(tick*0.02+i/3)%1;
      ctx.globalAlpha=0.5*(1-t); ctx.fillStyle='#ffffff';
      ctx.beginPath(); ctx.arc(X+W-12+Math.sin(t*6)*3,Y-6-t*16,2,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    return;
  }
  if(d.kind==='tree'){
    const seed=d.seed||0, scale=d.scale||1, lobes=d.lobes||3;
    const sw=Math.sin(tick*0.05+d.x)*1*scale;
    const trunkH=7+seed*7, baseY=Y+19-trunkH*0.3;
    ctx.fillStyle='rgba(0,0,0,0.16)';
    ctx.beginPath(); ctx.ellipse(X+9,Y+19,9*scale,3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.trunk; ctx.fillRect(X+8,Y+19-trunkH,4,trunkH);
    const topY=Y+9-trunkH*0.5;
    ctx.fillStyle=TOWN.leafDk;
    ctx.beginPath(); ctx.arc(X+9+sw,topY,9*scale,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.leaf;
    for(let i=0;i<lobes;i++){
      const ang=(i/lobes)*Math.PI*2+seed*4;
      const lr=5.5*scale+((i+seed*3)%2);
      const lx=X+9+sw+Math.cos(ang)*4.2*scale, ly=topY-2+Math.sin(ang)*3.4*scale;
      ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle=TOWN.leafHi;
    ctx.beginPath(); ctx.arc(X+6+sw,topY-5*scale,3*scale,0,Math.PI*2); ctx.fill();
    return;
  }
  if(d.kind==='fountain'){
    const cx=X+W/2, cy=Y+H/2, rad=W/2;
    ctx.fillStyle='rgba(0,0,0,0.16)';
    ctx.beginPath(); ctx.ellipse(cx,Y+H,rad,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.stoneDk; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.stone; ctx.beginPath(); ctx.arc(cx,cy,rad-2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.water; ctx.beginPath(); ctx.arc(cx,cy,rad-6,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.55; ctx.fillStyle=TOWN.waterHi;
    ctx.beginPath(); ctx.ellipse(cx-3,cy-2+((tick*0.15)%3-1.5),4,2,0.3,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle=TOWN.stone; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=TOWN.waterHi;
    for(let k=0;k<4;k++){
      const a=tick*0.06+k*1.57, up=Math.abs(Math.sin(tick*0.12+k))*6;
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*8,cy+Math.sin(a)*6-up,1.3,0,Math.PI*2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx,cy-9-Math.sin(tick*0.2)*2,1.4,0,Math.PI*2); ctx.fill();
    return;
  }
  if(d.kind==='stall'){
    ctx.fillStyle='#8a5a2c'; ctx.fillRect(X-1,Y-40,3,40); ctx.fillRect(X+W-2,Y-40,3,40);
    for(let i=0;i<Math.ceil((W+8)/6);i++){
      ctx.fillStyle=(i%2)?'#fff5e0':'#e0644a';
      ctx.fillRect(X-4+i*6,Y-40,6,14);
      ctx.fillRect(X-4+i*6,Y-26,6,3+((i%2)?0:2));
    }
    ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(X-2,Y+H,W+4,4);
    ctx.fillStyle='#b9793a'; ctx.fillRect(X,Y+2,W,H-2);
    ctx.fillStyle='#d9a066'; ctx.fillRect(X,Y,W,4);
    ctx.fillStyle='#fff5e0'; ctx.fillRect(X+2,Y+8,W-4,8);
    ctx.fillStyle='#e0644a'; ctx.fillRect(X+2,Y+11,W-4,2);
    ctx.fillStyle=PALETTE.potionCork; ctx.fillRect(X+9,Y-5,3,2);
    ctx.fillStyle=PALETTE.potion; ctx.fillRect(X+8,Y-3,5,5);
    ctx.fillStyle=PALETTE.swordBlade; ctx.fillRect(X+27,Y-9,2,9);
    ctx.fillStyle=PALETTE.swordHilt; ctx.fillRect(X+24,Y-2,8,2);
    ctx.fillStyle=PALETTE.shieldTrim; ctx.fillRect(X+42,Y-6,9,8);
    ctx.fillStyle=PALETTE.shieldBody; ctx.fillRect(X+43,Y-5,7,5);
    return;
  }
  if(d.kind==='pillar'){
    const f=Math.sin(tick*0.25+d.x)*1.5;
    ctx.fillStyle=TOWN.stoneDk; ctx.fillRect(X+5,Y+6,10,14);
    ctx.fillStyle=TOWN.stone; ctx.fillRect(X+6,Y+6,7,14); ctx.fillRect(X+3,Y+3,14,4);
    ctx.fillStyle='#5a4a3a'; ctx.fillRect(X+4,Y-2,12,5);
    ctx.fillStyle='#ff9a3c'; ctx.fillRect(X+7,Y-10+f,6,9);
    ctx.fillStyle='#ffe27a'; ctx.fillRect(X+9,Y-7+f,2,5);
    return;
  }
  if(d.kind==='lamp'){
    ctx.fillStyle='#4a4a55'; ctx.fillRect(X+9,Y+5,2,15);
    ctx.globalAlpha=0.22; ctx.fillStyle='#ffe27a'; ctx.fillRect(X+1,Y-8,18,18);
    ctx.globalAlpha=1;
    ctx.fillStyle='#ffd27a'; ctx.fillRect(X+6,Y-2,8,8);
    ctx.fillStyle='#fff3c4'; ctx.fillRect(X+8,Y,4,4);
    ctx.fillStyle='#4a4a55'; ctx.fillRect(X+5,Y-4,10,3);
    return;
  }
  if(d.kind==='sign'){
    ctx.save();
    ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(40,20,60,0.85)';
    ctx.strokeText(d.text,X+TS/2,Y+TS/2);
    ctx.fillStyle='#fff3b0'; ctx.fillText(d.text,X+TS/2,Y+TS/2);
    ctx.restore();
  }
}

function drawNpc(n){
  const p=state.player;
  const px=n.x*TS-camPX, py=n.y*TS-camPY;
  n.facing=(p.x<n.x)?-1:1;
  drawCreatureAt(px,py,n.facing,0.6,merchantParts,0,1,n.x);
  const b=Math.sin(tick*0.1)*2;
  ctx.fillStyle='#c98f22'; ctx.fillRect(px-4,py-25+b,8,8);
  ctx.fillStyle='#ffd23c'; ctx.fillRect(px-3,py-24+b,6,6);
  ctx.fillStyle='#fff3a8'; ctx.fillRect(px-2,py-23+b,2,2);
}

function drawCritter(c){
  const X=c.x*TS-camPX, Y=c.y*TS-camPY;
  const flap=Math.abs(Math.sin(tick*0.4+c.ph))*3;
  ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(X-2,Y+8,5,2);
  ctx.fillStyle=c.color;
  ctx.fillRect(X-4,Y-flap,3,3); ctx.fillRect(X+1,Y-flap,3,3);
  ctx.fillStyle='#554'; ctx.fillRect(X-1,Y-1,2,4);
}

function drawTownWorld(f,sx,ex,sy,ey,drawPlayer){
  const p=state.player;
  for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++) drawTownTile(x,y,f.grid[y][x]);
  const list=[];
  for(const d of f.decor){
    const X=d.x*TS-camPX, Y=d.y*TS-camPY;
    if(X<-120||Y<-120||X>cv.width+120||Y>cv.height+120) continue;
    list.push({b:d.y+d.h+(d.kind==='sign'?-5:0), fn:()=>drawDecor(d)});
  }
  for(const n of f.npcs) list.push({b:n.y+0.45, fn:()=>drawNpc(n)});
  list.push({b:p.y+0.45, fn:drawPlayer});
  list.sort((a,b)=>a.b-b.b);
  for(const e of list) e.fn();
  for(const c of f.critters) drawCritter(c);
}
