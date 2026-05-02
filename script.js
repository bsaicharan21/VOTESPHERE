// ═══════════════════════════════════════════
// STATE & API HELPERS
// ═══════════════════════════════════════════
const COLORS = ['#7c3aed','#06b6d4','#f59e0b','#ec4899','#10b981','#f97316','#3b82f6','#a855f7','#84cc16','#f43f5e'];
const EMOJIS = ['🦁','🦅','🌟','🔥','🌊','⚡','🌸','🏔️','🌙','☀️','🦋','🐉'];

let state = {
  elections: [],
  voters: [],
  currentElectionIdx: 0,
  selectedCandidates: [],
  hasVoted: false,
  settings: { changeVote: false, anonymity: 'full', results: 'live' },
  currentWPSection: 'home',
  particleMode: 'default',
};
let myCreatedElections = [];

// API helper
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  return res.json();
}
async function loadFromServer() {
  state.elections = await api('/elections');
  state.voters = await api('/voters');
}


// ═══════════════════════════════════════════
// WALLPAPER PRESETS
// ═══════════════════════════════════════════
const WP_PRESETS = [
  {name:'Deep Space',sub:'Dark cosmic vibes',grad:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',emoji:'🌌'},
  {name:'Aurora',sub:'Northern lights glow',grad:'linear-gradient(135deg,#0a0a2e,#1a0533,#003311)',emoji:'🌠'},
  {name:'Ocean Deep',sub:'Calm ocean depths',grad:'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',emoji:'🌊'},
  {name:'Volcanic',sub:'Fire and power',grad:'linear-gradient(135deg,#1a0000,#4a1000,#1a0010)',emoji:'🌋'},
  {name:'Emerald Night',sub:'Dark forest feel',grad:'linear-gradient(135deg,#001a0a,#003322,#001a2e)',emoji:'🌿'},
  {name:'Neon Dusk',sub:'Synthwave aesthetic',grad:'linear-gradient(135deg,#1a001a,#260044,#001a33)',emoji:'🎆'},
  {name:'Midnight Gold',sub:'Luxury dark theme',grad:'linear-gradient(135deg,#1a1000,#2a1a00,#0a0a00)',emoji:'✨'},
  {name:'Rose Noir',sub:'Dark romantic vibes',grad:'linear-gradient(135deg,#1a0010,#2d001a,#0f0010)',emoji:'🌹'},
  {name:'Arctic Void',sub:'Cold and minimal',grad:'linear-gradient(135deg,#001020,#001830,#000a20)',emoji:'❄️'},
  {name:'Solar Storm',sub:'Energetic and bright',grad:'linear-gradient(135deg,#2a0a00,#1a0020,#001020)',emoji:'☀️'},
  {name:'Bioluminescence',sub:'Glowing depths',grad:'linear-gradient(135deg,#000a1a,#001a2a,#002a1a)',emoji:'🪸'},
  {name:'Galactic Core',sub:'Milky way center',grad:'linear-gradient(135deg,#0a0010,#1a002a,#2a001a)',emoji:'🌀'},
];

let currentWPPresetIdx = {};
function initWPPresets(){
  renderWPGrid();
  previewCustomWP();
}
function renderWPGrid(){
  const grid = document.getElementById('wp-presets');
  grid.innerHTML = WP_PRESETS.map((p,i) => `
    <div class="wp-card" style="background:${p.grad};" onclick="applyPresetWP(${i})" id="wpc-${i}">
      <div class="wp-card-badge">${p.emoji}</div>
      <div class="wp-card-label">${p.name}</div>
      <div class="wp-card-sub">${p.sub}</div>
    </div>
  `).join('');
}
function selectWPSection(sec, btn){
  state.currentWPSection = sec;
  document.querySelectorAll('#wp-section-tabs .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const labels = {home:'Dashboard',vote:'Vote Page',results:'Results',admin:'Admin Panel',analytics:'Analytics'};
  document.getElementById('wp-section-label').innerHTML = `Editing wallpaper for: <strong style="color:var(--text)">${labels[sec]}</strong>`;
  previewCustomWP();
}
function applyPresetWP(idx){
  const p = WP_PRESETS[idx];
  const sec = state.currentWPSection;
  document.documentElement.style.setProperty(`--wp-${sec}`, p.grad);
  document.getElementById(`bg-${sec}`).style.background = p.grad;
  document.querySelectorAll('.wp-card').forEach(c=>c.classList.remove('active-wp'));
  document.getElementById(`wpc-${idx}`).classList.add('active-wp');
  toast(`Applied "${p.name}" to ${sec} page!`, p.emoji);
}
function previewCustomWP(){
  const c1=document.getElementById('wp-color1').value;
  const c2=document.getElementById('wp-color2').value;
  const c3=document.getElementById('wp-color3').value;
  const dir=document.getElementById('wp-dir').value;
  const grad=`linear-gradient(${dir},${c1},${c2},${c3})`;
  document.getElementById('wp-preview').style.background = grad;
}
function applyCustomWP(){
  const c1=document.getElementById('wp-color1').value;
  const c2=document.getElementById('wp-color2').value;
  const c3=document.getElementById('wp-color3').value;
  const dir=document.getElementById('wp-dir').value;
  const grad=`linear-gradient(${dir},${c1},${c2},${c3})`;
  const sec=state.currentWPSection;
  document.documentElement.style.setProperty(`--wp-${sec}`,grad);
  document.getElementById(`bg-${sec}`).style.background=grad;
  toast('Custom gradient applied!','🎨');
}
function setParticleMode(mode){
  state.particleMode=mode;
  initParticles();
  toast(`Particle mode: ${mode}`,'✨');
}

// ═══════════════════════════════════════════
// LINK GENERATOR
// ═══════════════════════════════════════════
function generateVoteLink(){
  const idx = document.getElementById('link-gen-election').value;
  const e = state.elections[idx];
  if(!e){toast('Select an election first','⚠️');return;}
  const token = Math.random().toString(36).substr(2,8).toUpperCase();
  const expiry = document.getElementById('link-expiry').value;
  const url = `${window.location.origin}/vote/${e.id}?token=${token}&exp=${expiry.replace(/\s/g,'_')}`;
  document.getElementById('link-url-text').textContent = url;
  document.getElementById('link-output').style.display = 'flex';
  document.getElementById('link-qr').innerHTML = generateQRSVG(url);
  toast(`Link generated for "${e.title}"!`,'🔗');
}
function generateQR(){generateVoteLink();}
function generateQRSVG(text){
  const cells = 7;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 ${cells} ${cells}">`;
  const pattern = [];
  const seed = text.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  for(let r=0;r<cells;r++){
    for(let c=0;c<cells;c++){
      const corner=(r<2&&c<2)||(r<2&&c>=cells-2)||(r>=cells-2&&c<2);
      const fill = corner || ((seed*r*c+r+c)%3===0);
      if(fill) pattern.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="#000"/>`);
    }
  }
  return svg+pattern.join('')+'</svg>';
}
function copyLink(){
  const url=document.getElementById('link-url-text').textContent;
  navigator.clipboard.writeText(url).then(()=>toast('Link copied to clipboard!','📋')).catch(()=>{
    const ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
    toast('Link copied!','📋');
  });
}
function shareLink(){
  const url=document.getElementById('link-url-text').textContent;
  if(navigator.share){navigator.share({title:'VoteSphere Election',url}).catch(()=>toast('Share cancelled','ℹ️'));}
  else{copyLink();}
}
function generateShareLink(){
  const e=state.elections[state.currentElectionIdx];
  const token=Math.random().toString(36).substr(2,8).toUpperCase();
  const url=`${window.location.origin}/vote/${e.id}?token=${token}`;
  const out=document.getElementById('share-link-out');
  out.style.display='block';
  out.innerHTML=`
    <div style="font-family:monospace;font-size:0.72rem;color:var(--cyan);word-break:break-all;margin-bottom:0.5rem;">${url}</div>
    <button class="btn btn-ghost btn-xs" onclick="navigator.clipboard.writeText('${url}').then(()=>toast('Copied!','📋'))">📋 Copy Link</button>
  `;
  toast('Share link generated!','🔗');
}
function updateLinkGenDropdown(){
  const sel=document.getElementById('link-gen-election');
  if(sel) sel.innerHTML=state.elections.map((e,i)=>`<option value="${i}">${e.emoji} ${e.title}</option>`).join('');
}

// ═══════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════
let particleRAF;
function initParticles(){
  const canvas=document.getElementById('particles');
  const ctx=canvas.getContext('2d');
  if(particleRAF) cancelAnimationFrame(particleRAF);
  let w,h,pts=[];
  function resize(){w=canvas.width=window.innerWidth;h=canvas.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  const mode=state.particleMode;
  if(mode==='none'){ctx.clearRect(0,0,canvas.width,canvas.height);return;}
  const count=mode==='dense'?120:mode==='minimal'?20:60;
  const palette=['108,99,255','45,212,191','236,72,153','245,158,11','16,185,129'];
  for(let i=0;i<count;i++) pts.push({
    x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,
    vx:(Math.random()-0.5)*(mode==='dense'?0.5:0.3),vy:(Math.random()-0.5)*(mode==='dense'?0.5:0.3),
    r:Math.random()*2+0.5,a:Math.random(),
    col:palette[Math.floor(Math.random()*palette.length)]
  });
  function frame(){
    ctx.clearRect(0,0,w,h);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>w)p.vx*=-1;
      if(p.y<0||p.y>h)p.vy*=-1;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.col},${p.a*0.5})`;ctx.fill();
    });
    if(mode!=='minimal'){
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<130){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=`rgba(${a.col},${(1-d/130)*0.07})`;ctx.lineWidth=0.6;ctx.stroke();}
      }));
    }
    particleRAF=requestAnimationFrame(frame);
  }
  frame();
}

