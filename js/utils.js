"use strict";
// ---- Small stateless helpers used across the game ----
function lerp(a,b,t){ return a+(b-a)*t; }
function rnd(n){ return Math.floor(Math.random()*n); }
function rndRange(a,b){ return a+rnd(b-a+1); }
function hash(x,y){ let h=(x*928371+y*123457+7)>>>0; h=(h^(h>>13))*2246822519>>>0; return h; }
function monsterName(t){ return t==='goblin'?'ゴブリン':t==='bat'?'コウモリ':t==='skeleton'?'スケルトン':'ネズミ'; }
