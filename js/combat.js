"use strict";
// ---- Collision, attacking, and the per-frame game-state update ----
function tileAt(g,x,y){ if(x<0||y<0||x>=MW||y>=MH) return 1; return g[y][x]; }
function isBlocking(v){ return v===1||v===7; }

function moveEntity(e,dx,dy,grid){
  if(dx!==0){
    const nx=e.x+dx, edge=nx+(dx>0?e.r:-e.r), tx=Math.floor(edge);
    const y1=Math.floor(e.y-e.r+0.001), y2=Math.floor(e.y+e.r-0.001);
    let blocked=false;
    for(let ty=y1; ty<=y2; ty++){ if(isBlocking(tileAt(grid,tx,ty))){blocked=true;break;} }
    if(!blocked) e.x=nx;
  }
  if(dy!==0){
    const ny=e.y+dy, edge=ny+(dy>0?e.r:-e.r), ty=Math.floor(edge);
    const x1=Math.floor(e.x-e.r+0.001), x2=Math.floor(e.x+e.r-0.001);
    let blocked=false;
    for(let tx=x1; tx<=x2; tx++){ if(isBlocking(tileAt(grid,tx,ty))){blocked=true;break;} }
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

  if(f.isTown){ updateTown(dt); return; }

  for(let i=f.items.length-1;i>=0;i--){
    const it=f.items[i], dx=(it.x+0.5)-p.x, dy=(it.y+0.5)-p.y;
    if(Math.hypot(dx,dy) < p.r+0.4){
      f.items.splice(i,1);
      if(it.type==='gold'){ p.gold=(p.gold||0)+it.amount; log('金貨を'+it.amount+'枚拾った。'); updateHUD(); }
      else grantItem(it.type);
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
