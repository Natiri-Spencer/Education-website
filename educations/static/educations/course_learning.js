(function(){
 'use strict';
 const base=new URL('.',document.currentScript.src);
 document.querySelectorAll('[data-print-lesson]').forEach(button=>{button.hidden=false;button.addEventListener('click',()=>window.print());});
 let loaded;
 function script(name){return new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=new URL(name,base).href;element.onload=resolve;element.onerror=()=>{element.remove();reject(Error('The activity could not load. You can keep studying the diagram and lesson, then try again.'));};document.head.append(element);});}
 document.querySelectorAll('[data-open-simulation]').forEach(button=>{
  button.hidden=false;
  button.addEventListener('click',async()=>{
   const panel=button.closest('[data-course-simulation]'),status=panel.querySelector('[data-load-status]');
   button.disabled=true;status.textContent='Opening activity…';
   try{
    loaded??=script(panel.dataset.modelSrc).then(()=>script(panel.dataset.uiSrc)).catch(error=>{loaded=null;throw error;});
    await loaded;const stage=panel.querySelector('[data-simulation-stage]');
    window.CourseSimulations.mount(stage,panel.dataset);stage.hidden=false;button.hidden=true;status.textContent='';
    stage.querySelector('select,input,button')?.focus();
   }catch(error){status.textContent=error.message;button.disabled=false;}
  });
 });
})();
