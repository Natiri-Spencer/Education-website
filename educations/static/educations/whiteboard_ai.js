(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardAI=factory();}(typeof self!=='undefined'?self:this,function(){
    'use strict';
    const actions={explain:'Explain',hint:'Give a hint',check:'Check my work',summarize:'Summarize board',practice:'Create practice'};
    function validateResult(raw){
        if(!raw||typeof raw!=='object')throw new Error('The AI assistant returned no result.');
        const result={title:String(raw.title||'').slice(0,120),explanation:String(raw.explanation||'').slice(0,5000),insertText:String(raw.insertText||'').slice(0,5000),insertFormat:raw.insertFormat==='math'?'math':'paragraph',warnings:Array.isArray(raw.warnings)?raw.warnings.filter(value=>typeof value==='string').slice(0,6):[]};
        if(!result.explanation||!result.insertText)throw new Error('The AI assistant returned an incomplete result.');return result;
    }
    async function request(url,csrf,payload,signal,fetcher=fetch){
        const response=await fetcher(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRFToken':csrf},body:JSON.stringify(payload),signal});
        let data={};try{data=await response.json();}catch(_){/* handled below */}
        if(!response.ok)throw new Error(data.error||`AI Assist failed (${response.status}).`);return validateResult(data.result);
    }
    function insertion(result,action,sourceIds,position){
        return{type:'sticky',x:position.x,y:position.y,w:360,h:220,fill:'#efe4ff',stroke:'#3b3548',fontSize:18,text:`${result.title}\n\n${result.insertText}`.trim(),aiGenerated:true,aiAction:action,aiSourceIds:[...sourceIds].slice(0,60)};
    }
    return{actions,validateResult,request,insertion};
}));
