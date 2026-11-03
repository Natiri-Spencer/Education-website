/* Original SVG illustrations of common school-laboratory circuit apparatus. */
((global)=>{
    const txt=(x,y,s,size=10,fill='#20313b',extra='')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
    function defs(p){return `<defs>
        <linearGradient id="${p}-metal"><stop stop-color="#788a94"/><stop offset=".25" stop-color="#ecf2f3"/><stop offset=".5" stop-color="#9baab2"/><stop offset=".75" stop-color="#f2f6f6"/><stop offset="1" stop-color="#687b85"/></linearGradient>
        <linearGradient id="${p}-gold"><stop stop-color="#996a31"/><stop offset=".35" stop-color="#f6d78e"/><stop offset=".6" stop-color="#d7a34b"/><stop offset="1" stop-color="#8b5e26"/></linearGradient>
        <linearGradient id="${p}-case" x2="0" y2="1"><stop stop-color="#40525c"/><stop offset=".35" stop-color="#1c2b33"/><stop offset="1" stop-color="#0a151c"/></linearGradient>
        <linearGradient id="${p}-glass"><stop stop-color="#c2e6ec" stop-opacity=".18"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".65"/><stop offset=".55" stop-color="#d9f2f6" stop-opacity=".15"/><stop offset="1" stop-color="#89b8c4" stop-opacity=".35"/></linearGradient>
        <linearGradient id="${p}-wood" x2="1" y2=".4"><stop stop-color="#b38c60"/><stop offset=".45" stop-color="#dec19a"/><stop offset="1" stop-color="#a77a4c"/></linearGradient>
        <radialGradient id="${p}-glow"><stop stop-color="#fff6b2" stop-opacity=".9"/><stop offset="1" stop-color="#ffc34d" stop-opacity="0"/></radialGradient>
        <filter id="${p}-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="1" dy="5" stdDeviation="3" flood-color="#142a35" flood-opacity=".3"/></filter>
    </defs>`;}
    const screw=(x,y)=>`<circle cx="${x}" cy="${y}" r="3" fill="#9eacb2" stroke="#586871"/><path d="M${x-2} ${y}h4" stroke="#41505b"/>`;
    function post(x,y,red){return `<ellipse cx="${x}" cy="${y+3}" rx="9" ry="6" fill="#31414a"/><rect x="${x-6}" y="${y-5}" width="12" height="10" rx="2" fill="${red?'#b83e37':'#25343e'}" stroke="${red?'#e28e7c':'#607580'}"/><circle cx="${x}" cy="${y}" r="6" fill="${red?'#e26655':'#435661'}"/><circle cx="${x}" cy="${y}" r="2" fill="#d8e0dd"/>`;}
    function cell(p){return `<g filter="url(#${p}-shadow)"><rect x="-73" y="-31" width="146" height="79" rx="8" fill="url(#${p}-case)" stroke="#5e737f"/><path d="M-65-23h130M-65 40h130" stroke="#5b707a"/>${screw(-65,-21)}${screw(65,-21)}
        <rect x="-41" y="-25" width="84" height="47" rx="8" fill="url(#${p}-gold)" stroke="#8a6a39"/><ellipse cx="-40" cy="-1" rx="6" ry="23" fill="url(#${p}-metal)"/><rect x="-49" y="-8" width="9" height="14" rx="2" fill="url(#${p}-metal)"/>
        <path d="M-14-24h34v45h-34z" fill="#31545c"/>${txt(3,-3,'1.5 V',10,'#eff5f1')}${txt(3,9,'DRY CELL',5.5,'#e4ece9')}${txt(-29,1,'+',11)}${txt(34,1,'−',12)}
        <path d="M45-12l6 3-6 4 6 4-6 4 6 4-6 4" stroke="#cbd6d7" stroke-width="2" fill="none"/>
        ${post(-58,30,true)}${post(58,30,false)}</g>`;}
    function bulb(p,power){const r=Math.max(0,Math.min(1,power||0));return `<g>${r?`<ellipse cx="0" cy="-10" rx="65" ry="65" fill="url(#${p}-glow)" opacity="${Math.sqrt(r)}"/>`:''}<g filter="url(#${p}-shadow)"><rect x="-55" y="17" width="110" height="42" rx="9" fill="url(#${p}-case)" stroke="#5c737d"/><ellipse cy="21" rx="27" ry="12" fill="#182b33" stroke="#677c86"/><rect x="-16" y="-1" width="32" height="27" rx="4" fill="url(#${p}-gold)"/>
        <path d="M-15 1h30m-30 5h30m-29 5h28m-27 5h26" stroke="#8a713d" stroke-width="2"/><path d="M-14-1C-16-13-28-18-26-35C-24-64 24-64 26-35C28-18 16-13 14-1Z" fill="url(#${p}-glass)" stroke="#6c939f" stroke-width="1.5"/>
        <path d="M-10-3v-24l6 5 8-5 6 5v19" stroke="${r?'#fff1ac':'#756d5c'}" stroke-width="${r?2.4:1.2}" fill="none"/><path d="M-17-41q-8 12-3 20" stroke="#ffffff" stroke-width="3" opacity=".8" fill="none"/>
        ${post(-44,38,false)}${post(44,38,false)}${screw(-39,22)}${screw(39,22)}</g></g>`;}

    function modularSwitch(p,closed){return `<g filter="url(#${p}-shadow)"><rect x="-71" y="-27" width="142" height="76" rx="8" fill="#3b6f8b" stroke="#163c53" stroke-width="2"/><rect x="-65" y="-22" width="130" height="65" rx="6" fill="#d0dde3" stroke="#6e95a8"/>
        ${screw(-58,-15)}${screw(58,-15)}${txt(-29,-7,'OFF',7)}${txt(29,-7,'ON',7)}<ellipse cy="6" rx="15" ry="11" fill="url(#${p}-metal)" stroke="#607780"/><circle cy="4" r="8" fill="#667a85"/>
        <g transform="rotate(${closed?28:-28} 0 4)"><rect x="-4" y="-17" width="8" height="24" rx="3" fill="url(#${p}-metal)"/><rect x="-7" y="-24" width="14" height="18" rx="5" fill="#1d303c" stroke="#5a7280"/></g>
        ${post(-52,30,true)}${post(52,30,false)}${txt(0,37,'SPST SWITCH',7,'#294b5b')}</g>`;}
    function meter(p,type,value){const valid=value!==null&&Number.isFinite(value),reading=valid?value.toFixed(2):'— —';
        return `<g filter="url(#${p}-shadow)"><rect x="-70" y="-62" width="140" height="122" rx="10" fill="#306078" stroke="#173c52" stroke-width="2"/><rect x="-65" y="-57" width="130" height="110" rx="8" fill="#43819b" stroke="#8fb3c2"/>
        <rect x="-60" y="-50" width="120" height="65" rx="6" fill="#1c303a" stroke="#8bacb7" stroke-width="2"/><rect x="-54" y="-44" width="108" height="53" rx="3" fill="#c3d7c1"/><path d="M-51-41H51" stroke="#e4efdd" opacity=".7"/>
        ${txt(-37,-31,'DC',7,'#46604f')}<text x="32" y="-9" text-anchor="end" font-family="Consolas,monospace" font-size="25" font-weight="bold" fill="#1f3a30">${reading}</text>${txt(43,-10,type,12,'#2a4b3c')}
        ${txt(0,27,type==='A'?'DIGITAL AMMETER':'DIGITAL VOLTMETER',7,'#edf7fa')}${post(-44,44,true)}${post(44,44,false)}${txt(-44,30,'+',8,'#fff')}${txt(44,30,'−',9,'#fff')}${screw(0,44)}
        </g>`;
    }
    function leads(p){return `<g filter="url(#${p}-shadow)"><path d="M-47 24C-60-27 42-47 48-2S-28 49-38 3S32-30 43 24" fill="none" stroke="#d45745" stroke-width="5"/><path d="M-41 30C-13 59 59 10 29-25S-51-26-20 26" fill="none" stroke="#334b5b" stroke-width="5"/><rect x="-54" y="17" width="25" height="11" rx="3" fill="#aa382e"/><path d="M-61 19h9v6h-9" fill="#becdd0"/><rect x="23" y="20" width="25" height="11" rx="3" fill="#253b4c"/><path d="M47 22h11v6H47" fill="#becdd0"/></g>`;}
    function render(type,p,options={}){return type==='cell'?cell(p):type==='bulb'?bulb(p,options.power):type==='switch'?modularSwitch(p,options.closed):type==='wires'?leads(p):meter(p,type==='ammeter'?'A':'V',options.value??null);}
    const api={defs,render};if(typeof module!=='undefined'&&module.exports)module.exports=api;else global.Grade7ElectricalApparatus=api;
})(typeof window!=='undefined'?window:globalThis);
