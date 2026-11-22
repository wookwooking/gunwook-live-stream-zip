(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = {boys_planet: 'BOYS PLANET', wild_idol: '극한데뷔 야생돌'};
  const cfg = window.CALENDAR_CONFIG || {};
  const online = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const db = online ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{storageKey:'sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token'}}) : null;
  const localKey = 'gunwook-episode-archive-demo-v1';
  let program = 'boys_planet', episode = null, videos = [], authenticated = false;
  const msg = (id, value) => { $(id).textContent = value; };
  const youtubeId = url => {
    try {
      const u = new URL(url), host = u.hostname.toLowerCase().replace(/^www\./, '');
      let id = null;
      if (host === 'youtu.be') id = u.pathname.split('/')[1];
      else if (['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)) {
        id = u.pathname === '/watch' ? u.searchParams.get('v') : /^\/(shorts|embed|live)\//.test(u.pathname) ? u.pathname.split('/')[2] : null;
      }
      return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  };
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey)) || []; } catch { return []; } };
  const saveLocal = () => localStorage.setItem(localKey, JSON.stringify(videos));
  async function refresh() {
    if (online) {
      const {data, error} = await db.from('archive_videos').select('id,program,episode,title,youtube_url,created_at').order('created_at', {ascending:false});
      if (error) { msg('archiveNotice', '영상 목록을 불러오지 못했어요. Supabase에 archive_videos 테이블을 만들었는지 확인해 주세요. ('+error.message+')'); return; }
      videos = data || [];
    } else videos = loadLocal();
    renderEpisodes();
  }
  function renderEpisodes() {
    msg('archiveProgramTitle', '♡ '+names[program]+' · EPISODES');
    document.querySelectorAll('[data-program]').forEach(b => b.classList.toggle('selected', b.dataset.program === program));
    const root = $('archiveEpisodes'); root.replaceChildren();
    const episodeNumbers = [...new Set(videos.filter(v => v.program === program).map(v => Number(v.episode)))].filter(Number.isInteger).sort((a,b)=>a-b);
    if (!episodeNumbers.length) {
      const p=document.createElement('p'); p.className='archive-placeholder'; p.textContent='등록된 회차 없음'; root.append(p);
      episode=null;
    } else {
      if (!episodeNumbers.includes(episode)) episode=episodeNumbers[0];
      for (const n of episodeNumbers) {
        const b=document.createElement('button'); b.type='button'; b.className='archive-episode'+(n===episode?' active':'');
        b.textContent='EP.'+String(n).padStart(2,'0'); b.onclick=()=>{episode=n;renderEpisodes()}; root.append(b);
      }
    }
    renderVideos();
  }
  function renderVideos() {
    const root=$('archiveResults'); root.replaceChildren();
    const matches=videos.filter(v=>v.program===program && Number(v.episode)===episode && episode!==null);
    if (!matches.length) {const p=document.createElement('p');p.className='archive-placeholder';p.textContent='아직 등록된 영상이 없어요 ♡';root.append(p);return;}
    const heading=document.createElement('h3');heading.textContent=names[program]+' · '+episode+'화 ('+matches.length+'개 영상)';root.append(heading);
    for (const v of matches) {
      const article=document.createElement('article');article.className='archive-video';
      const title=document.createElement('h3');title.textContent=v.title;article.append(title);
      const id=youtubeId(v.youtube_url);
      if (id) {const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0&playsinline=1';frame.title=v.title;frame.loading='lazy';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';article.append(frame);}
      if (authenticated) {
        const del=document.createElement('button');del.type='button';del.className='delete';del.textContent='삭제';
        del.onclick=async()=>{if(!confirm('이 영상을 삭제할까요?'))return;
          if(online){const {error}=await db.from('archive_videos').delete().eq('id',v.id);if(error){msg('archiveAdminStatus',error.message);return;}}
          else{videos=videos.filter(x=>x.id!==v.id);saveLocal();}
          await refresh();
        };article.append(del);
      }
      root.append(article);
    }
  }
  function showTab(which) {
    const live=which==='live';$('liveArchiveView').hidden=!live;$('archiveVideoView').hidden=live;
    $('archiveLiveTab').classList.toggle('active',live);$('archiveVideoTab').classList.toggle('active',!live);
    $('archiveLiveTab').setAttribute('aria-pressed',String(live));$('archiveVideoTab').setAttribute('aria-pressed',String(!live));
    if(!live)refresh();
  }
  $('archiveLiveTab').onclick=()=>showTab('live');
  $('archiveVideoTab').onclick=()=>showTab('video');
  document.querySelectorAll('[data-program]').forEach(b=>b.onclick=()=>{program=b.dataset.program;episode=null;renderEpisodes()});
  async function updateAuth() {
    if(online){const {data}=await db.auth.getSession();authenticated=!!data?.session;}
    else authenticated=true;
    renderVideos();
  }
  $('archiveForm').onsubmit=async e=>{
    e.preventDefault();await updateAuth();
    if(!authenticated){msg('archiveAdminStatus','먼저 기존 관리자 화면에서 로그인해 주세요.');return;}
    const p=$('archiveProgramInput').value,n=Number($('archiveEpisodeInput').value),title=$('archiveTitleInput').value.trim(),url=$('archiveUrlInput').value.trim();
    if(!names[p]||!Number.isInteger(n)||n<1||n>999||!title||!youtubeId(url)){msg('archiveAdminStatus','프로그램, 회차, 제목, 유튜브 링크를 확인해 주세요.');return;}
    if(online){const {error}=await db.from('archive_videos').insert({program:p,episode:n,title,youtube_url:url});if(error){msg('archiveAdminStatus','등록 실패: '+error.message);return;}}
    else{videos.unshift({id:crypto.randomUUID(),program:p,episode:n,title,youtube_url:url});saveLocal();}
    $('archiveTitleInput').value='';$('archiveUrlInput').value='';program=p;episode=n;
    msg('archiveAdminStatus','♡ 영상이 등록되었어요! 영상 모음 탭에서 확인해 주세요.');await refresh();
  };
  if(online)db.auth.onAuthStateChange(()=>{updateAuth()});
  $('adminToggle').addEventListener('click',()=>{setTimeout(updateAuth,100)});
  $('logout').addEventListener('click',()=>{setTimeout(updateAuth,100)});
  updateAuth();refresh();
})();