function initHeroParticles(){
  const cont=document.getElementById('hero-particles');
  if(!cont)return;
  const colors=['#7c3aed','#06b6d4','#ec4899','#10b981','#f59e0b'];
  for(let i=0;i<20;i++){
    const el=document.createElement('div');
    el.className='fp';
    const s=Math.random()*8+4;
    el.style.cssText=`left:${Math.random()*100}%;width:${s}px;height:${s}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${6+Math.random()*8}s;animation-delay:${Math.random()*8}s;`;
    cont.appendChild(el);
  }
}

// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
function showPage(id){
  const isPublic = window.location.hostname.includes('ngrok');
  if (isPublic && id === 'wallpaper') {
    toast('Themes access is restricted to the host computer.', '⛔');
    return;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-links button').forEach((b,i)=>{
    const pages=['home','vote','results','admin','analytics','wallpaper'];
    b.classList.toggle('active',pages[i]===id);
  });
  document.querySelectorAll('.page-bg').forEach(bg=>{bg.classList.remove('active');bg.classList.add('inactive');});
  const activeBg=document.getElementById('bg-'+id);
  if(activeBg){activeBg.classList.add('active');activeBg.classList.remove('inactive');}
  if(id==='vote') renderVotePage();
  if(id==='results') renderResults();
  if(id==='admin'){renderAdmin();updateLinkGenDropdown();}
  if(id==='analytics') renderAnalytics();
  if(id==='wallpaper') initWPPresets();
}

