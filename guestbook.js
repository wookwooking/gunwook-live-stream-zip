(()=>{'use strict';
const $=id=>document.getElementById(id);
const tab=$('guestbookTab'),view=$('guestbookView'),list=$('guestbookList'),form=$('guestbookForm');
if(!tab||!view||!list||!form)return;
const cfg=window.CALENDAR_CONFIG||{};
const client=(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase)?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const PAGE_SIZE=15;let offset=0,hasMore=false,loading=false,admin=false;
const status=s=>{$('guestbookStatus').textContent=s};
function openGuestbook(){
  $('liveArchiveView').hidden=true;$('archiveVideoView').hidden=true;view.hidden=false;
  for(const id of ['archiveLiveTab','archiveVideoTab','guestbookTab']){const el=$(id);if(el){el.classList.toggle('active',id==='guestbookTab');el.setAttribute('aria-pressed',String(id==='guestbookTab'))}}
  view.scrollIntoView({behavior:'smooth',block:'start'});refresh();
}
tab.addEventListener('click',openGuestbook);
for(const id of ['archiveLiveTab','archiveVideoTab']){$(id)?.addEventListener('click',()=>{view.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-pressed','false')})}
$('homeButton')?.addEventListener('click',()=>{view.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-pressed','false');$('archiveVideoView').hidden=true;$('liveArchiveView').hidden=false;for(const id of ['archiveLiveTab','archiveVideoTab']){$(id)?.classList.toggle('active',id==='archiveLiveTab');$(id)?.setAttribute('aria-pressed',String(id==='archiveLiveTab'))};});
function makeEntry(entry){const card=document.createElement('article');card.className='guestbook-entry';
 const head=document.createElement('div');head.className='guestbook-entry-head';
 const name=document.createElement('span');name.className='guestbook-entry-name';
name.textContent=entry.nickname;
name.classList.add('guestbook-biscuit-name');

 const date=document.createElement('time');date.className='guestbook-entry-date';date.textContent=new Date(entry.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 head.append(name,date);const message=document.createElement('p');message.className='guestbook-entry-text';message.textContent=entry.message;card.append(head,message);
 if(admin){const del=document.createElement('button');del.type='button';del.className='guestbook-delete';del.textContent='관리자 삭제';del.onclick=async()=>{if(!confirm('이 방명록을 삭제할까요?'))return;const {error}=await client.from('guestbook_entries').delete().eq('id',entry.id);if(error){status('삭제 실패: 관리자 권한을 확인해 주세요.');return}refresh()};card.append(del)}return card;
}
async function checkAdmin(){if(!client)return;const {data}=await client.auth.getUser();admin=!!data?.user;}
async function refresh(more=false){if(loading)return;if(!client){list.innerHTML='<p class="guestbook-empty">Supabase 설정을 확인해 주세요.</p>';return}loading=true;$('guestbookMore').hidden=true;if(!more){offset=0;list.replaceChildren();await checkAdmin()}
 const {data,error}=await client.from('guestbook_entries').select('id,nickname,message,created_at').order('created_at',{ascending:false}).range(offset,offset+PAGE_SIZE-1);
 if(error){if(!more)list.innerHTML='<p class="guestbook-empty">방명록을 불러오지 못했어요. Supabase 테이블 설정을 확인해 주세요.</p>';status('불러오기 오류: '+error.message)}
 else{for(const e of data)list.append(makeEntry(e));offset+=data.length;hasMore=data.length===PAGE_SIZE;$('guestbookMore').hidden=!hasMore;if(!offset)list.innerHTML='<p class="guestbook-empty">첫 번째 방명록을 남겨주세요 ♡</p>'}
 loading=false;
}
$('guestbookMessage').addEventListener('input',()=>{$('guestbookCount').textContent=$('guestbookMessage').value.length+' / 300'});
$('guestbookRefresh').onclick=()=>refresh();$('guestbookMore').onclick=()=>refresh(true);
form.addEventListener('submit',async e=>{e.preventDefault();if(!client){status('Supabase 연결 설정을 확인해 주세요.');return}if($('guestbookWebsite').value)return;
 const nickname=$('guestbookNickname').value.trim(),message=$('guestbookMessage').value.trim();if(!nickname||nickname.length>20||!message||message.length>300){status('닉네임과 메시지 길이를 확인해 주세요.');return}
 const last=Number(localStorage.getItem('guestbook-last-post')||0);if(Date.now()-last<60000){status('잠시 후 다시 작성해 주세요 ♡');return}
 const btn=$('guestbookSubmit');btn.disabled=true;status('등록 중이에요...');
 const {error}=await client.from('guestbook_entries').insert({nickname,message});btn.disabled=false;
 if(error){status('등록 실패: '+error.message);return}localStorage.setItem('guestbook-last-post',String(Date.now()));$('guestbookMessage').value='';$('guestbookCount').textContent='0 / 300';status('방명록이 등록되었어요 ♡');refresh();
});
})();
