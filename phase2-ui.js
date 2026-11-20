/* CLUBHUB Phase 2 interaction layer. Loaded after the Phase 1 application. */

const originalHome = home;
let lastModalKey = '';
let focusReturnSelector = '';

function migratePhase2Store(){
  const defaults=loadPhase2Store();
  for(const key of ['forms','submissions','memberships','accessRequests','customOpportunities','customClubs']){
    if(!Array.isArray(state.store[key])) state.store[key]=[];
    for(const record of defaults[key]||[]) if(record.id&&!state.store[key].some(x=>x.id===record.id)) state.store[key].push(record);
  }
  persistStore();
}
migratePhase2Store();

for(const club of state.store.customClubs) if(!CLUBS.some(item=>item.id===club.id)) CLUBS.push(club);

function syncCustomOpportunities(){
  for(const o of state.store.customOpportunities.filter(item=>item.status==='PUBLISHED')){
    const club=CLUBS.find(c=>c.id===o.clubId);
    if(club&&!club.opps.some(x=>x.customId===o.id)) club.opps.push({customId:o.id,title:o.title,description:o.description,requirements:o.requirements,open:o.open,deadline:o.deadline,publicationStatus:o.status});
  }
}
syncCustomOpportunities();

function openOverlay(type,id,opener){
  if(opener){
    if(opener.dataset.club) focusReturnSelector=`[data-club="${CSS.escape(opener.dataset.club)}"]`;
    else if(opener.dataset.event) focusReturnSelector=`[data-event="${CSS.escape(opener.dataset.event)}"]`;
    else focusReturnSelector='';
  }
  state.modal={type,id};
  render();
}

function closeOverlay(){
  state.modal=null;
  document.body.classList.remove('modal-open');
  render();
  if(focusReturnSelector) requestAnimationFrame(()=>document.querySelector(focusReturnSelector)?.focus());
  focusReturnSelector='';
}

function afterRender(){
  const key=state.modal?`${state.modal.type}:${state.modal.id||''}`:'';
  document.body.classList.toggle('modal-open',!!state.modal);
  if(key&&key!==lastModalKey){
    requestAnimationFrame(()=>{
      const body=document.querySelector('.modal-body');
      if(body) body.scrollTop=0;
      document.querySelector('.modal [data-action="close-modal"]')?.focus();
    });
  }
  lastModalKey=key;
}

function welcomePage(){
  return `<main class="auth-gateway"><section class="auth-panel"><div class="auth-brand"><span class="brand-mark">CH</span><span>CLUBHUB</span></div><p class="eyebrow">Your campus, connected</p><h1>How will you use CLUBHUB?</h1><p class="auth-lead">Choose a workspace to enter the protected classroom demonstration. Production sign-in is prepared for Auth0 Universal Login but is not configured in this local build.</p><div class="role-grid"><article class="role-card card"><div class="feature-icon">${icon('user')}</div><h2>I'm a Student</h2><p>Discover clubs, receive personalized matches, track deadlines, and submit applications.</p><button class="button primary" data-demo-login="student">Continue as Demo Student</button></article><article class="role-card card staff-role"><div class="feature-icon">${icon('briefcase')}</div><h2>I'm Club Staff</h2><p>Manage Pacific Finance Association, publish opportunities, build forms, and review applicants.</p><button class="button accent" data-demo-login="staff">Continue as Demo Club Staff</button></article></div><div class="auth0-note">${icon('external')} <div><strong>Auth0-ready</strong><span>When server credentials are configured, these role choices redirect to Universal Login. Role preference never grants staff authorization.</span></div></div><button class="text-link" data-page="home">View public homepage</button></section></main>`;
}

home = function(){
  const content=originalHome();
  return content.replace('<button class="button primary" data-page="discover">Explore clubs', '<button class="button primary" data-page="welcome">Sign in or try the demo').replace('View personalized demo','Student dashboard');
};

function topRecommendations(){
  const p=profile();
  return [...CLUBS].filter(c=>c.visibility!=='DRAFT').sort((a,b)=>scoreClub(b,p).score-scoreClub(a,p).score).slice(0,3);
}

dashboard = function(){
  const p=profile(),recs=topRecommendations(),myApps=state.store.submissions.filter(s=>s.studentId===p.id),deadlines=calendarEvents().filter(e=>e.type==='Application Deadline'&&new Date(e.date)>=new Date()).slice(0,4),active=CLUBS.filter(c=>c.visibility!=='DRAFT').filter(activeOpp).filter(c=>['active','soon'].includes(oppStatus(activeOpp(c)))).slice(0,3),outside=[...CLUBS].filter(c=>c.visibility!=='DRAFT').filter(c=>scoreClub(c,p).matches.length===0).sort((a,b)=>scoreClub(b,p).score-scoreClub(a,p).score).slice(0,3);
  return `<main class="page"><div class="container"><section class="welcome"><div><p class="eyebrow" style="color:#9fc1ff">Personalized student portal</p><h2>Welcome back, ${p.firstName}!</h2><p>Your CLUBHUB is tuned to ${p.faculty}, ${p.major}, and ${p.interests.slice(0,3).join(', ')}.</p></div><div class="match-ring">${scoreClub(recs[0],p).score}%</div></section><div class="stat-grid"><a href="#/recommendations" class="stat stat-link card" data-page="recommendations"><div class="feature-icon">${icon('spark')}</div><div><strong>${recs.length}</strong><span>top matches ready</span></div>${icon('arrowRight','stat-arrow')}</a><a href="#/saved" class="stat stat-link card" data-page="saved"><div class="feature-icon">${icon('bookmark')}</div><div><strong>${p.saved.length}</strong><span>saved clubs</span></div>${icon('arrowRight','stat-arrow')}</a><a href="#/applications" class="stat stat-link card" data-page="applications"><div class="feature-icon">${icon('briefcase')}</div><div><strong>${myApps.length}</strong><span>submitted applications</span></div>${icon('arrowRight','stat-arrow')}</a></div>${dashSection('Recommended for you','Transparent matches based on your current profile.',recs.map(c=>clubCard(c,true)).join(''))}<section class="dashboard-section"><div class="section-head"><div><h2>Upcoming deadlines</h2><p>Your nearest recruitment dates.</p></div><button class="text-link" data-page="calendar">Open calendar</button></div><div class="deadline-list">${deadlines.map(deadlineCard).join('')}</div></section>${dashSection('Currently recruiting','Opportunities accepting applications now.',active.map(c=>clubCard(c)).join(''))}${dashSection('Explore new interests','Thoughtful steps outside your usual categories.',outside.map(c=>clubCard(c)).join(''))}</div></main>`;
};

