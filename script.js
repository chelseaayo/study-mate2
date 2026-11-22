
(()=>{'use strict';
const I={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',ask:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8.5Z"/>',practice:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9h8M8 13h5M8 17h7"/>',plan:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',progress:'<path d="M4 20V12M10 20V8M16 20V4M22 20V10"/>',spark:'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',left:'<path d="m15 18-6-6 6-6"/>',check:'<path d="m5 12 5 5L20 7"/>',flag:'<path d="M5 21V5m0 0q5-4 9 0t7 0v11q-4 4-8 0t-8 0"/>',book:'<path d="M4 19.5V4.8c0-1 .8-1.8 1.8-1.8H20v16H5.8A1.8 1.8 0 0 0 4 20.8c0 1 .8 1.7 1.8 1.7H20"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',award:'<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1.5 9 5-3 5 3-1.5-9"/>',refresh:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>'};
const icon=(k,size=20)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true">${I[k]||I.spark}</svg>`;
const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const navItems=[['home','Dashboard','home'],['ask','Ask & Check','ask'],['practice','Practice','practice'],['plan','Study Plan','plan'],['progress','Progress','progress']];
const STORAGE='studymate-hifi-v3'; // New results format: old example results are not counted as quiz evidence.
let lastFocus=null;let today=new Date();let future=new Date(today);future.setDate(future.getDate()+21);
const iso=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const defaults=()=>({view:'home',course:'ITEC 3230',draft:'What does feasibility mean?',lastAsk:null,flagged:0,flags:[],examDate:iso(future),hours:'5',sessions:[],quiz:{topic:'Design principles',level:'Medium',phase:'setup',index:0,selected:-1,hint:false,score:0,total:3,history:[],shortText:'',graded:false,selfMark:null},quizAttempts:[],allAnswered:0,allCorrect:0,showSource:false});
let state=defaults();
try{
 // Preserve earlier quiz attempts, but start a new question cleanly after upgrades.
 const saved=localStorage.getItem(STORAGE)||localStorage.getItem('studymate-hifi-v2');
 const o=saved?JSON.parse(saved):null;
 if(o&&typeof o==='object'){
  state={...state,...o,quiz:{...defaults().quiz},lastAsk:null,quizAttempts:Array.isArray(o.quizAttempts)?o.quizAttempts:[]};
  state.view='home';state.showSource=false;
 }
}catch(e){}

function save(){try{let s={...state,showSource:false};localStorage.setItem(STORAGE,JSON.stringify(s));}catch(e){}}
function pct(){return state.sessions.length?Math.round(state.sessions.filter(x=>x.done).length/state.sessions.length*100):0}
function accuracyPct(){let a=state.quizAttempts;return a.length?Math.round(a.filter(x=>x.correct).length/a.length*100):null}
function accuracyLabel(){let x=accuracyPct();return x===null?'—':x+'%'}
function topicStats(){return Object.keys(bank.Medium).map(name=>{let attempts=state.quizAttempts.filter(x=>x.topic===name);let n=attempts.length;let correct=attempts.filter(x=>x.correct).length;return {name,answered:n,correct,accuracy:n?Math.round(correct/n*100):null}}).sort((a,b)=>(a.answered===0)-(b.answered===0)||((a.accuracy??100)-(b.accuracy??100)))}
function topicPanel(){let s=topicStats();return s.map(t=>`<div class="weak-row"><div style="flex:1;min-width:0"><div class="between"><strong>${esc(t.name.replace(/\b\w/g,ch=>ch.toUpperCase()))}</strong><span class="weak-percent">${t.answered?t.accuracy+'%':'Not tested yet'}</span></div>${t.answered?`<div style="margin-top:8px">${progressBar(t.accuracy,t.accuracy<60?'purple':'')}</div><p class="mini-note" style="margin:5px 0 0">${t.correct} of ${t.answered} answers correct</p>`:`<p class="mini-note" style="margin:5px 0 0">Take a quiz to get a score.</p>`}</div></div>`).join('')}
function reviewNote(){return state.quizAttempts.length?`Based on ${state.quizAttempts.length} practice answer${state.quizAttempts.length===1?'':'s'} in this browser (including self-reviewed short answers). Accuracy across difficulty levels is not a validated mastery score.`:'No quiz results yet. Complete a practice question to see your strengths and review areas.'}
function dateLabel(str){let d=new Date(str+'T12:00:00');return Number.isNaN(+d)?'Date not set':d.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}
function renderNav(){let html=navItems.map(([k,title,ic])=>`<button type="button" class="navbtn ${state.view===k?'active':''}" data-view="${k}" ${state.view===k?'aria-current="page"':''}>${icon(ic)}<span>${title}</span></button>`).join('');document.getElementById('side-nav').innerHTML=html;document.getElementById('mobile-nav').innerHTML=navItems.map(([k,t,ic])=>`<button type="button" data-view="${k}" class="${state.view===k?'active':''}">${icon(ic,20)}<span>${k==='home'?'Home':k==='ask'?'Ask':k==='plan'?'Plan':t}</span></button>`).join('')}
function goto(v){if(!navItems.some(x=>x[0]===v))return;state.view=v;if(location.hash!=='#'+v)history.pushState(null,'','#'+v);closeModal();render();window.scrollTo({top:0,behavior:'instant'});save()}
function progressBar(n,color=''){return `<div class="track" role="progressbar" aria-label="Progress" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100"><div class="fill ${color}" style="width:${n}%"></div></div>`}
function top(title,label,subtitle){return `<p class="eyebrow">${label}</p><h1 class="headline">${title}</h1><p class="lead">${subtitle}</p>`}
function home(){let c=state.course;return top('Make progress, one step at a time.','WELCOME BACK','Your study space for understanding concepts, practising with feedback, and planning ahead.')+`<div class="columns"><div><div class="hero"><div><div class="mini-note" style="color:#dce7ff;font-weight:700">YOUR LEARNING SPACE · ${esc(c)}</div><h2>Ready for your next study session?</h2><p>Ask a question, test yourself, or turn weak topics into a focused study plan.</p></div><div class="hero-icon">${icon('spark',46)}</div></div><div class="section-title"><h2>What would you like to do today?</h2><span class="mini">Choose an activity</span></div><div class="feature-grid"><button class="feature" data-view="ask"><span class="feature-icon blue-icon">${icon('ask')}</span><strong>Ask a question</strong><p>Get an explanation with a source and confidence level.</p><span class="feature-arrow">${icon('arrow',19)}</span></button><button class="feature" data-view="practice"><span class="feature-icon green-icon">${icon('practice')}</span><strong>Practice a topic</strong><p>Try questions, request hints, and learn from feedback.</p><span class="feature-arrow">${icon('arrow',19)}</span></button><button class="feature" data-view="plan"><span class="feature-icon purple-icon">${icon('calendar')}</span><strong>Plan my study</strong><p>Build a weekly plan using your exam date and weak topics.</p><span class="feature-arrow">${icon('arrow',19)}</span></button><button class="feature" data-view="progress"><span class="feature-icon orange-icon">${icon('progress')}</span><strong>View progress</strong><p>See what you've completed and what needs more work.</p><span class="feature-arrow">${icon('arrow',19)}</span></button></div><div class="section-title"><h2>Your snapshot</h2><span class="mini">Updated as you practice</span></div><div class="stat-grid"><div class="stat"><p>Questions answered</p><strong>${state.quizAttempts.length}</strong><small>${state.quizAttempts.length?'Keep going':'Ready to begin'}</small></div><div class="stat"><p>Study plan complete</p><strong>${pct()}%</strong><small>${state.sessions.length?'Based on checked sessions':'Plan not started'}</small></div><div class="stat"><p>Quiz accuracy</p><strong>${accuracyLabel()}</strong><small>${state.quizAttempts.length?'From your practice answers':'Take a quiz to get results'}</small></div></div></div><div class="side-column"><div class="panel side-panel"><h3>Current course</h3><div class="course-chip"><div class="course-square">IT</div><div><strong>${esc(c)}</strong><span>Designing User Interfaces</span></div></div><div class="subdivider"></div><div class="between" style="font-size:12px"><b>Quiz accuracy</b><b>${accuracyLabel()}</b></div><div style="margin-top:9px">${progressBar(accuracyPct()??0)}</div><div class="small-progress"><div class="between"><span class="muted">Study plan</span><b>${pct()}%</b></div>${progressBar(pct(),'green')}</div><div class="small-progress"><div class="between"><span class="muted">Practice answers</span><b>${state.quizAttempts.length}</b></div>${progressBar(Math.min(100,state.quizAttempts.length/9*100),'purple')}</div></div><div class="notice">${icon('shield')}<div><strong style="display:block;color:#315078;margin-bottom:3px">Study with confidence</strong>StudyMate encourages you to try first, verify sources, and stay in control of what you learn.</div></div></div></div>`}
// Prepared concept answers for the offline high-fidelity demonstration.
// These are illustrative explanations, NOT retrieved or verified course citations.
// The Ask & Check demo deliberately supports three topics only.
// This matcher tolerates common misspellings and natural wording without claiming to be a real AI.
const answers={
 feasibility:{level:'High',reason:'Both sources define feasibility directly and agree with each other.',
  answer:'Feasibility describes how practical or realistic a proposed project is [1]. Teams usually check four things: whether they can build it, afford it, whether people can use it, and whether it can be finished on time [2].',
  sources:[
   {n:1,title:'Feasibility overview',loc:'Demo note · Concept summary',text:'A feasibility assessment asks whether a proposed idea is realistic given technical capabilities, costs, organizational needs, and available time. Teams use it before committing resources.',quote:'whether a proposed idea is realistic given technical capabilities, costs, organizational needs, and available time'},
   {n:2,title:'Types of feasibility',loc:'Demo note · Four dimensions',text:'Common dimensions are technical (can we build it?), economic (can we afford it?), operational (will people be able to use it?), and schedule (can we complete it on time?).',quote:'technical (can we build it?), economic (can we afford it?), operational (will people be able to use it?), and schedule (can we complete it on time?)'}]},
 prototype:{level:'High',reason:'Definition and purpose are each stated directly by a consistent source.',
  answer:'A prototype is an early version of a product or interface [1]. It can be a simple sketch or a detailed interactive interface [1]. Designers use prototypes to get feedback and find problems before building the final product [2].',
  sources:[
   {n:1,title:'Prototype definition',loc:'Demo note · Prototypes',text:'A prototype is an early version or representation of a product or interface. It may be a simple sketch or a detailed interactive interface.',quote:'an early version or representation of a product or interface'},
   {n:2,title:'Why build prototypes',loc:'Demo note · Purpose',text:'A prototype helps a team test ideas, gather feedback, and identify problems before full implementation.',quote:'gather feedback, and identify problems before full implementation'}]},
 fidelity:{level:'Medium',reason:'The comparison combines two notes, and the closing contrast is a summary that neither source states directly.',
  answer:'A low-fidelity prototype is a rough version, such as a paper sketch or wireframe, that is quick to make and useful for discussing layout [1]. A high-fidelity prototype looks and behaves more like the finished product, with realistic content and clickable interactions [2]. Low fidelity tests the concept early; high fidelity tests the detailed experience.',
  sources:[
   {n:1,title:'Low fidelity',loc:'Demo note · Fidelity levels',text:'Low fidelity: sketches and wireframes focusing on structure. They are quick to create and useful for discussing layout and navigation.',quote:'sketches and wireframes focusing on structure'},
   {n:2,title:'High fidelity',loc:'Demo note · Fidelity levels',text:'High fidelity: polished visual design with realistic content and clickable interactions, closer to the finished product.',quote:'polished visual design with realistic content and clickable interactions'}]}
};
const exampleQuestions=[
 'What does feasibility mean?',
 'What is a prototype?',
 'What is the difference between low- and high-fidelity prototypes?'
];
function editDistance(a,b){
 if(a===b)return 0;
 if(Math.abs(a.length-b.length)>2)return 3;
 let prev=Array.from({length:b.length+1},(_,j)=>j);
 for(let i=1;i<=a.length;i++){
  const cur=[i];
  for(let j=1;j<=b.length;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
  prev=cur;
 }
 return prev[b.length];
}
function wordLike(word,expected){
 if(word===expected)return true;
 // Limit tolerance to 1-2 edits on recognizable topic words, not short generic words.
 return expected.length>=8 && word.length>=Math.floor(expected.length*0.65)
  && editDistance(word,expected)<=2;
}
function findPreparedAnswer(value){
 const text=String(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const words=text.split(/\s+/).filter(Boolean);
 const has=(aliases)=>words.some(w=>aliases.some(a=>wordLike(w,a)));
 const hasFeasibility=has(['feasibility','feasible']);
 const hasPrototype=has(['prototype','prototypes','prototyping']);
 const hasFidelity=has(['fidelity','fidelities']);
 const hasLow=has(['low','lofi']) || /\blow\s+fi\b/.test(text);
 const hasHigh=has(['high','hifi']) || /\bhigh\s+fi\b/.test(text);
 // Most-specific answer first: "low vs high fidelity prototypes" contains the word prototype.
 if(hasLow&&hasHigh&&(hasFidelity||hasPrototype))return answers.fidelity;
 if(hasFeasibility&&!hasPrototype)return answers.feasibility;
 if(hasPrototype&&!hasFeasibility)return answers.prototype;
 return null;
}
const LEVELS={High:'conf-high',Medium:'conf-med',Low:'conf-low'};
function confBadge(x){return `<span class="conf-wrap"><button type="button" class="conf ${LEVELS[x.level]}" data-action="conf" aria-expanded="false" aria-controls="conf-reason">${icon(x.level==='High'?'shield':'info',14)} ${x.level} confidence</button><span id="conf-reason" class="conf-reason" role="note"><b>Why ${x.level.toLowerCase()}:</b> ${esc(x.reason)}</span></span>`}
function cited(t){return esc(t).replace(/\[(\d+)\]/g,(m,n)=>`<button type="button" class="cite" data-action="cite" data-n="${n}" aria-label="Go to source ${n}">[${n}]</button>`)}
function strip(x){return `<div class="src-strip"><span class="src-label">Sources</span>${x.sources.map(s=>`<button type="button" class="src-chip" data-action="cite" data-n="${s.n}">[${s.n}] ${esc(s.title)}</button>`).join('')}</div>`}
function sourcePanel(x){return `<div class="panel side-panel" id="source-panel"><h3>Sources</h3>${x.sources.map(s=>{const i=s.text.indexOf(s.quote);return `<div class="src-item" id="src-${s.n}" tabindex="-1"><strong>[${s.n}] ${esc(s.title)}</strong><div class="mini-note">${esc(s.loc)}</div><p>${esc(s.text.slice(0,i))}<mark class="quote">${esc(s.quote)}</mark>${esc(s.text.slice(i+s.quote.length))}</p></div>`}).join('')}<p class="mini-note">Select a citation to highlight the passage it relies on. These are prepared demo notes, not retrieved course documents.</p></div>`}
function ask(){
 const x=state.lastAsk;
 const answerHtml=!x?'':`<div class="chat-question"><span>${esc(x.question)}</span></div>${x.found?`<div class="answer-box"><div class="answer-head"><strong style="display:flex;align-items:center;gap:7px">${icon('spark',16)} StudyMate explanation</strong>${confBadge(x)}</div><div class="answer-body"><p>${cited(x.answer)}</p>${strip(x)}<div class="button-row" style="margin-top:19px"><button class="btn" data-action="cite" data-n="1">${icon('eye')} Check sources</button>${x.flagged?`<span class="pill success">${icon('check',13)} Flagged for review</span>`:`<button class="btn" data-action="flag">${icon('flag')} Flag this answer</button>`}<button class="btn" data-view="practice">${icon('practice')} Try practice</button></div><p class="mini-note" style="margin-top:16px">Sample explanation and confidence indicator; this is not a live AI answer or a verified lecture citation.</p></div></div>`:`<div class="callout no-answer" role="status"><b>No prepared answer found.</b><p>This offline demo currently supports three topics: feasibility, prototypes, and low- versus high-fidelity prototypes. You can phrase them in your own words, and common spelling errors are okay. For other topics, a connected AI service and course materials would be needed.</p></div>`}`;
 return top('Ask & Check','AI TUTOR','Ask about a course concept, inspect the source, and flag an explanation if it needs review.')+`<div class="columns"><div><div class="panel panel-pad"><div class="tab-head"><h2>Ask your StudyMate</h2><span class="pill">${icon('book',13)} ${esc(state.course)}</span></div><form id="ask-form"><div class="field"><label for="ask-input">What would you like to understand?</label><textarea class="form-control textarea" id="ask-input" name="ask-input" maxlength="500" placeholder="e.g., What does feasibility mean?" required>${esc(state.draft)}</textarea></div><div class="button-row"><button class="btn primary" type="submit">${icon('spark',16)} Ask StudyMate</button><span class="mini-note">Common spelling mistakes and different wording are okay.</span></div></form>${answerHtml}<div class="sample-asks"><h3>Try one of these questions</h3><div class="sample-chips">${exampleQuestions.map((q,i)=>`<button class="sample-chip" type="button" data-action="ask-example" data-index="${i}">${esc(q)}</button>`).join('')}</div></div></div></div><div class="side-column">${x&&x.found?sourcePanel(x):''}<div class="info-panel"><h3>Tips for better answers</h3><ul><li>Ask about a specific course concept.</li><li>Review the source, not just the answer.</li><li>Sample confidence is not proof of correctness.</li><li>Use Flag when something looks incorrect or unclear.</li></ul></div><div class="callout" style="margin-top:15px">${icon('info',15)} <b>Prototype note:</b> Three prepared topics are available. Wording does not need to match exactly, but this is not a connected AI or course-document search system.</div></div></div>`;
}

const bankMedium={
 'Design principles':[
 {q:'What is the definition of "pattern" in the context of design principles?',o:['Random assortment of elements','Regular arrangement of alternated or repeated elements (shapes, colours, lines, etc.)','A technique used to create depth in a composition','Method for organizing visual elements based on size'],correct:1,hint:'Think about repeated visual elements and predictable arrangement.',why:'A pattern is an arrangement of repeated or alternating elements such as shapes, colours, and lines.',source:'Lecture 1 · sample question from the low-fidelity prototype'},
 {q:'Which feature best demonstrates immediate feedback?',o:['A button without a label','A confirmation after an answer is flagged','A hidden navigation menu','An input without instructions'],correct:1,hint:'Feedback tells the user what happened after an action.',why:'A clear confirmation shows that the system received the report, reducing uncertainty.',source:'StudyMate sample design-principles content'},
 {q:'Why should the Submit Answer button remain disabled until a choice is selected?',o:['To reduce colour contrast','To discourage practice','To enforce a useful constraint','To make the app run faster'],correct:2,hint:'Think about preventing an unsupported action.',why:'A constraint helps prevent an incomplete submission and guides the user toward a valid action.',source:'StudyMate sample design-principles content'}],
 'Conceptual design':[
 {q:'Which description best fits StudyMate’s conceptual model?',o:['A shopping checkout workflow','A learning cycle from course materials to tutor, practice, feedback and progress','An administrative database','A messaging-only platform'],correct:1,hint:'It moves from explanation to practice and improvement.',why:'StudyMate uses a continuous cycle: course materials → AI tutor → practice → feedback → progress.',source:'StudyMate presentation · Conceptual Model'},
 {q:'What familiar metaphor is used for the Study Plan feature?',o:['A shopping cart','A personal timetable','A music player','A file archive'],correct:1,hint:'It organizes study sessions by available time.',why:'The study planner works like a timetable that helps organize upcoming work.',source:'StudyMate presentation · Familiar Metaphors'},
 {q:'Who remains in control of the StudyMate learning process?',o:['Only the AI','The student','The platform administrator','The instructor only'],correct:1,hint:'Who chooses what to study next?',why:'Students ask questions, review feedback, and choose what to study next.',source:'StudyMate presentation · Conceptual Model'}],
 'Usability evaluation':[
 {q:'What is the main goal of observing a participant during a usability test?',o:['To evaluate the participant’s intelligence','To understand where the interface helps or hinders task completion','To grade the participant’s answers','To record personal information'],correct:1,hint:'The interface is being evaluated, not the participant.',why:'The goal is to observe whether the design supports a user in completing tasks.',source:'StudyMate sample usability content'},
 {q:'Which is an example of quantitative usability data?',o:['A participant’s suggestion','Time required to complete a task','A verbal explanation of confusion','An open-ended interview response'],correct:1,hint:'Look for something counted or measured numerically.',why:'Task time is numerical and can be compared across tasks or participants.',source:'StudyMate sample usability content'},
 {q:'Which question produces useful qualitative feedback?',o:['How many seconds did you need?','Did you finish: yes or no?','What part of the task felt confusing, and why?','What was your score out of three?'],correct:2,hint:'Open-ended questions invite explanations and suggestions.',why:'An open-ended question reveals the reasons behind difficulties.',source:'StudyMate sample usability content'}]
};
const bankEasy={
 'Design principles':[
 {q:'Which design principle means using the same style of buttons throughout an app?',o:['Consistency','Randomness','Complexity','Surprise'],correct:0,hint:'Think about elements looking and behaving alike.',why:'Consistency makes controls predictable, so users learn the interface faster.',source:'StudyMate demo question bank · design principles'},
 {q:'What should happen after a student submits an answer?',o:['Nothing happens','The app shows clear feedback','The navigation disappears','The page becomes blank'],correct:1,hint:'Users need to know what their action did.',why:'Immediate feedback communicates the outcome of an action.',source:'StudyMate demo question bank · design principles'},
 {q:'Which button label is easiest to understand?',o:['Do it','OK maybe','Start practice','Next thing'],correct:2,hint:'Look for a specific action.',why:'A descriptive label like Start practice makes the action and expected result clear.',source:'StudyMate demo question bank · design principles'}],
 'Conceptual design':[
 {q:'What is the main purpose of StudyMate?',o:['Sell textbooks','Help students learn and practise','Manage student fees','Schedule campus buses'],correct:1,hint:'Remember the goal shown on the dashboard.',why:'StudyMate supports learning through explanations, practice, feedback, and planning.',source:'StudyMate low-fidelity presentation · Problem Overview'},
 {q:'Which feature works like a personal timetable?',o:['Ask & Check','Flag an Answer','Study Plan','Course selector'],correct:2,hint:'Which tool organizes upcoming sessions?',why:'The Study Plan feature uses a familiar timetable metaphor.',source:'StudyMate low-fidelity presentation · Familiar Metaphors'},
 {q:'After reading an AI explanation, what can a student do to test understanding?',o:['Start Practice','Delete the course','Exit StudyMate','Change the logo'],correct:0,hint:'Look for the learning cycle in your presentation.',why:'Practising after an explanation helps students check understanding.',source:'StudyMate low-fidelity presentation · Conceptual Model'}],
 'Usability evaluation':[
 {q:'Who performs tasks in a usability test?',o:['A participant','Only the programmer','Only a database','Nobody'],correct:0,hint:'The test studies real user interaction.',why:'A participant tries realistic tasks while researchers observe the interface.',source:'StudyMate demo question bank · usability evaluation'},
 {q:'Which data item can be measured in seconds?',o:['User feelings','Time to complete a task','Colour preferences','A suggestion'],correct:1,hint:'Choose something numerical.',why:'Task completion time is a quantitative measurement.',source:'StudyMate demo question bank · usability evaluation'},
 {q:'What should you test in a usability study?',o:['How smart the participant is','Whether the interface supports tasks','How quickly the team can type','The participant’s private messages'],correct:1,hint:'You are evaluating the design.',why:'Usability testing evaluates whether users can effectively interact with the interface.',source:'StudyMate demo question bank · usability evaluation'}]
};
const bankHard={
 'Design principles':[
 {q:'A student clicks “Submit report,” but nothing confirms the result. Which change best addresses the usability problem?',o:['Replace all icons with larger icons','Show an accessible confirmation that the report was received','Remove the report form','Add a fifth navigation section'],correct:1,hint:'Consider the gulf of evaluation.',why:'An explicit success message reduces uncertainty and provides immediate feedback after submission.',source:'StudyMate demo scenario · design principles'},
 {q:'In StudyMate, Submit Answer is enabled before an option is selected, resulting in empty submissions. What is the strongest design fix?',o:['Change the font size of the question','Disable Submit until a valid choice is made, then explain missing input if necessary','Hide the Submit button permanently','Change the sidebar colour'],correct:1,hint:'Think about constraints that prevent invalid actions.',why:'A meaningful constraint stops incomplete submissions while retaining a clear path to completion.',source:'StudyMate demo scenario · design principles'},
 {q:'A quiz uses a blue underlined label that looks like a link, but clicking it does nothing. Which principle is most directly violated?',o:['Affordance and signifiers','Data encryption','Compression','Database normalization'],correct:0,hint:'The visual appearance suggests an action the element cannot perform.',why:'Visual signifiers create expectations about how an element behaves; misleading signifiers make actions harder to understand.',source:'StudyMate demo scenario · design principles'}],
 'Conceptual design':[
 {q:'A student reads an AI explanation but cannot reach practice or review the source. Which revision best preserves StudyMate’s intended conceptual model?',o:['Put all information in one static paragraph','Connect the explanation to its source and a practice action with feedback','Remove all user choices','Show the student an unrelated leaderboard'],correct:1,hint:'Think about the continuous learning cycle and student control.',why:'The conceptual model links course materials, explanation, practice, feedback, and progress while the student directs learning.',source:'StudyMate low-fidelity presentation · Conceptual Model'},
 {q:'A design team wants to simplify the app by hiding every feature except the AI chat. What important user goal would this compromise?',o:['Choosing the app’s background colour','Practising, tracking weak topics, and planning study sessions','Viewing a profile picture','Changing window size'],correct:1,hint:'Recall the app’s four core tasks.',why:'StudyMate is a learning assistant, not just a chatbot: practice, progress, planning, and reporting AI errors are important user goals.',source:'StudyMate low-fidelity presentation · Core Tasks'},
 {q:'StudyMate highlights “weak topics” based solely on fabricated percentages. What revision best respects its user-centred model?',o:['Keep the percentages without an explanation','Derive results from actual quiz attempts and state when evidence is missing','Hide the scores from the student','Use random scores each visit'],correct:1,hint:'How does the student make informed study choices?',why:'Evidence-based progress supports student control, while a “not tested” state avoids misleading information.',source:'StudyMate demo scenario · conceptual design'}],
 'Usability evaluation':[
 {q:'A moderator tells a participant “Click Practice, choose Design Principles, then press Start.” What is the most serious problem?',o:['The task is too realistic','It gives away the navigation steps and prevents testing discoverability','It measures too much time','It makes quantitative data impossible'],correct:1,hint:'Good tasks specify the goal, not every click.',why:'Giving exact click instructions masks navigation problems; task scenarios should let participants decide how to act.',source:'StudyMate demo scenario · usability evaluation'},
 {q:'A participant finishes a task in 40 seconds but says the interface was confusing. Which interpretation is best?',o:['The task was definitely easy','Time alone cannot explain the experience; combine quantitative and qualitative evidence','The comment must be ignored','A single task time proves the design is excellent'],correct:1,hint:'Quantitative and qualitative measures tell different stories.',why:'Completion time is quantitative; the participant’s explanation can reveal confusion not visible in the time alone.',source:'StudyMate demo scenario · usability evaluation'},
 {q:'Only one participant tests your prototype. Which conclusion is justified?',o:['The results prove every student will succeed','You can identify issues observed in that session, but cannot generalize broadly','The SUS score becomes a national benchmark','No qualitative data can be collected'],correct:1,hint:'Think about the limitation of a single participant.',why:'One test can uncover useful usability issues but does not establish general performance across all users.',source:'StudyMate demo scenario · usability evaluation'}]
};
const bank={Easy:bankEasy,Medium:bankMedium,Hard:bankHard};
// Three different question types per difficulty / topic: multiple choice, true or false, short answer.
const newQuestionTypes={
 Easy:{
  'Design principles':[
   {type:'tf',q:'Consistency means using completely different navigation styles on every page.',correct:1,hint:'Think about whether a consistent interface should change unexpectedly.',why:'False. Consistency means using predictable navigation and interaction patterns across screens.',source:'StudyMate low-fidelity presentation · page 9'},
   {type:'short',q:'After a student flags an incorrect AI answer, what feedback should StudyMate provide?',hint:'Think about what the student needs to know after submitting a report.',model:'A clear confirmation that the report was submitted successfully.',why:'Good feedback tells the student what happened after their action.',source:'StudyMate low-fidelity presentation · page 10'}],
  'Conceptual design':[
   {type:'tf',q:'A conceptual model helps explain how users understand and interact with a system.',correct:0,hint:'Does it describe the important concepts and relationships of an application?',why:'True. The model describes the main concepts and how they fit together from the user’s point of view.',source:'Illustrative conceptual-design note'},
   {type:'short',q:'Name one familiar metaphor used in StudyMate and explain what it helps a student do.',hint:'Think about a tutor, timetable, classroom exercise, or progress tracker.',model:'The study planner works like a personal timetable and helps students organize study sessions.',why:'Other valid answers include the tutor as a guide or practice as classroom exercises.',source:'StudyMate low-fidelity presentation · page 8'}],
  'Usability evaluation':[
   {type:'tf',q:'A usability test measures how intelligent the participant is.',correct:1,hint:'What is the real thing being evaluated?',why:'False. The interface is tested; the participant is not being graded.',source:'Illustrative usability-testing note'},
   {type:'short',q:'Give one example of quantitative data that can be recorded during a usability test.',hint:'Choose something that can be measured or counted.',model:'Task completion time, number of errors, task success rate, or the SUS score.',why:'Quantitative data are numerical; comments and opinions are qualitative.',source:'Illustrative usability-testing note'}]
 },
 Medium:{
  'Design principles':[
   {type:'tf',q:'Disabling “Submit Answer” until a student selects an option is an example of a useful constraint.',correct:0,hint:'Can constraints prevent invalid or incomplete actions?',why:'True. Disabling Submit prevents an empty response.',source:'StudyMate low-fidelity presentation · page 10'},
   {type:'short',q:'Explain the difference between feedback and constraints using one StudyMate example of each.',hint:'One tells the user what happened; the other prevents an invalid action.',model:'Feedback: the app confirms a flagged answer was submitted. Constraint: Submit Answer stays disabled until an option is selected.',why:'Feedback communicates results; constraints limit invalid actions.',source:'StudyMate low-fidelity presentation · page 10'}],
  'Conceptual design':[
   {type:'tf',q:'In StudyMate, the student remains in control of what they study next.',correct:0,hint:'Who chooses the next subject or activity?',why:'True. The student asks questions, practises, checks feedback, and selects study priorities.',source:'StudyMate low-fidelity presentation · page 7'},
   {type:'short',q:'Briefly describe the main learning cycle used in StudyMate.',hint:'Start with course material and end with progress.',model:'Course materials → AI tutor → practice → feedback → progress. The study plan uses weak topics to guide future studying.',why:'The conceptual model links explanations to practice and progress, keeping the student in control.',source:'StudyMate low-fidelity presentation · page 7'}],
  'Usability evaluation':[
   {type:'tf',q:'Open-ended interview responses are a form of qualitative usability data.',correct:0,hint:'Are the responses numerical measures or descriptions?',why:'True. Interview answers help explain why a task was confusing or easy.',source:'Illustrative usability-testing note'},
   {type:'short',q:'Write a realistic usability test task for StudyMate without giving away which buttons to click.',hint:'State a goal, not the exact navigation steps.',model:'You have an exam next week. Use StudyMate to create a study plan for it.',why:'A clear goal allows the moderator to evaluate whether navigation is discoverable.',source:'Illustrative usability-testing note'}]
 },
 Hard:{
  'Design principles':[
   {type:'tf',q:'A label that looks clickable but does nothing can violate users’ expectations about signifiers.',correct:0,hint:'Do visual cues create expectations about what will happen?',why:'True. A false signifier suggests an action that is not actually available.',source:'Illustrative interaction-design note'},
   {type:'short',q:'A user clicks “Submit report” but sees no confirmation. Name the design problem and propose a fix.',hint:'Think about the gulf of evaluation and feedback.',model:'The design lacks feedback, increasing the gulf of evaluation. Show a clear success confirmation after submission.',why:'Confirmation helps the user know their action succeeded.',source:'StudyMate low-fidelity presentation · page 10'}],
  'Conceptual design':[
   {type:'tf',q:'Showing actual quiz-based weak topics fits StudyMate’s learning model better than inventing progress percentages.',correct:0,hint:'Should feedback reflect a student’s actual activity?',why:'True. Real practice attempts are evidence for planning, whereas invented scores would mislead the user.',source:'StudyMate low-fidelity presentation · pages 7 and 20'},
   {type:'short',q:'A student can ask questions but cannot practise or see progress. Explain the conceptual-model problem and one improvement.',hint:'What steps are missing from the learning cycle?',model:'The learning cycle is broken because explanation is disconnected from practice and feedback. Add links to practice questions and progress after the explanation.',why:'A connected user journey supports learning beyond just receiving answers.',source:'StudyMate low-fidelity presentation · page 7'}],
  'Usability evaluation':[
   {type:'tf',q:'A single successful participant proves the interface will work for all students.',correct:1,hint:'Can a result from one person be generalized to everyone?',why:'False. One session can reveal issues, but does not prove universal usability.',source:'Illustrative usability-methods note'},
   {type:'short',q:'A participant completes a task quickly but reports that it was confusing. What conclusion should the design team draw?',hint:'Consider both numerical and open-ended evidence.',model:'Completion time alone does not describe usability. Combine task-time data with the participant’s comments to identify what was confusing.',why:'Quantitative and qualitative evidence can reveal different aspects of the same experience.',source:'Illustrative usability-methods note'}]
 }
};
for(const level of Object.keys(newQuestionTypes)){
 for(const topic of Object.keys(newQuestionTypes[level])){
  bank[level][topic][0].type='mc';
  bank[level][topic][1]=newQuestionTypes[level][topic][0];
  bank[level][topic][2]=newQuestionTypes[level][topic][1];
 }
}
const questionTypeLabel={mc:'Multiple choice',tf:'True / False',short:'Short answer'};
function recordAttempt(correct,gradeMethod='automatic'){
 const q=state.quiz;
 if(q.graded)return;
 q.graded=true;
 if(correct)q.score++;
 state.allAnswered++;
 if(correct)state.allCorrect++;
 const item={topic:question().topic||q.topic,level:q.level,type:question().type||'mc',correct,questionIndex:q.index,gradeMethod,at:Date.now()};
 q.history.push(item);
 state.quizAttempts.push(item);
}

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const MIXED='All topics (mixed)';
function buildItems(topic,level){const ts=topic===MIXED?Object.keys(bank.Medium):[topic];const out=[];
 ts.forEach(t=>bank[level][t].forEach(v=>{const c={...v,topic:t};if(c.type==='mc'){const right=c.o[c.correct];c.o=shuffle(c.o);c.correct=c.o.indexOf(right)}out.push(c)}));
 return topic===MIXED?shuffle(out):out}
function keyTerms(user,model){const w=x=>[...new Set(x.toLowerCase().match(/[a-z]{5,}/g)||[])];const m=w(model),u=new Set(w(user));return {hit:m.filter(x=>u.has(x)),total:m.length}}
function daysLeft(){const n=Math.ceil((+new Date(state.examDate+'T12:00:00')-+new Date(today.getFullYear(),today.getMonth(),today.getDate()))/86400000);return n>0?n+' day'+(n===1?'':'s')+' left':n===0?'today':'date passed'}
function question(){let q=state.quiz;return q.items?.[q.index]||bank.Medium['Design principles'][0]}
function practice(){
 const q=state.quiz;
 const b=top('Practice to understand','ACTIVE LEARNING','Choose a topic, answer different kinds of questions, and learn from feedback.');
 if(q.phase==='setup'){
  return b+`<div class="columns"><div class="panel panel-pad"><div class="assessment-header"><div class="assessment-icon">${icon('practice',23)}</div><div><h2 style="margin:0;font-size:18px">Set up a practice session</h2><div class="caption">Three question types at each difficulty</div></div></div><form id="quiz-setup"><div class="field"><label for="topic-select">Topic</label><select id="topic-select" class="form-control" name="topic">${[...Object.keys(bank.Medium),MIXED].map(k=>`<option ${q.topic===k?'selected':''}>${esc(k)}</option>`).join('')}</select></div><div class="field"><label for="level-select">Difficulty</label><select id="level-select" class="form-control" name="difficulty"><option ${q.level==='Easy'?'selected':''}>Easy</option><option ${q.level==='Medium'?'selected':''}>Medium</option><option ${q.level==='Hard'?'selected':''}>Hard</option></select></div><div class="question-type-preview"><span class="type-preview">Multiple choice</span><span class="type-preview">True / False</span><span class="type-preview">Short answer</span></div><button class="btn primary" type="submit">Start practice ${icon('arrow',15)}</button></form></div><div class="side-column"><div class="info-panel"><h3>How practice works</h3><ul><li>Every session has one multiple choice, one true/false, and one short answer.</li><li>Easy, Medium, and Hard use different questions.</li><li>Short answers show a model answer for your self-review.</li><li>Your reviewed responses update Progress.</li></ul></div><div class="callout" style="margin-top:14px"><b>Offline demo:</b> Written answers are self-checked against an example answer; no real AI grader is connected.</div></div></div>`;
 }
 if(q.phase==='complete'){
  return b+`<div class="panel panel-pad" style="max-width:760px"><div class="empty-state"><div class="big-icon">${icon('award',34)}</div><span class="pill success">Session complete</span><h3 style="margin-top:15px">You answered ${q.score} of ${q.total} correctly!</h3><p>Each session combines multiple choice, true/false, and a short written response. Written responses are self-assessed against a sample answer.</p><div class="button-row" style="justify-content:center"><button class="btn" data-action="restart-quiz">Try another set</button><button class="btn primary" data-view="progress">View progress ${icon('arrow')}</button></div></div></div>`;
 }
 const v=question(),type=v.type||'mc',done=q.phase==='feedback';
 const questionInput=type==='short'
  ?`<div class="field" style="margin-top:20px"><label for="short-response">Your answer</label><textarea class="form-control textarea short-response" id="short-response" placeholder="Write a brief explanation in your own words..." rows="4" maxlength="1000" ${done?'disabled':''}>${esc(q.shortText||'')}</textarea><p class="mini-note">Write at least 3 characters. You will compare your response to a model answer.</p></div>`
  :`<div class="options-list" role="group" aria-label="${type==='tf'?'True or false':'Answer choices'}">${(type==='tf'?['True','False']:v.o).map((o,i)=>`<button type="button" class="answer-option ${q.selected===i?'selected':''} ${done&&i===v.correct?'correct':''} ${done&&q.selected===i&&i!==v.correct?'wrong':''}" data-action="select-answer" data-index="${i}" aria-pressed="${q.selected===i}" ${done?'disabled':''}><span class="radio-circle"></span><span>${esc(o)}</span></button>`).join('')}</div>`;
 const result=type==='short'
  ?`<div class="feedback"><h3>Compare your response with the sample answer</h3><p><b>Your answer:</b> ${esc(q.shortText||'')}</p><p style="margin-top:13px"><b>Model answer:</b> ${esc(v.model)}</p><p style="margin-top:10px">${esc(v.why)}</p>${(()=>{const k=keyTerms(q.shortText||'',v.model);return `<p class="mini-note" style="margin-top:10px">Rough guide: your answer shares ${k.hit.length} of ${k.total} key terms with the model answer. Wording can differ, so use your own judgment.</p>`})()}<div class="mini-note" style="margin-top:10px">Source: ${esc(v.source)}</div></div>${!q.graded?`<div class="self-review"><p><b>How did your answer compare?</b></p><p class="mini-note">Self-assess based on whether you included the essential idea. You can be correct with different wording.</p><div class="button-row"><button class="btn self-yes" data-action="self-grade" data-result="correct">${icon('check')} I got it</button><button class="btn" data-action="self-grade" data-result="review">Needs review</button></div></div>`:`<div class="self-marked ${q.selfMark==='correct'?'':'review'}">${q.selfMark==='correct'?'✓ Marked as understood':'↻ Added to areas for review'} · saved to your Progress</div>`}`
  :`<div class="feedback ${q.selected===v.correct?'':'bad'}"><h3>${q.selected===v.correct?'✓ Correct!':'Not quite — keep learning'}</h3><p>${esc(v.why)}</p><div class="mini-note" style="margin-top:10px">Source: ${esc(v.source)}</div></div>`;
 return b+`<div class="columns"><div><div class="panel panel-pad"><div class="quiz-top"><div><span class="pill">${esc(v.topic||q.topic)} · ${esc(q.level)}</span> <span class="pill type-pill">${questionTypeLabel[type]}</span><h3>Question ${q.index+1} of ${q.total}</h3></div><span class="badge-outline">${q.score} correct</span></div>${progressBar(Math.round((q.index+(done?1:0))/q.total*100))}<p class="question-text">${esc(v.q)}</p>${questionInput}${q.hint&&!done?`<div class="hint">${icon('info',14)} Hint: ${esc(v.hint)}</div>`:''}${done?result:''}<div class="button-row" style="justify-content:space-between">${!done?`<button class="btn" data-action="hint" ${q.hint?'disabled':''}>${icon('info',16)} ${q.hint?'Hint shown':'Show hint'}</button><button class="btn primary" data-action="submit-answer" ${type==='short'?(!(q.shortText||'').trim()||q.shortText.trim().length<3?'disabled':''):(q.selected===-1?'disabled':'')}>Submit answer ${icon('arrow',16)}</button>`:`<button class="btn" data-action="restart-quiz">Exit to setup</button><button class="btn primary" data-action="next-question" ${!q.graded?'disabled':''}>${q.index===q.total-1?'View results':'Next question'} ${icon('arrow',16)}</button>`}</div></div></div><div class="side-column"><div class="info-panel"><h3>Practice instructions</h3><ul>${type==='short'?'<li>Explain the concept in your own words.</li><li>After submitting, compare your answer with the example.</li><li>Choose whether you got the key idea so Progress can update.</li>':type==='tf'?'<li>Choose True or False.</li><li>Read the explanation after you submit.</li>':'<li>Choose one answer to enable Submit.</li><li>Read the explanation after you submit.</li>'}<li>A hint offers a clue, not the full answer.</li></ul></div><div class="callout" style="margin-top:14px">${icon('info',14)} This is a three-question prototype flow to fit the 15-minute usability evaluation.</div></div></div>`;
}

function plan(){const have=state.sessions.length;return top('Plan your study','STUDY PLANNER','Build a realistic plan using your exam date, available hours, and the topics that need attention.')+`<div class="columns"><div><div class="panel panel-pad"><div class="tab-head"><h2>Study plan settings</h2><span class="pill">${icon('calendar',14)} ${esc(state.course)}</span></div><form id="plan-form"><div class="form-grid"><div class="field"><label for="exam-date">Exam date</label><input class="form-control" type="date" id="exam-date" name="date" value="${esc(state.examDate)}" required></div><div class="field"><label for="study-hours">Study time (hours per week)</label><select class="form-control" id="study-hours" name="hours">${[1,2,3,4,5,6,8,10,12,15].map(h=>`<option value="${h}" ${String(h)===String(state.hours)?'selected':''}>${h} hour${h!==1?'s':''} per week</option>`).join('')}</select></div></div><button class="btn primary" type="submit">${icon('spark',16)} ${have?'Regenerate study plan':'Generate study plan'}</button> <span class="mini-note">Regenerating resets checked sessions.</span></form></div>${have?`<div class="section-title"><h2>My study plan</h2><span class="pill success">${pct()}% complete</span></div><div class="panel panel-pad"><div class="between" style="margin-bottom:11px"><b>Upcoming study sessions</b><span class="caption">Exam: ${dateLabel(state.examDate)} · ${daysLeft()}</span></div>${progressBar(pct(),'green')}<div style="margin-top:7px" class="mini-note">${state.sessions.filter(x=>x.done).length} of ${have} sessions completed</div><div style="margin-top:15px">${state.sessions.map((s,i)=>`<div class="task-row ${s.done?'done':''}"><input type="checkbox" id="session-${i}" data-action="toggle-session" data-index="${i}" ${s.done?'checked':''}/><label for="session-${i}"><strong>${esc(s.topic)}</strong><small>${esc(s.description)} · ${esc(s.hours)} hour${s.hours===1?'':'s'}</small></label><button class="btn" data-action="practice-topic" data-index="${i}">Practice</button><span class="date-pill">${esc(s.day)}</span></div>`).join('')}</div><div class="button-row" style="margin-top:15px"><button class="btn" data-view="progress">View progress ${icon('arrow')}</button></div></div>`:''}</div><div class="side-column"><div class="panel side-panel"><h3>Quiz-based review priorities</h3>${topicPanel()}<p class="mini-note" style="margin:11px 0 0">${reviewNote()}</p></div><div class="info-panel"><h3>Your plan stays flexible</h3><ul><li>Focus first on weaker topics.</li><li>Mark a session done after studying.</li><li>Adjust the date or hours any time.</li></ul></div></div></div>`}
function activityPanel(){const a=state.quizAttempts;if(!a.length)return '';
 const row=(l,r,c)=>`<div class="between" style="margin:8px 0;font-size:13px"><span>${l}</span><b${c?` style="color:${c}"`:''}>${r}</b></div>`;
 const lv=['Easy','Medium','Hard'].map(l=>{const x=a.filter(i=>i.level===l);return row(l,x.length?`${x.filter(i=>i.correct).length} of ${x.length} correct`:'Not tried')}).join('');
 const rec=a.slice(-5).reverse().map(i=>row(`${esc(i.topic)} · ${esc(i.level)} · ${questionTypeLabel[i.type]||'Multiple choice'}`,i.correct?'Correct':'Review',i.correct?'#147c61':'#b3412f')).join('');
 return `<div class="section-title"><h2>Recent activity</h2><button class="btn" data-action="export">Download results (CSV)</button></div><div class="panel panel-pad"><b>By difficulty</b>${lv}<div class="subdivider"></div><b>Last ${Math.min(5,a.length)} answers</b>${rec}</div>`}
function flagPanel(){const f=state.flags||[];if(!f.length)return '';return `<div class="panel side-panel" style="margin-bottom:15px"><h3>Flagged answers (${f.length})</h3>${f.slice(-3).reverse().map(x=>`<p class="mini-note" style="margin:8px 0"><b>${esc(x.question)}</b><br>${esc(x.reason)}${x.details?' · '+esc(x.details):''}</p>`).join('')}</div>`}
function progress(){return top('See how far you’ve come','YOUR PROGRESS','Track your practice and study-plan completion, and decide what to focus on next.')+`<div class="columns"><div><div class="stat-grid"><div class="stat"><p>Study plan progress</p><strong>${pct()}%</strong><small>${state.sessions.length?'From completed sessions':'No plan created yet'}</small></div><div class="stat"><p>Practice accuracy</p><strong>${accuracyLabel()}</strong><small>${state.quizAttempts.length?state.quizAttempts.length+' question'+(state.quizAttempts.length===1?'':'s')+' attempted':'No quizzes taken yet'}</small></div><div class="stat"><p>Questions answered</p><strong>${state.quizAttempts.length}</strong><small>Across all quiz difficulties</small></div></div><div class="section-title"><h2>Learning activity</h2></div><div class="panel panel-pad"><div class="between"><b>Practice accuracy</b><strong>${accuracyLabel()}</strong></div><p class="caption">${state.quizAttempts.length} question${state.quizAttempts.length===1?'':'s'} answered · ${state.quizAttempts.filter(x=>x.correct).length} correct</p><div style="margin:20px 0 23px">${progressBar(accuracyPct()??0,'green')}</div><div class="between"><b>Study plan</b><strong>${pct()}%</strong></div><p class="caption">${state.sessions.length?state.sessions.filter(x=>x.done).length+' of '+state.sessions.length+' sessions complete':'Create a plan to track your study sessions.'}</p>${progressBar(pct())}<div class="button-row" style="margin-top:25px"><button class="btn primary" data-view="practice">Practice again ${icon('arrow')}</button><button class="btn" data-view="plan">Open study plan</button></div></div>${activityPanel()}<div class="section-title"><h2>Improve with each session</h2></div><div class="callout greenish">${icon('shield',17)} <b>Privacy:</b> This demo stores activity only in your current browser using local storage. It does not send student scores to a server or to an instructor.</div></div><div class="side-column"><div class="panel side-panel"><h3>Areas to review</h3>${topicPanel()}<p class="mini-note" style="margin-top:10px">${reviewNote()}</p></div>${flagPanel()}<div class="info-panel"><h3>Keep growing</h3><ul><li>Use Practice to review difficult topics.</li><li>Use Plan to schedule focused sessions.</li><li>Use Ask & Check to verify explanations.</li></ul></div></div></div>`}
function render(){const ae=document.activeElement,fk=ae&&ae.closest&&ae.closest('#view')?{id:ae.id,a:ae.dataset.action,i:ae.dataset.index}:null;document.getElementById('brand-icon').innerHTML=icon('spark',24);document.getElementById('light-icon').innerHTML=icon('spark',17);document.getElementById('course-icon').innerHTML=icon('book',16);document.getElementById('course-select').value=state.course;document.getElementById('crumb-title').textContent=navItems.find(x=>x[0]===state.view)?.[1]||'Dashboard';renderNav();document.getElementById('view').innerHTML=({home,ask,practice,plan,progress}[state.view]||home)();save();if(fk){const el=fk.id?document.getElementById(fk.id):fk.a?document.querySelector(`#view [data-action="${fk.a}"]${fk.i!==undefined?`[data-index="${fk.i}"]`:''}`):null;if(el&&!el.disabled)el.focus()}}
function toast(msg){let e=document.getElementById('toast-root');e.innerHTML=`<div class="toast" role="status">${icon('check',16)} ${esc(msg)}</div>`;setTimeout(()=>{if(e)e.innerHTML=''},3300)}
function modal(body){lastFocus=document.activeElement;document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" data-action="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${body.title}</h2><button class="close" data-action="close-modal" aria-label="Close dialog">${icon('close',18)}</button></div>${body.html}</div></div>`;document.querySelector('.modal .close')?.focus()}
function closeModal(){const r=document.getElementById('modal-root'),had=r.innerHTML;r.innerHTML='';if(had&&lastFocus&&document.contains(lastFocus))lastFocus.focus()}
function flagModal(){if(!state.lastAsk)return;modal({title:'Flag this answer',html:`<p>Help improve StudyMate by explaining why this answer should be reviewed. Choose a reason before you can submit.</p><form id="flag-form"><div class="field"><label for="flag-reason">Reason for flagging <span style="color:var(--red)">*</span></label><select class="form-control" id="flag-reason" required><option value="">Choose a reason</option><option>Incorrect or misleading explanation</option><option>Source does not support the answer</option><option>Explanation is unclear or incomplete</option><option>Other issue</option></select></div><div class="field"><label for="flag-details">Additional details (optional)</label><textarea class="form-control textarea" id="flag-details" placeholder="What should be reviewed?" rows="3" style="min-height:75px"></textarea></div><div class="button-row" style="justify-content:flex-end"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">Submit report ${icon('arrow')}</button></div></form>`})}
function flaggedConfirm(){modal({title:'Answer flagged!',html:`<div class="empty-state" style="padding:15px 5px 4px"><div class="big-icon" style="background:#e8f8f1;color:#147c61">${icon('flag',32)}</div><h3>Thank you for your feedback</h3><p>Your report has been saved in this demo. In the proposed system, a TA would review flagged answers against course material.</p><button class="btn primary" data-action="close-modal">OK ${icon('check')}</button></div>`})}
function generateSessions(d,h){
 const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 const diff=Math.ceil((+new Date(d+'T12:00:00')-+start)/86400000);
 if(!(diff>0)){toast('Choose a future exam date.');return false}
 const perWeek=Math.min(5,Math.max(1,Math.round(Number(h)/1.5)));
 const n=Math.min(14,Math.max(3,Math.ceil(diff/7)*perWeek));
 const queue=[];topicStats().forEach(t=>{queue.push(t);if(t.answered&&t.accuracy<60)queue.push(t)});
 state.sessions=Array.from({length:n},(_,i)=>{const t=queue[i%queue.length];const at=new Date(start);at.setDate(at.getDate()+Math.max(1,Math.round((i+1)*diff/(n+1))));
  return {topic:t.name.replace(/\b\w/g,c=>c.toUpperCase()),description:t.answered?`Review quiz mistakes · ${t.accuracy}% accuracy from ${t.answered} answers`:'Explore this topic · not yet tested',day:at.toLocaleDateString('en-CA',{month:'short',day:'numeric'}),hours:Math.round(Number(h)/perWeek*2)/2,done:false}});
 return true}
function resetQuiz(){state.quiz={...state.quiz,phase:'setup',index:0,selected:-1,hint:false,score:0,history:[],shortText:'',graded:false,selfMark:null}}
document.addEventListener('submit',e=>{
 if(e.target.id==='ask-form'){
  e.preventDefault();const value=(document.getElementById('ask-input')?.value||'').trim();
  if(!value){toast('Enter a question first.');return}
  const answer=findPreparedAnswer(value);
  state.draft=value;
  state.lastAsk=answer?{found:true,question:value,...answer}:{found:false,question:value};
  render();toast(answer?'Prepared explanation ready — check the source.':'No prepared answer for that question yet.');
 }else if(e.target.id==='quiz-setup'){
  e.preventDefault();const f=new FormData(e.target);const topic=String(f.get('topic')),level=String(f.get('difficulty'));
  const items=buildItems(topic,level);state.quiz={topic,level,phase:'question',index:0,selected:-1,hint:false,score:0,total:items.length,history:[],shortText:'',graded:false,selfMark:null,items};render();
 }else if(e.target.id==='plan-form'){
  e.preventDefault();const f=new FormData(e.target);state.examDate=String(f.get('date'));state.hours=String(f.get('hours'));
  if(generateSessions(state.examDate,state.hours)){render();toast('Study plan generated successfully.')}
 }else if(e.target.id==='flag-form'){
  e.preventDefault();const reason=document.getElementById('flag-reason')?.value;
  if(!reason){toast('Please select a reason.');return}
  state.flagged++;state.flags=[...(state.flags||[]),{question:state.lastAsk?.question,source:state.lastAsk?.sources?.map(x=>x.title).join(', '),reason,details:(document.getElementById('flag-details')?.value||'').trim(),at:Date.now()}];if(state.lastAsk)state.lastAsk.flagged=true;render();flaggedConfirm();
 }
});
document.addEventListener('click',e=>{
 const target=e.target.closest('button[data-view]');if(target){goto(target.dataset.view);return}
 const b=e.target.closest('button[data-action]');if(!b)return;
 const a=b.dataset.action;
 if(a==='cite'){const n=b.dataset.n,el=document.getElementById('src-'+n);if(!el)return;
  document.querySelectorAll('.src-item').forEach(i=>i.classList.toggle('active',i===el));
  document.querySelectorAll('.cite,.src-chip').forEach(c=>c.setAttribute('aria-current',String(c.dataset.n===n)));
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});el.focus({preventScroll:true})}
 else if(a==='conf'){const r=document.getElementById('conf-reason');b.setAttribute('aria-expanded',String(r.classList.toggle('open')))}
 else if(a==='flag')flagModal();
 else if(a==='close-modal')closeModal();
 else if(a==='overlay'&&e.target===b)closeModal();
 else if(a==='ask-example'){
  const question=exampleQuestions[Number(b.dataset.index)];if(!question)return;
  state.draft=question;render();document.getElementById('ask-form')?.requestSubmit();
 }
 else if(a==='hint'&&state.quiz.phase==='question'){state.quiz.hint=true;render()}
 else if(a==='select-answer'&&state.quiz.phase==='question'){
  state.quiz.selected=Number(b.dataset.index);render();
 }
 else if(a==='submit-answer'){
  const q=state.quiz;if(q.phase!=='question')return;
  const v=question();
  if(v.type==='short'){
   if((q.shortText||'').trim().length<3){toast('Enter a short answer first.');return}
   q.phase='feedback';q.graded=false;render();
  }else{
   if(q.selected<0)return;
   recordAttempt(q.selected===v.correct,'automatic');q.phase='feedback';render();
  }
 }
 else if(a==='self-grade'){
  const q=state.quiz;
  if(q.phase!=='feedback'||question().type!=='short'||q.graded)return;
  const correct=b.dataset.result==='correct';q.selfMark=correct?'correct':'review';
  recordAttempt(correct,'self-assessed');render();
 }
 else if(a==='next-question'){
  const q=state.quiz;if(q.phase!=='feedback'||!q.graded)return;
  if(q.index+1>=q.total)q.phase='complete';
  else{q.index++;q.selected=-1;q.shortText='';q.graded=false;q.selfMark=null;q.hint=false;q.phase='question'}
  render();
 }
 else if(a==='restart-quiz'){resetQuiz();render()}
 else if(a==='export'){const rows=[['topic','level','type','correct','grading','time'],...state.quizAttempts.map(i=>[i.topic,i.level,i.type,i.correct,i.gradeMethod,i.at?new Date(i.at).toISOString():''])];
  const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));l.download='studymate-results.csv';l.click();setTimeout(()=>URL.revokeObjectURL(l.href),1000);toast('Results downloaded.')}
 else if(a==='practice-topic'){const s=state.sessions[Number(b.dataset.index)];if(!s)return;const t=Object.keys(bank.Medium).find(k=>k.toLowerCase()===s.topic.toLowerCase());if(t)state.quiz={...state.quiz,topic:t,phase:'setup'};goto('practice')}
 else if(a==='reset'){
  if(window.confirm('Reset your demo questions, quiz results, and study plan?')){
   state=defaults();render();toast('Demo data reset.');
  }
 }
});

document.addEventListener('change',e=>{if(e.target.id==='course-select'){state.course=e.target.value;render();toast('Course changed (sample demo data).')}let t=e.target;if(t.matches('input[data-action="toggle-session"]')){let i=Number(t.dataset.index);if(state.sessions[i]){state.sessions[i].done=t.checked;render();toast(t.checked?'Study session completed.':'Session marked incomplete.')}}});
document.addEventListener('input',e=>{if(e.target.id==='ask-input'){state.draft=e.target.value;save()}else if(e.target.id==='short-response'){state.quiz.shortText=e.target.value;const btn=document.querySelector('button[data-action=submit-answer]');if(btn)btn.disabled=e.target.value.trim().length<3;save()}});document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){closeModal();const r=document.getElementById('conf-reason');if(r?.classList.contains('open')){r.classList.remove('open');document.querySelector('.conf')?.setAttribute('aria-expanded','false')}}
 const m=document.querySelector('.modal');
 if(e.key==='Tab'&&m){const f=[...m.querySelectorAll('button,select,textarea,input')].filter(x=>!x.disabled);if(f.length){const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}}
 if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&e.target.id==='ask-input'){e.preventDefault();document.getElementById('ask-form').requestSubmit()}
 if(/^[1-4]$/.test(e.key)&&!m&&state.view==='practice'&&state.quiz.phase==='question'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))document.querySelector(`[data-action="select-answer"][data-index="${e.key-1}"]`)?.click();
});
window.addEventListener('popstate',()=>{const v=location.hash.slice(1);if(navItems.some(x=>x[0]===v)&&v!==state.view){state.view=v;closeModal();render()}});
{const v=location.hash.slice(1);if(navItems.some(x=>x[0]===v))state.view=v}
render();
})();