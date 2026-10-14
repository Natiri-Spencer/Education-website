const fs = require('fs');
const cp = require('child_process');
const git = (...args) => cp.execFileSync('git', ['-c','safe.directory=C:/Users/Administrator/Desktop/Nat_project/cbc_env',...args], {encoding:'utf8'});
const read = path => fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n');
const head = path => git('show',`HEAD:${path}`).replace(/\r\n/g,'\n');
const staged = new Map();
const templatePath='educations/templates/educations/virtual_labs.xhtml';
const current=read(templatePath);
let template=head(templatePath);
template=template.replace('virtual_labs.css\' %}?v=25','virtual_labs.css\' %}?v=26').replace('virtual_labs.js\' %}?v=22','virtual_labs.js\' %}?v=23');
template=template.replace('Choose a method to open its guided simulation. Follow the steps and observe what is collected and what remains behind.','Choose a separation method. In evaporation, assemble the apparatus, control the heating, and record your observations in the notebook.');
const evaporationCard=current.split('\n').find(line=>line.includes('data-mixture-method="evaporation"'));
template=template.replace(/^.*data-mixture-method="evaporation".*$/m,evaporationCard);
const procedure=current.match(/<ol class="evap-procedure shared-procedure">[\s\S]*?<\/ol>/)[0];
template=template.replace('<nav class="mixture-method-nav"',`${procedure}\n                <nav class="mixture-method-nav"`);
template=template.replace('                <div class="mixture-progress-track"',"                {% include 'educations/evaporation.xhtml' %}\n                <div class=\"mixture-progress-track\"");
template=template.replace('{% endblock %}\n', '{% endblock %}\n');
template=template.replace('<script src="{% static \'educations/commercial_indicators.js\' %}?v=4" defer></script>','<script src="{% static \'educations/commercial_indicators.js\' %}?v=4" defer></script>\n<script src="{% static \'educations/evaporation.js\' %}?v=2" defer></script>');
if(template.includes('separation_lab') || template.includes('shared-apparatus-shelf')) throw Error('Non-evaporation template edits detected');
staged.set(templatePath,template);
const cssPath='educations/static/educations/virtual_labs.css';
const allCSS=read(cssPath);
let css=allCSS.slice(allCSS.indexOf('.evap-activity { display: none; }'),allCSS.indexOf('/* Shared experiment shell:'));
css=css.replace('.simulation-view .mixture-lab-app {','.simulation-view .mixture-lab-app[data-active-method="evaporation"] {');
css+=`
/* Evaporation uses the procedure / workbench / shelf layout. */
.evap-procedure { display: none; }
[data-active-method="evaporation"] .evap-procedure { display: block; list-style: none; counter-reset: evap-step; padding: .3rem 0; }
.evap-procedure li { position: relative; counter-increment: evap-step; padding: .5rem 0 .5rem 2.2rem; font-size: .85rem; line-height: 1.6; }
.evap-procedure li::before { content: counter(evap-step); position: absolute; left: 0; top: .65rem; display: grid; place-items: center; width: 23px; height: 23px; border-radius: 50%; background: #f3f7fc; color: #55718e; font-size: .7rem; font-weight: bold; }
.simulation-view [data-active-method="evaporation"] .mixture-simulation-layout { grid-template-columns: minmax(270px,18%) minmax(0,1fr) minmax(320px,24%); height: auto; min-height: calc(100dvh - 3rem); overflow: visible; }
.simulation-view [data-active-method="evaporation"] .mixture-simulation-main { display: contents; }
[data-active-method="evaporation"] .mixture-simulation-heading { display: none; }
.simulation-view [data-active-method="evaporation"] .evap-activity { display: grid; grid-column: 2 / 4; grid-template-columns: minmax(0,1fr) max(320px,24vw); align-content: start; }
[data-active-method="evaporation"] .evap-intro { grid-column: 1; padding: .6rem 1rem; margin: 0; font-size: .8rem; background: #192a42; }
[data-active-method="evaporation"] .evap-layout { display: contents; }
[data-active-method="evaporation"] .evap-layout > div { grid-column: 1; min-width: 0; }
.simulation-view [data-active-method="evaporation"] .evap-shelf { grid-column: 2; grid-row: 1 / 4; min-width: 0; padding: .6rem .8rem 2rem; border: 0; border-left: 1px solid #344c69; border-radius: 0; background: #192a42; }
[data-active-method="evaporation"] .evap-notebook { grid-column: 1; margin: 0; padding: 1rem; border: 0; border-top: 1px solid #344c69; border-radius: 0; background: #192a42; }
[data-active-method="evaporation"] .evap-feedback { margin: 0; }
.evap-shelf .shared-objective { padding: .7rem; border: 1px solid #344c69; border-radius: 6px; background: #18283e; }
.evap-shelf .shared-objective small { font-size: .65rem; font-weight: bold; }
.evap-shelf > h3 { width: fit-content; margin: .8rem auto; padding: .5rem .8rem; border: 2px solid #416a71; border-radius: 4px; color: #43e0d4; font-size: .7rem; letter-spacing: .12em; }
.evap-shelf-items { gap: .3rem; padding: .3rem; border: 3px solid #344f70; }
.evap-shelf-items button { min-height: 120px; border: 3px solid #344f70; border-radius: 0; background: linear-gradient(#203650,#192a42); }
.simulation-view .evap-bench { min-height: 570px; border: 0; border-radius: 0; background: linear-gradient(#879bb0,#879bb0) left 8px bottom 8px / calc(100% - 16px) 280px no-repeat,repeating-linear-gradient(0deg,transparent 0 43px,#263b53 44px 45px),repeating-linear-gradient(90deg,#102036 0 78px,#263b53 79px 80px); }
.evap-activity .work-area-heading { position: relative; }
.evap-activity .drop-hint { pointer-events: none; }
.evap-controls, .evap-predict-label, #evap-prediction, .evap-observation { margin-left: 1rem; margin-right: 1rem; }
.evap-activity #evap-prediction { width: calc(100% - 2rem); }
@media (max-width: 1050px) { .simulation-view [data-active-method="evaporation"] .mixture-simulation-layout { grid-template-columns: 220px minmax(0,1fr) 240px; } .simulation-view [data-active-method="evaporation"] .evap-activity { grid-template-columns: minmax(0,1fr) 240px; } }
@media (max-width: 800px) { .simulation-view [data-active-method="evaporation"] .mixture-simulation-layout { grid-template-columns: minmax(0,1fr); } .simulation-view [data-active-method="evaporation"] .evap-activity { grid-column: 1; grid-template-columns: minmax(0,1fr); } .simulation-view [data-active-method="evaporation"] .evap-shelf { grid-column: 1; grid-row: auto; } .simulation-view .evap-bench { min-height: 450px; } }
`;
staged.set(cssPath,head(cssPath).trimEnd()+'\n'+css);
staged.set('educations/static/educations/virtual_labs.js',read('educations/static/educations/virtual_labs.js'));
staged.set('educations/static/educations/evaporation.js',read('educations/static/educations/evaporation.js'));
staged.set('educations/templates/educations/evaporation.xhtml',read('educations/templates/educations/evaporation.xhtml'));
fs.mkdirSync('.evaporation-review',{recursive:true});
for(const [path,raw] of staged) {
  const content=raw.trimEnd()+'\n';
  const reviewPath=`.evaporation-review/${path}`;
  fs.mkdirSync(require('path').dirname(reviewPath),{recursive:true}); fs.writeFileSync(reviewPath,content);
  const sha=cp.execFileSync('git',['-c','safe.directory=C:/Users/Administrator/Desktop/Nat_project/cbc_env','hash-object','-w','--stdin'],{input:content,encoding:'utf8'}).trim();
  git('update-index','--add','--cacheinfo',`100644,${sha},${path}`);
}
console.log('Staged five evaporation files; other working files were preserved.');
