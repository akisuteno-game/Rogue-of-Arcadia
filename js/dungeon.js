"use strict";
// ---- Procedural dungeon generation (rooms, corridors, monsters, items) ----
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

function newTown(player){
  const grid=[]; for(let y=0;y<MH;y++) grid.push(new Array(MW).fill(1));
  const cx=Math.floor(MW/2), cy=Math.floor(MH/2);
  const w=18, h=13;
  const x0=cx-Math.floor(w/2), y0=cy-Math.floor(h/2);
  for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++) grid[y][x]=0;
  const entX=cx, entY=y0+1;
  grid[entY][entX]=4;
  player.x=cx+0.5; player.y=y0+h-2+0.5; player.kx=0; player.ky=0; player.flash=0;
  updateCamera(player, true);
  return {grid, monsters:[], items:[], stairsX:-1, stairsY:-1, depth:0, isTown:true};
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
