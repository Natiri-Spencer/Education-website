(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardUploads=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
    'use strict';
    const MAX_FILE=10*1024*1024, MAX_EXPORT=40*1024*1024;
    const formats={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',txt:'text/plain',csv:'text/csv'};
    function metadata(raw){
        const fileName=String(raw.fileName||'').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g,'');
        const extension=fileName.split('.').pop().toLowerCase();
        if(!formats[extension]||!fileName.includes('.'))throw Error('Choose a PDF, Word, Excel, PowerPoint, TXT or CSV file.');
        if(fileName.length>180)throw Error('Shorten the file name to 180 characters or fewer.');
        if(!Number.isInteger(raw.fileSize)||raw.fileSize<1||raw.fileSize>MAX_FILE)throw Error('Choose a non-empty document up to 10 MB.');
        if(typeof raw.attachmentId!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(raw.attachmentId))throw Error('Invalid document attachment.');
        return{attachmentId:raw.attachmentId,fileName,fileSize:raw.fileSize,fileType:formats[extension]};
    }
    let database;
    function db(){
        if(!globalThis.indexedDB)return Promise.reject(Error('Document storage is unavailable in this browser.'));
        if(!database)database=new Promise((resolve,reject)=>{const request=indexedDB.open('cbe-whiteboard-attachments',1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onsuccess=()=>resolve(request.result);request.onerror=()=>{database=null;reject(Error('Document storage could not be opened.'));};});
        return database;
    }
    async function put(id,blob){
        const connection=await db();
        return new Promise((resolve,reject)=>{const tx=connection.transaction('files','readwrite');tx.objectStore('files').put(blob,id);tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(Error('The document could not be saved. Device storage may be full.'));});
    }
    async function get(id){
        const connection=await db();
        return new Promise((resolve,reject)=>{const r=connection.transaction('files').objectStore('files').get(id);r.onsuccess=()=>r.result?resolve(r.result):reject(Error('This document is missing from this device. Import its editable board backup or upload it again.'));r.onerror=()=>reject(Error('The document could not be read.'));});
    }
    async function checkContent(blob,name){
        const extension=name.split('.').pop().toLowerCase(),bytes=new Uint8Array(await blob.slice(0,8).arrayBuffer());
        if(extension==='pdf'&&String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('This file does not contain a valid PDF header.');
        if(['docx','xlsx','pptx'].includes(extension)&&(bytes[0]!==80||bytes[1]!==75))throw Error('This file does not match its Office document format.');
        if(['doc','xls','ppt'].includes(extension)&&![208,207,17,224,161,177,26,225].every((v,i)=>bytes[i]===v))throw Error('This file does not match its Office document format.');
    }
    async function store(file,id){
        const meta=metadata({fileName:file.name,fileSize:file.size,attachmentId:id});
        await checkContent(file,meta.fileName);await put(id,file.slice(0,file.size,meta.fileType));return meta;
    }
    function dataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not export this document.'));reader.readAsDataURL(blob);});}
    async function pack(board){
        const records=[],seen=new Set();let size=0;
        for(const item of board.items.filter(i=>i.type==='file')){
            const meta=metadata(item);if(seen.has(meta.attachmentId))continue;seen.add(meta.attachmentId);
            size+=meta.fileSize;if(size>MAX_EXPORT)throw Error('Keep document attachments below 40 MB per exported board.');
            const blob=await get(meta.attachmentId);if(blob.size!==meta.fileSize)throw Error('A document attachment is damaged. Upload it again.');
            records.push({...meta,data:await dataUrl(blob)});
        }
        return{...board,attachments:records};
    }
    async function unpack(board,records,uid){
        const files=board.items.filter(i=>i.type==='file');if(!files.length)return board;
        if(!Array.isArray(records)||records.length>100)throw Error('This board is missing its document attachments.');
        const byId=new Map(),prepared=[];let size=0;
        for(const record of records){
            const meta=metadata(record);if(byId.has(meta.attachmentId))throw Error('Duplicate attachment in board file.');
            const prefix=`data:${meta.fileType};base64,`;
            if(typeof record.data!=='string'||!record.data.startsWith(prefix)||record.data.length>MAX_FILE*1.34+200)throw Error('Invalid document data in board file.');
            const encoded=record.data.slice(prefix.length);if(!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Error('Invalid document encoding.');
            let binary;try{binary=atob(encoded);}catch(_){throw Error('Invalid document encoding.');}
            if(binary.length!==meta.fileSize)throw Error('Document size does not match its attachment.');
            size+=binary.length;if(size>MAX_EXPORT)throw Error('Keep document attachments below 40 MB per imported board.');
            const blob=new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))],{type:meta.fileType});await checkContent(blob,meta.fileName);
            const next={...meta,attachmentId:uid()};byId.set(meta.attachmentId,next);prepared.push([next.attachmentId,blob]);
        }
        for(const item of files){const match=byId.get(item.attachmentId);if(!match||match.fileSize!==item.fileSize||match.fileName!==item.fileName)throw Error('A document attachment is missing or does not match its file card.');}
        for(const [id,blob] of prepared)await put(id,blob);
        return{...board,items:board.items.map(item=>item.type==='file'?{...item,...byId.get(item.attachmentId)}:item)};
    }
    return{metadata,store,get,pack,unpack,MAX_FILE,formats};
}));