function recommendationsPage(){
  const recs=topRecommendations();
  return `<main class="page"><div class="container"><div class="page-header"><div><p class="eyebrow">Personalized discovery</p><h1>Top matches for ${profile().firstName}</h1><p>These ${recs.length} matches use the same interests, academic relevance, recruitment availability, and time-fit logic as your dashboard.</p></div><button class="button light" data-page="profile">${icon('edit')} Update preferences</button></div><div class="club-grid">${recs.map(c=>clubCard(c,true)).join('')}</div></div></main>`;
}

function applicationsPage(){
  const apps=state.store.submissions.filter(s=>s.studentId===profile().id).sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
  return `<main class="page"><div class="container"><div class="page-header"><div><p class="eyebrow">Your recruitment journey</p><h1>My applications</h1><p>Review submitted answers and follow public status updates from club teams.</p></div></div>${apps.length?`<div class="application-list">${apps.map(s=>{const c=CLUBS.find(x=>x.id===s.clubId);return `<article class="application-row card"><div class="club-logo club-cover ${c.gradient}">${esc(c.emoji)}</div><div><span class="category">${c.name}</span><h3>${s.opportunityTitle}</h3><p>Submitted ${fmt(s.submittedAt,{month:'short',day:'numeric',year:'numeric'})}</p></div><span class="status-chip status-${s.status.toLowerCase()}">${phase2Status(s.status)}</span><button class="button light small" data-submission="${s.id}">View application</button></article>`}).join('')}</div>`:`<div class="empty card"><div class="feature-icon">${icon('briefcase')}</div><h3>No submitted applications yet</h3><p class="muted">Explore clubs that are recruiting and submit your first application.</p><button class="button primary" data-page="discover">Explore recruiting clubs</button></div>`}</div></main>`;
}

function publicOpportunities(c){return c.opps.filter(o=>!o.publicationStatus||o.publicationStatus==='PUBLISHED')}
function opportunityActions(c,o){
  const status=oppStatus(o),form=opportunityForm(c.id,o.title),applied=hasApplied(c.id,o.title);
  if(applied) return `<button class="button light small" data-page="applications">View submitted application</button>`;
  if(status==='active'||status==='soon') return form?`<button class="button primary small" data-apply="${esc(oppKey(c.id,o.title))}">Apply now</button>`:`<button class="button light small" disabled title="This club has not published an application form">Form not published</button>`;
  if(status==='upcoming') return `<button class="button light small" data-calendar-club="${c.id}">View opening in calendar</button>`;
  return `<button class="button light small" disabled>Applications closed</button>`;
}

clubModal = function(id){
  const c=CLUBS.find(x=>x.id===id);if(!c)return'';const opps=publicOpportunities(c);
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal club-profile-modal" role="dialog" aria-modal="true" aria-labelledby="club-modal-title" onclick="event.stopPropagation()"><div class="modal-head"><h2>Club profile</h2><button class="icon-button" data-action="close-modal" aria-label="Close club profile">${icon('x')}</button></div><div class="modal-body"><div class="detail-hero"><div class="detail-logo club-cover ${c.gradient}">${esc(c.emoji)}</div><div><span class="tag">${c.category}</span><h2 id="club-modal-title">${c.name}</h2><p class="muted">${c.description}</p><button class="button ${saved(c.id)?'accent':'primary'} small" data-save="${c.id}">${icon('bookmark')} ${saved(c.id)?'Remove from Saved':'Save Club'}</button></div></div><div class="detail-section"><h3>Our mission</h3><p class="muted">${c.mission}</p></div><div class="detail-section"><h3>What we do</h3><div class="activity-list">${c.activities.map(x=>`<div class="activity">${icon('check')} ${x}</div>`).join('')}</div></div><div class="detail-section"><h3>Interests & fit</h3><div class="tags">${c.tags.map(x=>`<span class="tag">${x}</span>`).join('')}</div><p class="muted">Faculty relevance: ${c.faculties.join(', ')} · Expected commitment: ${c.hours} hrs/week</p><p><strong>Membership:</strong> ${c.membership}</p></div><div class="detail-section"><h3>Recruitment opportunities</h3>${opps.length?opps.map(o=>`<article class="opp-card"><div class="opp-top"><div><h4>${o.title}</h4><span class="pill ${oppStatus(o)}"><i class="dot"></i>${statusLabel(o)}</span></div><strong>${fmt(o.deadline,{month:'short',day:'numeric',year:'numeric'})}</strong></div><p>${o.description}</p><p><strong>Requirements:</strong> ${o.requirements}</p><div class="opp-actions"><button class="text-link" data-opportunity="${esc(oppKey(c.id,o.title))}">View details</button>${opportunityActions(c,o)}</div></article>`).join(''):'<p class="muted">No recruitment opportunities are published right now.</p>'}</div><div class="detail-section"><h3>Upcoming events</h3>${c.events.map(e=>`<button class="deadline event-row-button" data-calendar-club="${c.id}"><div class="date-box"><small>${fmt(e.start,{month:'short'}).toUpperCase()}</small><b>${fmt(e.start,{day:'numeric'})}</b></div><div><h4>${e.title}</h4><p>${e.description}</p></div></button>`).join('')}</div></div></div></div>`;
};

function opportunityModal(key){
  const [clubId,...titleParts]=key.split(':'),title=titleParts.join(':'),c=CLUBS.find(x=>x.id===clubId),o=c?.opps.find(x=>x.title===title);if(!c||!o)return'';
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="opportunity-title" onclick="event.stopPropagation()"><div class="modal-head"><h2>Recruitment opportunity</h2><button class="icon-button" data-action="close-modal" aria-label="Close opportunity">${icon('x')}</button></div><div class="modal-body"><span class="pill ${oppStatus(o)}"><i class="dot"></i>${statusLabel(o)}</span><h2 id="opportunity-title">${o.title}</h2><p class="muted">${c.name}</p><p>${o.description}</p><h3>Requirements</h3><p>${o.requirements}</p><div class="deadline-summary card"><div><small>Applications open</small><strong>${fmt(o.open,{month:'long',day:'numeric',year:'numeric'})}</strong></div><div><small>Deadline</small><strong>${fmt(o.deadline,{month:'long',day:'numeric',year:'numeric'})}</strong></div></div>${opportunityActions(c,o)}</div></div></div>`;
}

function applicationFormModal(key){
  const [clubId,...parts]=key.split(':'),title=parts.join(':'),c=CLUBS.find(x=>x.id===clubId),form=opportunityForm(clubId,title);if(!c||!form)return'';
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal application-modal" role="dialog" aria-modal="true" aria-labelledby="application-title" onclick="event.stopPropagation()"><div class="modal-head"><h2>Application</h2><button class="icon-button" data-action="close-modal" aria-label="Close application">${icon('x')}</button></div><form class="modal-body" id="student-application" data-application-key="${esc(key)}"><p class="eyebrow">${c.name}</p><h2 id="application-title">${form.name}</h2><p class="muted">Form version ${form.version} · Required questions are marked *</p>${form.questions.map(q=>questionInput(q)).join('')}<div class="notice">Your responses are private to authorized ${c.name} reviewers. CLUBHUB does not use AI to evaluate applicants.</div><div class="form-actions"><button type="button" class="button light" data-action="close-modal">Cancel</button><button type="submit" class="button primary">Submit application</button></div></form></div></div>`;
}

