const STAFF_MEMBERSHIPS = [
  {id:'staff-alex-consulting',userId:'alex',clubId:'consulting-society',role:'OWNER',status:'APPROVED'},
  {id:'staff-maya-consulting',userId:'maya',clubId:'consulting-society',role:'REVIEWER',status:'APPROVED'},
  {id:'staff-sam-sustainability',userId:'sam',clubId:'sustainability-collective',role:'OWNER',status:'APPROVED'},
  {id:'staff-jordan-sustainability',userId:'jordan',clubId:'sustainability-collective',role:'EDITOR',status:'APPROVED'}
];

const ACCESS_REQUESTS = [
  {id:'request-1',userId:'maya',clubId:'global-health',proposedClubName:null,evidence:'Faculty advisor confirmation and club email access.',status:'PENDING',createdAt:new Date().toISOString()},
  {id:'request-2',userId:'jordan',clubId:null,proposedClubName:'Student Illustration Guild',evidence:'Draft constitution and founding team details supplied.',status:'PENDING',createdAt:new Date().toISOString()}
];

const DEFAULT_QUESTIONS = [
  {id:'motivation',title:'Why are you interested in joining our club?',description:'Tell us what excites you about this opportunity.',type:'LONG_TEXT',required:true,limitType:'words',limit:200,options:[]},
  {id:'year',title:'What year of study are you in?',description:'',type:'MULTIPLE_CHOICE',required:true,options:['First','Second','Third','Fourth or above']},
  {id:'experience',title:'What relevant experiences do you have?',description:'This can include coursework, volunteering, work, or lived experience.',type:'LONG_TEXT',required:false,limitType:'words',limit:150,options:[]},
  {id:'interests',title:'Which areas interest you most?',description:'Select all that apply.',type:'CHECKBOXES',required:true,options:['Consulting','Finance','Marketing','Strategy']}
];

const APPLICATION_FORMS = [
  {id:'form-consulting-v1',clubId:'consulting-society',opportunityTitle:'Community Consultant',name:'Community Consultant Application',version:1,status:'PUBLISHED',questions:DEFAULT_QUESTIONS.map(q=>({...q,options:[...q.options]}))},
  {id:'form-finance-v1',clubId:'finance-association',opportunityTitle:'Junior Analyst Team',name:'Junior Analyst Application',version:1,status:'PUBLISHED',questions:[
    {...DEFAULT_QUESTIONS[0],id:'finance-motivation'},
    {...DEFAULT_QUESTIONS[1],id:'finance-year',options:[...DEFAULT_QUESTIONS[1].options]},
    {id:'market',title:'Which market are you most curious about?',description:'',type:'DROPDOWN',required:true,options:['Public equities','Fixed income','Private markets','Fintech']}
  ]},
  {id:'form-sustainability-v1',clubId:'sustainability-collective',opportunityTitle:'Circular Campus Lead',name:'Circular Campus Lead Application',version:1,status:'PUBLISHED',questions:[
    {id:'impact',title:'What change would you like to see on campus?',description:'Be specific and practical.',type:'LONG_TEXT',required:true,limitType:'words',limit:200,options:[]},
    {id:'skills',title:'Which skills would you bring?',description:'',type:'CHECKBOXES',required:true,options:['Event planning','Research','Communications','Partnerships']},
    {id:'availability',title:'Can you commit 4–6 hours each week?',description:'',type:'MULTIPLE_CHOICE',required:true,options:['Yes','No','Unsure']}
  ]}
];

const seedSubmissionDate = days => { const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString(); };
const APPLICATION_SUBMISSIONS = [
  {id:'submission-maya-consulting',studentId:'maya',clubId:'consulting-society',opportunityTitle:'Community Consultant',formId:'form-consulting-v1',formVersion:1,submittedAt:seedSubmissionDate(2),status:'UNDER_REVIEW',answers:{motivation:'I want to apply structured problem solving to community-defined challenges and learn from a multidisciplinary team.',year:'Third',experience:'I coordinated a peer tutoring program and completed an introductory data analysis course.',interests:['Consulting','Strategy']},privateNotes:[{id:'note-1',reviewerId:'alex',text:'Strong community motivation; discuss availability in interview.',createdAt:seedSubmissionDate(1)}]},
  {id:'submission-jordan-consulting',studentId:'jordan',clubId:'consulting-society',opportunityTitle:'Community Consultant',formId:'form-consulting-v1',formVersion:1,submittedAt:seedSubmissionDate(1),status:'SUBMITTED',answers:{motivation:'Storytelling and audience research have taught me to frame ambiguous questions clearly.',year:'Second',experience:'Film production team coordination and student festival volunteering.',interests:['Marketing','Strategy']},privateNotes:[]},
  {id:'submission-alex-sustainability',studentId:'alex',clubId:'sustainability-collective',opportunityTitle:'Circular Campus Lead',formId:'form-sustainability-v1',formVersion:1,submittedAt:seedSubmissionDate(4),status:'INTERVIEW',answers:{impact:'I would make repair and reuse programs easier to discover through residence partnerships.',skills:['Event planning','Partnerships'],availability:'Yes'},privateNotes:[]}
];

const REVIEW_STATUSES = ['SUBMITTED','UNDER_REVIEW','INTERVIEW','ACCEPTED','NOT_SELECTED','WITHDRAWN'];
const STAFF_ROLES = ['OWNER','EDITOR','REVIEWER'];

function loadPhase2Store(){
  try {
    const stored=JSON.parse(localStorage.getItem('clubhub-phase2-store'));
    if(stored) return stored;
  } catch {}
  return {
    forms:APPLICATION_FORMS.map(f=>({...f,questions:f.questions.map(q=>({...q,options:[...(q.options||[])]}))})),
    submissions:APPLICATION_SUBMISSIONS.map(s=>({...s,answers:{...s.answers},privateNotes:[...s.privateNotes]})),
    memberships:STAFF_MEMBERSHIPS.map(x=>({...x})),
    accessRequests:ACCESS_REQUESTS.map(x=>({...x})),
    customOpportunities:[]
  };
}
