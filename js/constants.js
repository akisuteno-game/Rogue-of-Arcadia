"use strict";
// ---- Core tunables & shared data tables ----
const TS=20, MW=96, MH=64;

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
  charmBody:'#a860c9', charmGlow:'#e8b8ff',
  portalCore:'#8a5fe0', portalGlow:'#c9a8ff', portalRing:'#5a3ca8',
  goldCoin:'#f0c239', goldCoinDk:'#b8860b'
};

const ZOOM=2.1;

const SHOP_ITEMS={
  potion:{icon:'🧪', name:'薬草', cost:4},
  sword:{icon:'⚔️', name:'剣のかけら', cost:10},
  shield:{icon:'🛡️', name:'盾のかけら', cost:10},
  charm:{icon:'🧿', name:'お守り', cost:16}
};

const MONSTER_DEFS={
  rat:{hpBase:3,hpPerDepth:0.5,atkBase:1,atkPerDepth:0,speed:2.5,r:0.26,aggro:4.5,exp:3},
  goblin:{hpBase:6,hpPerDepth:1,atkBase:2,atkPerDepth:0.5,speed:1.5,r:0.34,aggro:5.5,exp:6},
  bat:{hpBase:2,hpPerDepth:0.35,atkBase:1,atkPerDepth:0,speed:3.3,r:0.22,aggro:6,exp:4},
  skeleton:{hpBase:9,hpPerDepth:1.2,atkBase:3,atkPerDepth:0.6,speed:1.1,r:0.36,aggro:5,exp:9}
};

const ATTACK_RANGE=1.8, ATTACK_HALF_ANGLE=10*Math.PI/180, ATTACK_CD=0.65;