function questionInput(q){
  const label=`<label for="answer-${q.id}">${esc(q.title)}${q.required?' *':''}</label>${q.description?`<small>${esc(q.description)}</small>`:''}`;
  if(q.type==='LONG_TEXT')return `<div class="field application-field">${label}<textarea id="answer-${q.id}" name="${q.id}" rows="5" ${q.required?'required':''} data-limit="${q.limit||''}" data-limit-type="${q.limitType||''}"></textarea>${q.limit?`<small>Maximum ${q.limit} ${q.limitType}</small>`:''}</div>`;
  if(q.type==='SHORT_TEXT')return `<div class="field application-field">${label}<input id="answer-${q.id}" name="${q.id}" ${q.required?'required':''} maxlength="${q.limit||500}"></div>`;
  if(q.type==='DROPDOWN')return `<div class="field application-field">${label}<select id="answer-${q.id}" name="${q.id}" ${q.required?'required':''}><option value="">Select one</option>${q.options.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div>`;
  const inputType=q.type==='CHECKBOXES'?'checkbox':'radio';return `<fieldset class="field application-field"><legend>${esc(q.title)}${q.required?' *':''}</legend>${q.description?`<small>${esc(q.description)}</small>`:''}<div class="answer-options">${q.options.map((x,i)=>`<label><input type="${inputType}" name="${q.id}" value="${esc(x)}" ${q.required&&i===0?'required':''}> ${esc(x)}</label>`).join('')}</div></fieldset>`;
}

