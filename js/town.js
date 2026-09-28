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

function newTown(player){
  const grid=[]; for(let y=0;y<MH;y++) grid.push(new Array(MW).fill(1));
  const x0=Math.floor(MW/2)-TOWN_W/2, y0=Math.floor(MH/2)-TOWN_H/2;
  const T=(rx,ry,v)=>{ grid[y0+ry][x0+rx]=v; };
  const R=(rx,ry,w,h,v)=>{ for(let j=0;j<h;j++) for(let i=0;i<w;i++) T(rx+i,ry+j,v); };
  R(1,1,TOWN_W-2,TOWN_H-2,6);        // grass
  R(9,6,14,10,5);                    // central plaza
  R(15,2,3,4,5);                     // road north to the dungeon gate
  R(15,16,3,5,5);                    // road south (spawn)
  R(1,10,8,2,5); R(23,10,8,2,5);     // roads west / east
  const decor=[];
  const add=(kind,rx,ry,w,h,extra)=>{ decor.push(Object.assign({kind,x:x0+rx,y:y0+ry,w,h},extra||{})); };
  const solid=(rx,ry,w,h)=>R(rx,ry,w,h,7);

  T(16,2,4);                          // dungeon entrance (portal)
  solid(14,2,1,1); add('pillar',14,2,1,1);
  solid(18,2,1,1); add('pillar',18,2,1,1);
  add('sign',16,1,1,1,{text:'迷宮の入り口'});

  [[3,3,0],[25,3,1],[3,14,2],[25,14,3]].forEach(([hx,hy,ri])=>{
    solid(hx,hy,4,3); add('house',hx,hy,4,3,{roof:TOWN.roofs[ri]});
  });
  solid(15,10,2,2); add('fountain',15,10,2,2);
  solid(19,8,3,1); add('stall',19,8,3,1);
  [[9,6],[22,6],[9,15],[22,15]].forEach(([lx,ly])=>{ solid(lx,ly,1,1); add('lamp',lx,ly,1,1); });
  [[2,7],[2,12],[29,7],[29,12],[8,3],[23,3],[11,3],[21,3],[8,18],[23,18],[12,19],[20,19],[2,18],[29,18]]
    .forEach(([tx,ty])=>{ solid(tx,ty,1,1); add('tree',tx,ty,1,1); });

  const npcs=[{
    type:'merchant', name:'商人 マルコ', x:x0+20.5, y:y0+7.5, facing:-1, talkRange:2.6,
    lines:['いらっしゃい！旅のお供にどうだい？','冒険の準備はいいかい？','迷宮は危険だ。薬草は多めにね！'],
    shop:['potion','sword','shield','charm']
  }];

  const critters=[];
  for(let i=0;i<7;i++){
    critters.push({cx:x0+5+Math.random()*22, cy:y0+4+Math.random()*14, rx:2+Math.random()*3, ry:1.5+Math.random()*2,
      sx:0.4+Math.random()*0.5, sy:0.5+Math.random()*0.5, ph:Math.random()*6.28, t:Math.random()*10, x:0, y:0,
      color:TOWN.flowers[i%TOWN.flowers.length]});
  }

  player.x=x0+16.5; player.y=y0+19.5; player.kx=0; player.ky=0; player.flash=0;
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
    ctx.fillStyle=TOWN.forestHi; ctx.fillRect(X+2+(h%9),Y+3+(h%7),4,3); ctx.fillRect(X+10+(h%5),Y+11+(h%6),4,3);
    return;
  }
  if(t===5||t===4){
    ctx.fillStyle=((x+y)%2===0)?TOWN.cobA:TOWN.cobB; ctx.fillRect(X,Y,TS,TS);
    ctx.fillStyle=TOWN.cobLine;
    ctx.fillRect(X,Y+TS/2,TS,1);
    ctx.fillRect(X+((y%2)?5:14),Y,1,TS/2);
    ctx.fillRect(X+((y%2)?14:5),Y+TS/2,1,TS/2);
    return;
  }
  ctx.fillStyle=((x+y)%2===0)?TOWN.grassA:TOWN.grassB; ctx.fillRect(X,Y,TS,TS);
  if(h%4===0){ ctx.fillStyle=TOWN.tuft; ctx.fillRect(X+3+(h%11),Y+5+(h%9),1,3); ctx.fillRect(X+4+(h%11),Y+6+(h%9),1,2); }
  if(h%7===0){
    const sw=Math.round(Math.sin(tick*0.06+x)*1);
    ctx.fillStyle=TOWN.flowers[h%TOWN.flowers.length];
    ctx.fillRect(X+4+(h%10)+sw,Y+3+(h%11),2,2);
    ctx.fillStyle='#ffe66b'; ctx.fillRect(X+4+(h%10)+sw,Y+4+(h%11),1,1);
  }
}

