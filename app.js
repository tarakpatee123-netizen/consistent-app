
const KEY='consistent_v1';
const MINIMUM=25;
const quotes=[
  'You do not need to feel motivated. Start for 25 minutes.',
  'Make today small enough that you cannot talk yourself out of it.',
  'The goal is not a perfect day. The goal is returning.',
  'One finished task beats five half-started tasks.',
  'Consistency is keeping promises to yourself when nobody is watching.'
];
const defaultState={tasks:[],days:{},sessions:[],settings:{goal:'Study'}};
let state=load();
let timerSeconds=25*60, timerRunning=false, timerInterval=null, timerMode=25;
function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function localKey(d=new Date()){return d.toISOString().slice(0,10)}
function dayData(key=localKey()){if(!state.days[key]) state.days[key]={minutes:0,tasks:0,sessions:0};return state.days[key]}
function formatDate(d=new Date()){return d.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function calcStreak(){let n=0;let d=new Date();let today=localKey(d), prevKey=null;const todayMinutes=dayData(today).minutes;
  while(true){const k=localKey(d), complete=(dayData(k).minutes>=MINIMUM || (k===today && dayData(k).minutes>0 && prevKey===null && false));if(complete){n++;d.setDate(d.getDate()-1);prevKey=k;continue}break}
  if(n===0 && dayData(today).minutes===0){d=new Date();d.setDate(d.getDate()-1);while(dayData(localKey(d)).minutes>=MINIMUM){n++;d.setDate(d.getDate()-1)}}
  return n;
}
function calcBest(){let dates=Object.keys(state.days).sort();let best=0,run=0,last=null;for(const k of dates){if(dayData(k).minutes>=MINIMUM){if(last){const a=new Date(last),b=new Date(k);const diff=Math.round((b-a)/86400000);run=diff===1?run+1:1}else run=1;best=Math.max(best,run);last=k}else last=null}return best}
function render(){
  const today=dayData(); const streak=calcStreak(); const best=calcBest();
  document.getElementById('todayDate').textContent=formatDate(); document.getElementById('focusDate').textContent=formatDate();
  document.getElementById('streak').textContent=streak; document.getElementById('bestStreak').textContent=best; document.getElementById('pStreak').textContent=streak; document.getElementById('pBest').textContent=best;
  document.getElementById('focusMinutes').textContent=today.minutes+'m'; document.getElementById('tasksDone').textContent=state.tasks.filter(t=>t.doneDate===localKey()).length; document.getElementById('sessionsToday').textContent=today.sessions;
  const pct=Math.min(100,Math.round(today.minutes/MINIMUM*100));document.getElementById('dailyPct').textContent=pct+'%';document.getElementById('dailyBar').style.width=pct+'%';
  document.getElementById('heroText').textContent=today.minutes>=MINIMUM?'Minimum complete. Protect the streak.':'You only need 25 focused minutes to complete today.';
  renderTasks('homeTasks',true);renderTasks('allTasks',false);renderSelect();renderHistory();save();
}
function renderTasks(id,home){const el=document.getElementById(id);const visible=state.tasks.filter(t=>!t.done||t.doneDate===localKey());if(!visible.length){el.innerHTML='<div class="empty">No tasks yet. Add one small, concrete task.</div>';return}el.innerHTML=visible.map(t=>`<div class="task ${t.active?'active ':''}${t.done?'done':''}"><button class="check" onclick="toggleTask('${t.id}')">${t.done?'✓':''}</button><div class="task-main" onclick="setActive('${t.id}')"><div class="task-name">${esc(t.name)}</div><div class="task-meta">${t.active?'CURRENT FOCUS':'Tap to make this your focus task'}</div></div><span class="tag">${t.done?'Done':'Task'}</span></div>`).join('')}
function renderSelect(){const s=document.getElementById('focusTaskSelect');const active=state.tasks.filter(t=>!t.done);if(!active.length){s.innerHTML='<option value="">Add a task first</option>';return}s.innerHTML=active.map(t=>`<option value="${t.id}" ${t.active?'selected':''}>${esc(t.name)}</option>`).join('')}
function renderHistory(){const el=document.getElementById('history'),arr=[];for(let i=0;i<14;i++){const d=new Date();d.setDate(d.getDate()-i);const k=localKey(d),x=dayData(k),done=x.minutes>=MINIMUM;arr.push(`<div class="history-item"><div class="left"><strong>${d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</strong><div>${x.minutes} focused min · ${x.sessions} sessions · ${done?'minimum complete':'minimum not complete'}</div></div><span class="pill">${done?'✓ Consistent':'—'}</span></div>`)}el.innerHTML=arr.join('')}
function addTask(name){name=name.trim();if(!name)return showToast('Write a task first.');const active=state.tasks.find(t=>!t.done);if(active){showToast('Finish your current task before adding a new one.');return}state.tasks.push({id:Date.now().toString(),name,done:false,doneDate:null,active:true,created:Date.now()});showToast('Task added. Make it your only focus.');document.getElementById('taskInput').value='';render()}
function toggleTask(id){const t=state.tasks.find(x=>x.id===id);if(!t)return;t.done=!t.done;t.doneDate=t.done?localKey():null;t.active=false;if(t.done)showToast('Task finished. That counts.');render()}
function setActive(id){state.tasks.forEach(t=>t.active=t.id===id&&!t.done);render();showToast('Focus task selected.')}
function esc(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===name));document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='focus')document.getElementById('timer').textContent=fmt(timerSeconds)}
function fmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function resetTimer(){clearInterval(timerInterval);timerRunning=false;timerSeconds=timerMode*60;document.getElementById('timerMain').textContent='Start';document.getElementById('timerLabel').textContent='Ready when you are.';document.getElementById('timer').textContent=fmt(timerSeconds)}
function startTimer(){if(timerRunning){clearInterval(timerInterval);timerRunning=false;document.getElementById('timerMain').textContent='Resume';return}if(!state.tasks.some(t=>!t.done)){showToast('Add one task before starting.');setView('tasks');return}timerRunning=true;document.getElementById('timerMain').textContent='Pause';document.getElementById('timerLabel').textContent='Stay with this task. No switching.';timerInterval=setInterval(()=>{timerSeconds--;document.getElementById('timer').textContent=fmt(timerSeconds);document.title=fmt(timerSeconds)+' · CONSISTENT';if(timerSeconds%60===0){dayData().minutes++;render()}if(timerSeconds<=0){clearInterval(timerInterval);timerRunning=false;dayData().sessions++;render();document.getElementById('timerMain').textContent='Start';document.getElementById('timerLabel').textContent='Session complete. Stand up, breathe, then decide.';navigator.vibrate?.([100,80,100]);showToast('Focus session complete!');resetTimer() }},1000)}
function setMode(m){timerMode=m;document.querySelectorAll('.mode-switch button').forEach(b=>b.classList.toggle('active',Number(b.dataset.min)===m));resetTimer();document.getElementById('focusQuote').textContent=quotes[Math.floor(Math.random()*quotes.length)]}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('startFocusHome').onclick=()=>{setView('focus');document.getElementById('timerMain').click()};document.getElementById('addTaskHome').onclick=()=>setView('tasks');document.getElementById('addTaskBtn').onclick=()=>addTask(document.getElementById('taskInput').value);document.getElementById('taskInput').addEventListener('keydown',e=>{if(e.key==='Enter')addTask(e.target.value)});document.getElementById('timerMain').onclick=startTimer;document.getElementById('timerReset').onclick=resetTimer;document.getElementById('focusTaskSelect').onchange=e=>e.target.value&&setActive(e.target.value);document.querySelectorAll('.mode-switch button').forEach(b=>b.onclick=()=>setMode(Number(b.dataset.min)));
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