function submissionModal(id,staffView=false){
  const s=state.store.submissions.find(x=>x.id===id);if(!s)return'';const c=CLUBS.find(x=>x.id===s.clubId),form=state.store.forms.find(f=>f.id===s.formId&&f.version===s.formVersion);const canReview=staffView&&staffClub()?.id===s.clubId;
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="submission-title" onclick="event.stopPropagation()"><div class="modal-head"><h2>${staffView?'Applicant review':'Submitted application'}</h2><button class="icon-button" data-action="close-modal" aria-label="Close application details">${icon('x')}</button></div><div class="modal-body"><p class="eyebrow">${c.name}</p><h2 id="submission-title">${s.opportunityTitle}</h2><div class="submission-meta"><span>${staffView?userName(s.studentId):'Submitted by you'}</span><span>${fmt(s.submittedAt,{month:'long',day:'numeric',year:'numeric'})}</span><span class="status-chip status-${s.status.toLowerCase()}">${phase2Status(s.status)}</span></div><div class="answer-review">${form?form.questions.map(q=>`<section><h3>${esc(q.title)}</h3><p>${formatAnswer(s.answers[q.id])}</p></section>`).join(''):`<p class="muted">The original form snapshot is unavailable.</p>`}</div>${canReview?`<div class="review-controls card"><div class="field"><label>Review status</label><select id="review-status">${REVIEW_STATUSES.filter(x=>x!=='WITHDRAWN').map(x=>`<option value="${x}" ${s.status===x?'selected':''}>${phase2Status(x)}</option>`).join('')}</select></div><div class="field"><label>Private reviewer note</label><textarea id="review-note" rows="3" placeholder="Visible only to authorized club staff"></textarea></div><button class="button primary" data-update-submission="${s.id}">Save review</button></div>`:''}</div></div></div>`;
}
function formatAnswer(value){return Array.isArray(value)?value.map(esc).join(', '):esc(value||'No response')}

function profileWithPersonalization(){
  const p=profile(),bio=p.bio||'',extracted=p.extractedInterests||[];
  return `<main class="page"><div class="container"><div class="page-header"><div><p class="eyebrow">Your CLUBHUB</p><h1>Profile & personalization</h1><p>Structured preferences and optional experience context power your discovery matches.</p></div></div><div class="profile-grid"><aside class="profile-card card"><div class="big-avatar">${p.initials}</div><div><h3>${p.name}</h3><p class="muted">${p.faculty} · Year ${p.year}</p><span class="demo-label">CLASSROOM DEMO</span></div></aside><section class="form-card card"><div class="form-grid"><div class="field"><label>Display name</label><input id="profile-name" value="${esc(p.name)}"></div><div class="field"><label>Faculty</label><select id="profile-faculty">${['Sauder','Science','Arts','Engineering','Kinesiology','Land & Food Systems'].map(x=>`<option ${x===p.faculty?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Major or program</label><input id="profile-major" value="${esc(p.major)}"></div><div class="field"><label>Year of study</label><select id="profile-year">${[1,2,3,4,5].map(x=>`<option ${String(x)===String(p.year)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Interests</label><div class="interest-picker">${allInterests().map(x=>`<button type="button" class="interest-choice ${p.interests.includes(x)?'selected':''}" data-interest="${x}">${x}</button>`).join('')}</div></div><div class="field full"><label>Available extracurricular time: <strong id="hours-label">${p.hours} hours / week</strong></label><input id="profile-hours" type="range" min="1" max="12" value="${p.hours}"></div></div><div class="personalization-panel"><p class="eyebrow">Tell us about yourself</p><h2>Turn your experiences into better discovery.</h2><p class="muted">Share interests, skills, leadership, volunteering, projects, or goals in your own words. This is optional and never shown to club staff.</p><div class="field"><label for="profile-bio">Write about yourself</label><textarea id="profile-bio" rows="7" placeholder="Tell us about yourself! What activities have you participated in? What skills have you developed? What are your interests, achievements, or future goals?">${esc(bio)}</textarea></div><div class="upload-zone"><input id="cv-upload" type="file" accept=".pdf,.docx,.txt" hidden><div class="feature-icon">${icon('download')}</div><div><strong>Upload a CV or resume</strong><p>PDF, DOCX, or text · maximum 5 MB. Raw documents are not retained in this demo.</p></div><button type="button" class="button light small" data-action="choose-cv">Choose file</button></div><div id="cv-status" class="upload-status">${p.cvName?`Selected: ${esc(p.cvName)} · ${p.cvProcessed?'text processed':'server extraction required for this file type'}`:'No document selected'}</div><label class="consent-row"><input id="ai-consent" type="checkbox"> I consent to sending minimized, reviewed profile information to Gemini when a server key is configured.</label><div class="notice"><strong>Basic matching active.</strong> No Gemini key is configured in this static demo. Analysis uses transparent local keyword matching; it is not presented as AI.</div><div class="form-actions"><button type="button" class="button light" data-action="clear-personalization">Delete personal text</button><button type="button" class="button accent" data-action="analyze-profile">Analyze for demo matches</button></div>${extracted.length?`<div class="extracted-panel"><h3>Review extracted interests</h3><p class="muted">Only save the suggestions that accurately describe you.</p><div class="interest-picker">${extracted.map(x=>`<button type="button" class="interest-choice selected" data-extracted="${x}">${x}</button>`).join('')}</div><button type="button" class="button primary small" data-action="confirm-extracted">Add reviewed interests</button></div>`:''}</div><div class="form-actions"><button class="button primary" data-action="save-profile">Save profile</button></div></section></div>${extracted.length?aiMatchesSection(extracted):''}</div></main>`;
}
profilePage = profileWithPersonalization;

function extractProfileKeywords(text){
  const map={finance:['finance','investing','market','accounting'],consulting:['consulting','case','problem solving','strategy'],entrepreneurship:['entrepreneur','startup','founder','business'],research:['research','lab','academic'],medicine:['medicine','health','medical'],technology:['technology','coding','software','ai','data'],photography:['photography','camera','photo'],film:['film','video','cinema'],music:['music','audio','production'],sustainability:['sustainability','climate','environment'],volunteering:['volunteer','charity','community service'],['international relations']:['international','politics','diplomacy'],['public speaking']:['debate','public speaking','presentation','speech'],leadership:['leadership','led','organized','coordinated']};
  const lower=text.toLowerCase();return Object.entries(map).filter(([,terms])=>terms.some(t=>lower.includes(t))).map(([key])=>key).slice(0,10);
}
function aiMatchesSection(interests){
  const temp={...profile(),interests:[...new Set([...profile().interests,...interests])]},matches=[...CLUBS].sort((a,b)=>scoreClub(b,temp).score-scoreClub(a,temp).score).slice(0,3);
  return `<section class="dashboard-section"><div class="section-head"><div><p class="eyebrow">Basic matching · deterministic fallback</p><h2>AI Matches for You</h2><p>Grounded only in your reviewed keywords and CLUBHUB's stored club data.</p></div></div><div class="club-grid">${matches.map(c=>clubCard(c,true)).join('')}</div></section>`;
}

function staffPageShell(title,subtitle,content,action=''){
  const c=staffClub();if(!c)return unauthorizedPage();return `<main class="page staff-page"><div class="container"><div class="staff-context"><span class="club-logo club-cover ${c.gradient}">${esc(c.emoji)}</span><div><small>Club staff workspace · ${phase2Status(staffMembership().role)}</small><strong>${c.name}</strong></div></div><div class="page-header"><div><p class="eyebrow">Recruitment workspace</p><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>${content}</div></main>`;
}
function unauthorizedPage(){return `<main class="page"><div class="container"><div class="empty card"><div class="feature-icon">${icon('briefcase')}</div><h2>Staff access required</h2><p class="muted">This development identity has no approved membership for the selected club.</p><button class="button primary" data-workspace="student">Return to student workspace</button></div></div></main>`}

function staffOverviewPage(){
  const c=staffClub();if(!c)return unauthorizedPage();const opps=c.opps,apps=state.store.submissions.filter(s=>s.clubId===c.id),pending=apps.filter(s=>s.status==='SUBMITTED').length,active=opps.filter(o=>['active','soon'].includes(oppStatus(o))).length;
  return staffPageShell('Overview','A live view of your club profile, campaigns, and applicant pipeline.',`<div class="stat-grid"><a class="stat stat-link card" data-page="staff-recruitment"><div class="feature-icon">${icon('calendar')}</div><div><strong>${active}</strong><span>active campaigns</span></div>${icon('arrowRight','stat-arrow')}</a><a class="stat stat-link card" data-page="applicants"><div class="feature-icon">${icon('user')}</div><div><strong>${apps.length}</strong><span>total applications</span></div>${icon('arrowRight','stat-arrow')}</a><a class="stat stat-link card" data-page="applicants"><div class="feature-icon">${icon('clock')}</div><div><strong>${pending}</strong><span>awaiting review</span></div>${icon('arrowRight','stat-arrow')}</a></div><div class="staff-grid"><section class="card table-card"><div class="section-head"><div><h2>Recent submissions</h2><p>Most recently received applications.</p></div></div>${apps.length?apps.sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)).slice(0,4).map(s=>`<button class="table-row" data-staff-submission="${s.id}"><span class="avatar">${PERSONAS[s.studentId]?.initials||'ST'}</span><span><strong>${userName(s.studentId)}</strong><small>${s.opportunityTitle}</small></span><span class="status-chip status-${s.status.toLowerCase()}">${phase2Status(s.status)}</span></button>`).join(''):'<p class="muted">No applications received yet.</p>'}</section><section class="card quick-actions"><h2>Quick actions</h2><button class="button primary" data-action="new-opportunity">Create opportunity</button><button class="button light" data-page="form-builder">Build application form</button><button class="button light" data-page="staff-profile">Edit public club profile</button></section></div>`);
}

function staffProfilePage(){
  const c=staffClub();if(!c)return unauthorizedPage();
  return staffPageShell('My club profile','Changes update the shared student-facing club record.',`<div class="form-card card">${c.visibility==='DRAFT'?'<div class="notice"><strong>Draft profile.</strong> Students cannot discover this club until you publish it.</div>':''}<div class="form-grid"><div class="field"><label>Club name</label><input id="staff-club-name" value="${esc(c.name)}" ${hasStaffRole('OWNER')?'':'disabled'}></div><div class="field"><label>Category</label><select id="staff-club-category">${CATEGORIES.map(x=>`<option ${x===c.category?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Short introduction</label><textarea id="staff-club-description" rows="4">${esc(c.description)}</textarea></div><div class="field full"><label>Mission</label><textarea id="staff-club-mission" rows="3">${esc(c.mission)}</textarea></div><div class="field full"><label>Activities, one per line</label><textarea id="staff-club-activities" rows="4">${esc(c.activities.join('\n'))}</textarea></div><div class="field"><label>Weekly time commitment</label><input id="staff-club-hours" type="number" min="1" max="30" value="${c.hours}"></div><div class="field"><label>Membership information</label><input id="staff-club-membership" value="${esc(c.membership)}"></div></div><div class="form-actions"><button class="button light" data-action="preview-staff-club">Preview as student</button><button class="button primary" data-action="save-staff-profile">Save profile</button>${c.visibility==='DRAFT'?'<button class="button accent" data-action="publish-staff-club">Publish unverified demo profile</button>':''}</div></div>`,`<button class="button light" data-action="new-club">Create Your Club Profile</button>`);
}

function staffRecruitmentPage(){
  const c=staffClub();if(!c)return unauthorizedPage();const groups={Open:[],Upcoming:[],Past:[],Drafts:[]},drafts=state.store.customOpportunities.filter(o=>o.clubId===c.id&&o.status==='DRAFT').map(o=>({customId:o.id,title:o.title,description:o.description,requirements:o.requirements,open:o.open,deadline:o.deadline,publicationStatus:o.status}));[...c.opps,...drafts].forEach(o=>{if(o.publicationStatus==='DRAFT')groups.Drafts.push(o);else if(oppStatus(o)==='upcoming')groups.Upcoming.push(o);else if(oppStatus(o)==='closed'||o.publicationStatus==='CLOSED')groups.Past.push(o);else groups.Open.push(o)});
  return staffPageShell('Recruitment opportunities','Create, publish, and manage campaigns whose dates feed student discovery and calendar views.',Object.entries(groups).map(([name,items])=>`<section class="recruitment-group"><h2>${name} applications <span>${items.length}</span></h2>${items.length?`<div class="application-list">${items.map(o=>{const count=state.store.submissions.filter(s=>s.clubId===c.id&&s.opportunityTitle===o.title).length;return `<article class="application-row card"><div><span class="category">${name}</span><h3>${o.title}</h3><p>${fmt(o.open)} – ${fmt(o.deadline)} · ${count} applicant${count===1?'':'s'}</p></div><span class="pill ${oppStatus(o)}"><i class="dot"></i>${o.publicationStatus==='DRAFT'?'Draft':statusLabel(o)}</span><button class="button light small" data-opportunity="${esc(oppKey(c.id,o.title))}">View</button><button class="button light small" data-page="applicants">Applicants</button></article>`}).join('')}</div>`:'<div class="empty-inline">No campaigns in this section.</div>'}</section>`).join(''),`<button class="button primary" data-action="new-opportunity">Create opportunity</button>`);
}

function formBuilderPage(){
  const c=staffClub();if(!c)return unauthorizedPage();const forms=state.store.forms.filter(f=>f.clubId===c.id);
  return staffPageShell('Application form builder','Create stable, versioned forms rendered dynamically for students.',forms.length?`<div class="application-list">${forms.map(f=>`<article class="application-row card"><div><span class="category">Version ${f.version} · ${phase2Status(f.status)}</span><h3>${f.name}</h3><p>${f.questions.length} questions · ${f.opportunityTitle}</p></div><button class="button light small" data-builder="${f.id}">Edit form</button><button class="button light small" data-preview-form="${f.id}">Preview</button></article>`).join('')}</div>`:`<div class="empty card"><h3>No application forms</h3><p class="muted">Create a campaign first, then add its application questions.</p></div>`,`<button class="button primary" data-action="new-form">Add form</button>`);
}

function applicantsPage(){
  const c=staffClub();if(!c)return unauthorizedPage();let apps=state.store.submissions.filter(s=>s.clubId===c.id);if(state.applicantStatus!=='all')apps=apps.filter(s=>s.status===state.applicantStatus);apps.sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
  return staffPageShell('Applicants','Review only applications submitted to your authorized club workspace.',`<div class="filters"><select data-applicant-filter><option value="all">All statuses</option>${REVIEW_STATUSES.map(x=>`<option value="${x}" ${state.applicantStatus===x?'selected':''}>${phase2Status(x)}</option>`).join('')}</select></div>${apps.length?`<div class="application-list">${apps.map(s=>`<article class="application-row card"><span class="avatar">${PERSONAS[s.studentId]?.initials||'ST'}</span><div><span class="category">${s.opportunityTitle}</span><h3>${userName(s.studentId)}</h3><p>Submitted ${fmt(s.submittedAt,{month:'short',day:'numeric',year:'numeric'})}</p></div><span class="status-chip status-${s.status.toLowerCase()}">${phase2Status(s.status)}</span><button class="button primary small" data-staff-submission="${s.id}">Review</button></article>`).join('')}</div>`:`<div class="empty card"><h3>No matching applicants</h3><p class="muted">Applications will appear here as students submit published forms.</p></div>`}`);
}

function teamPage(){
  const c=staffClub();if(!c)return unauthorizedPage();const team=state.store.memberships.filter(m=>m.clubId===c.id&&m.status==='APPROVED');
  return staffPageShell('Team management','Owners can manage club-scoped roles. Editors and reviewers cannot elevate permissions.',`<div class="application-list">${team.map(m=>`<article class="application-row card"><span class="avatar">${PERSONAS[m.userId]?.initials||'ST'}</span><div><h3>${userName(m.userId)}</h3><p>${phase2Status(m.role)} · Approved</p></div>${hasStaffRole('OWNER')&&m.userId!==state.persona?`<select data-team-role="${m.id}">${STAFF_ROLES.map(r=>`<option ${r===m.role?'selected':''}>${r}</option>`).join('')}</select><button class="button light small" data-remove-member="${m.id}">Remove</button>`:`<span class="tag">${phase2Status(m.role)}</span>`}</article>`).join('')}</div><div class="notice">Invitations and approval requests require verified identities in the production Auth0 workflow. This demo does not send external invitations.</div>`);
}

function newOpportunityModal(){
  const c=staffClub();if(!c)return'';const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const deadline=new Date();deadline.setDate(deadline.getDate()+14);const dateValue=d=>d.toISOString().slice(0,10);
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-opportunity-title" onclick="event.stopPropagation()"><div class="modal-head"><h2 id="new-opportunity-title">Create recruitment opportunity</h2><button class="icon-button" data-action="close-modal">${icon('x')}</button></div><form class="modal-body" id="new-opportunity-form"><div class="field"><label>Opportunity title *</label><input name="title" required placeholder="e.g. Junior Research Associate"></div><div class="field"><label>Description *</label><textarea name="description" rows="4" required></textarea></div><div class="field"><label>Responsibilities</label><textarea name="responsibilities" rows="3"></textarea></div><div class="field"><label>Eligibility requirements *</label><textarea name="requirements" rows="3" required></textarea></div><div class="form-grid"><div class="field"><label>Opens *</label><input type="date" name="open" value="${dateValue(tomorrow)}" required></div><div class="field"><label>Deadline *</label><input type="date" name="deadline" value="${dateValue(deadline)}" required></div><div class="field"><label>Hours / week</label><input type="number" name="hours" min="1" max="30" value="4"></div><div class="field"><label>Publication</label><select name="status"><option value="DRAFT">Save as draft</option><option value="PUBLISHED">Publish now</option></select></div></div><div class="form-actions"><button type="button" class="button light" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Create opportunity</button></div></form></div></div>`;
}

function newClubModal(){
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-club-title" onclick="event.stopPropagation()"><div class="modal-head"><h2 id="new-club-title">Create your club profile</h2><button class="icon-button" data-action="close-modal">${icon('x')}</button></div><form class="modal-body" id="new-club-form"><p class="muted">Start a private draft. New classroom clubs are always labeled unverified demonstration data.</p><div class="form-grid"><div class="field"><label>Club name *</label><input name="name" required placeholder="e.g. Student Design Collective"></div><div class="field"><label>Category *</label><select name="category">${CATEGORIES.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field full"><label>Short introduction *</label><textarea name="description" rows="3" required placeholder="What should a student understand in one minute?"></textarea></div><div class="field full"><label>Mission *</label><textarea name="mission" rows="3" required placeholder="Why does this community exist?"></textarea></div><div class="field full"><label>Member activities, one per line *</label><textarea name="activities" rows="4" required placeholder="Weekly workshops&#10;Community projects&#10;Guest speakers"></textarea></div><div class="field"><label>Relevant interests, comma separated</label><input name="tags" placeholder="design, community, creativity"></div><div class="field"><label>Relevant faculties</label><input name="faculties" placeholder="Arts, Sauder, All Faculties"></div><div class="field"><label>Expected hours / week</label><input name="hours" type="number" min="1" max="30" value="3"></div><div class="field"><label>Membership and fees</label><input name="membership" placeholder="Free membership"></div><div class="field"><label>Meeting format</label><select name="format"><option>In person</option><option>Online</option><option>Hybrid</option></select></div><div class="field"><label>Contact email</label><input name="email" type="email" placeholder="club@example.test"></div></div><div class="notice">The draft is private to this demo staff identity until explicitly published.</div><div class="form-actions"><button type="button" class="button light" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Save draft</button></div></form></div></div>`;
}

function builderModal(id){
  const form=state.store.forms.find(f=>f.id===id);if(!form)return'';return `<div class="modal-backdrop" data-action="close-modal"><div class="modal builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-title" onclick="event.stopPropagation()"><div class="modal-head"><h2 id="builder-title">Edit form</h2><button class="icon-button" data-action="close-modal">${icon('x')}</button></div><div class="modal-body"><div class="field"><label>Form name</label><input id="builder-name" value="${esc(form.name)}"></div><div id="builder-questions">${form.questions.map((q,i)=>builderQuestion(q,i)).join('')}</div><button class="button light" data-action="add-question">Add question</button><div class="form-actions"><button class="button light" data-preview-form="${form.id}">Preview form</button><button class="button primary" data-save-form="${form.id}">Save new version</button></div></div></div></div>`;
}
function builderQuestion(q,i){return `<section class="builder-question card" data-question-id="${q.id}"><div class="builder-order"><button class="icon-button" data-move-question="up" aria-label="Move question up">${icon('arrowLeft')}</button><strong>${i+1}</strong><button class="icon-button" data-move-question="down" aria-label="Move question down">${icon('arrowRight')}</button></div><div class="field"><label>Question</label><input data-q-title value="${esc(q.title)}"></div><div class="field"><label>Type</label><select data-q-type>${[['SHORT_TEXT','Short text'],['LONG_TEXT','Long text'],['MULTIPLE_CHOICE','Multiple choice'],['CHECKBOXES','Checkboxes'],['DROPDOWN','Dropdown']].map(([v,l])=>`<option value="${v}" ${q.type===v?'selected':''}>${l}</option>`).join('')}</select></div><label class="consent-row"><input type="checkbox" data-q-required ${q.required?'checked':''}> Required</label><div class="field"><label>Choices (comma separated)</label><input data-q-options value="${esc((q.options||[]).join(', '))}"></div><button class="text-link danger" data-delete-question>Delete</button></section>`}

function formPreviewModal(id){const form=state.store.forms.find(f=>f.id===id);if(!form)return'';return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><div class="modal-head"><h2>Student form preview</h2><button class="icon-button" data-action="close-modal">${icon('x')}</button></div><div class="modal-body"><h2>${form.name}</h2>${form.questions.map(questionInput).join('')}<div class="notice">Preview only — answers are not submitted.</div></div></div></div>`}

function renderPhase2Modal(){
  if(!state.modal)return'';const {type,id}=state.modal;
  return type==='club'?clubModal(id):type==='event'?eventModal(id):type==='onboarding'?onboarding():type==='opportunity'?opportunityModal(id):type==='application'?applicationFormModal(id):type==='submission'?submissionModal(id,false):type==='staff-submission'?submissionModal(id,true):type==='new-opportunity'?newOpportunityModal():type==='new-club'?newClubModal():type==='builder'?builderModal(id):type==='form-preview'?formPreviewModal(id):'';
}

render = function(){
  const pages={welcome:welcomePage,home,discover,dashboard,recommendations:recommendationsPage,calendar,saved:savedPage,applications:applicationsPage,profile:profilePage,'staff-overview':staffOverviewPage,'staff-profile':staffProfilePage,'staff-recruitment':staffRecruitmentPage,'form-builder':formBuilderPage,applicants:applicantsPage,team:teamPage};
  const page=pages[state.page]||welcomePage;
  const showNav=state.page!=='welcome';
  app.innerHTML=(showNav?nav():'')+page()+renderPhase2Modal();
  document.title=`${state.page==='home'?'CLUBHUB — Find your people':state.page.split('-').map(x=>x[0]?.toUpperCase()+x.slice(1)).join(' ')+' · CLUBHUB'}`;
  afterRender();
};

document.addEventListener('click',e=>{
  const closeTarget=e.target.closest?.('[data-action="close-modal"]');
  if(closeTarget){e.preventDefault();e.stopPropagation();closeOverlay();return}
  if(!e.target.closest?.('.persona')) document.querySelectorAll('.persona.open').forEach(menu=>menu.classList.remove('open'));
  const b=e.target.closest('button,a');if(!b)return;
  if(b.dataset.demoLogin){
    localStorage.setItem('clubhub-demo-session',b.dataset.demoLogin);
    if(b.dataset.demoLogin==='staff'){state.persona='staffdemo';state.workspace='staff:finance-association';localStorage.setItem('clubhub-persona',state.persona);localStorage.setItem('clubhub-workspace',state.workspace);navigate('staff-overview')}
    else{state.persona='alex';state.workspace='student';localStorage.setItem('clubhub-persona','alex');localStorage.setItem('clubhub-workspace','student');navigate('dashboard')}
    return;
  }
  if(b.dataset.workspace){state.workspace=b.dataset.workspace;localStorage.setItem('clubhub-workspace',state.workspace);document.querySelector('.workspace-switcher')?.classList.remove('open');navigate(state.workspace==='student'?'dashboard':'staff-overview');return}
  if(b.dataset.persona){state.workspace='student';localStorage.setItem('clubhub-workspace','student');return}
  if(b.dataset.action==='workspace-menu'){b.closest('.persona').classList.toggle('open');return}
  if(b.dataset.club){focusReturnSelector=`[data-club="${CSS.escape(b.dataset.club)}"]`;state.modal={type:'club',id:b.dataset.club};render();return}
  if(b.dataset.opportunity){openOverlay('opportunity',b.dataset.opportunity,b);return}
  if(b.dataset.apply){openOverlay('application',b.dataset.apply,b);return}
  if(b.dataset.submission){openOverlay('submission',b.dataset.submission,b);return}
  if(b.dataset.staffSubmission){openOverlay('staff-submission',b.dataset.staffSubmission,b);return}
  if(b.dataset.calendarClub){state.modal=null;state.calDate=new Date();navigate('calendar');return}
  if(b.dataset.action==='choose-cv'){document.querySelector('#cv-upload')?.click();return}
  if(b.dataset.action==='save-profile'){const p=profile(),bio=document.querySelector('#profile-bio');if(bio)p.bio=bio.value;localStorage.setItem(`clubhub-profile-${p.id}`,JSON.stringify(p));return}
  if(b.dataset.action==='analyze-profile'){const p=profile(),bio=document.querySelector('#profile-bio')?.value||'';p.bio=bio;p.extractedInterests=extractProfileKeywords(`${bio} ${p.cvText||''}`);localStorage.setItem(`clubhub-profile-${p.id}`,JSON.stringify(p));toast(p.extractedInterests.length?'Basic matching found reviewable interests':'Add more detail to find matching interests');render();return}
  if(b.dataset.action==='confirm-extracted'){const p=profile();p.interests=[...new Set([...p.interests,...(p.extractedInterests||[])])];localStorage.setItem(`clubhub-profile-${p.id}`,JSON.stringify(p));toast('Reviewed interests added to your profile');render();return}
  if(b.dataset.action==='clear-personalization'){const p=profile();p.bio='';p.cvName='';p.cvText='';p.cvProcessed=false;p.extractedInterests=[];localStorage.setItem(`clubhub-profile-${p.id}`,JSON.stringify(p));toast('Personal profile text deleted');render();return}
  if(b.dataset.action==='new-opportunity'){openOverlay('new-opportunity','new',b);return}
  if(b.dataset.action==='new-club'){openOverlay('new-club','new',b);return}
  if(b.dataset.action==='preview-staff-club'){openOverlay('club',staffClub().id,b);return}
  if(b.dataset.action==='save-staff-profile'){const c=staffClub();if(!c)return;c.name=document.querySelector('#staff-club-name').value;c.category=document.querySelector('#staff-club-category').value;c.description=document.querySelector('#staff-club-description').value;c.mission=document.querySelector('#staff-club-mission').value;c.activities=document.querySelector('#staff-club-activities').value.split('\n').map(x=>x.trim()).filter(Boolean);c.hours=+document.querySelector('#staff-club-hours').value;c.membership=document.querySelector('#staff-club-membership').value;localStorage.setItem(`clubhub-club-${c.id}`,JSON.stringify(c));toast('Club profile saved and student view updated');render();return}
  if(b.dataset.action==='publish-staff-club'){const c=staffClub();if(!c||!hasStaffRole('OWNER'))return toast('Only the club owner can publish this profile');c.visibility='PUBLISHED';const stored=state.store.customClubs.find(x=>x.id===c.id);if(stored)Object.assign(stored,c);persistStore();localStorage.setItem(`clubhub-club-${c.id}`,JSON.stringify(c));toast('Unverified demo club published to student discovery');render();return}
  if(b.dataset.builder){openOverlay('builder',b.dataset.builder,b);return}
  if(b.dataset.previewForm){openOverlay('form-preview',b.dataset.previewForm,b);return}
  if(b.dataset.action==='new-form'){const c=staffClub(),opp=c.opps[0],id=`form-${Date.now()}`;state.store.forms.push({id,clubId:c.id,opportunityTitle:opp.title,name:`${opp.title} Application`,version:1,status:'DRAFT',questions:DEFAULT_QUESTIONS.map(q=>({...q,id:`${q.id}-${Date.now()}`,options:[...(q.options||[])]}))});persistStore();openOverlay('builder',id,b);return}
  if(b.dataset.action==='add-question'){const container=document.querySelector('#builder-questions'),i=container.children.length;container.insertAdjacentHTML('beforeend',builderQuestion({id:`question-${Date.now()}`,title:'New question',type:'SHORT_TEXT',required:false,options:[]},i));return}
  if(b.hasAttribute('data-delete-question')){b.closest('.builder-question').remove();return}
  if(b.dataset.moveQuestion){const row=b.closest('.builder-question');if(b.dataset.moveQuestion==='up'&&row.previousElementSibling)row.parentElement.insertBefore(row,row.previousElementSibling);if(b.dataset.moveQuestion==='down'&&row.nextElementSibling)row.parentElement.insertBefore(row.nextElementSibling,row);return}
  if(b.dataset.saveForm){saveFormVersion(b.dataset.saveForm);return}
  if(b.dataset.updateSubmission){const s=state.store.submissions.find(x=>x.id===b.dataset.updateSubmission);if(!s||s.clubId!==staffClub()?.id)return toast('Not authorized for this application');s.status=document.querySelector('#review-status').value;const note=document.querySelector('#review-note').value.trim();if(note)s.privateNotes.push({id:`note-${Date.now()}`,reviewerId:state.persona,text:note,createdAt:new Date().toISOString()});persistStore();toast('Review status updated for the student');render();return}
  if(b.dataset.removeMember){if(!hasStaffRole('OWNER'))return toast('Only club owners can remove team access');state.store.memberships=state.store.memberships.filter(m=>m.id!==b.dataset.removeMember);persistStore();toast('Team access removed');render();return}
},true);

document.addEventListener('submit',e=>{
  if(e.target.id==='student-application'){
    e.preventDefault();const formEl=e.target,key=formEl.dataset.applicationKey,[clubId,...parts]=key.split(':'),title=parts.join(':'),form=opportunityForm(clubId,title),club=CLUBS.find(c=>c.id===clubId),opp=club.opps.find(o=>o.title===title);
    if(hasApplied(clubId,title))return toast('You already submitted an application');
    if(!form||!['active','soon'].includes(oppStatus(opp)))return toast('This application is not currently open');
    const fd=new FormData(formEl),answers={};let invalid='';for(const q of form.questions){const values=fd.getAll(q.id).map(String).filter(Boolean);const value=q.type==='CHECKBOXES'?values:values[0]||'';if(q.required&&(!values.length||!value))invalid=`Please answer: ${q.title}`;if(q.limit&&typeof value==='string'){const length=q.limitType==='words'?value.trim().split(/\s+/).filter(Boolean).length:value.length;if(length>q.limit)invalid=`${q.title} exceeds the ${q.limit} ${q.limitType} limit.`}answers[q.id]=value}if(invalid)return toast(invalid);
    state.store.submissions.push({id:`submission-${Date.now()}`,studentId:profile().id,clubId,opportunityTitle:title,formId:form.id,formVersion:form.version,submittedAt:new Date().toISOString(),status:'SUBMITTED',answers,privateNotes:[]});persistStore();state.modal=null;toast('Application submitted successfully');navigate('applications');return;
  }
  if(e.target.id==='new-opportunity-form'){
    e.preventDefault();if(!hasStaffRole('OWNER','EDITOR'))return toast('Your role cannot create opportunities');const fd=new FormData(e.target),c=staffClub(),open=new Date(`${fd.get('open')}T12:00:00`),deadline=new Date(`${fd.get('deadline')}T23:59:00`);if(deadline<=open)return toast('Deadline must be after the opening date');const id=`opportunity-${Date.now()}`,o={id,clubId:c.id,title:String(fd.get('title')).trim(),description:String(fd.get('description')).trim(),responsibilities:String(fd.get('responsibilities')).trim(),requirements:String(fd.get('requirements')).trim(),open:open.toISOString(),deadline:deadline.toISOString(),hours:+fd.get('hours'),status:String(fd.get('status'))};state.store.customOpportunities.push(o);if(o.status==='PUBLISHED')c.opps.push({customId:id,title:o.title,description:o.description,requirements:o.requirements,open:o.open,deadline:o.deadline,publicationStatus:o.status});state.store.forms.push({id:`form-${id}-v1`,clubId:c.id,opportunityTitle:o.title,name:`${o.title} Application`,version:1,status:o.status==='PUBLISHED'?'PUBLISHED':'DRAFT',questions:DEFAULT_QUESTIONS.map((q,i)=>({...q,id:`${q.id}-${id}-${i}`,options:[...(q.options||[])]}))});persistStore();state.modal=null;toast(o.status==='PUBLISHED'?'Opportunity and starter form published to students and calendar':'Opportunity and starter form saved as drafts');navigate('staff-recruitment');return;
  }
  if(e.target.id==='new-club-form'){
    e.preventDefault();const fd=new FormData(e.target),slug=String(fd.get('name')).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||`demo-club-${Date.now()}`;if(CLUBS.some(c=>c.id===slug))return toast('A club with this name already exists');const club={id:slug,name:String(fd.get('name')).trim(),category:String(fd.get('category')),emoji:'CH',gradient:'blue',description:String(fd.get('description')).trim(),mission:String(fd.get('mission')).trim(),tags:String(fd.get('tags')).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),faculties:String(fd.get('faculties')).split(',').map(x=>x.trim()).filter(Boolean),hours:+fd.get('hours')||3,membership:String(fd.get('membership')).trim()||'Membership details forthcoming',activities:String(fd.get('activities')).split('\n').map(x=>x.trim()).filter(Boolean),contactEmail:String(fd.get('email')).trim(),meetingFormat:String(fd.get('format')),opps:[],events:[],visibility:'DRAFT',isRepresentativeDemoData:true};state.store.customClubs.push(club);state.store.memberships.push({id:`membership-${Date.now()}`,userId:state.persona,clubId:club.id,role:'OWNER',status:'APPROVED'});CLUBS.push(club);persistStore();state.workspace=`staff:${club.id}`;localStorage.setItem('clubhub-workspace',state.workspace);state.modal=null;toast('Private club draft created');navigate('staff-profile');return;
  }
});

document.addEventListener('change',e=>{
  if(e.target.id==='cv-upload'){
    const file=e.target.files[0];if(!file)return;const status=document.querySelector('#cv-status');if(file.size>5*1024*1024){status.textContent='File is larger than the 5 MB limit.';return}const allowed=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];if(!allowed.includes(file.type)){status.textContent='Choose a PDF, DOCX, or text file.';return}const p=profile();p.cvName=file.name;p.cvProcessed=file.type==='text/plain';p.cvText='';if(file.type==='text/plain'){const reader=new FileReader();reader.onload=()=>{p.cvText=String(reader.result).slice(0,50000);localStorage.setItem(`clubhub-profile-${p.id}`,JSON.stringify(p));status.textContent=`${file.name} processed locally. Raw file was not stored.`};reader.readAsText(file)}else{localStorage.setItem(`clubhub-profile-${p.id}`,JSON.stringify(p));status.textContent=`${file.name} validated. Secure server extraction is required for ${file.name.endsWith('.pdf')?'PDF':'DOCX'} content.`}return;
  }
  if(e.target.dataset.applicantFilter){state.applicantStatus=e.target.value;render();return}
  if(e.target.dataset.teamRole){if(!hasStaffRole('OWNER'))return toast('Only owners can change roles');const m=state.store.memberships.find(x=>x.id===e.target.dataset.teamRole);if(m&&m.userId!==state.persona){m.role=e.target.value;persistStore();toast('Team role updated')}render();return}
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state.modal){e.preventDefault();closeOverlay()}
  else if(e.key==='Escape')document.querySelectorAll('.persona.open').forEach(menu=>menu.classList.remove('open'));
  if(e.key==='Tab'&&state.modal){const items=[...document.querySelectorAll('.modal button:not([disabled]),.modal input:not([disabled]),.modal select:not([disabled]),.modal textarea:not([disabled]),.modal a[href]')];if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
});

function saveFormVersion(id){
  const old=state.store.forms.find(f=>f.id===id),rows=[...document.querySelectorAll('.builder-question')];if(!old||!rows.length)return toast('A form needs at least one question');const questions=rows.map((row,i)=>({id:row.dataset.questionId||`question-${Date.now()}-${i}`,title:row.querySelector('[data-q-title]').value.trim(),description:'',type:row.querySelector('[data-q-type]').value,required:row.querySelector('[data-q-required]').checked,options:row.querySelector('[data-q-options]').value.split(',').map(x=>x.trim()).filter(Boolean)}));if(questions.some(q=>!q.title))return toast('Every question needs a title');const next={...old,id:`${old.id.split('-v')[0]}-v${old.version+1}-${Date.now()}`,name:document.querySelector('#builder-name').value.trim(),version:old.version+1,status:'PUBLISHED',questions};old.status='ARCHIVED';state.store.forms.push(next);persistStore();state.modal=null;toast(`Form version ${next.version} published; historical submissions preserved`);navigate('form-builder');
}

// Persist staff edits across reloads and keep demo mode explicit.
CLUBS.forEach(c=>{try{const stored=JSON.parse(localStorage.getItem(`clubhub-club-${c.id}`));if(stored)Object.assign(c,stored)}catch{}});
if(!localStorage.getItem('clubhub-demo-session')&&!location.hash) state.page='welcome';
render();
