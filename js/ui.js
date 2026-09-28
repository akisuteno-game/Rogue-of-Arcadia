"use strict";
// ---- HUD, inventory bar, message log ----
let best=1;
try{ const b=localStorage.getItem('dungeon_best'); if(b) best=parseInt(b,10)||1; }catch(e){}

let inventory={potion:0};
let equip={sword:0,shield:0,charm:0};

const logEl=document.getElementById('log');
function log(msg){
  const d=document.createElement('div'); d.textContent=msg;
  logEl.appendChild(d);
  while(logEl.children.length>40) logEl.removeChild(logEl.firstChild);
  logEl.scrollTop=logEl.scrollHeight;
}

function updateHUD(){
  const p=state.player, f=state.floor;
  const loc=document.getElementById('locLabel');
  loc.innerHTML = f.isTown ? '<b>アルカディア</b>(拠点)' : '地下 <b>'+f.depth+'</b>階';
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

function openShop(npc){
  const box=document.getElementById('npcDialogue');
  box.querySelector('.who').textContent=npc.name;
  box.querySelector('.line').textContent=npc.lines[rnd(npc.lines.length)];
  box.style.display='flex';
}
function closeShop(){
  document.getElementById('npcDialogue').style.display='none';
}
