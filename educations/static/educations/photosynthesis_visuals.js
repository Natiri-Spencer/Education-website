((root) => {
    const leafPath='M 0 -135 C 110 -100 135 -20 80 75 Q 45 120 0 145 Q -60 110 -90 45 C -140 -45 -75 -115 0 -135 Z';
    function leaf(x,y,scale=1,fill='#4dba70',covered=false,result=0,guide=false) {
        return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="${leafPath}" fill="${fill}" stroke="#b7dfb3" stroke-width="3"/>
        ${result>0?`<g clip-path="url(#photo-leaf-clip)" opacity="${result}"><path d="${leafPath}" fill="#20245c"/><rect x="-140" y="-38" width="280" height="80" fill="#c79643"/></g>`:''}
        <path d="M0 145V-118 M0 -70L55 -65 M0 -15L85 -10 M0 40L60 50 M0 -70L-55 -65 M0 -15L-85 -10 M0 40L-60 50" fill="none" stroke="${result?'#b1b3cf':'#d1e6a5'}" stroke-width="3" opacity=".7"/>
        ${guide?'<path d="M-110 -38H110M-110 42H110" stroke="#fff" stroke-width="3" stroke-dasharray="8 6" fill="none"/>':''}
        ${covered?'<rect x="-116" y="-43" width="232" height="90" rx="6" fill="#101525" stroke="#8492a6" stroke-width="3"/><path d="M-89 -50v98q0 14 12 14t12 -14v-93 M65 -50v98q0 14 12 14t12 -14v-93" stroke="#d7deea" stroke-width="5" fill="none"/>':''}</g>`;
    }
    function text(x,y,value,size=20,fill='#edf5ff',extra='') {return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${value}</text>`;}
    function scene(state) {
        if(state.preparing) {
            const model=root.PhotosynthesisModel,index=model.currentIndex(state),step=model.steps[index];
            const cards=step.items.map((id,i)=>{
                const [icon,label]=model.items[id],ready=state.placed.has(id),x=110+i*360;
                return `<g transform="translate(${x} 135)"><rect width="320" height="250" rx="18" fill="${ready?'#173f40':'#192c44'}" stroke="${ready?'#40d6c2':'#6b829a'}" stroke-width="3"/><text x="160" y="90" font-size="56" text-anchor="middle" fill="#edf5ff">${icon}</text>${text(160,150,label,19,'#edf5ff','text-anchor="middle"')}${text(160,201,ready?'✓ Ready on workbench':'Select from the shelf',20,ready?'#b5ed61':'#b9cee3','text-anchor="middle"')}</g>`;
            }).join('');
            return `<title id="photo-scene-title">Step ${index+1}: prepare apparatus</title><desc id="photo-scene-desc">Select ${step.items.map(id=>model.items[id][1]).join(' and ')} for this step. The simulation starts when you choose Run step ${index+1}.</desc><rect width="900" height="510" fill="#11243a"/>${text(55,60,`STEP ${index+1} · PREPARE THE WORKBENCH`,25)}${text(55,100,'Only the apparatus for this procedure step can be selected.',20,'#b9cee3')}${cards}${text(55,460,model.missing(state).length?'Choose the highlighted items, then run this step.':`Apparatus ready. Choose Run step ${index+1} to begin.`,22,'#b5ed61')}`;
        }
        const stage=state.stage,p=state.progress,done=!state.running;
        let art='';
        if(stage<=3) {
            art+=`<g ${stage===1?'opacity=".55"':''}><path d="M180 365V180M180 300L120 250M180 250L230 200" stroke="#68aa6c" stroke-width="10" fill="none"/>${leaf(120,225,.35)}${leaf(230,178,.35,'#4dba70',stage>=2)}${leaf(180,130,.35)}<path d="M120 365H245L225 465H140Z" fill="#c67855" stroke="#f1b186" stroke-width="4"/><ellipse cx="182" cy="365" rx="63" ry="13" fill="#544440"/></g>`;
            art+=text(74,490,'Same green potted plant',18);
            if(stage===1) {
                art+='<rect x="55" y="45" width="260" height="425" rx="12" fill="#0b1224" fill-opacity=".6" stroke="#8493a8" stroke-width="4"/><circle cx="285" cy="260" r="6" fill="#b5ed61"/>';
                art+=text(74,75,'DARK CUPBOARD',18)+text(350,95,`${Math.round(48*p)} / 48 hours in darkness`,24);
                art+=leaf(545,270,.65,'#c79643')+text(400,450,done?'Spare leaf: no starch detected':'Destarching before the investigation',19);
                art+=text(410,480,done?'Baseline iodine test: yellow-brown':'Time is compressed in this model.',17,'#b8cde4');
            } else {
                art+=leaf(565,260,.92,'#4dba70',stage>=2);
                art+=text(430,75,'Selected leaf — enlarged',23);
                art+=text(690,180,'Exposed',18)+text(690,285,stage>=2?'Black paper':'Green leaf',18)+text(690,385,'Exposed',18);
                if(stage===2)art+=text(390,465,'Paper covers BOTH surfaces; clips hold it in place.',18);
                if(stage===3) {
                    art+='<circle cx="355" cy="120" r="38" fill="#f4d673"/><g stroke="#f4d673" stroke-width="5"><path d="M355 57V37M300 120H278M310 75L292 57M403 75L420 57M412 120H435"/></g><g stroke="#f4d673" stroke-width="5" marker-end="url(#photo-arrow)"><path d="M400 150L480 165M395 175L475 365"/></g>';
                    art+=text(370,465,`${(4*p).toFixed(1)} / 4 simulated hours in good light`,21)+text(400,493,'Only exposed areas receive light.',18);
                }
            }
        } else if([4,7,8].includes(stage)) {
            art+='<path d="M120 100H780L835 435H65Z" fill="#f3f3e9" stroke="#b1c3c9" stroke-width="4"/>';
            art+=leaf(450,258,.94,stage===4?'#4dba70':'#ede6b4',false,stage===8?p:0,true);
            art+=text(44,60,stage===4?'Remove the cover; remember its position':stage===7?'Rinse, soften and spread on the tile':'Iodine test for starch',25);
            const ink='#17334d';
            art+=text(645,165,stage===8&&done?'Blue-black':'Exposed area',20,ink)+text(645,278,stage===8&&done?'Yellow-brown':'Covered strip',20,ink)+text(645,380,stage===8&&done?'Blue-black':'Exposed area',20,ink);
            art+='<g stroke="#436078" stroke-width="2"><path d="M520 156H627M548 264H627M515 365H627"/></g>';
            if(stage===8)art+=`<g transform="translate(460 28) rotate(24)"><rect x="-12" y="0" width="24" height="60" rx="5" fill="#cfd7e3"/><path d="M-6 60L0 82L6 60" fill="#d1e8ed"/><ellipse cx="0" cy="${90+p*40}" rx="7" ry="11" fill="#b57a32" opacity="${done?0:1}"/></g>`;
            if(stage===4)art+='<path d="M190 150L350 245L192 178" fill="none" stroke="#65788e" stroke-width="8"/><rect x="125" y="295" width="130" height="52" rx="5" fill="#101525" stroke="#8492a6" stroke-width="3"/>'+text(117,380,'Paper removed',18,'#17334d');
            if(stage===7)art+='<path d="M135 220V325Q195 355 255 325V220" fill="#79bfe1" fill-opacity=".5" stroke="#436078" stroke-width="3"/><path d="M140 250H250" stroke="#436078" stroke-width="3"/>'+text(118,385,'Warm rinse water',17,'#17334d');
            if(stage===7)art+=text(90,485,'Warm water softens the leaf after ethanol treatment.',21);
            if(stage===8)art+=text(90,485,done?'Light exposed → starch present | Covered → no starch detected':'Watch the exposed and covered areas as iodine spreads.',20);
        } else {
            const ethanol=stage===6;
            art+=text(65,62,ethanol?'Remove chlorophyll — indirect heating':'Prepare the leaf in hot water',26);
            if(ethanol){art+='<rect x="180" y="415" width="520" height="62" rx="12" fill="#354a64" stroke="#738ca5" stroke-width="3"/><circle cx="642" cy="446" r="9" fill="#a9e75e"/>';art+=text(225,454,'ELECTRIC HOT-WATER BATH',22);}
            art+='<path d="M225 115V410H655V115" fill="#92cbf0" fill-opacity=".1" stroke="#bdd9e8" stroke-width="5"/><path d="M228 230H652V405H228Z" fill="#79bfe1" fill-opacity=".35"/>';
            if(ethanol) {
                art+='<path d="M350 100V350Q350 395 400 395Q450 395 450 350V100" fill="#e6f6ed" fill-opacity=".15" stroke="#d8eef0" stroke-width="5"/>';
                art+=`<path d="M355 210H445V350Q445 388 400 388Q355 388 355 350Z" fill="#5eb676" fill-opacity="${.1+.65*p}"/>`;
                art+=leaf(400,298,.38,p<.4?'#4dba70':p<.8?'#a4c48a':'#ede6b4');
                art+=text(695,170,'Boiling tube',18)+text(695,235,'Ethanol',18)+text(695,270,'turns green',18);
                art+='<path d="M450 150H675M450 225H675" stroke="#adc8db" stroke-width="2"/>';
                art+=text(80,500,'No naked flame. Chlorophyll dissolves into ethanol.',21);
            } else {art+=leaf(440,300,.52);art+=text(695,245,'Hot water',21);art+=text(140,500,'Hot water kills the tissue and stops chemical reactions.',21);}
            art+='<g fill="none" stroke="#d3ebef" stroke-width="3" opacity=".6"><path d="M270 190q-15 -20 0 -40t0 -40M530 190q-15 -20 0 -40t0 -40M600 190q-15 -20 0 -40t0 -40"/></g>';
        }
        return `<title id="photo-scene-title">Photosynthesis: stage ${stage} of 8</title><desc id="photo-scene-desc">${root.PhotosynthesisModel.steps[stage-1]?.observation || 'A green potted plant and an enlarged leaf are ready for investigation.'}</desc><defs><clipPath id="photo-leaf-clip"><path d="${leafPath}"/></clipPath><marker id="photo-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f4d673"/></marker></defs><rect width="900" height="510" fill="#11243a"/>${art}`;
    }
    root.PhotosynthesisVisuals={scene};
})(window);
