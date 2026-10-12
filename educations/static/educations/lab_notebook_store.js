((global) => {
    const plain = value => value == null ? '' : String(value);
    const columns = ['Stage / test','My answers','Mark & correction'];
    const separation = ['sublimation','chromatography','distillation','filtration'];
    const magnetism = ['attraction','repulsion','direction'];
    const electrical = ['simple','bulbs','cells'];
    const catalogue = [
        {id:'apparatus',title:'Apparatus identification',key:'grade7-apparatus-notebook-v1',columns:['Task','My instrument','Use of the correct instrument','Mark & correction'],prompt:'Identify each instrument and state its use.',rows:entries=>entries},
        {id:'hibiscus',title:'Hibiscus indicator',key:'grade7-hibiscus-notebook-v1',columns:['Sample','Indicator colour','My classification','What the colour means','Mark & correction'],prompt:'Record the sample, indicator colour and classification as acid, base or neutral.',rows:entries=>entries},
        {id:'commercial',title:'Commercial indicators',key:'grade7-commercial-notebook-v1',columns:['Sample','Indicator','Prediction','Observation','Conclusion & evidence','Mark & correction'],prompt:'Compare litmus, methyl orange and phenolphthalein. Record the colour and the conclusion supported by the evidence.',rows:entries=>entries.map(entry=>entry.cells||[])},
        {id:'evaporation',title:'Evaporation',key:'grade7-evaporation-notebook-v1',columns,prompt:'Observe the water level and salt crystals. State what remains and where the water goes.',rows:entries=>entries},
        ...separation.map((id,i)=>({id,title:['Sublimation','Paper chromatography','Fractional distillation','Filtration'][i],key:'grade7-separation-notebook-v1-'+id,columns,prompt:['Describe the white fumes, deposit on the cold flask and common salt remaining.','Record the starting spot, separated colour bands and solvent front.','Record heating, condensation and the collected fraction.','Identify the residue, filtrate and separation method.'][i],rows:entries=>entries.map(entry=>[entry.stage,entry.answer,entry.mark])})),
        ...magnetism.map((id,i)=>({id:'mag-'+id,title:'Magnetism: '+id,key:'grade7-magnetism-'+id,columns:id==='attraction'?['Test','My answers','Material type','Mark & correction']:columns,prompt:['Record the material, prediction, movement and magnetic/non-magnetic classification.','Compare like and unlike facing poles and record the movement.','Record the starting direction and where the released magnet settles.'][i],rows:entries=>entries.map(entry=>id==='attraction'?[entry.test,entry.answers,entry.classification||'Not recorded',entry.mark]:[entry.test,entry.answers,entry.mark])})),
        ...electrical.map((id,i)=>({id:'ee-'+id,title:['Electrical: simple circuit','Electrical: series / parallel bulbs','Electrical: series / parallel cells'][i],key:'grade7-electrical-'+id,columns:['Setup & measurement','Current (A)','Voltage (V)','Brightness','Mark & correction'],prompt:'Record the arrangement, ammeter reading, voltmeter reading and bulb brightness. Compare your results.',rows:entries=>entries.map(entry=>[entry.setup,entry.current,entry.voltage,entry.brightness,entry.mark])}))
,
        {id:'ee-sources',title:'Sources of energy',key:'grade7-electrical-sources',columns:['Panel covered','My observation','My conclusion','Mark & correction'],prompt:'Compare bulb brightness with the solar panel uncovered, partly covered and fully covered. Explain the role of sunlight.',rows:entries=>entries}
    ];
    function createStore(storage) {
        const session = new Map();
        function load(key) {if(session.has(key))return session.get(key);try {const value=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(value)?value.filter(entry=>entry&&typeof entry==='object'):[];}catch(_){return [];}}
        function save(key,entries) {session.set(key,entries);try {storage.setItem(key,JSON.stringify(entries));return true;}catch(_){return false;}}
        function rows(book) {return book.rows(load(book.key)).filter(Array.isArray).map(row=>book.columns.map((_,i)=>plain(row[i])));}
        function render(body,entries,count,empty='Your checked observations will appear here.',emptyClass='') {
            body.replaceChildren();
            if(!entries.length){const row=body.insertRow(),cell=row.insertCell();row.className=emptyClass;cell.colSpan=count;cell.textContent=empty;return;}
            entries.forEach(entry=>{if(!Array.isArray(entry))return;const row=body.insertRow();for(let i=0;i<count;i++)row.insertCell().textContent=plain(entry[i]);});
        }
        return {load,save,rows,render};
    }
    const api={catalogue,createStore};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;
    else {let storage;try{storage=global.localStorage;}catch(_){storage={getItem(){return null;},setItem(){throw Error('Storage unavailable');}};}global.Grade7Notebooks={...api,...createStore(storage)};}
})(typeof window!=='undefined'?window:globalThis);
