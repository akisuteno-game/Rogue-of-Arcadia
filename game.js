(function(){
"use strict";
const TS=20, MW=96, MH=64;
const cv=document.getElementById('cv'), ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
let camPX=0, camPY=0;
function lerp(a,b,t){ return a+(b-a)*t; }
function updateCamera(player, snap){
  const maxCamX=Math.max(0, MW*TS-cv.width);
  const maxCamY=Math.max(0, MH*TS-cv.height);
  const tx=Math.min(maxCamX, Math.max(0, player.x*TS-cv.width/2));
  const ty=Math.min(maxCamY, Math.max(0, player.y*TS-cv.height/2));
  if(snap){ camPX=tx; camPY=ty; } else { camPX=lerp(camPX,tx,0.16); camPY=lerp(camPY,ty,0.16); }
}

const PALETTE={
  wallLo:'#3d3448', wallHi:'#5a4d68', mortar:'#221c29',
  floorA:'#1a1220', floorB:'#1e1526', crack:'#070508',
  corA:'#0d0d13', corB:'#101017', corPath:'rgba(150,140,160,0.07)',
  stairs:'#d9b34f', stairsGlow:'#f4d98a',
  potion:'#c94f4f', potionHi:'#e88a8a', potionCork:'#8a6a3a',
  torch:'#e0793c', torchCore:'#ffd27a',
  playerSkin:'#e8c18a', playerArmor:'#e0793c', playerArmorDk:'#8a4a26', playerCloak:'#5a2d3a', playerCloakDk:'#3a1c26', playerBoot:'#3a2c22',
  goblinSkin:'#5fae6a', goblinSkinDk:'#356b3d', goblinBelt:'#7a5a2c', goblinTooth:'#eee',
  ratFur:'#948a9c', ratFurDk:'#5c5464', ratPink:'#c98a9a',
  batBody:'#4a4058', batWing:'#2a2432', batEye:'#e8402c',
  boneWhite:'#d8d0c0', boneShadow:'#a89880', boneEye:'#1a1620', boneWeapon:'#6a625a',
  swordBlade:'#cfd6dd', swordHilt:'#8a6a3a', shieldBody:'#5a7ba8', shieldTrim:'#d9b34f',
  charmBody:'#a860c9', charmGlow:'#e8b8ff'
};

const MONSTER_DEFS={
  rat:{hpBase:3,hpPerDepth:0.5,atkBase:1,atkPerDepth:0,speed:2.5,r:0.26,aggro:4.5,exp:3},
  goblin:{hpBase:6,hpPerDepth:1,atkBase:2,atkPerDepth:0.5,speed:1.5,r:0.34,aggro:5.5,exp:6},
  bat:{hpBase:2,hpPerDepth:0.35,atkBase:1,atkPerDepth:0,speed:3.3,r:0.22,aggro:6,exp:4},
  skeleton:{hpBase:9,hpPerDepth:1.2,atkBase:3,atkPerDepth:0.6,speed:1.1,r:0.36,aggro:5,exp:9}
};

let best=1;
try{ const b=localStorage.getItem('dungeon_best'); if(b) best=parseInt(b,10)||1; }catch(e){}

let state=null, tick=0;
let inventory={potion:0};
let equip={sword:0,shield:0,charm:0};
const logEl=document.getElementById('log');
function log(msg){
  const d=document.createElement('div'); d.textContent=msg;
  logEl.appendChild(d);
  while(logEl.children.length>40) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop=logEl.scrollHeight;
}
function rnd(n){return Math.floor(Math.random()*n);}
function rndRange(a,b){return a+rnd(b-a+1);}
function hash(x,y){ let h=(x*928371+y*123457+7)>>>0; h=(h^(h>>13))*2246822519>>>0; return h; }
function monsterName(t){ return t==='goblin'?'ゴブリン':t==='bat'?'コウモリ':t==='skeleton'?'スケルトン':'ネズミ'; }
function setFloor(grid,x,y){ if(y>=0&&y<MH&&x>=0&&x<MW&&grid[y][x]===1) grid[y][x]=3; }
function carveCorridor(grid,ax,ay,bx,by){
  if(Math.random()<0.5){
    for(let x=Math.min(ax,bx);x<=Math.max(ax,bx);x++){ setFloor(grid,x,ay); setFloor(grid,x,ay+1); }
    for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++){ setFloor(grid,bx,y); setFloor(grid,bx+1,y); }
  } else {
    for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++){ setFloor(grid,ax,y); setFloor(grid,ax+1,y); }
    for(let x=Math.min(ax,bx);x<=Math.max(ax,bx);x++){ setFloor(grid,x,by); setFloor(grid,x,by+1); }
  }
}

