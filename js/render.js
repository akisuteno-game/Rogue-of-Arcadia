"use strict";
// ---- Camera & all canvas drawing (tiles, items, creatures, effects) ----
let camPX=0, camPY=0;
function updateCamera(player, snap){
  const maxCamX=Math.max(0, MW*TS-cv.width);
  const maxCamY=Math.max(0, MH*TS-cv.height);
  const tx=Math.min(maxCamX, Math.max(0, player.x*TS-cv.width/2));
  const ty=Math.min(maxCamY, Math.max(0, player.y*TS-cv.height/2));
  if(snap){ camPX=tx; camPY=ty; } else { camPX=lerp(camPX,tx,0.16); camPY=lerp(camPY,ty,0.16); }
}

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
function drawPortal(x,y){
  const X=x*TS-camPX, Y=y*TS-camPY;
  const glow=0.5+0.5*Math.sin(tick*0.1);
  ctx.fillStyle=PALETTE.portalRing; ctx.fillRect(X+3,Y+1,14,18);
  ctx.fillStyle=PALETTE.portalCore; ctx.fillRect(X+5,Y+3,10,14);
  ctx.globalAlpha=0.4+glow*0.4; ctx.fillStyle=PALETTE.portalGlow;
  ctx.fillRect(X+6,Y+5,8,10);
  ctx.globalAlpha=1;
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

function render(){
  const f=state.floor, p=state.player;
  updateCamera(p, false);
  const sx=Math.max(0,Math.floor(camPX/TS)-1), ex=Math.min(MW-1,Math.ceil((camPX+cv.width)/TS));
  const sy=Math.max(0,Math.floor(camPY/TS)-1), ey=Math.min(MH-1,Math.ceil((camPY+cv.height)/TS));
  const ppx=p.x*TS-camPX, ppy=p.y*TS-camPY;

  if(f.isTown){
    const sky=ctx.createLinearGradient(0,0,0,cv.height);
    sky.addColorStop(0,'#bfe8f7'); sky.addColorStop(1,'#eaf7d8');
    ctx.fillStyle=sky; ctx.fillRect(0,0,cv.width,cv.height);
    drawTownWorld(f, sx, ex, sy, ey, ()=>drawCreatureAt(ppx,ppy,p.facing,1.2,c=>playerParts(c,p.atkPulse),p.flash,1,p.x));
    return;
  }

  ctx.fillStyle=PALETTE.wallLo; ctx.fillRect(0,0,cv.width,cv.height);

  let shakeX=0, shakeY=0;
  if(state.shake>0.01){
    shakeX=(Math.random()-0.5)*state.shake*8;
    shakeY=(Math.random()-0.5)*state.shake*8;
    state.shake=Math.max(0,state.shake-0.1);
  } else state.shake=0;
  ctx.save();
  ctx.translate(shakeX,shakeY);

  for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++){
    const t=f.grid[y][x];
    if(t===1) drawWall(x,y); else { drawFloor(x,y,t===3); if(t===2) drawStairs(x,y); else if(t===4) drawPortal(x,y); }
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
