"use strict";
// ---- Pixel-art part drawers for player & monsters (called via drawCreatureAt) ----
function playerParts(c, hideSword){
  c.fillStyle=PALETTE.playerCloakDk; c.fillRect(-6,-2,4,10);
  c.fillStyle=PALETTE.playerCloak; c.fillRect(-6,-3,3,9);
  c.fillStyle=PALETTE.playerBoot; c.fillRect(-4,6,3,3); c.fillRect(1,6,3,3);
  c.fillStyle=PALETTE.playerArmorDk; c.fillRect(-5,-1,10,8);
  c.fillStyle=PALETTE.playerArmor; c.fillRect(-5,-2,10,7);
  c.fillStyle=PALETTE.playerArmorDk; c.fillRect(-5,1,10,1);
  c.fillStyle=PALETTE.playerSkin; c.fillRect(-3,-9,6,6);
  c.fillStyle=PALETTE.playerArmor; c.fillRect(-4,-11,8,3); c.fillRect(-4,-9,2,3);
  c.fillStyle='#2a2016'; c.fillRect(-2,-7,1,1); c.fillRect(1,-7,1,1);
  if(!hideSword){
    c.fillStyle='#8a8f96'; c.fillRect(5,-8,2,3);
    c.fillStyle='#cfd6dd'; c.fillRect(5,-6,2,12);
  }
}
// While actually swinging (atkPulse>0), the sword above is hidden and
// drawPlayerWeapon() in render.js draws a separate world-space blade that
// truly points toward the attacked direction, regardless of body facing.
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
function merchantParts(c){
  c.fillStyle='#6a4a2c'; c.fillRect(-4,6,3,3); c.fillRect(2,6,3,3);
  c.fillStyle='#8a5a2c'; c.fillRect(-5,-2,11,9);
  c.fillStyle='#c99a4a'; c.fillRect(-5,-3,11,3);
  c.fillStyle='#5a3a1c'; c.fillRect(-5,2,11,2);
  c.fillStyle='#e8c18a'; c.fillRect(-3,-9,7,6);
  c.fillStyle='#c9963c'; c.fillRect(-4,-12,9,4);
  c.fillStyle='#8a5a2c'; c.fillRect(-5,-9,2,3); c.fillRect(4,-9,2,3);
  c.fillStyle='#2a2016'; c.fillRect(-2,-7,1,1); c.fillRect(1,-7,1,1);
  c.fillStyle='#5a3a1c'; c.fillRect(-2,-5,4,1);
}