function newFloor(depth, player){
  const grid=[]; for(let y=0;y<MH;y++) grid.push(new Array(MW).fill(1));
  const rooms=[]; const roomAttempts=48+rnd(16);
  for(let i=0;i<roomAttempts;i++){
    const w=rndRange(6,11), h=rndRange(5,9);
    const x=rndRange(1,MW-w-2), y=rndRange(1,MH-h-2);
    let overlap=false;
    for(const r of rooms){ if(x<r.x+r.w+1 && x+w+1>r.x && y<r.y+r.h+1 && y+h+1>r.y){overlap=true;break;} }
    if(overlap) continue;
    rooms.push({x,y,w,h});
    for(let ry=y; ry<y+h; ry++) for(let rx=x; rx<x+w; rx++) grid[ry][rx]=0;
  }
  const centers=rooms.map(r=>[(r.x+r.x+r.w-1)>>1,(r.y+r.y+r.h-1)>>1]);
  const edges=[];
  for(let i=0;i<rooms.length;i++) for(let j=i+1;j<rooms.length;j++){
    const dx=centers[i][0]-centers[j][0], dy=centers[i][1]-centers[j][1];
    edges.push({i,j,d:dx*dx+dy*dy});
  }
  edges.sort((a,b)=>a.d-b.d);
  const parent=rooms.map((_,i)=>i);
  function find(x){ while(parent[x]!==x){ parent[x]=parent[parent[x]]; x=parent[x]; } return x; }
  for(const e of edges){
    const ri=find(e.i), rj=find(e.j);
    if(ri!==rj){
      parent[ri]=rj;
      carveCorridor(grid, centers[e.i][0],centers[e.i][1], centers[e.j][0],centers[e.j][1]);
    } else if(e.d<420 && Math.random()<0.08){
      carveCorridor(grid, centers[e.i][0],centers[e.i][1], centers[e.j][0],centers[e.j][1]);
    }
  }
  const start=rooms[0], startX=(start.x+start.x+start.w-1)>>1, startY=(start.y+start.y+start.h-1)>>1;
  const last=rooms[rooms.length-1];
  const stairsX=(last.x+last.x+last.w-1)>>1, stairsY=(last.y+last.y+last.h-1)>>1;
  grid[stairsY][stairsX]=2;

  const monsters=[]; const monCount=Math.min(8+depth*2+Math.floor(rooms.length/2), 40);
  const pool=['rat','rat','goblin'];
  if(depth>=2) pool.push('bat','bat');
  if(depth>=4) pool.push('skeleton');
  for(let i=0;i<monCount;i++){
    const r=rooms[1+rnd(Math.max(1,rooms.length-1))]; if(!r) continue;
    const mx=rndRange(r.x,r.x+r.w-1), my=rndRange(r.y,r.y+r.h-1);
    if(mx===startX&&my===startY) continue;
    const type=pool[rnd(pool.length)];
    const def=MONSTER_DEFS[type];
    const hp=Math.ceil(def.hpBase+depth*def.hpPerDepth);
    monsters.push({x:mx+0.5,y:my+0.5,type,
      hp, maxhp:hp, atk:Math.ceil(def.atkBase+depth*def.atkPerDepth), alive:true, facing:1,
      flash:0, kx:0, ky:0, hitCd:0, dying:false, deathT:1,
      wanderDx:0, wanderDy:0, wanderT:Math.random()*1.5,
      r:def.r, speed:def.speed+depth*0.015, aggro:def.aggro});
  }
  const items=[]; const itemCount=3+rnd(3)+Math.floor(rooms.length/5);
  const itemPool=['potion','potion','potion','sword','shield','charm'];
  for(let i=0;i<itemCount;i++){
    const r=rooms[rnd(rooms.length)];
    const ix=rndRange(r.x,r.x+r.w-1), iy=rndRange(r.y,r.y+r.h-1);
    if(grid[iy][ix]===0 && !(ix===startX&&iy===startY)) items.push({x:ix,y:iy,type:itemPool[rnd(itemPool.length)]});
  }
  player.x=startX+0.5; player.y=startY+0.5; player.kx=0; player.ky=0; player.flash=0;
  updateCamera(player, true);
  return {grid, monsters, items, stairsX, stairsY, depth};
}

function newGame(){
  const player={hp:12,maxhp:12,atk:3,def:0,lv:1,exp:0,expNext:10,x:0,y:0,facing:1,
    flash:0,kx:0,ky:0,atkCd:0,hitCd:0,r:0.3,speed:3.4,atkPulse:0,aimX:1,aimY:0,atkAngle:0};
  const floor=newFloor(1, player);
  state={player, floor, over:false, shake:0};
  inventory={potion:0}; equip={sword:0,shield:0,charm:0};
  log('迷宮の入り口に立った。画面をドラッグして進め。');
  updateHUD(); renderInventory();
}

function updateHUD(){
  const p=state.player;
  document.getElementById('floorNum').textContent=state.floor.depth;
  document.getElementById('lvNum').textContent=p.lv;
  document.getElementById('bestFloor').textContent=best;
  document.getElementById('hpBar').style.width=Math.max(0,(p.hp/p.maxhp*100))+'%';
  document.getElementById('hpText').textContent=Math.max(0,Math.ceil(p.hp))+'/'+p.maxhp;
  document.getElementById('xpBar').style.width=(p.exp/p.expNext*100)+'%';
  document.getElementById('xpText').textContent=p.exp+'/'+p.expNext;
}

