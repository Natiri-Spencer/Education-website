/* Qualitative school circuit model. Wiring is checked against the selected topology. */
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
        return {parts,ports,groups,pairs,source,voltageTarget,cellMode,cellCount,bulbMode,bulbCount,branch,sourceV:cellMode==='series'?3:1.5};
    }
    function analyze(settings) {
        const board=layout(settings),parent={};Object.keys(board.ports).forEach(id=>parent[id]=id);
        const find=id=>{if(parent[id]!==id)parent[id]=find(parent[id]);return parent[id];};
        const active=id=>board.ports[id] && settings.placed.includes(board.ports[id].owner);
        const wires=settings.wires.filter(([a,b])=>active(a)&&active(b));
        wires.forEach(([a,b])=>parent[find(a)]=find(b));
        const joined=(a,b)=>find(a)===find(b),groupIndex={};board.groups.forEach((group,index)=>group.forEach(id=>groupIndex[id]=index));
        const actualGroups={};Object.keys(groupIndex).filter(active).forEach(id=>(actualGroups[find(id)]??=new Set()).add(groupIndex[id]));
        const fault=Object.values(actualGroups).some(set=>set.size>1);
        const powerItems=Object.keys(board.parts).filter(id=>id!=='voltmeter');
        const missing=board.pairs.filter(([a,b])=>!active(a)||!active(b)||!joined(a,b));
        const ready=!fault && powerItems.every(id=>settings.placed.includes(id)) && missing.length===0;
        const on=ready && settings.closed;
        const resistance=board.bulbMode==='series'?20:board.bulbMode==='parallel'?5:10;
        const totalCurrent=on?board.sourceV/resistance:0;
        const bulbCurrent=board.bulbMode==='parallel'?totalCurrent/2:totalCurrent;
        const bulbVoltage=on?(board.bulbMode==='series'?board.sourceV/2:board.sourceV):0;
        const power=bulbVoltage*bulbVoltage/10,brightness=power===0?'off':power/.9>.5?'bright':'dim';
        const potential={};
        const packReady=!fault && Array.from({length:board.cellCount},(_,i)=>'c'+(i+1)).every(id=>settings.placed.includes(id)) && (board.cellCount===1 || (board.cellMode==='series'?joined('c1-','c2+'):joined('c1+','c2+')&&joined('c1-','c2-')));
        if(packReady) {
            potential['c1+']=board.sourceV;potential['c1-']=board.cellMode==='series'?1.5:0;
            if(board.cellCount===2){potential['c2+']=1.5;potential['c2-']=0;}
            // One-cell comparison has only one 1.5 V source.
            if(board.cellCount===1)potential['c1-']=0;
        }
        if(ready) {
            potential.s1=board.sourceV;potential.s2=on?board.sourceV:0;
            potential['b1+']=on?board.sourceV:0;potential['b1-']=board.bulbMode==='series'?bulbVoltage:0;
            if(board.bulbCount===2){potential['b2+']=on?bulbVoltage:0;potential['b2-']=0;}
            potential['a+']=potential['a-']=on?board.sourceV:0;
        }
        function voltageAt(id) {const connected=Object.keys(potential).filter(p=>active(p)&&joined(p,id));return connected.length?potential[connected[0]]:null;}
        const vp=active('v+')?voltageAt('v+'):null,vn=active('v-')?voltageAt('v-'):null;
        const volts=vp===null||vn===null||fault?null:vp-vn;
        const target=board.voltageTarget;
        const voltageConnected=active('v+')&&active('v-')&&((joined('v+',target[0])&&joined('v-',target[1]))||(joined('v+',target[1])&&joined('v-',target[0])));
        const current=ready?(board.branch?bulbCurrent:totalCurrent):null;
        return {board,ready,on,fault,missing,totalCurrent,bulbCurrent,bulbVoltage,current,volts,voltageConnected,power,brightness,relativePower:power/.9,joined,groupIndex};
    }
    function grade(model,answers) {
        const near=(value,expected)=>Number.isFinite(value)&&Math.abs(value-expected)<=.0051;
        const current=near(Number(answers.current),model.current),voltage=near(Number(answers.voltage),model.volts),brightness=answers.brightness===model.brightness;
        const score=Number(current)+Number(voltage)+Number(brightness);
        const corrections=[];if(!current)corrections.push('Current: '+model.current.toFixed(2)+' A.');if(!voltage)corrections.push('Voltage: '+model.volts.toFixed(2)+' V.');if(!brightness)corrections.push('Brightness: '+model.brightness+'.');
        return score+'/3. '+(corrections.length?corrections.join(' '):'Correct.');
    }
    const api={layout,analyze,grade};if(typeof module!=='undefined'&&module.exports)module.exports=api;else global.Grade7Electrical=api;
})(typeof window!=='undefined'?window:globalThis);
