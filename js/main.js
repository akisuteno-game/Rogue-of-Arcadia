"use strict";
// ---- Entry point: canvas setup, game state, main loop, boot ----
const cv=document.getElementById('cv'), ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;

let state=null, tick=0;

function newGame(){
  const player={hp:12,maxhp:12,atk:3,def:0,lv:1,exp:0,expNext:10,x:0,y:0,facing:1,
    flash:0,kx:0,ky:0,atkCd:0,hitCd:0,r:0.3,speed:3.4,atkPulse:0,aimX:1,aimY:0,atkAngle:0};
  const floor=newTown(player);
  state={player, floor, over:false, shake:0, nearNpc:null};
  inventory={potion:0}; equip={sword:0,shield:0,charm:0};
  log('アルカディアの街に戻ってきた。光る入り口から迷宮へ向かおう。');
  updateHUD(); renderInventory();
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

document.getElementById('overBtn').addEventListener('click', ()=>{
  document.getElementById('overlay').style.display='none';
  logEl.innerHTML=''; newGame();
});

function resizeCanvas(){
  const rect=box.getBoundingClientRect();
  cv.width=Math.max(200,Math.round(rect.width));
  cv.height=Math.max(150,Math.round(rect.height));
  ctx.imageSmoothingEnabled=false;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', ()=>setTimeout(resizeCanvas,80));
if(window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
resizeCanvas();

newGame();
