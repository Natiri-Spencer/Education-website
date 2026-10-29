const {test}=require('node:test');
const assert=require('node:assert/strict');
const U=require('../static/educations/whiteboard_uploads.js');
const M=require('../static/educations/whiteboard_model.js');

test('documents restore metadata without embedding their content in browser board storage',()=>{
    for(const [ext,mime] of Object.entries(U.formats)){
        const board=M.newBoard();board.items=[M.create('file',20,30,{attachmentId:'file-123',fileName:'Lesson.'+ext,fileSize:123,src:'javascript:bad',fileData:'untrusted'})];
        const restored=M.restore(board).items[0];
        assert.equal(restored.fileType,mime);assert.equal(restored.fileName,'Lesson.'+ext);
        assert.equal(restored.attachmentId,'file-123');assert.equal(restored.src,undefined);assert.equal(restored.fileData,undefined);
        assert.deepEqual(M.bounds(M.move(restored,10,20)),{x:30,y:50,w:340,h:130});
    }
});

test('documents reject unsupported types, oversized files and invalid storage keys',()=>{
    const valid={attachmentId:'file-123',fileName:'lesson.pdf',fileSize:100};
    for(const fileName of ['script.html','program.exe','macro.docm','archive.zip'])assert.throws(()=>U.metadata({...valid,fileName}),/Choose a PDF/);
    for(const fileSize of [0,-1,1.5,U.MAX_FILE+1,Infinity])assert.throws(()=>U.metadata({...valid,fileSize}),/10 MB/);
    assert.throws(()=>U.metadata({...valid,attachmentId:'https://remote.example/file'}),/Invalid/);
    assert.equal(U.metadata({...valid,fileName:'C:\\private\\Lesson.PDF'}).fileName,'Lesson.PDF');
});

test('missing portable attachments fail before importing any document',async()=>{
    const board=M.newBoard();board.items=[M.create('file',0,0,{attachmentId:'f1',fileName:'lesson.txt',fileSize:3})];
    await assert.rejects(()=>U.unpack(board,undefined,()=> 'new-id'),/missing/);
    await assert.rejects(()=>U.unpack(board,[{attachmentId:'f1',fileName:'lesson.txt',fileSize:3,data:'data:text/html;base64,YWJj'}],()=> 'new-id'),/Invalid document data/);
    await assert.rejects(()=>U.unpack(board,[{attachmentId:'f1',fileName:'lesson.txt',fileSize:4,data:'data:text/plain;base64,YWJj'}],()=> 'new-id'),/size does not match/);
});
