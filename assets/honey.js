// assets/honey.js
// Tiny Tamagotchi for Honey the chihuahua — no death, ever 💖
(() => {
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const sprite = $('#honeySprite');
const moodEl = $('#honeyMood');
const msgEl  = $('#honeyMsg');

const bars = {
  food:   $('#barFood'),
  water:  $('#barWater'),
  fun:    $('#barFun'),
  energy: $('#barEnergy'),
};

const buttons = {
  feed:  $('#btnFeed'),
  drink: $('#btnDrink'),
  play:  $('#btnPlay'),
  nap:   $('#btnNap'),
};

const SAVE_KEY = 'honey.save.v1';

// state: 0..100 meters (higher is better)
let state = loadState() || {
  name: 'Honey',
  food: 80,
  water: 80,
  fun: 75,
  energy: 70,
  last: Date.now(),
};

// decay rates per minute (tune to taste)
const DECAY = {
  food:   2.2,
  water:  2.6,
  fun:    1.8,
  energy: 1.4,
};

// action effects
const FX = {
  feed:  { food: +24, energy: +6,  msg: 'munch munch~' },
  drink: { water: +26,             msg: 'slurp slurp~' },
  play:  { fun: +24, energy: -8,   msg: 'zoomies!!'   },
  nap:   { energy: +26, fun: +4,   msg: 'zzz…'        },
};

// tick every 10s, but also catch up from last visit
const TICK_MS = 10000;

init();
start();

function init(){
  // idle animation by default
  if (!prefersReduced) sprite.classList.add('idle');

  // wire buttons
  buttons.feed.addEventListener('click', () => act('feed'));
  buttons.drink.addEventListener('click', () => act('drink'));
  buttons.play.addEventListener('click', () => act('play'));
  buttons.nap.addEventListener('click', () => act('nap'));

  // resume from last time
  catchUp();
  render();
}

// reduce meters based on elapsed minutes since last save
function catchUp(){
  const now = Date.now();
  const mins = Math.max(0, (now - (state.last || now)) / 60000);
  decay(mins);
  state.last = now;
  saveState();
}

function start(){
  setInterval(() => {
    decay(TICK_MS/60000);
    render();
    saveState();
  }, TICK_MS);
}

function decay(minutes){
  // never below 0, but Honey doesn’t die
  for (const k of ['food','water','fun','energy']){
    state[k] = clamp(state[k] - DECAY[k]*minutes, 0, 100);
  }
}

function act(type){
  const fx = FX[type];
  if (!fx) return;
  // small cooldown feedback
  pulse(buttons[type]);
  if (!prefersReduced){
    if (type === 'play') sprite.classList.add('hop');
    if (type === 'feed' || type === 'drink') sprite.classList.add('wag');
    setTimeout(()=>{ sprite.classList.remove('hop','wag'); }, 650);
  }
  // apply changes
  for (const k of Object.keys(DECAY)){
    if (fx[k]) state[k] = clamp(state[k] + fx[k], 0, 100);
  }
  state.last = Date.now();
  msgEl.textContent = fx.msg;
  render();
  saveState();
}

function render(){
  // update bars
  bars.food.style.width   = `${state.food.toFixed(0)}%`;
  bars.water.style.width  = `${state.water.toFixed(0)}%`;
  bars.fun.style.width    = `${state.fun.toFixed(0)}%`;
  bars.energy.style.width = `${state.energy.toFixed(0)}%`;

  // color feedback (low = more pink)
  setBarColor(bars.food,   state.food);
  setBarColor(bars.water,  state.water);
  setBarColor(bars.fun,    state.fun);
  setBarColor(bars.energy, state.energy);

  // mood
  const avg = (state.food + state.water + state.fun + state.energy) / 4;
  let mood = 'happy ✨';
  if (avg < 75) mood = 'content 💖';
  if (avg < 55) mood = 'needy 🥺';
  if (avg < 35) mood = 'sleepy 😴';
  if (state.energy < 12) mood = 'napping… 😴';
  moodEl.textContent = mood;

  // sleepy look when energy low
  const eyeColor = avg < 45 ? '#4a355c' : '#2c2137';
  sprite.querySelectorAll('rect[fill="#2c2137"]').forEach(r => r.setAttribute('fill', eyeColor));
}

function setBarColor(el, val){
  // shift gradient subtly based on value
  const p = Math.max(0, Math.min(100, val));
  const a = 0.25 + (p/100)*0.5; // 0.25..0.75
  el.style.background = `linear-gradient(90deg, rgba(251,196,217,${a}), rgba(217,204,255,${a}))`;
}

function pulse(btn){
  const old = btn.style.transform;
  btn.style.transform = 'translate(-1px,-1px) scale(0.98)';
  setTimeout(()=> btn.style.transform = old, 110);
}

function saveState(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function loadState(){ try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
})();