function renderInventory(){
  const bar=document.getElementById('itembar');
  bar.innerHTML='';
  const defs=[
    {key:'potion', icon:'🧪', usable:true, val:()=>inventory.potion},
    {key:'sword', icon:'⚔️', usable:false, val:()=>equip.sword},
    {key:'shield', icon:'🛡️', usable:false, val:()=>equip.shield},
    {key:'charm', icon:'🧿', usable:false, val:()=>equip.charm}
  ];
  for(const d of defs){
    const v=d.val();
    const slot=document.createElement('div');
    slot.className='itemslot'+(v>0?(d.usable?' usable':''):' empty');
    slot.innerHTML=d.icon+(v>0?'<span class="count">x'+v+'</span>':'');
    if(d.usable) slot.addEventListener('click', usePotion);
    bar.appendChild(slot);
  }
  for(let i=0;i<2;i++){ const e=document.createElement('div'); e.className='itemslot empty'; bar.appendChild(e); }
}
function usePotion(){
  if(!state || state.over || inventory.potion<=0) return;
  inventory.potion--;
  const heal=4+rnd(5);
  state.player.hp=Math.min(state.player.maxhp, state.player.hp+heal);
  log('薬草を使った。HPが'+heal+'回復した。');
  updateHUD(); renderInventory();
}

function tileAt(g,x,y){ if(x<0||y<0||x>=MW||y>=MH) return 1; return g[y][x]; }

function moveEntity(e,dx,dy,grid){
  if(dx!==0){
    const nx=e.x+dx, edge=nx+(dx>0?e.r:-e.r), tx=Math.floor(edge);
    const y1=Math.floor(e.y-e.r+0.001), y2=Math.floor(e.y+e.r-0.001);
    let blocked=false;
    for(let ty=y1; ty<=y2; ty++){ if(tileAt(grid,tx,ty)===1){blocked=true;break;} }
    if(!blocked) e.x=nx;
  }
  if(dy!==0){
    const ny=e.y+dy, edge=ny+(dy>0?e.r:-e.r), ty=Math.floor(edge);
    const x1=Math.floor(e.x-e.r+0.001), x2=Math.floor(e.x+e.r-0.001);
    let blocked=false;
    for(let tx=x1; tx<=x2; tx++){ if(tileAt(grid,tx,ty)===1){blocked=true;break;} }
    if(!blocked) e.y=ny;
  }
}

function gameOver(){
  state.over=true;
  const ov=document.getElementById('overlay');
  document.getElementById('overTitle').textContent='力尽きた…';
  document.getElementById('overText').textContent=
    '地下'+state.floor.depth+'階、Lv.'+state.player.lv+'で終了。最高到達は地下'+best+'階。';
  ov.style.display='flex';
}

const ATTACK_RANGE=1.8, ATTACK_HALF_ANGLE=10*Math.PI/180, ATTACK_CD=0.4;
function doAttack(){
  if(!state || state.over) return;
  const p=state.player, f=state.floor;
  if(p.atkCd>0) return;
  p.atkCd=ATTACK_CD; p.atkPulse=1;
  p.atkAngle=Math.atan2(p.aimY,p.aimX);
  const cosHalf=Math.cos(ATTACK_HALF_ANGLE);
  for(const m of f.monsters){
    if(!m.alive) continue;
    const dx=m.x-p.x, dy=m.y-p.y, dist=Math.hypot(dx,dy);
    if(dist >= ATTACK_RANGE+m.r) continue;
    let hitOk = dist < p.r+m.r+0.15;
    if(!hitOk && dist>0.02){
      const dot=(dx/dist)*p.aimX+(dy/dist)*p.aimY;
      hitOk = dot>=cosHalf;
    }
    if(hitOk){
      const dmg=Math.max(1, p.atk+rnd(2)-1);
      m.hp-=dmg; m.flash=1;
      const kd=dist||1; m.kx=(dx/kd)*6.5; m.ky=(dy/kd)*6.5;
      if(m.hp<=0){
        m.alive=false; m.dying=true; m.deathT=1;
        const gain=MONSTER_DEFS[m.type].exp; p.exp+=gain;
        log(monsterName(m.type)+'を倒した！ EXP+'+gain);
        if(p.exp>=p.expNext){
          p.lv++; p.exp-=p.expNext; p.expNext=Math.floor(p.expNext*1.4);
          p.maxhp+=4; p.hp=p.maxhp; p.atk+=1;
          log('レベルアップ！ Lv.'+p.lv+'になった。');
        }
      }
    }
  }
  updateHUD();
}

