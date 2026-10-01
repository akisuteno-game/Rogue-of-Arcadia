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
  document.getElementById('goldNum').textContent=p.gold||0;
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

function grantItem(type){
  const p=state.player;
  if(type==='sword'){ p.atk+=1; equip.sword++; log('剣のかけらを手に入れた。攻撃力+1'); }
  else if(type==='shield'){ p.def+=1; equip.shield++; log('盾のかけらを手に入れた。防御力+1'); }
  else if(type==='charm'){ p.maxhp+=3; p.hp+=3; equip.charm++; log('お守りを手に入れた。最大HP+3'); }
  else { inventory.potion++; log('薬草を手に入れた。(所持:'+inventory.potion+')'); }
  updateHUD(); renderInventory();
}

function buyItem(key){
  const def=SHOP_ITEMS[key], p=state.player;
  if(!p || state.over) return;
  if((p.gold||0)<def.cost){ log(def.name+'を買うには'+def.cost+'G必要。お金が足りない…'); return; }
  p.gold-=def.cost;
  log(def.cost+'Gで'+def.name+'を購入した。');
  grantItem(key);
}

function openShop(npc){
  const box=document.getElementById('npcDialogue');
  box.querySelector('.who').textContent=npc.name;
  box.querySelector('.line').textContent=npc.lines[rnd(npc.lines.length)];
  const row=document.getElementById('shopRow');
  row.innerHTML='';
  if(npc.shop){
    for(const key of npc.shop){
      const def=SHOP_ITEMS[key];
      const btn=document.createElement('button');
      btn.className='shopBtn';
      btn.innerHTML='<span>'+def.icon+'</span><span class="cost">'+def.cost+'G</span>';
      btn.addEventListener('click', ()=>buyItem(key));
      row.appendChild(btn);
    }
  }
  box.style.display='flex';
}
function closeShop(){
  document.getElementById('npcDialogue').style.display='none';
}
