(()=>{'use strict';
// Edit this list to add tracks. MP3s belong in the music/ folder in the repository.


const TRACKS = [
  {
    title: 'Luv Bug',
    artist: '박건욱',
    file: 'music/Luv%20Bug.mp3'
  },
  {
    title: 'Day After Day',
    artist: '박건욱',
    file: 'music/Day%20After%20Day.mp3'
  },
  {
    title: '솔직하지 못해서',
    artist: '박건욱, 김태래',
    file: 'music/%EC%86%94%EC%A7%81%ED%95%98%EC%A7%80%20%EB%AA%BB%ED%95%B4%EC%84%9C.mp3'
  },
  {
    title: 'Placebo',
    artist: '박건욱',
    file: 'music/Placebo.mp3'
  },
  {
    title: 'Customize',
    artist: '제로베이스원',
    file: 'music/Customize.mp3'
  }
];


const widget=document.createElement('aside');widget.className='bgm-widget';widget.setAttribute('aria-label','배경음악 플레이어');
widget.innerHTML=`<div class="bgm-window"><div class="bgm-titlebar"><span>♫ GUNWOOK MUSIC PLAYER</span><button type="button" id="bgmMinimize" aria-label="음악 플레이어 접기" aria-expanded="true">−</button></div><div class="bgm-content"><div class="bgm-track"><span class="bgm-disc" aria-hidden="true">♫</span><div class="bgm-track-info"><div class="bgm-name" id="bgmName">음악을 추가해 주세요 ♡</div><div class="bgm-state" id="bgmState" role="status">일시정지</div></div></div><div class="bgm-controls"><button type="button" id="bgmPrev" aria-label="이전 곡">⏮</button><button type="button" class="bgm-play" id="bgmPlay" aria-label="재생">▶</button><button type="button" id="bgmNext" aria-label="다음 곡">⏭</button></div><label class="bgm-volume">🔉 <input type="range" id="bgmVolume" min="0" max="100" value="35" aria-label="음량"><span id="bgmVolumeValue">35%</span></label><button type="button" class="bgm-list-toggle" id="bgmPlaylistToggle" aria-expanded="false">☷ PLAYLIST ▾</button><ol class="bgm-list" id="bgmPlaylist" hidden></ol></div></div>`;
document.body.append(widget);
const $=id=>widget.querySelector('#'+id),audio=new Audio();audio.preload='none';audio.volume=.35;let current=0;let userPaused=false;let firstInteractionHandled=false;
const safeTracks=TRACKS.filter(t=>t&&typeof t.file==='string'&&t.file.trim()&&typeof t.title==='string');
const name=()=>safeTracks[current]?safeTracks[current].title+(safeTracks[current].artist?' — '+safeTracks[current].artist:''):'음악을 추가해 주세요 ♡';
function sync(){ $('bgmName').textContent=name();$('bgmPlay').textContent=audio.paused?'▶':'Ⅱ';$('bgmPlay').setAttribute('aria-label',audio.paused?'재생':'일시정지');if(!audio.error)$('bgmState').textContent=audio.paused?'일시정지':'♪ 재생 중';[...$('bgmPlaylist').querySelectorAll('button')].forEach((b,i)=>b.setAttribute('aria-current',String(i===current)))}
function load(i){if(!safeTracks.length)return;current=(i+safeTracks.length)%safeTracks.length;audio.src=safeTracks[current].file;audio.load();sync()}
async function play(){if(!safeTracks.length){$('bgmState').textContent='먼저 MP3 파일을 등록해 주세요';return}if(!audio.src)load(current);try{await audio.play();sync()}catch(e){$('bgmState').textContent='음악 파일을 확인해 주세요';sync()}}
function step(delta){if(!safeTracks.length)return;const wasPlaying=!audio.paused;load(current+delta);if(wasPlaying)play()}
$('bgmPlay').onclick=()=>{if(audio.paused){userPaused=false;play()}else{userPaused=true;audio.pause();sync()}};$('bgmPrev').onclick=()=>step(-1);$('bgmNext').onclick=()=>step(1);
$('bgmVolume').oninput=e=>{audio.volume=Number(e.target.value)/100;$('bgmVolumeValue').textContent=e.target.value+'%'};
$('bgmPlaylistToggle').onclick=()=>{const open=$('bgmPlaylist').hidden;$('bgmPlaylist').hidden=!open;$('bgmPlaylistToggle').setAttribute('aria-expanded',String(open));$('bgmPlaylistToggle').textContent=open?'☷ PLAYLIST ▴':'☷ PLAYLIST ▾'};
$('bgmMinimize').onclick=()=>{const closed=widget.classList.toggle('bgm-minimized');$('bgmMinimize').textContent=closed?'+':'−';$('bgmMinimize').setAttribute('aria-expanded',String(!closed));requestAnimationFrame(keepWindowVisible)};
// Drag the music window by its title bar (desktop only).
// Position is stored in this browser; the music controls continue working normally.
const dragBar=widget.querySelector('.bgm-titlebar');
const dragKey='gunwook-bgm-window-position-v1';
const desktopDrag=window.matchMedia('(min-width: 601px) and (pointer: fine)');
let dragState=null;
const clamp=(v,min,max)=>Math.max(min,Math.min(v,Math.max(min,max)));
function setWindowPosition(x,y){
  const w=widget.getBoundingClientRect().width;
  const h=widget.getBoundingClientRect().height;
  widget.style.left=clamp(x,0,window.innerWidth-w)+'px';
  widget.style.top=clamp(y,0,window.innerHeight-h)+'px';
  widget.style.right='auto';widget.style.bottom='auto';
}
function restoreWindowPosition(){
  if(!desktopDrag.matches){
    widget.style.removeProperty('left');widget.style.removeProperty('top');
    widget.style.removeProperty('right');widget.style.removeProperty('bottom');
    return;
  }
  try{
    const p=JSON.parse(localStorage.getItem(dragKey)||'null');
    if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))setWindowPosition(p.x,p.y);
  }catch(e){}
}
function keepWindowVisible(){
  if(!desktopDrag.matches){restoreWindowPosition();return;}
  if(widget.style.left){
    setWindowPosition(parseFloat(widget.style.left),parseFloat(widget.style.top));
    try{localStorage.setItem(dragKey,JSON.stringify({x:parseFloat(widget.style.left),y:parseFloat(widget.style.top)}));}catch(e){}
  }else restoreWindowPosition();
}
dragBar.addEventListener('pointerdown',e=>{
  if(!desktopDrag.matches||e.button!==0||e.target.closest('button'))return;
  const rect=widget.getBoundingClientRect();
  dragState={id:e.pointerId,dx:e.clientX-rect.left,dy:e.clientY-rect.top};
  dragBar.setPointerCapture(e.pointerId);
  widget.classList.add('bgm-dragging');
  e.preventDefault();
});
dragBar.addEventListener('pointermove',e=>{
  if(!dragState||e.pointerId!==dragState.id)return;
  setWindowPosition(e.clientX-dragState.dx,e.clientY-dragState.dy);
});
function endWindowDrag(e){
  if(!dragState||e.pointerId!==dragState.id)return;
  dragState=null;widget.classList.remove('bgm-dragging');
  if(widget.style.left){
    try{localStorage.setItem(dragKey,JSON.stringify({x:parseFloat(widget.style.left),y:parseFloat(widget.style.top)}));}catch(err){}
  }
}
dragBar.addEventListener('pointerup',endWindowDrag);
dragBar.addEventListener('pointercancel',endWindowDrag);
window.addEventListener('resize',keepWindowVisible);
if(desktopDrag.addEventListener)desktopDrag.addEventListener('change',keepWindowVisible);
restoreWindowPosition();
if(safeTracks.length){safeTracks.forEach((t,i)=>{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=(i+1)+'. '+t.title+(t.artist?' — '+t.artist:'');b.onclick=()=>{load(i);play()};li.append(b);$('bgmPlaylist').append(li)});load(0)}else{$('bgmPlaylist').innerHTML='<li class="bgm-empty">아직 등록된 곡이 없어요.</li>'}
audio.addEventListener('ended',()=>{if(safeTracks.length){load(current+1);play()}});audio.addEventListener('pause',sync);audio.addEventListener('play',sync);audio.addEventListener('error',()=>{$('bgmState').textContent='MP3 파일을 불러올 수 없어요'});
// Start BGM on the visitor's first interaction with the page, if allowed by the browser.
// Interactions with the player itself retain their normal meaning; manual pause never restarts automatically.
function startOnFirstInteraction(e){
  if(firstInteractionHandled||userPaused||!safeTracks.length)return;
  if(widget.contains(e.target))return;
  firstInteractionHandled=true;
  play();
}
document.addEventListener('pointerdown',startOnFirstInteraction,{capture:true});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){startOnFirstInteraction(e)}},{capture:true});
// A YouTube iframe may receive focus when clicked; pause BGM to avoid competing sound.
window.addEventListener('blur',()=>{setTimeout(()=>{if(document.activeElement?.tagName==='IFRAME'&&!audio.paused){audio.pause();sync()}},0)});
})();