function update(dt){
  const p=state.player, f=state.floor;
  if(state.over) return;
  let ix=0, iy=0;
  if(joyActive){ ix=joyVec.x; iy=joyVec.y; }
  else {
    if(keysDown.has('ArrowLeft')||keysDown.has('a')||keysDown.has('A')) ix-=1;
    if(keysDown.has('ArrowRight')||keysDown.has('d')||keysDown.has('D')) ix+=1;
    if(keysDown.has('ArrowUp')||keysDown.has('w')||keysDown.has('W')) iy-=1;
    if(keysDown.has('ArrowDown')||keysDown.has('s')||keysDown.has('S')) iy+=1;
    const len=Math.hypot(ix,iy); if(len>1){ ix/=len; iy/=len; }
  }
  if(ix!==0) p.facing=ix>0?1:-1;
  if(atkActive && atkHasAim){ p.aimX=atkAimX; p.aimY=atkAimY; if(atkAimX!==0) p.facing=atkAimX>0?1:-1; }
  else if(joyActive && joyHasAim){ p.aimX=joyAimX; p.aimY=joyAimY; if(joyAimX!==0) p.facing=joyAimX>0?1:-1; }
  else if(ix!==0||iy!==0){ const len=Math.hypot(ix,iy)||1; p.aimX=ix/len; p.aimY=iy/len; }
  moveEntity(p, ix*p.speed*dt, iy*p.speed*dt, f.grid);
  moveEntity(p, p.kx*dt, p.ky*dt, f.grid);
  const damp=Math.max(0,1-dt*8); p.kx*=damp; p.ky*=damp;
  p.atkCd=Math.max(0,p.atkCd-dt); p.hitCd=Math.max(0,p.hitCd-dt);
  p.flash=Math.max(0,p.flash-dt*3.5);
  p.atkPulse=Math.max(0,p.atkPulse-dt*4);
  if(atkActive && atkHasAim && p.atkCd<=0){ doAttack(); }

  for(let i=f.items.length-1;i>=0;i--){
    const it=f.items[i], dx=(it.x+0.5)-p.x, dy=(it.y+0.5)-p.y;
    if(Math.hypot(dx,dy) < p.r+0.4){
      f.items.splice(i,1);
      if(it.type==='sword'){ p.atk+=1; equip.sword++; log('剣のかけらを見つけた。攻撃力+1'); }
      else if(it.type==='shield'){ p.def+=1; equip.shield++; log('盾のかけらを見つけた。防御力+1'); }
      else if(it.type==='charm'){ p.maxhp+=3; p.hp+=3; equip.charm++; log('お守りを見つけた。最大HP+3'); }
      else { inventory.potion++; log('薬草を拾った。(所持:'+inventory.potion+')'); }
      updateHUD(); renderInventory();
    }
  }

  for(let i=f.monsters.length-1;i>=0;i--){
    const m=f.monsters[i];
    if(!m.alive){
      m.deathT-=dt*1.7;
      if(m.deathT<=0){ f.monsters.splice(i,1); }
      continue;
    }
    const dx0=p.x-m.x, dy0=p.y-m.y, d0=Math.hypot(dx0,dy0);
    if(d0<m.aggro && d0>0.02){
      const nx=dx0/d0, ny=dy0/d0;
      if(nx!==0) m.facing=nx>0?1:-1;
      moveEntity(m, nx*m.speed*dt, ny*m.speed*dt, f.grid);
    } else {
      m.wanderT-=dt;
      if(m.wanderT<=0){
        const ang=Math.random()*Math.PI*2;
        if(Math.random()<0.25){ m.wanderDx=0; m.wanderDy=0; }
        else { m.wanderDx=Math.cos(ang); m.wanderDy=Math.sin(ang); }
        m.wanderT=0.6+Math.random()*1.4;
      }
      if(m.wanderDx||m.wanderDy){
        if(m.wanderDx!==0) m.facing=m.wanderDx>0?1:-1;
        moveEntity(m, m.wanderDx*m.speed*0.4*dt, m.wanderDy*m.speed*0.4*dt, f.grid);
      }
    }
    moveEntity(m, m.kx*dt, m.ky*dt, f.grid);
    m.kx*=damp; m.ky*=damp;
    m.flash=Math.max(0,m.flash-dt*3.5);
    m.hitCd=Math.max(0,m.hitCd-dt);

    const dist=Math.hypot(p.x-m.x,p.y-m.y);
    if(dist < p.r+m.r){
      if(p.hitCd<=0 && m.hitCd<=0){
        const dmg=Math.max(1, m.atk-p.def);
        p.hp-=dmg; p.flash=1; p.hitCd=0.55; m.hitCd=0.55;
        state.shake=Math.max(state.shake,0.7);
        const kd=dist||1; p.kx=((p.x-m.x)/kd)*7.5; p.ky=((p.y-m.y)/kd)*7.5;
        updateHUD();
        if(p.hp<=0){ gameOver(); return; }
      }
    }
  }
  const tx=Math.floor(p.x), ty=Math.floor(p.y);
  if(f.grid[ty] && f.grid[ty][tx]===2){
    log('階段を見つけ、地下'+(f.depth+1)+'階へ降りた。');
    p.hp=Math.min(p.maxhp, p.hp+Math.floor(p.maxhp*0.3));
    state.floor=newFloor(f.depth+1, p);
    if(f.depth+1>best){ best=f.depth+1; try{localStorage.setItem('dungeon_best',String(best));}catch(e){} }
    updateHUD();
  }
}

