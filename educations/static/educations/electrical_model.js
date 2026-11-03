/* School circuit model: connectivity is independent of apparatus position or order. */
((global) => {
    function layout(settings) {
        const method=settings.method, bulbMode=method==='bulbs'?settings.bulbs:'single';
        const cellMode=method==='cells'?settings.cells:'series';
        const cellCount=cellMode==='single'?1:2, bulbCount=method==='bulbs'?2:1;
        const branch=bulbMode==='parallel' && ['b1','b2'].includes(settings.current)?settings.current:null;
        const parts={}, ports={};
        function part(id,x,y,name,type) {parts[id]={id,x,y,name,type};}
        function port(id,x,y,owner) {ports[id]={id,x,y,owner};}
        const positions=cellCount===1?[[120,300]]:cellMode==='parallel'?[[100,320],[240,320]]:[[120,215],[120,390]];
        positions.forEach(([x,y],index)=>{const id='c'+(index+1);part(id,x,y,'Dry cell '+(index+1)+' · 1.5 V','cell');port(id+'+',x,y-50,id);port(id+'-',x,y+50,id);});
        part('switch',250,100,'Switch','switch');port('s1',210,100,'switch');port('s2',290,100,'switch');
        const lamps=bulbMode==='parallel'?[[530,260],[690,260]]:bulbCount===2?[[620,240],[620,370]]:[[620,280]];
        lamps.forEach(([x,y],i)=>{const id='b'+(i+1);part(id,x,y,'Bulb '+(i+1),'bulb');port(id+'+',x,y-40,id);port(id+'-',x,y+40,id);});
        const ampPosition=branch?[branch==='b1'?530:690,160]:[430,100];
        part('ammeter',...ampPosition,'Ammeter','ammeter');port('a+',ampPosition[0]-40,ampPosition[1],'ammeter');port('a-',ampPosition[0]+40,ampPosition[1],'ammeter');
        part('voltmeter',400,420,'Voltmeter','voltmeter');port('v+',360,420,'voltmeter');port('v-',440,420,'voltmeter');
        const positive=cellMode==='parallel'?['c2+','c1+']:['c1+'];
        const negative=cellMode==='parallel'?['c1-','c2-']:[cellCount===2?'c2-':'c1-'];
        const groups=[positive.concat('s1')];
        if(cellCount===2 && cellMode==='series')groups.push(['c2+','c1-']);
        if(branch) {const other=branch==='b1'?'b2':'b1';groups.push(['s2','a+',other+'+'],['a-',branch+'+']);}
        else {groups.push(['s2','a+'],['a-','b1+',...(bulbMode==='parallel'?['b2+']:[])]);}
        if(bulbMode==='series')groups.push(['b1-','b2+']);
        const returns=bulbMode==='parallel'?['b2-','b1-']:['b'+bulbCount+'-'];groups.push(returns.concat(negative));
        const pairs=groups.flatMap(group=>group.slice(1).map(id=>[group[0],id]));
        const source=[positive[positive.length-1],negative[0]];
        const voltageTarget=settings.voltage==='b1'?['b1+','b1-']:settings.voltage==='b2'&&bulbCount===2?['b2+','b2-']:source;
        const offsets={cell:[[-58,30],[58,30]],bulb:[[-44,38],[44,38]],switch:[[-52,30],[52,30]],ammeter:[[-44,44],[44,44]],voltmeter:[[-44,44],[44,44]]};
        Object.values(parts).forEach(p=>{
            const saved=settings.positions?.[p.id];if(saved){p.x=saved.x;p.y=saved.y;}
            p.rotation=settings.rotations?.[p.id]||0;
            const meter=p.type==='ammeter'||p.type==='voltmeter';
            p.width=p.type==='cell'?146:p.type==='switch'?142:meter?140:110;
            p.height=meter?120:p.type==='bulb'?116:90;
            const radians=p.rotation*Math.PI/180,cs=Math.cos(radians),sn=Math.sin(radians);
            Object.values(ports).filter(v=>v.owner===p.id).forEach((v,i)=>{const [dx,dy]=offsets[p.type][i];v.x=p.x+dx*cs-dy*sn;v.y=p.y+dx*sn+dy*cs;});
        });
        return {parts,ports,groups,pairs,source,voltageTarget,cellMode,cellCount,bulbMode,bulbCount,branch,sourceV:cellMode==='series'?3:1.5};
    }
    function analyze(settings) {
        const board=layout(settings),parent={};Object.keys(board.ports).forEach(id=>parent[id]=id);
        const find=id=>{if(parent[id]!==id)parent[id]=find(parent[id]);return parent[id];};
        const active=id=>board.ports[id] && settings.placed.includes(board.ports[id].owner);
        const wires=settings.wires.filter(([a,b])=>active(a)&&active(b));
        wires.forEach(([a,b])=>parent[find(a)]=find(b));
        const joined=(a,b)=>!!board.ports[a]&&!!board.ports[b]&&find(a)===find(b);
        const cellsPlaced=Array.from({length:board.cellCount},(_,i)=>'c'+(i+1)).every(id=>settings.placed.includes(id));
        const reversePack=board.cellCount===2&&board.cellMode==='series'&&joined('c2-','c1+');
        let source=board.cellCount===1?['c1+','c1-']:board.cellMode==='parallel'?['c1+','c1-']:reversePack?['c2+','c1-']:['c1+','c2-'];
        const cellShort=Array.from({length:board.cellCount},(_,i)=>'c'+(i+1)).some(id=>joined(id+'+',id+'-'));
        const packConflict=cellShort||board.cellCount===2&&(board.cellMode==='parallel'?(joined('c1+','c2-')||joined('c1-','c2+')):(joined('c1+','c2+')||joined('c1-','c2-')));
        const packReady=cellsPlaced&&!packConflict&&(board.cellCount===1||(board.cellMode==='parallel'?(joined('c1+','c2+')&&joined('c1-','c2-')):(joined('c1-','c2+')||reversePack)));
        board.source=source;if(settings.voltage==='source')board.voltageTarget=source;
        const edgePorts={switch:['s1','s2'],ammeter:['a+','a-'],b1:['b1+','b1-'],b2:['b2+','b2-']};
        const edges=Object.keys(edgePorts).filter(id=>board.parts[id]&&settings.placed.includes(id)).map(id=>({id,a:find(edgePorts[id][0]),b:find(edgePorts[id][1])}));
        const adjacency={};edges.forEach(e=>{(adjacency[e.a]??=[]).push({edge:e,to:e.b});(adjacency[e.b]??=[]).push({edge:e,to:e.a});});
        const start=find(source[0]),finish=find(source[1]),paths=[];
        function walk(node,seen,path){if(paths.length>20)return;if(node===finish){paths.push(path);return;}for(const {edge,to}of adjacency[node]||[]){if(!seen.has(to))walk(to,new Set([...seen,to]),path.concat({id:edge.id,from:node,to}));}}
        if(start!==finish)walk(start,new Set([start]),[]);
        const powerItems=Object.keys(board.parts).filter(id=>id!=='voltmeter');
        const powerPlaced=powerItems.every(id=>settings.placed.includes(id));
        const loadCount=path=>path.filter(e=>e.id.startsWith('b')).length;
        const allEdgesUsed=edges.every(edge=>paths.some(p=>p.some(e=>e.id===edge.id)));
        let topology=paths.length===1&&loadCount(paths[0])===board.bulbCount&&paths[0].some(e=>e.id==='switch')&&paths[0].some(e=>e.id==='ammeter');
        if(board.bulbMode==='parallel'){
            topology=paths.length===2&&paths.every(p=>loadCount(p)===1&&p.some(e=>e.id==='switch'))&&
                ['b1','b2'].every(id=>paths.some(p=>p.some(e=>e.id===id)))&&
                (board.branch?paths.every(p=>p.some(e=>e.id==='ammeter')===p.some(e=>e.id===board.branch)):paths.every(p=>p.some(e=>e.id==='ammeter')));
        }
        const internal=board.cellCount===2&&board.cellMode==='series'?find(reversePack?'c2-':'c1-'):null;
        const packTap=internal!==null&&edges.some(e=>e.a===internal||e.b===internal);
        const bypass=packTap||edges.some(e=>e.a===e.b)||paths.some(p=>loadCount(p)===0);
        const fault=packConflict||joined(...source)||bypass;
        const ready=packReady&&powerPlaced&&topology&&allEdgesUsed&&!fault;
        const on=ready&&settings.closed;
        const resistance=board.bulbMode==='series'?20:board.bulbMode==='parallel'?5:10;
        const totalCurrent=on?board.sourceV/resistance:0,bulbCurrent=board.bulbMode==='parallel'?totalCurrent/2:totalCurrent;
        const bulbVoltage=on?(board.bulbMode==='series'?board.sourceV/2:board.sourceV):0;
        const power=bulbVoltage*bulbVoltage/10,brightness=power===0?'off':power/.9>.5?'bright':'dim';
        const potential={};
        const put=(id,value)=>potential[find(id)]=value;
        if(packReady&&!fault){put(source[0],board.sourceV);put(source[1],0);if(board.cellCount===2&&board.cellMode==='series')put(reversePack?'c2-':'c1-',1.5);}
        if(ready&&on){paths.forEach(path=>{let volts=board.sourceV;potential[start]=volts;path.forEach(edge=>{if(edge.id.startsWith('b'))volts-=bulbVoltage;potential[edge.to]=volts;});});}
        else if(ready){
            // With the switch open, each disconnected side is at its source-terminal potential.
            function spread(node,value,seen=new Set()){if(seen.has(node))return;seen.add(node);potential[node]=value;for(const {edge,to}of adjacency[node]||[])if(edge.id!=='switch')spread(to,value,seen);}
            spread(start,board.sourceV);spread(finish,0);
        }
        function voltageAt(id){return potential[find(id)]??null;}
        const vp=active('v+')?voltageAt('v+'):null,vn=active('v-')?voltageAt('v-'):null;
        const volts=vp===null||vn===null||fault?null:vp-vn;
        const target=board.voltageTarget;
        const voltageConnected=active('v+')&&active('v-')&&((joined('v+',target[0])&&joined('v-',target[1]))||(joined('v+',target[1])&&joined('v-',target[0])));
        const ampPath=paths.find(path=>path.some(e=>e.id==='ammeter')),ampEdge=ampPath?.find(e=>e.id==='ammeter');
        const ammeterReversed=!!ampEdge&&ampEdge.from!==find('a+');
        const current=ready?(board.branch?bulbCurrent:totalCurrent)*(ammeterReversed?-1:1):null;
        const missing=Object.keys(board.ports).filter(id=>active(id)&&!id.startsWith('v')&&!wires.some(pair=>pair.includes(id)));
        const groupIndex={};Object.keys(board.ports).forEach(id=>groupIndex[id]=find(id));
        return {board,ready,on,fault,missing,totalCurrent,bulbCurrent,bulbVoltage,current,volts,voltageConnected,power,brightness,relativePower:power/.9,joined,groupIndex,ammeterReversed,packReady,topology};
    }
    function inspect(settings){
        const model=analyze({...settings,closed:true}),issues=[],parts=Object.values(model.board.parts),missing=parts.filter(p=>!settings.placed.includes(p.id));
        if(missing.length)issues.push('Collect the remaining apparatus: '+missing.map(p=>p.name).join(', ')+'.');
        if(!settings.placed.includes('wires'))issues.push('Bring the connecting wires from the shelf.');
        const placed=parts.filter(p=>settings.placed.includes(p.id));
        const bounds=p=>{const sideways=p.rotation%180!==0;return {w:sideways?p.height:p.width,h:sideways?p.width:p.height};};
        const overlaps=[];for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){const a=placed[i],b=placed[j],aa=bounds(a),bb=bounds(b);if(Math.abs(a.x-b.x)<(aa.w+bb.w)/2+8&&Math.abs(a.y-b.y)<(aa.h+bb.h)/2+8)overlaps.push(a.name+' and '+b.name);}
        if(overlaps.length)issues.push('Leave space between apparatus: separate '+overlaps.join('; ')+'.');
        if(!missing.length){
            if(!model.packReady)issues.push('Check the dry-cell connections and polarities for your chosen arrangement.');
            if(model.fault)issues.push('A wire bypasses an apparatus or short-circuits a cell. Trace each route and remove the bypass.');
            else if(!model.ready)issues.push('The power circuit is open or does not match your chosen arrangement. Trace the bulb route(s), switch and ammeter.');
            if(model.ready&&model.ammeterReversed)issues.push('Reverse the ammeter leads: current should enter its red (+) terminal.');
            if(!model.voltageConnected)issues.push('Connect the voltmeter across the selected source or bulb, not in the power path.');
            else if(model.volts<0)issues.push('Reverse the voltmeter leads: connect red (+) towards the higher-potential side.');
        }
        return {passed:issues.length===0,issues,model};
    }
    function grade(model,answers) {
        const near=(value,expected)=>Number.isFinite(value)&&Math.abs(value-expected)<=.0051;
        const current=near(Number(answers.current),model.current),voltage=near(Number(answers.voltage),model.volts),brightness=answers.brightness===model.brightness;
        const score=Number(current)+Number(voltage)+Number(brightness);
        const corrections=[];if(!current)corrections.push('Current: '+model.current.toFixed(2)+' A.');if(!voltage)corrections.push('Voltage: '+model.volts.toFixed(2)+' V.');if(!brightness)corrections.push('Brightness: '+model.brightness+'.');
        return score+'/3. '+(corrections.length?corrections.join(' '):'Correct.');
    }
    const api={layout,analyze,inspect,grade};if(typeof module!=='undefined'&&module.exports)module.exports=api;else global.Grade7Electrical=api;
})(typeof window!=='undefined'?window:globalThis);