// ═══════════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════════
function renderAll(){
  renderElectionsGrid();
  renderTimeline();
  updateStats();
  renderAdmin();
  renderVotePage();
  updateLinkGenDropdown();
}

// ═══════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════
function updateStats(){
  const totalVotes=state.elections.reduce((s,e)=>s+e.candidates.reduce((a,c)=>a+c.votes,0),0);
  const totalVoters=state.elections.reduce((s,e)=>s+e.registeredVoters,0);
  const totalCandidates=state.elections.reduce((s,e)=>s+e.candidates.length,0);
  const turnout=totalVoters>0?Math.round(totalVotes/totalVoters*100):0;
  animNum('stat-total',totalVotes);
  animNum('stat-voters',totalVoters);
  animNum('stat-candidates',totalCandidates);
  document.getElementById('stat-active').textContent=state.elections.filter(e=>e.status==='live').length;
  document.getElementById('stat-turnout').textContent=turnout+'%';
}
function animNum(id,target){
  const el=document.getElementById(id);if(!el)return;
  let cur=0,step=Math.max(1,Math.ceil(target/60));
  const t=setInterval(()=>{cur=Math.min(cur+step,target);el.textContent=cur.toLocaleString();if(cur>=target)clearInterval(t);},20);
}

// ═══════════════════════════════════════════
// ELECTIONS GRID
// ═══════════════════════════════════════════
function renderElectionsGrid(){
  const g=document.getElementById('elections-grid');if(!g)return;
  g.innerHTML=state.elections.map((e,i)=>{
    const totalVotes=e.candidates.reduce((a,c)=>a+c.votes,0);
    const progress=e.registeredVoters>0?Math.round(totalVotes/e.registeredVoters*100):0;
    const badgeClass={live:'badge-live',soon:'badge-soon',closed:'badge-closed'}[e.status]||'badge-live';
    const statusLabel={live:'Live',soon:'⏳ Upcoming',closed:'■ Closed'}[e.status]||'Live';
    return `<div class="election-card" onclick="selectElection(${i});showPage('vote')">
      <div class="election-cover" style="background:linear-gradient(135deg,${e.color}1a,${e.color}33);">
        <div class="cover-ripple" style="position:absolute;inset:0;background:radial-gradient(circle,${e.color}22,transparent);"></div>
        <span style="font-size:4rem;position:relative;z-index:1;filter:drop-shadow(0 4px 16px ${e.color}88)">${e.emoji}</span>
      </div>
      <div class="election-body">
        <div class="election-meta">
          <span class="badge ${badgeClass}">${statusLabel}</span>
          <span class="badge badge-type">${typeLabel(e.type)}</span>
        </div>
        <div class="election-title">${e.title}</div>
        <div class="election-desc">${e.desc}</div>
        <div class="election-footer">
          <div style="font-size:0.78rem;color:var(--muted)">${totalVotes} / ${e.registeredVoters} voted</div>
          <div style="font-size:0.78rem;font-weight:600;color:${e.color}">${progress}% turnout</div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${progress}%;background:linear-gradient(90deg,${e.color},${e.color}88);"></div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function typeLabel(t){return{plurality:'Plurality',ranked:'Ranked Choice',approval:'Approval',score:'Score Voting'}[t]||t;}

function renderTimeline(){
  const tl=document.getElementById('timeline');if(!tl)return;
  tl.innerHTML=state.elections.map(e=>`<div class="tl-item">
    <div class="tl-dot ${e.status==='closed'?'done':''}"></div>
    <div class="tl-title">${e.emoji} ${e.title}</div>
    <div class="tl-time">Start: ${e.start} · End: ${e.end}</div>
  </div>`).join('');
}

function startCountdown(){
  const target=new Date('2024-12-31T23:59:59');
  function update(){
    const now=new Date(),diff=Math.max(0,target-now);
    const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    const el=document.getElementById('countdown');if(!el)return;
    el.innerHTML=[['Days',d],['Hours',h],['Mins',m],['Secs',s]].map(([l,v])=>`<div class="cd-unit"><div class="cd-num">${String(v).padStart(2,'0')}</div><div class="cd-label">${l}</div></div>`).join('');
  }
  update();setInterval(update,1000);
}

function startTicker(){
  const msgs=['1,247 votes cast today','3 active elections live now','🔒 All votes are anonymous','✦ Next: Faculty of Year award','📊 Real-time results available'];
  let i=0;
  setInterval(()=>{
    i=(i+1)%msgs.length;
    const el=document.getElementById('ticker-text');
    if(el){el.style.opacity='0';setTimeout(()=>{el.textContent=msgs[i];el.style.opacity='1';},200);}
  },3500);
}

function selectElection(idx){state.currentElectionIdx=idx;state.selectedCandidates=[];state.hasVoted=false;}
function renderVotePage(){
  const e=state.elections[state.currentElectionIdx];if(!e)return;
  document.getElementById('vote-election-title').textContent=e.title;
  document.getElementById('vote-registered').textContent=`${e.registeredVoters} registered voters`;
  const totalVotes=e.candidates.reduce((a,c)=>a+c.votes,0);
  document.getElementById('vote-cast-count').textContent=`${totalVotes} votes cast`;
  document.getElementById('vote-deadline').textContent=`Closes: ${e.end}`;
  const typeTags={plurality:'🗳️ Plurality Voting',ranked:'🏆 Ranked Choice',approval:'✅ Approval Voting',score:'⭐ Score Voting'};
  document.getElementById('vote-type-tag').textContent=typeTags[e.type]||e.type;
  const instrMap={plurality:'Click one candidate to select your vote',ranked:`Rank up to ${e.maxSelections} candidates in order of preference`,approval:'Select all candidates you approve of',score:'Click to select (score voting)'};
  document.getElementById('vote-instructions').innerHTML='ℹ️ '+instrMap[e.type];
  document.getElementById('approval-note').style.display=e.type==='approval'?'block':'none';
  renderCandidateGrid();
  renderElectionTabs();
  renderLiveLeaderboard();
}
function renderElectionTabs(){
  const t=document.getElementById('election-selector');if(!t)return;
  t.innerHTML=state.elections.map((e,i)=>`<button class="tab ${i===state.currentElectionIdx?'active':''}" onclick="selectElection(${i});renderVotePage()">${e.emoji} ${e.title.split(' ').slice(0,2).join(' ')}</button>`).join('');
}
function renderCandidateGrid(){
  const e=state.elections[state.currentElectionIdx];
  const g=document.getElementById('candidates-grid');if(!g)return;
  const q=(document.getElementById('candidate-search')||{value:''}).value.toLowerCase();
  g.innerHTML=e.candidates.filter(c=>c.name.toLowerCase().includes(q)||c.party.toLowerCase().includes(q)).map(c=>{
    const sel=state.selectedCandidates.includes(c.id);
    const rankIdx=state.selectedCandidates.indexOf(c.id)+1;
    const isRanked=e.type==='ranked'&&rankIdx>0;
    return `<div class="candidate-card ${sel?'selected':''} ${isRanked?'ranked':''}" onclick="toggleCandidate('${c.id}')" id="cc-${c.id}">
      <div class="rank-badge">${rankIdx||''}</div>
      <div class="selected-check">✓</div>
      <div class="candidate-avatar" style="background:${c.color||'#333'}22;border:2px solid ${c.color||'#7c3aed'}55;box-shadow:0 0 20px ${c.color||'#7c3aed'}33">${c.emoji||'👤'}</div>
      <div class="candidate-name">${c.name}</div>
      <div class="candidate-party">${c.party}</div>
      <div class="candidate-stats">
        <div class="c-stat"><div class="c-stat-val" style="color:${c.color}">${c.votes}</div><div class="c-stat-lbl">votes</div></div>
        <div class="c-stat"><div class="c-stat-val">${c.bio?c.bio.split(' ').slice(0,2).join(' '):'—'}</div><div class="c-stat-lbl">specialty</div></div>
      </div>
    </div>`;
  }).join('');
  renderVoteSummary();
}
function toggleCandidate(id){
  const e=state.elections[state.currentElectionIdx];
  if(state.hasVoted){toast('You have already voted!','⚠️');return;}
  if(e.type==='plurality'){state.selectedCandidates=state.selectedCandidates[0]===id?[]:[id];}
  else if(e.type==='approval'){const idx=state.selectedCandidates.indexOf(id);if(idx>=0)state.selectedCandidates.splice(idx,1);else state.selectedCandidates.push(id);}
  else if(e.type==='ranked'){const idx=state.selectedCandidates.indexOf(id);if(idx>=0)state.selectedCandidates.splice(idx,1);else if(state.selectedCandidates.length<e.maxSelections)state.selectedCandidates.push(id);else{toast(`Max ${e.maxSelections} rankings!`,'ℹ️');return;}}
  renderCandidateGrid();
  document.getElementById('submit-vote-btn').disabled=state.selectedCandidates.length===0;
}
function filterCandidates(){renderCandidateGrid();}
function renderVoteSummary(){
  const e=state.elections[state.currentElectionIdx];
  const wrap=document.getElementById('vote-summary');if(!wrap)return;
  if(!state.selectedCandidates.length){
    wrap.innerHTML='<div style="text-align:center;color:var(--muted);font-size:0.85rem;padding:1.5rem 0;">No selection yet.<br>Click a candidate to vote.</div>';return;
  }
  wrap.innerHTML=state.selectedCandidates.map((id,i)=>{
    const c=e.candidates.find(x=>x.id===id);
    return c?`<div class="vote-summary-item">
      <div class="vs-num">${i+1}</div>
      <div style="font-size:1.2rem">${c.emoji||'👤'}</div>
      <div class="vs-name">${c.name}</div>
      <button class="vs-remove" onclick="toggleCandidate('${c.id}')">✕</button>
    </div>`:''
  }).join('');
}
function renderLiveLeaderboard(){
  const e=state.elections[state.currentElectionIdx];
  const sorted=[...e.candidates].sort((a,b)=>b.votes-a.votes);
  document.getElementById('live-leaderboard').innerHTML=sorted.slice(0,4).map((c,i)=>`<div class="lb-row">
    <div class="lb-rank">${['🥇','🥈','🥉','4'][i]||i+1}</div>
    <div class="lb-av" style="background:${c.color||'#333'}22;box-shadow:0 0 12px ${c.color||'#7c3aed'}44">${c.emoji||'👤'}</div>
    <div class="lb-info"><div class="lb-name">${c.name}</div><div class="lb-party">${c.party}</div></div>
    <div class="lb-votes" style="color:${c.color||'var(--accent)'}">${c.votes}</div>
  </div>`).join('');
}

function openVoteModal(){
  const e=state.elections[state.currentElectionIdx];
  const names=state.selectedCandidates.map(id=>{const c=e.candidates.find(x=>x.id===id);return c?`<strong style="color:var(--accent2)">${c.emoji} ${c.name}</strong>`:''}).join(', ');
  document.getElementById('vote-modal-body').innerHTML=`You are about to vote for: ${names}.<br><br>This action is <strong>final</strong>. Proceed?`;
  document.getElementById('vote-modal').classList.add('open');
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
async function submitVote(){
  const e=state.elections[state.currentElectionIdx];
  const voterName=document.getElementById('voter-name-input')?.value||'';
  const voterEmail=document.getElementById('voter-email-input')?.value||'';
  try {
    await api(`/elections/${e.id}/vote`, 'POST', {
      candidateIds: state.selectedCandidates,
      voterName,
      voterEmail
    });
    state.hasVoted=true;
    closeModal('vote-modal');
    // Reload data from server
    await loadFromServer();
    renderCandidateGrid();
    renderLiveLeaderboard();
    updateStats();
    renderElectionsGrid();
    toast('Vote submitted & saved to server! 🎉','✅');
    launchConfetti();
    const btn=document.getElementById('submit-vote-btn');
    if(btn){btn.disabled=true;btn.textContent='✓ Vote Cast';}
    // Clear inputs
    const ni=document.getElementById('voter-name-input');if(ni)ni.value='';
    const ei=document.getElementById('voter-email-input');if(ei)ei.value='';
  } catch(err) { toast('Error submitting vote: '+err.message,'⚠️'); }
}

async function renderResults(){
  const tabs=document.getElementById('results-tabs');
  tabs.innerHTML=state.elections.map((e,i)=>`<button class="tab ${i===state.currentElectionIdx?'active':''}" onclick="state.currentElectionIdx=${i};renderResults()">${e.emoji} ${e.title.split(' ').slice(0,2).join(' ')}</button>`).join('');
  const e=state.elections[state.currentElectionIdx];
  if(!e)return;
  // Fetch live results from server
  let serverData;
  try { serverData = await api(`/elections/${e.id}/results`); } catch(err) { serverData = null; }
  const sorted = serverData ? serverData.candidates : [...e.candidates].sort((a,b)=>b.votes-a.votes);
  const total=sorted.reduce((s,c)=>s+c.votes,0)||1;
  const winner=sorted[0];
  document.getElementById('winner-section').innerHTML=winner?`<div class="winner-card">
    <span class="winner-emoji">${winner.emoji||'🏆'}</span>
    <div class="winner-name" style="background:linear-gradient(135deg,${winner.color||'#7c3aed'},var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${winner.name}</div>
    <div style="color:var(--muted);font-size:0.9rem;position:relative;z-index:1">${winner.party}</div>
    <div class="winner-votes" style="position:relative;z-index:1">${winner.votes} votes · ${Math.round(winner.votes/total*100)}% of total</div>
  </div>`:'';
  document.getElementById('results-list').innerHTML=sorted.map((c,i)=>`<div class="result-row">
    <div class="result-rank ${['gold','silver','bronze'][i]||''}">${['🥇','🥈','🥉'][i]||`#${i+1}`}</div>
    <div class="result-avatar" style="background:${c.color||'#333'}22;box-shadow:0 0 16px ${c.color||'#7c3aed'}44">${c.emoji||'👤'}</div>
    <div class="result-info"><div class="result-name">${c.name}</div><div class="result-party">${c.party}</div></div>
    <div class="result-bar-wrap">
      <div class="result-bar-bg"><div class="result-bar" style="width:${Math.round(c.votes/total*100)}%;background:linear-gradient(90deg,${c.color||'var(--accent)'},${c.color||'var(--accent)'}88)"></div></div>
    </div>
    <div class="result-pct" style="color:${c.color||'var(--accent)'}">${Math.round(c.votes/total*100)}%</div>
    <div class="result-count">${c.votes} votes</div>
  </div>`).join('');
  const chartWrap=document.getElementById('results-chart');
  const maxV=sorted[0]?.votes||1;
  chartWrap.innerHTML=sorted.map(c=>`<div class="chart-bar-col">
    <div class="chart-bar-val" style="color:${c.color||'var(--accent)'}">${c.votes}</div>
    <div class="chart-bar" style="height:${Math.max(8,Math.round(c.votes/maxV*120))}px;background:linear-gradient(180deg,${c.color||'var(--accent)'},${c.color||'var(--accent)'}55)"></div>
    <div class="chart-bar-label" style="font-size:0.65rem">${c.name.split(' ')[0]}</div>
  </div>`).join('');
  // Election ID display + stats
  document.getElementById('election-stats-list').innerHTML=`<div style="display:flex;flex-direction:column;gap:10px;">
    ${[['Election ID',`<code style="color:var(--accent2);background:rgba(124,58,237,0.1);padding:2px 8px;border-radius:6px;">${e.id}</code>`],['Type',typeLabel(e.type)],['Total Votes',`${total} / ${e.registeredVoters}`],['Turnout',`${Math.round(total/e.registeredVoters*100)}%`],['Candidates',e.candidates.length],['Status',e.status.toUpperCase()]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:0.85rem;color:var(--muted)">${k}</span>
      <span style="font-size:0.85rem;font-weight:600;color:var(--text)">${v}</span>
    </div>`).join('')}
  </div>`;
  // Show vote log for current election
  renderVoteLog(e.id);
}

// Render vote log table
async function renderVoteLog(electionId) {
  const section = document.getElementById('vote-log-section');
  const tbody = document.getElementById('vote-log-tbody');
  const empty = document.getElementById('vote-log-empty');
  if (!section || !tbody) return;
  try {
    const logs = await api(`/votelog/${electionId}`);
    section.style.display = 'block';
    if (!logs.length) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    tbody.innerHTML = logs.map((v, i) => `<tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><code style="font-size:0.78rem;color:var(--accent2);background:rgba(124,58,237,0.1);padding:2px 8px;border-radius:6px;">${v.voterId}</code></td>
      <td>${v.voterName || 'Anonymous'}</td>
      <td style="color:var(--muted)">${v.voterEmail || '—'}</td>
      <td>${v.candidateNames ? v.candidateNames.join(', ') : '—'}</td>
      <td style="color:var(--muted);font-size:0.8rem">${new Date(v.timestamp).toLocaleString()}</td>
    </tr>`).join('');
  } catch (err) { section.style.display = 'none'; }
}

// Search election results by ID or title
async function searchElectionResults() {
  const q = (document.getElementById('election-id-search')?.value || '').trim();
  const feedback = document.getElementById('search-results-feedback');
  if (!q) { feedback.style.display = 'none'; return; }
  try {
    const results = await api(`/search?q=${encodeURIComponent(q)}`);
    if (results.length > 0) {
      // Find the election index in current state
      const foundId = results[0].id;
      const idx = state.elections.findIndex(e => e.id === foundId);
      if (idx >= 0) {
        state.currentElectionIdx = idx;
        feedback.style.display = 'block';
        feedback.innerHTML = `<span style="color:var(--green)">✓ Found: <strong>${results[0].title}</strong> (ID: ${results[0].id})</span>`;
        renderResults();
      }
    } else {
      feedback.style.display = 'block';
      feedback.innerHTML = `<span style="color:var(--coral)">✗ No election found matching "${q}"</span>`;
    }
  } catch (err) {
    feedback.style.display = 'block';
    feedback.innerHTML = `<span style="color:var(--coral)">⚠️ Error searching</span>`;
  }
}
function clearResultsSearch() {
  const input = document.getElementById('election-id-search');
  const feedback = document.getElementById('search-results-feedback');
  if (input) input.value = '';
  if (feedback) feedback.style.display = 'none';
  renderResults();
}

function renderAdmin(){
  const isPublic = window.location.hostname.includes('ngrok');
  const allowedElections = isPublic ? state.elections.filter(e => myCreatedElections.includes(e.id)) : state.elections;
  
  const opts = allowedElections.map(e => `<option value="${state.elections.indexOf(e)}">${e.emoji} ${e.title}</option>`).join('');
  
  ['admin-target-election','admin-control-election'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts || '<option value="" disabled selected>Create an election first</option>';
  });
  
  const cardCandidates = document.getElementById('admin-target-election')?.closest('.admin-card');
  if (cardCandidates) {
    cardCandidates.style.display = (isPublic && allowedElections.length === 0) ? 'none' : 'block';
  }
  
  loadAdminCandidates();renderVoterTable();
}
function loadAdminCandidates(){
  const idx=parseInt(document.getElementById('admin-target-election')?.value)||0;
  const e=state.elections[idx];if(!e)return;
  const list=document.getElementById('admin-candidates-list');if(!list)return;
  list.innerHTML=e.candidates.map((c,i)=>`<div class="candidate-form-item">
    <span class="cfi-emoji" onclick="changeEmoji(${i})">${c.emoji||'👤'}</span>
    <input class="cfi-name" value="${c.name}" placeholder="Name" data-idx="${i}" data-field="name" onchange="updateCandidateField(this)">
    <input class="cfi-party" value="${c.party}" placeholder="Party/Group" data-idx="${i}" data-field="party" onchange="updateCandidateField(this)">
    <button class="cfi-remove" onclick="removeCandidate(${i})">✕</button>
  </div>`).join('');
}
function updateCandidateField(el){
  const idx=parseInt(document.getElementById('admin-target-election').value)||0;
  const ci=parseInt(el.dataset.idx),field=el.dataset.field;
  if(state.elections[idx]?.candidates[ci]) state.elections[idx].candidates[ci][field]=el.value;
}
function addCandidateForm(){
  const idx=parseInt(document.getElementById('admin-target-election').value)||0;
  state.elections[idx].candidates.push({id:'c'+Date.now(),name:'New Candidate',party:'Party',emoji:EMOJIS[Math.floor(Math.random()*EMOJIS.length)],color:COLORS[Math.floor(Math.random()*COLORS.length)],bio:'',votes:0});
  loadAdminCandidates();
}
function removeCandidate(i){
  const idx=parseInt(document.getElementById('admin-target-election').value)||0;
  state.elections[idx].candidates.splice(i,1);loadAdminCandidates();toast('Candidate removed','🗑️');
}
async function saveCandidates(){
  const idx=parseInt(document.getElementById('admin-target-election').value)||0;
  const e=state.elections[idx];
  if(!e)return;
  await api(`/elections/${e.id}/candidates`,'PUT',{candidates:e.candidates});
  await loadFromServer();
  renderAll();toast('Candidates saved to server!','✅');
}
function changeEmoji(i){
  const idx=parseInt(document.getElementById('admin-target-election').value)||0;
  state.elections[idx].candidates[i].emoji=EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
  loadAdminCandidates();
}
async function createElection(){
  const title=document.getElementById('admin-title').value.trim();
  if(!title){toast('Please enter a title','⚠️');return;}
  const newElec = await api('/elections','POST',{
    title,type:document.getElementById('admin-type').value,
    desc:document.getElementById('admin-desc').value,
    registeredVoters:parseInt(document.getElementById('admin-voters').value)||100,
    maxSelections:parseInt(document.getElementById('admin-max-sel').value)||1,
    start:document.getElementById('admin-start').value,end:document.getElementById('admin-end').value,
    emoji:EMOJIS[Math.floor(Math.random()*EMOJIS.length)],
    color:COLORS[Math.floor(Math.random()*COLORS.length)],
  });
  myCreatedElections.push(newElec.id);
  await loadFromServer();
  renderAll();updateLinkGenDropdown();
  document.getElementById('active-count').textContent=state.elections.filter(e=>e.status==='live').length;
  toast('Election created & saved!','🏛️');launchConfetti();
}
async function updateElection(){
  const idx=state.currentElectionIdx;
  const e=state.elections[idx];
  if(e) await api(`/elections/${e.id}`,'PUT',e);
  await loadFromServer();
  toast('Election updated!','✅');renderAll();
}
async function deleteElection(selectId = 'admin-target-election'){
  const val = document.getElementById(selectId)?.value;
  if (!val || isNaN(parseInt(val))) return;
  const idx = parseInt(val);
  const e = state.elections[idx];
  if (!e) return;
  if (confirm(`Are you sure you want to delete "${e.title}"?`)) {
    await api(`/elections/${e.id}`, 'DELETE');
    const myIdx = myCreatedElections.indexOf(e.id);
    if(myIdx >= 0) myCreatedElections.splice(myIdx, 1);
    await loadFromServer();
    renderAll();
    toast('Election deleted!', '🗑️');
  }
}
async function setStatus(s){
  const idx=parseInt(document.getElementById('admin-control-election')?.value)||0;
  const e=state.elections[idx];
  if(e) await api(`/elections/${e.id}/status`,'PUT',{status:s});
  await loadFromServer();
  renderAll();toast(`Election status: ${s}`,'🎛️');
}
function saveSettings(){toast('Settings saved!','⚙️');}
function exportResults(){
  const e=state.elections[state.currentElectionIdx];
  const data=JSON.stringify({election:e.title,results:e.candidates.map(c=>({name:c.name,votes:c.votes}))},null,2);
  const b=new Blob([data],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='results.json';a.click();
  toast('Results exported!','📤');
}

const FIRST=['Alex','Jordan','Morgan','Taylor','Riley','Casey','Avery','Blake','Quinn','Logan','Sage','Drew','Rowan','Finley','Parker','Hayden'];
const LAST=['Smith','Johnson','Williams','Brown','Garcia','Martinez','Davis','Wilson','Moore','Taylor','Anderson','Thomas','White','Harris','Martin'];
function genName(){return FIRST[Math.floor(Math.random()*FIRST.length)]+' '+LAST[Math.floor(Math.random()*LAST.length)];}
async function generateVoters(){
  state.voters = await api('/voters/generate','POST');
  renderVoterTable();
}
function renderVoterTable(){
  const tbody=document.getElementById('voter-tbody');if(!tbody)return;
  tbody.innerHTML=state.voters.map((v,i)=>`<tr>
    <td style="color:var(--muted)">${i+1}</td>
    <td><code style="font-size:0.78rem;color:var(--accent2);background:rgba(124,58,237,0.1);padding:2px 8px;border-radius:6px;">${v.id}</code></td>
    <td>${v.name}</td>
    <td style="color:var(--muted)">${v.email}</td>
    <td><span class="status-pill status-${v.status}">${v.status}</span></td>
    <td style="color:var(--muted)">${v.votedFor||'—'}</td>
    <td><button class="btn btn-ghost btn-xs" onclick="toggleVoterStatus('${v.id}')">Toggle</button></td>
  </tr>`).join('');
}
async function toggleVoterStatus(voterId){
  await api(`/voters/${voterId}/toggle`,'PUT');
  state.voters = await api('/voters');
  renderVoterTable();
}
async function resetVotes(){
  await api('/reset','POST');
  await loadFromServer();
  state.selectedCandidates=[];state.hasVoted=false;
  renderAll();toast('All votes reset!','🗑️');
}
async function simulateVoting(){
  const e=state.elections[state.currentElectionIdx];
  const res = await api(`/elections/${e.id}/simulate`,'POST');
  await loadFromServer();
  renderAll();toast(`Simulated ${res.simulatedVotes} votes!`,'▶');
}

function renderAnalytics(){
  const total=state.elections.reduce((s,e)=>s+e.candidates.reduce((a,c)=>a+c.votes,0),0);
  const totalVoters=state.elections.reduce((s,e)=>s+e.registeredVoters,0);
  const el1=document.getElementById('an-participation');const el2=document.getElementById('an-spoiled');
  if(el1)el1.textContent=totalVoters>0?Math.round(total/totalVoters*100)+'%':'0%';
  if(el2)el2.textContent=Math.floor(total*0.02);
  renderHourlyChart();renderTurnoutPie();renderTopElections();renderDemographics();
}
function renderHourlyChart(){
  const el=document.getElementById('hourly-chart');if(!el)return;
  const hours=[12,28,45,67,89,102,78,56,44,38,55,72,98,120,95,80,60,45,30,20,15,12,8,5];
  const slice=hours.slice(8,16);const max=Math.max(...slice);
  const colors=['#7c3aed','#06b6d4','#ec4899','#10b981','#f59e0b','#f97316','#a855f7','#3b82f6'];
  el.innerHTML=slice.map((v,i)=>`<div class="chart-bar-col">
    <div class="chart-bar-val" style="color:${colors[i%colors.length]}">${v}</div>
    <div class="chart-bar" style="height:${Math.round(v/max*120)}px;background:linear-gradient(180deg,${colors[i%colors.length]},${colors[i%colors.length]}44)"></div>
  </div>`).join('');
}
function renderTurnoutPie(){
  const el=document.getElementById('turnout-pie');if(!el)return;
  el.innerHTML=state.elections.map(e=>{
    const total=e.candidates.reduce((a,c)=>a+c.votes,0);
    const pct=e.registeredVoters>0?Math.round(total/e.registeredVoters*100):0;
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:1.2rem">${e.emoji}</span>
      <div style="flex:1"><div style="font-size:0.82rem;font-weight:500">${e.title.split(' ').slice(0,3).join(' ')}</div>
      <div style="background:rgba(255,255,255,0.06);border-radius:100px;height:6px;margin-top:5px;overflow:hidden;"><div style="height:100%;border-radius:100px;background:${e.color||'var(--accent)'};width:${pct}%;transition:width 1.2s ease;box-shadow:0 0 10px ${e.color||'var(--accent)'}66"></div></div></div>
      <span style="font-size:0.85rem;font-weight:700;color:${e.color||'var(--accent)'}">${pct}%</span>
    </div>`;
  }).join('');
}
function renderTopElections(){
  const el=document.getElementById('top-elections-list');if(!el)return;
  const sorted=[...state.elections].sort((a,b)=>b.candidates.reduce((s,c)=>s+c.votes,0)-a.candidates.reduce((s,c)=>s+c.votes,0));
  el.innerHTML=sorted.map((e,i)=>{
    const total=e.candidates.reduce((s,c)=>s+c.votes,0);
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;color:var(--muted);min-width:26px">${i+1}</div>
      <span style="font-size:1.2rem">${e.emoji}</span>
      <div style="flex:1;font-size:0.85rem;font-weight:500">${e.title}</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;color:${e.color||'var(--accent)'}">${total}</div>
    </div>`;
  }).join('');
}
function renderDemographics(){
  const el=document.getElementById('demographic-chart');if(!el)return;
  const cats=[['Undergraduate','45%','#7c3aed'],['Graduate','28%','#06b6d4'],['Faculty','15%','#f59e0b'],['Staff','12%','#ec4899']];
  el.innerHTML=cats.map(([l,p,c])=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
    <div style="width:10px;height:10px;border-radius:50%;background:${c};box-shadow:0 0 8px ${c};flex-shrink:0"></div>
    <div style="flex:1;font-size:0.85rem">${l}</div>
    <div style="background:rgba(255,255,255,0.06);border-radius:100px;height:6px;width:120px;overflow:hidden;flex-shrink:0"><div style="height:100%;border-radius:100px;background:${c};width:${p};box-shadow:0 0 8px ${c}66"></div></div>
    <div style="font-size:0.82rem;font-weight:700;color:${c};min-width:36px;text-align:right">${p}</div>
  </div>`).join('');
}

function toast(msg,icon='ℹ️'){
  const t=document.getElementById('toast-container');
  const el=document.createElement('div');el.className='toast';
  el.innerHTML=`<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  t.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),400);},3200);
}

function launchConfetti(){
  const colors=['#7c3aed','#06b6d4','#f59e0b','#ec4899','#10b981','#f97316','#a855f7','#84cc16'];
  for(let i=0;i<80;i++){
    const el=document.createElement('div');el.className='confetti-piece';
    el.style.cssText=`left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?'50%':'2px'};width:${5+Math.random()*10}px;height:${5+Math.random()*10}px;animation-duration:${1.5+Math.random()*2.5}s;animation-delay:${Math.random()*0.6}s;`;
    document.body.appendChild(el);setTimeout(()=>el.remove(),5000);
  }
}

async function init(){
  await loadFromServer();
  
  // Setup public mode (ngrok)
  if (window.location.hostname.includes('ngrok')) {
    // Hide themes button
    document.querySelectorAll("[onclick=\"showPage('wallpaper')\"]").forEach(el => el.style.display = 'none');
    
    // Hide sensitive admin cards
    ['admin-link-gen', 'admin-card-voters', 'admin-card-controls', 'admin-card-settings', 'admin-btn-update'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    
    // Rename Admin buttons to Create Election
    document.querySelectorAll("[onclick=\"showPage('admin')\"]").forEach(el => {
      if(el.innerHTML.includes('Admin')) {
        el.innerHTML = el.innerHTML.replace('Admin Panel', 'Create Election').replace('Admin', 'Create Election').replace('⚙️', '✚');
      }
    });
    
    // Change Admin page title
    const adminTitle = document.querySelector('#page-admin .section-title');
    if (adminTitle) adminTitle.innerHTML = '✚ Create <span>Election</span>';
  }

  renderAll();
  startCountdown();startTicker();
  renderHourlyChart();renderTurnoutPie();renderTopElections();renderDemographics();
  initParticles();initHeroParticles();
  updateLinkGenDropdown();
  previewCustomWP();
  // Handle shared vote links (e.g., /vote/e1)
  handleSharedLink();
}

function handleSharedLink(){
  const path = window.location.pathname;
  const match = path.match(/^\/vote\/([^/?]+)/);
  if(match){
    const electionId = match[1];
    const idx = state.elections.findIndex(e => e.id === electionId);
    if(idx >= 0){
      selectElection(idx);
      showPage('vote');
      toast(`Opened election: ${state.elections[idx].title}`,'🔗');
    }
  }
}

window.addEventListener('load',()=>{init().then(()=>setTimeout(()=>{renderVotePage();renderResults();},100));});