// ---- drawing ----
function drawWall(x,y){
  const g=state.floor.grid, X=x*TS-camPX, Y=y*TS-camPY;
  ctx.fillStyle=PALETTE.wallLo; ctx.fillRect(X,Y,TS,TS);
  const rowOffset=(y%2===0)?0:TS/2;
  ctx.fillStyle=PALETTE.mortar;
  ctx.fillRect(X,Y+TS/2-1,TS,1);
  ctx.fillRect(X+((0+rowOffset)%TS),Y,1,TS/2);
  ctx.fillRect(X+((TS/2+rowOffset)%TS),Y+TS/2,1,TS/2);
  ctx.fillStyle=PALETTE.wallHi;
  ctx.fillRect(X,Y,TS,3);
  const below=tileAt(g,x,y+1);
  if(below!==1){
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(X,Y+TS-5,TS,5);
    ctx.fillStyle=PALETTE.wallHi; ctx.fillRect(X,Y+TS-6,TS,1);
  }
  const right=tileAt(g,x+1,y);
  if(right!==1){ ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(X+TS-3,Y,3,TS); }
  const leftT=tileAt(g,x-1,y);
  if(leftT!==1){ ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(X,Y,3,TS); }
  if(hash(x,y)%11===0 && below!==1){
    const flick=0.7+0.3*Math.sin(tick*0.2+x*3+y);
    ctx.fillStyle=PALETTE.wallHi; ctx.fillRect(X+7,Y+TS-8,6,3);
    ctx.fillStyle=PALETTE.torch; ctx.fillRect(X+8,Y+TS-13,4,5);
    ctx.globalAlpha=flick; ctx.fillStyle=PALETTE.torchCore; ctx.fillRect(X+9,Y+TS-16,2,4); ctx.globalAlpha=1;
  }
}
function drawFloor(x,y,corridor){
  const X=x*TS-camPX, Y=y*TS-camPY;
  if(corridor){
    ctx.fillStyle=((x+y)%2===0)?PALETTE.corA:PALETTE.corB;
    ctx.fillRect(X,Y,TS,TS);
    ctx.fillStyle=PALETTE.corPath; ctx.fillRect(X+7,Y,6,TS);
    const h=hash(x,y);
    if(h%8===0){ ctx.fillStyle=PALETTE.crack; ctx.fillRect(X+3+(h%11),Y+4+(h%9),1,1); }
    return;
  }
  ctx.fillStyle=((x+y)%2===0)?PALETTE.floorA:PALETTE.floorB;
  ctx.fillRect(X,Y,TS,TS);
  const h=hash(x,y);
  if(h%5===0){ ctx.fillStyle=PALETTE.crack; ctx.fillRect(X+2+(h%9),Y+3+(h%6),2,1); ctx.fillRect(X+4+(h%7),Y+9+(h%5),1,3); }
  if(h%13===0){ ctx.fillStyle=PALETTE.crack; ctx.fillRect(X+13,Y+14,3,1); }
}
function drawStairs(x,y){
  const X=x*TS-camPX, Y=y*TS-camPY;
  const glow=0.5+0.5*Math.sin(tick*0.1);
  ctx.fillStyle=PALETTE.stairs;
  ctx.fillRect(X+3,Y+13,14,4); ctx.fillRect(X+6,Y+9,8,4); ctx.fillRect(X+9,Y+5,4,4);
  ctx.globalAlpha=0.25+glow*0.25; ctx.fillStyle=PALETTE.stairsGlow;
  ctx.fillRect(X+8,Y+3,4,3); ctx.globalAlpha=1;
}
function drawItem(x,y,type){
  const X=x*TS-camPX, Y=y*TS-camPY, bob=Math.sin(tick*0.08+x)*1.5;
  if(type==='sword'){
    ctx.fillStyle=PALETTE.swordHilt; ctx.fillRect(X+8,Y+13+bob,4,3);
    ctx.fillStyle=PALETTE.swordBlade; ctx.fillRect(X+9,Y+4+bob,2,10);
    ctx.fillRect(X+6,Y+11+bob,8,2);
    return;
  }
  if(type==='shield'){
    ctx.fillStyle=PALETTE.shieldTrim; ctx.fillRect(X+5,Y+5+bob,10,10);
    ctx.fillStyle=PALETTE.shieldBody; ctx.fillRect(X+6,Y+6+bob,8,7);
    ctx.fillStyle=PALETTE.shieldTrim; ctx.fillRect(X+9,Y+8+bob,2,4);
    return;
  }
  if(type==='charm'){
    const glow=0.5+0.5*Math.sin(tick*0.15);
    ctx.globalAlpha=0.3+glow*0.3; ctx.fillStyle=PALETTE.charmGlow;
    ctx.fillRect(X+6,Y+6+bob,8,8); ctx.globalAlpha=1;
    ctx.fillStyle=PALETTE.charmBody; ctx.fillRect(X+7,Y+7+bob,6,6);
    ctx.fillStyle=PALETTE.charmGlow; ctx.fillRect(X+9,Y+9+bob,2,2);
    return;
  }
  ctx.fillStyle=PALETTE.potionCork; ctx.fillRect(X+9,Y+5+bob,2,3);
  ctx.fillStyle=PALETTE.potion; ctx.fillRect(X+7,Y+8+bob,6,7);
  ctx.fillStyle=PALETTE.potionHi; ctx.fillRect(X+8,Y+9+bob,2,2);
}

function drawCreatureAt(px,py,facing,bobAmt,parts,flashAmt,alpha,seed){
  const bob=Math.sin(tick*0.15+seed*3)*bobAmt;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(px,py+bob);
  ctx.scale(facing,1);
  ctx.fillStyle='rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0,8,7,2.5,0,0,Math.PI*2); ctx.fill();
  parts(ctx);
  if(flashAmt>0.02){
    ctx.globalAlpha=alpha*flashAmt*0.7; ctx.fillStyle='#ffffff';
    ctx.fillRect(-6,-12,12,20);
  }
  ctx.restore();
}