function drawDecor(d){
  const X=d.x*TS-camPX, Y=d.y*TS-camPY, W=d.w*TS, H=d.h*TS;
  if(d.kind==='house'){
    const rh=Math.round(H*0.6);
    ctx.fillStyle='rgba(0,0,0,0.16)'; ctx.fillRect(X+2,Y+H,W,4);
    ctx.fillStyle='#b5533d'; ctx.fillRect(X+W-16,Y-6,7,12);
    ctx.fillStyle=TOWN.wall; ctx.fillRect(X,Y,W,H);
    ctx.fillStyle=TOWN.wallShade; ctx.fillRect(X,Y+rh,3,H-rh); ctx.fillRect(X,Y+H-3,W,3);
    ctx.fillStyle=d.roof; ctx.fillRect(X-2,Y,W+4,rh);
    ctx.fillStyle='rgba(0,0,0,0.16)';
    for(let yy=6;yy<rh-3;yy+=6) ctx.fillRect(X-2,Y+yy,W+4,1);
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(X-2,Y+rh-3,W+4,3);
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(X-2,Y,W+4,2);
    ctx.fillStyle=TOWN.door; ctx.fillRect(X+W/2-5,Y+H-14,10,14);
    ctx.fillStyle='#e5c26a'; ctx.fillRect(X+W/2+2,Y+H-8,2,2);
    ctx.fillStyle=TOWN.window;
    ctx.fillRect(X+7,Y+rh+4,9,8); ctx.fillRect(X+W-16,Y+rh+4,9,8);
    ctx.fillStyle='#fff'; ctx.fillRect(X+11,Y+rh+4,1,8); ctx.fillRect(X+W-12,Y+rh+4,1,8);
    ctx.fillStyle='#8a5a2c'; ctx.fillRect(X+W/2,Y-9,1,10);
    ctx.fillStyle=d.roof;
    for(let i=0;i<5;i++) ctx.fillRect(X+W/2+1+i*2,Y-9+Math.round(Math.sin(tick*0.15+i)*1),2,4);
    for(let i=0;i<3;i++){
      const t=(tick*0.02+i/3)%1;
      ctx.globalAlpha=0.5*(1-t); ctx.fillStyle='#ffffff';
      ctx.fillRect(X+W-14+Math.sin(t*6)*3,Y-8-t*16,4,4);
    }
    ctx.globalAlpha=1;
    return;
  }
  if(d.kind==='tree'){
    const sw=Math.sin(tick*0.05+d.x)*1;
    ctx.fillStyle='rgba(0,0,0,0.16)'; ctx.fillRect(X+2,Y+17,17,4);
    ctx.fillStyle=TOWN.trunk; ctx.fillRect(X+8,Y+10,4,10);
    ctx.fillStyle=TOWN.leafDk; ctx.fillRect(X+2+sw,Y-2,16,12);
    ctx.fillStyle=TOWN.leaf; ctx.fillRect(X+3+sw,Y-6,14,12); ctx.fillRect(X+1+sw,Y-2,18,8);
    ctx.fillStyle=TOWN.leafHi; ctx.fillRect(X+5+sw,Y-5,5,3); ctx.fillRect(X+12+sw,Y-1,3,3);
    return;
  }
  if(d.kind==='fountain'){
    ctx.fillStyle='rgba(0,0,0,0.16)'; ctx.fillRect(X+2,Y+H-2,W,4);
    ctx.fillStyle=TOWN.stoneDk; ctx.fillRect(X,Y,W,H);
    ctx.fillStyle=TOWN.stone; ctx.fillRect(X+2,Y+2,W-4,H-4);
    ctx.fillStyle=TOWN.water; ctx.fillRect(X+5,Y+5,W-10,H-10);
    ctx.globalAlpha=0.6; ctx.fillStyle=TOWN.waterHi;
    ctx.fillRect(X+7+((tick*0.3)%16),Y+9,6,2);
    ctx.fillRect(X+W-15-((tick*0.25)%14),Y+H-12,6,2);
    ctx.globalAlpha=1;
    const cx=X+W/2, cy=Y+H/2;
    ctx.fillStyle=TOWN.stone; ctx.fillRect(cx-3,cy-3,6,6);
    ctx.fillStyle=TOWN.waterHi;
    for(let k=0;k<4;k++){
      const a=tick*0.06+k*1.57, up=Math.abs(Math.sin(tick*0.12+k))*6;
      ctx.fillRect(cx+Math.cos(a)*8-1,cy+Math.sin(a)*6-1-up,2,2);
    }
    ctx.fillRect(cx-1,cy-9-Math.sin(tick*0.2)*2,2,6);
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
