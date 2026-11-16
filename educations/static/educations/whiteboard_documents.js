(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardDocuments=factory(new URL('vendor/',document.currentScript.src).href,document.getElementById('whiteboard-app')?.dataset.pdfWorkerUrl);}(typeof globalThis!=='undefined'?globalThis:this,function(vendor,workerSource){
    'use strict';
    const supported=new Set(['pdf','docx','xlsx','pptx','txt','csv']),documents=new Map(),pages=new Map();
    const extension=name=>String(name).split('.').pop().toLowerCase();
    const canOpen=name=>supported.has(extension(name));
    function pageNumber(value,count){return Math.max(1,Math.min(count,Number.isFinite(Number(value))?Math.trunc(Number(value)):1));}
    function activePage(items,preferredId,point){
        const papers=items.filter(i=>i.type==='document-page');if(!papers.length)return null;
        let best=papers.find(i=>i.id===preferredId)||papers[papers.length-1];
        if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return best;
        const distance=p=>Math.hypot(Math.max(p.x-point.x,point.x-p.x-p.w,0),Math.max(p.y-point.y,point.y-p.y-p.h,0));
        for(const paper of papers)if(distance(paper)<distance(best))best=paper;return best;
    }
    function adjacentPages(number,count){return [number+1,number-1].filter(n=>n>=1&&n<=count);}
    function pageMetadata(raw){
        if(!Number.isInteger(raw.pageNumber)||!Number.isInteger(raw.pageCount)||raw.pageNumber<1||raw.pageCount<raw.pageNumber||raw.pageCount>500)throw Error('Invalid document page number.');
        if(!Number.isFinite(raw.w)||!Number.isFinite(raw.h)||raw.w<80||raw.h<80||raw.w>5000||raw.h>8000)throw Error('Invalid document page size.');
        return{pageNumber:raw.pageNumber,pageCount:raw.pageCount,locked:true};
    }
    function textPages(value){
        const text=String(value).replace(/\r\n?/g,'\n').replace(/\u0000/g,'').replace(/\t/g,'    ');
        if(text.length>200000)throw Error('This text document is too long. Open a shorter section or a PDF copy.');
        const lines=[];
        for(const raw of text.split('\n')){
            let line=raw;
            while(line.length>74){let n=line.lastIndexOf(' ',74);if(n<26)n=74;lines.push(line.slice(0,n));line=line.slice(n).replace(/^ /,'');}
            lines.push(line);
        }
        const result=[];for(let i=0;i<lines.length;i+=48)result.push(lines.slice(i,i+48));
        return result.length?result:[['']];
    }
    function placement(items,width,height,point){
        const papers=items.filter(i=>i.type==='document-page');
        const bottom=i=>i.type==='path'?Math.max(...i.points.map(p=>p[1])):Math.max(i.y,i.y+i.h);
        return papers.length?{x:papers[0].x,y:Math.max(...items.map(bottom))+100,w:width,h:height}:{x:point.x-width/2,y:items.length?Math.max(point.y-100,...items.map(i=>bottom(i)+100)):point.y-100,w:width,h:height};
    }
    let pdfModule;
    async function pdfLibrary(){
        if(!pdfModule)pdfModule=import(vendor+'pdfjs/pdf.mjs').then(lib=>{lib.GlobalWorkerOptions.workerSrc=workerSource||vendor+'pdfjs/pdf.worker.mjs';return lib;}).catch(error=>{pdfModule=null;throw error;});
        return pdfModule;
    }
    function parseXml(text){
        if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('This document contains unsupported XML entities.');
        const xml=new DOMParser().parseFromString(text,'application/xml');
        if(xml.getElementsByTagName('parsererror').length)throw Error('The document XML is damaged.');return xml;
    }
    const elements=(xml,name)=>Array.from(xml.getElementsByTagNameNS('*',name));
    const words=xml=>elements(xml,'t').map(t=>t.textContent).join('');
    async function officeText(blob,ext){
        if(!globalThis.fflate)throw Error('Document reader is unavailable. Reload the whiteboard.');
        let expanded=0,count=0;
        const entries=await new Promise((resolve,reject)=>fflate.unzip(new Uint8Array(blob),{filter:f=>{if(f.originalSize>5000000||!(/^(word\/document\.xml|xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml|ppt\/slides\/slide\d+\.xml)$/.test(f.name)))return false;expanded+=f.originalSize;count++;return expanded<=12000000&&count<=101;}},(err,result)=>err?reject(Error('This Office document is damaged.')):resolve(result)));
        const xml=name=>{if(!entries[name])throw Error('The document content is missing or too large.');return parseXml(new TextDecoder().decode(entries[name]));};
        if(ext==='docx')return textPages(elements(xml('word/document.xml'),'p').map(p=>words(p)).join('\n'));
        const paths=Object.keys(entries).filter(p=>ext==='pptx'?/^ppt\/slides\//.test(p):/^xl\/worksheets\//.test(p)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).slice(0,100);
        if(!paths.length)throw Error('No readable pages were found. Export this document as PDF.');
        if(ext==='pptx')return paths.flatMap((p,i)=>textPages(`Slide ${i+1}\n\n`+elements(xml(p),'p').map(words).join('\n')));
        const shared=entries['xl/sharedStrings.xml']?elements(xml('xl/sharedStrings.xml'),'si').map(words):[];
        return paths.flatMap((p,i)=>textPages(`Worksheet ${i+1}\n\n`+elements(xml(p),'row').map(row=>elements(row,'c').map(c=>{
            const v=elements(c,'v')[0]?.textContent||'';return c.getAttribute('t')==='s'?(shared[Number(v)]||''):c.getAttribute('t')==='inlineStr'?words(c):v;
        }).join('    |    ')).join('\n')));
    }
    async function open(meta,getBlob){
        if(!canOpen(meta.fileName))throw Error('For this older Office format, save a PDF copy and open it here to write answers. Your original file is still available to download.');
        const key=meta.attachmentId;
        if(!documents.has(key))documents.set(key,(async()=>{
            const blob=await getBlob(key);if(blob.size!==meta.fileSize)throw Error('The original document is damaged. Upload it again.');
            const ext=extension(meta.fileName);
            if(ext==='pdf'){
                const lib=await pdfLibrary();let locked=false;
                const task=lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),cMapUrl:vendor+'pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:vendor+'pdfjs/standard_fonts/',wasmUrl:vendor+'pdfjs/wasm/',useWorkerFetch:false,isEvalSupported:false,enableXfa:false,maxImageSize:16000000});
                task.onPassword=()=>{locked=true;task.destroy();};
                let pdf;try{pdf=await task.promise;}catch(error){throw Error(locked?'This PDF needs a password. Save an unlocked PDF copy to write on it.':'This PDF could not be opened. Try a new PDF copy.');}
                if(pdf.numPages>500){await pdf.destroy();throw Error('Open a PDF with at most 500 pages.');}
                return{pdf,numPages:pdf.numPages,note:'Original PDF layout. Add a page to write answers over or beside the questions.'};
            }
            const sheets=['txt','csv'].includes(ext)?textPages(await blob.text()):await officeText(await blob.arrayBuffer(),ext);
            if(sheets.length>500)throw Error('Open a shorter document with at most 500 text pages.');
            return{sheets,numPages:sheets.length,note:ext==='txt'||ext==='csv'?'Text pages. Add a page to write your answers.':'Text view. To keep original formatting, pictures and diagrams, open a PDF copy.'};
        })().catch(error=>{documents.delete(key);throw error;}));
        while(documents.size>2){
            const oldest=documents.keys().next().value,pending=documents.get(oldest);documents.delete(oldest);
            renderQueue.catch(()=>{}).then(()=>pending).then(doc=>doc.pdf?.destroy()).catch(()=>{});
        }
        return documents.get(key);
    }
    let renderQueue = Promise.resolve();
    async function page(meta,number,getBlob,thumbnail=false,isCurrent=()=>true){
        const key=meta.attachmentId+':'+number+(thumbnail?':thumb':'');
        if(!pages.has(key)){
            const promise=renderQueue.catch(()=>{}).then(async()=>{
                if(!promise.isCurrent())throw Error('Page request superseded.');
                const doc=await open(meta,getBlob);if(!Number.isInteger(number)||number<1||number>doc.numPages)throw Error('Choose an available page.');
                const canvas=document.createElement('canvas');let width=900,height,text='';
                if(doc.pdf){
                    const pdfPage=await doc.pdf.getPage(number),natural=pdfPage.getViewport({scale:1});
                    const pageScale=Math.min(900/natural.width,6000/natural.height);
                    width=natural.width*pageScale;height=natural.height*pageScale;
                    try{pageMetadata({pageNumber:number,pageCount:doc.numPages,w:width,h:height});}catch(_){throw Error('This page has an unusual size. Export it as an A4 or Letter PDF page to write on it.');}
                    const pixels = thumbnail ? 40000 : 1500000;
                    const scale=Math.min((thumbnail ? 160 : 1600)/natural.width,Math.sqrt(pixels/(natural.width*natural.height)));
                    const view=pdfPage.getViewport({scale});canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
                    await pdfPage.render({canvasContext:canvas.getContext('2d'),viewport:view,background:'#ffffff'}).promise;
                    try{text=(await pdfPage.getTextContent()).items.map(t=>t.str+(t.hasEOL?'\n':' ')).join('').slice(0,20000);}catch(_){/* Scanned PDFs still display. */}
                    pdfPage.cleanup();
                }else{
                    height=1160;const scale=thumbnail?160/900:1.15;canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
                    ctx.fillStyle='#6b577f';ctx.font='18px Segoe UI, Arial, sans-serif';ctx.fillText(meta.fileName.slice(0,80),48,42);
                    ctx.fillStyle='#242032';ctx.font='18px Consolas, monospace';const lines=doc.sheets[number-1];lines.forEach((line,i)=>ctx.fillText(line,48,90+i*21));text=lines.join('\n');
                }
                const src=canvas.toDataURL('image/jpeg',.9);canvas.width=canvas.height=0;
                return{src,w:width,h:height,text,pageCount:doc.numPages,note:doc.note};
            }).catch(error=>{if(pages.get(key)===promise)pages.delete(key);throw error;});promise.isCurrent=isCurrent;pages.set(key,promise);renderQueue=promise;
            const sameKind=[...pages.keys()].filter(k=>k.endsWith(':thumb')===thumbnail);
            while(sameKind.length>(thumbnail?24:3))pages.delete(sameKind.shift());
        }
        const cached=pages.get(key);cached.isCurrent=isCurrent;pages.delete(key);pages.set(key,cached);
        return pages.get(key);
    }
    function release(){for(const pending of documents.values())pending.then(doc=>doc.pdf?.destroy()).catch(()=>{});documents.clear();pages.clear();}
    return{canOpen,pageNumber,activePage,adjacentPages,pageMetadata,textPages,placement,open,page,release};
}));