function playerParts(c, swingT){
  c.fillStyle=PALETTE.playerCloakDk; c.fillRect(-6,-2,4,10);
  c.fillStyle=PALETTE.playerCloak; c.fillRect(-6,-3,3,9);
  c.fillStyle=PALETTE.playerBoot; c.fillRect(-4,6,3,3); c.fillRect(1,6,3,3);
  c.fillStyle=PALETTE.playerArmorDk; c.fillRect(-5,-1,10,8);
  c.fillStyle=PALETTE.playerArmor; c.fillRect(-5,-2,10,7);
  c.fillStyle=PALETTE.playerArmorDk; c.fillRect(-5,1,10,1);
  c.fillStyle=PALETTE.playerSkin; c.fillRect(-3,-9,6,6);
  c.fillStyle=PALETTE.playerArmor; c.fillRect(-4,-11,8,3); c.fillRect(-4,-9,2,3);
  c.fillStyle='#2a2016'; c.fillRect(-2,-7,1,1); c.fillRect(1,-7,1,1);
  const ang=(swingT>0.02)?(-1.1+(1-swingT)*2.1):0.5;
  c.save();
  c.translate(6,-2); c.rotate(ang);
  c.fillStyle='#8a8f96'; c.fillRect(-1,-3,2,3);
  c.fillStyle='#cfd6dd'; c.fillRect(-1,-13,2,10);
  c.restore();
}
function goblinParts(c){
  c.fillStyle=PALETTE.goblinSkinDk; c.fillRect(-4,-2,9,8);
  c.fillStyle=PALETTE.goblinSkin; c.fillRect(-4,-3,9,7);
  c.fillStyle=PALETTE.goblinBelt; c.fillRect(-4,1,9,2);
  c.fillStyle='#241d2c'; c.fillRect(-3,6,2,3); c.fillRect(2,6,2,3);
  c.fillStyle=PALETTE.goblinSkin; c.fillRect(-3,-9,7,6);
  c.fillStyle=PALETTE.goblinSkinDk; c.fillRect(-5,-8,2,3); c.fillRect(3,-9,3,3);
  c.fillStyle='#e8402c'; c.fillRect(-1,-7,2,2);
  c.fillStyle=PALETTE.goblinTooth; c.fillRect(1,-4,1,2);
  c.fillStyle='#3a3020'; c.fillRect(5,-5,2,9);
}
function ratParts(c){
  c.fillStyle=PALETTE.ratFurDk; c.fillRect(-8,2,4,1);
  c.fillStyle=PALETTE.ratFur; c.fillRect(-4,-1,9,6);
  c.fillStyle=PALETTE.ratFurDk; c.fillRect(-4,3,9,2);
  c.fillStyle=PALETTE.ratFur; c.fillRect(3,-3,5,3);
  c.fillStyle=PALETTE.ratPink; c.fillRect(7,-2,2,1);
  c.fillStyle=PALETTE.ratFurDk; c.fillRect(4,-4,2,2); c.fillRect(6,-4,2,2);
  c.fillStyle='#1a1620'; c.fillRect(5,-2,1,1);
  c.fillStyle=PALETTE.ratFurDk; c.fillRect(-4,4,2,2); c.fillRect(1,4,2,2);
}
function batParts(c){
  const flap=Math.sin(tick*0.4)*3;
  c.fillStyle=PALETTE.batWing; c.fillRect(-11,-6+flap,7,5); c.fillRect(4,-6-flap,7,5);
  c.fillStyle=PALETTE.batBody; c.fillRect(-3,-6,7,7);
  c.fillStyle=PALETTE.batWing; c.fillRect(-3,-8,2,2); c.fillRect(2,-8,2,2);
  c.fillStyle=PALETTE.batEye; c.fillRect(-1,-4,1,1); c.fillRect(2,-4,1,1);
}
function skeletonParts(c){
  c.fillStyle=PALETTE.boneShadow; c.fillRect(-4,-1,9,8);
  c.fillStyle=PALETTE.boneWhite; c.fillRect(-4,-2,9,7);
  c.fillStyle=PALETTE.boneShadow; c.fillRect(-3,0,7,1); c.fillRect(-3,2,7,1);
  c.fillStyle='#241d2c'; c.fillRect(-3,6,2,3); c.fillRect(2,6,2,3);
  c.fillStyle=PALETTE.boneWhite; c.fillRect(-3,-9,7,6);
  c.fillStyle=PALETTE.boneEye; c.fillRect(-1,-7,2,2); c.fillRect(2,-7,2,2);
  c.fillStyle=PALETTE.boneWeapon; c.fillRect(5,-8,2,13);
  c.fillStyle=PALETTE.boneShadow; c.fillRect(4,-9,4,2);
}

