"use strict";
// ---- Keyboard + dual on-screen stick input (left=move, right=attack) ----
const keysDown=new Set();
window.addEventListener('keydown', e=>{
  keysDown.add(e.key);
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  if(e.key===' '||e.key==='j'||e.key==='J'){ e.preventDefault(); doAttack(); }
});
window.addEventListener('keyup', e=>{ keysDown.delete(e.key); });

const box=document.getElementById('canvasBox');

let joyActive=false, joyId=null; const joyVec={x:0,y:0};
let joyAimX=1, joyAimY=0, joyHasAim=false;
let joyAnchor={x:0,y:0};
const joyZone=document.getElementById('joyZone'), joyThumb=document.getElementById('joyThumb');
const JOY_R=40;
function joyShowAt(clientX,clientY){
  const rect=box.getBoundingClientRect();
  let lx=clientX-rect.left, ly=clientY-rect.top;
  lx=Math.max(56,Math.min(rect.width-56,lx));
  ly=Math.max(56,Math.min(rect.height-56,ly));
  joyZone.style.left=(lx-56)+'px'; joyZone.style.top=(ly-56)+'px';
  joyZone.style.display='block';
  joyAnchor.x=rect.left+lx; joyAnchor.y=rect.top+ly;
  joyThumb.style.left='32px'; joyThumb.style.top='32px';
}
function joyUpdate(clientX,clientY){
  const dx=clientX-joyAnchor.x, dy=clientY-joyAnchor.y;
  const dist=Math.hypot(dx,dy), clamped=Math.min(dist,JOY_R), ang=Math.atan2(dy,dx);
  joyThumb.style.left=(32+Math.cos(ang)*clamped)+'px';
  joyThumb.style.top=(32+Math.sin(ang)*clamped)+'px';
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
  lx=Math.max(56,Math.min(rect.width-56,lx));
  ly=Math.max(56,Math.min(rect.height-56,ly));
  atkJoyZone.style.left=(lx-56)+'px'; atkJoyZone.style.top=(ly-56)+'px';
  atkJoyZone.style.display='block';
  atkAnchor.x=rect.left+lx; atkAnchor.y=rect.top+ly;
  atkJoyThumb.style.left='32px'; atkJoyThumb.style.top='32px';
}
function atkJoyUpdate(clientX,clientY){
  const dx=clientX-atkAnchor.x, dy=clientY-atkAnchor.y;
  const dist=Math.hypot(dx,dy), clamped=Math.min(dist,JOY_R), ang=Math.atan2(dy,dx);
  atkJoyThumb.style.left=(32+Math.cos(ang)*clamped)+'px';
  atkJoyThumb.style.top=(32+Math.sin(ang)*clamped)+'px';
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
  if(e.pointerId===atkId){
    if(atkHasAim){ state.player.aimX=atkAimX; state.player.aimY=atkAimY; doAttack(); }
    atkActive=false; atkId=null; atkJoyZone.style.display='none'; atkHasAim=false;
  }
}
box.addEventListener('pointerup', ptrEnd);
box.addEventListener('pointercancel', ptrEnd);