function render(){
  const f=state.floor, p=state.player;
  ctx.fillStyle=PALETTE.wallLo; ctx.fillRect(0,0,cv.width,cv.height);
  updateCamera(p, false);

  let shakeX=0, shakeY=0;
  if(state.shake>0.01){
    shakeX=(Math.random()-0.5)*state.shake*8;
    shakeY=(Math.random()-0.5)*state.shake*8;
    state.shake=Math.max(0,state.shake-0.1);
  } else state.shake=0;
  ctx.save();
  ctx.translate(shakeX,shakeY);

  const sx=Math.max(0,Math.floor(camPX/TS)-1), ex=Math.min(MW-1,Math.ceil((camPX+cv.width)/TS));
  const sy=Math.max(0,Math.floor(camPY/TS)-1), ey=Math.min(MH-1,Math.ceil((camPY+cv.height)/TS));
  for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++){
    const t=f.grid[y][x];
    if(t===1) drawWall(x,y); else { drawFloor(x,y,t===3); if(t===2) drawStairs(x,y); }
  }
  for(const it of f.items){
    if(it.x>=sx-1&&it.x<=ex+1&&it.y>=sy-1&&it.y<=ey+1) drawItem(it.x,it.y,it.type);
  }
  for(const m of f.monsters){
    const alpha=m.alive?1:Math.max(0,m.deathT);
    const drift=m.alive?0:(1-m.deathT)*7;
    const mpx=m.x*TS-camPX, mpy=m.y*TS-camPY-drift;
    const bobAmt=m.type==='goblin'?1:m.type==='skeleton'?0.9:m.type==='bat'?1.4:0.7;
    const partsFn=m.type==='goblin'?goblinParts:m.type==='bat'?batParts:m.type==='skeleton'?skeletonParts:ratParts;
    drawCreatureAt(mpx,mpy,m.facing,bobAmt,partsFn,m.flash,alpha,m.x);
  }
  const ppx=p.x*TS-camPX, ppy=p.y*TS-camPY;
  drawCreatureAt(ppx,ppy,p.facing,1.2,c=>playerParts(c,p.atkPulse),p.flash,1,p.x);
  if(atkActive && atkHasAim){
    const ang=Math.atan2(p.aimY,p.aimX), ha=ATTACK_HALF_ANGLE, rr=ATTACK_RANGE*TS;
    ctx.save(); ctx.translate(ppx,ppy); ctx.rotate(ang);
    ctx.globalAlpha=0.16+0.06*Math.sin(tick*0.25); ctx.fillStyle='#ffe27a';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,rr,-ha,ha); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=0.55; ctx.strokeStyle='#ffe27a'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.arc(0,0,rr,-ha,ha); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  if(p.atkPulse>0.01){
    const t=p.atkPulse, ang=p.atkAngle, ha=ATTACK_HALF_ANGLE;
    const innerR=TS*0.6, outerR=ATTACK_RANGE*TS*0.95;
    ctx.save();
    ctx.translate(ppx,ppy); ctx.rotate(ang);
    ctx.beginPath();
    ctx.arc(0,0,outerR,-ha,ha);
    ctx.arc(0,0,innerR,ha,-ha,true);
    ctx.closePath();
    const grad=ctx.createLinearGradient(innerR,0,outerR,0);
    grad.addColorStop(0,'rgba(255,255,255,0)');
    grad.addColorStop(0.55,'rgba(255,226,122,'+(0.5*t)+')');
    grad.addColorStop(1,'rgba(255,255,255,'+(0.9*t)+')');
    ctx.fillStyle=grad; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,'+(0.85*t)+')'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(0,0,outerR,-ha,ha); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  const grad=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.height*0.35,cv.width/2,cv.height/2,cv.height*0.85);
  grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(1,'rgba(0,0,0,0.45)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,cv.width,cv.height);
  if(p.flash>0.02){ ctx.fillStyle='rgba(200,30,30,'+(p.flash*0.25)+')'; ctx.fillRect(0,0,cv.width,cv.height); }
}

let lastT=null;
function loop(now){
  if(lastT===null) lastT=now;
  const dt=Math.min(0.05,(now-lastT)/1000); lastT=now;
  tick++;
  if(state){ update(dt); render(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---- input ----
const keysDown=new Set();
window.addEventListener('keydown', e=>{
  keysDown.add(e.key);
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  if(e.key===' '||e.key==='j'||e.key==='J'){ e.preventDefault(); doAttack(); }
});
window.addEventListener('keyup', e=>{ keysDown.delete(e.key); });

let joyActive=false, joyId=null; const joyVec={x:0,y:0};
let joyAimX=1, joyAimY=0, joyHasAim=false;
let joyAnchor={x:0,y:0};
const joyZone=document.getElementById('joyZone'), joyThumb=document.getElementById('joyThumb');
const box=document.getElementById('canvasBox');
const JOY_R=32;
function joyShowAt(clientX,clientY){
  const rect=box.getBoundingClientRect();
  let lx=clientX-rect.left, ly=clientY-rect.top;
  lx=Math.max(44,Math.min(rect.width-44,lx));
  ly=Math.max(44,Math.min(rect.height-44,ly));
  joyZone.style.left=(lx-44)+'px'; joyZone.style.top=(ly-44)+'px';
  joyZone.style.display='block';
  joyAnchor.x=rect.left+lx; joyAnchor.y=rect.top+ly;
  joyThumb.style.left='25px'; joyThumb.style.top='25px';
}
function joyUpdate(clientX,clientY){
  const dx=clientX-joyAnchor.x, dy=clientY-joyAnchor.y;
  const dist=Math.hypot(dx,dy), clamped=Math.min(dist,JOY_R), ang=Math.atan2(dy,dx);
  joyThumb.style.left=(25+Math.cos(ang)*clamped)+'px';
  joyThumb.style.top=(25+Math.sin(ang)*clamped)+'px';
  const mag=dist>4?Math.min(1,dist/JOY_R):0;
  joyVec.x=Math.cos(ang)*mag; joyVec.y=Math.sin(ang)*mag;
  if(dist>2){ joyAimX=Math.cos(ang); joyAimY=Math.sin(ang); joyHasAim=true; }
  else joyHasAim=false;
}

let atkActive=false, atkId=null;
let atkAimX=1, atkAimY=0, atkHasAim=false;
let atkAnchor={x:0,y:0};
const atkJoyZone=document.getElementById('atkJoyZone'), atkJoyThumb=document.getElementById('atkJoyThumb');
function atkJoyShowAt(clientX,clientY){
  const rect=box.getBoundingClientRect();
  let lx=clientX-rect.left, ly=clientY-rect.top;
  lx=Math.max(44,Math.min(rect.width-44,lx));
  ly=Math.max(44,Math.min(rect.height-44,ly));
  atkJoyZone.style.left=(lx-44)+'px'; atkJoyZone.style.top=(ly-44)+'px';
  atkJoyZone.style.display='block';
  atkAnchor.x=rect.left+lx; atkAnchor.y=rect.top+ly;
  atkJoyThumb.style.left='25px'; atkJoyThumb.style.top='25px';
}
function atkJoyUpdate(clientX,clientY){
  const dx=clientX-atkAnchor.x, dy=clientY-atkAnchor.y;
  const dist=Math.hypot(dx,dy), clamped=Math.min(dist,JOY_R), ang=Math.atan2(dy,dx);
  atkJoyThumb.style.left=(25+Math.cos(ang)*clamped)+'px';
  atkJoyThumb.style.top=(25+Math.sin(ang)*clamped)+'px';
  if(dist>4){ atkAimX=Math.cos(ang); atkAimY=Math.sin(ang); atkHasAim=true; }
  else atkHasAim=false;
}

box.addEventListener('pointerdown', e=>{
  const rect=box.getBoundingClientRect();
  const isRight=(e.clientX-rect.left) > rect.width/2;
  if(isRight){
    if(atkActive) return;
    atkActive=true; atkId=e.pointerId;
    try{box.setPointerCapture(atkId);}catch(err){}
    atkJoyShowAt(e.clientX,e.clientY); atkHasAim=false;
  } else {
    if(joyActive) return;
    joyActive=true; joyId=e.pointerId;
    try{box.setPointerCapture(joyId);}catch(err){}
    joyShowAt(e.clientX,e.clientY);
    joyVec.x=0; joyVec.y=0; joyHasAim=false;
  }
});
box.addEventListener('pointermove', e=>{
  if(joyActive && e.pointerId===joyId) joyUpdate(e.clientX,e.clientY);
  if(atkActive && e.pointerId===atkId) atkJoyUpdate(e.clientX,e.clientY);
});
function ptrEnd(e){
  if(e.pointerId===joyId){ joyActive=false; joyId=null; joyZone.style.display='none'; joyVec.x=0; joyVec.y=0; joyHasAim=false; }
  if(e.pointerId===atkId){ atkActive=false; atkId=null; atkJoyZone.style.display='none'; atkHasAim=false; }
}
box.addEventListener('pointerup', ptrEnd);
box.addEventListener('pointercancel', ptrEnd);

document.getElementById('overBtn').addEventListener('click', ()=>{
  document.getElementById('overlay').style.display='none';
  logEl.innerHTML=''; newGame();
});

function fitCanvasBox(){
  const wrap=document.querySelector('.wrap');
  const vh=(window.visualViewport?window.visualViewport.height:window.innerHeight);
  let used=0;
  for(const child of wrap.children){ if(child!==box) used+=child.getBoundingClientRect().height; }
  const gap=parseFloat(getComputedStyle(wrap).gap)||6;
  used+=gap*(wrap.children.length-1);
  const h1=document.querySelector('h1');
  const bodyStyle=getComputedStyle(document.body);
  const chrome=(h1?h1.getBoundingClientRect().height:0)+parseFloat(bodyStyle.paddingTop)+parseFloat(bodyStyle.paddingBottom)+6;
  const availH=Math.max(120, vh-used-chrome-10);
  const availW=Math.max(200, wrap.clientWidth);
  const ratio=640/384;
  let w=availW, h=w/ratio;
  if(h>availH){ h=availH; w=h*ratio; }
  box.style.width=Math.round(w)+'px';
  box.style.height=Math.round(h)+'px';
}
window.addEventListener('resize', fitCanvasBox);
window.addEventListener('orientationchange', ()=>setTimeout(fitCanvasBox,80));
if(window.visualViewport) window.visualViewport.addEventListener('resize', fitCanvasBox);

newGame();
fitCanvasBox();
requestAnimationFrame(fitCanvasBox);
})();
