(() => {
    'use strict';
    const app = document.getElementById('whiteboard-app');
    if (!app || !window.WhiteboardModel) return;
    const M = window.WhiteboardModel, T = window.WhiteboardTypesetting, G = window.WhiteboardGraph, V = window.WhiteboardVoiceMath;
    const U = window.WhiteboardUploads, S = window.WhiteboardSelection, P = window.WhiteboardPersistence, Gesture = window.WhiteboardGestures, D = window.WhiteboardDialogs, AI = window.WhiteboardAI, $ = id => document.getElementById(id);
    const svg = $('wb-canvas'), world = $('wb-world'), stage = $('wb-stage');
    const paths = {
        cursor: 'M4 3l6 17 3-7 7-3L4 3z', hand: 'M8 12V6a2 2 0 014 0v5-7a2 2 0 014 0v8-6a2 2 0 014 0v9c0 5-3 7-7 7-3 0-5-2-7-4l-3-5a2 2 0 013-2l2 2z',
        pencil: 'M15 4l5 5M4 15L16 3a2 2 0 013 0l2 2a2 2 0 010 3L9 20l-6 1 1-6z', eraser: 'M15 3l6 6a2 2 0 010 3L11 22H7l-5-5a2 2 0 010-3L13 3a2 2 0 012 0zM8 9l8 8M11 22h11',
        rectangle: 'M3 5h18v14H3z', circle: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z', line: 'M4 20L20 4', arrow: 'M4 20L20 4M9 4h11v11', sticky: 'M4 3h16a1 1 0 011 1v11l-6 6H4a1 1 0 01-1-1V4a1 1 0 011-1zM15 21v-6h6',
        text: 'M4 5V3h16v2M12 3v18M8 21h8', table: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18', upload: 'M12 16V3M7 8l5-5 5 5M3 16v5h18v-5',
        download: 'M12 3v13M7 11l5 5 5-5M3 17v4h18v-4', undo: 'M9 4L3 10l6 6M3 10h10a7 7 0 017 7', redo: 'M15 4l6 6-6 6M21 10H11a7 7 0 00-7 7', close: 'M5 5l14 14M19 5L5 19',
        plus: 'M12 4v16M4 12h16', minus: 'M4 12h16', chevron: 'M5 9l7 7 7-7', layout: 'M3 4h18v16H3zM9 4v16M9 10h12', shapes: 'M4 3h7v7H4zM21 7a4 4 0 11-8 0 4 4 0 018 0zM3 21l5-9 5 9H3zM16 14h5v7h-5z',
        folder: 'M3 6h7l2 3h9v12H3V6zM3 6V3h7l2 3h7v3', home: 'M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10', copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
        trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7', layers: 'M12 3L2 8l10 5 10-5-10-5zM2 13l10 5 10-5M2 18l10 5 10-5',
        save: 'M3 3h15l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8', help: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9a3 3 0 016 0c0 2-3 2-3 5M12 17h.01',
        notes: 'M4 3h16v12l-6 6H4V3zM8 7h8M8 11h6M14 21v-6h6', timer: 'M9 2h6M12 2v3M18 5l2-2M20 14a8 8 0 11-16 0 8 8 0 0116 0zM12 9v5l3 2',
        fit: 'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5M8 8h8v8H8z', expand: 'M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6',
        draw: 'M14 3l7 7-10 10-8 1 1-8L14 3zM5 15l4 4M13 4l7 7M4 22l4-2 4 2 5-2',
        'shape-stack': 'M4 4h11v11H4zM21 15a6 6 0 11-12 0 6 6 0 0112 0z',
        signature: 'M2 18c4-6 7-20 7-12S4 22 5 16s7-9 7-4-2 8 0 4 4-5 4-2 2 3 6 2M9 22h13',
        thickness: 'M4 5h16M4 11h16M4 19h16', sliders: 'M3 6h18M3 18h18M8 3v6M16 15v6',
        up: 'M5 13l7-7 7 7M12 6v15', down: 'M5 11l7 7 7-7M12 3v15',
        sparkles: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z',
        wand: 'M4 20L17 7l3 3L7 23l-3-3zM13 11l3 3M5 3v4M3 5h4M19 1v4M17 3h4M21 17v4M19 19h4',
    };
    const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = name => `<svg class="wb-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.rectangle}"/></svg>`;
    app.querySelectorAll('[data-wb-icon]').forEach(el => { el.innerHTML = icon(el.dataset.wbIcon); });
    function penArt(name, colour) {
        const tip = colour || (name === 'pen' ? '#1689f8' : name === 'marker' ? '#ff485c' : '#ffe500');
        const art = name === 'eraser'
            ? '<rect x="1" y="7" width="49" height="22" rx="2" fill="#ff7690"/><path d="M27 7v22M32 7v22" stroke="#ffbdcb" stroke-width="2"/><path d="M45 7v22" stroke="#f23c66" stroke-width="4"/>'
            : `<path d="M-5 8H24L43 16v4L24 28H-5Z" fill="#fff" stroke="#e7e8ed"/><path d="M7 8v20" stroke="${tip}" stroke-width="1.7"/><path d="M40 16h10v4H40Z" fill="${tip}"/>${name === 'highlighter' ? `<path d="M41 16h10v8H41z" fill="${tip}"/>` : ''}${name === 'marker' ? `<path d="M-1 23l5-2-1 4 6-2" fill="none" stroke="${tip}" stroke-width="2"/>` : ''}`;
        return `<svg class="wb-pen-art" viewBox="0 0 54 36" aria-hidden="true">${art}</svg>`;
    }
    app.querySelectorAll('[data-wb-pen-art]').forEach(el => { el.innerHTML = penArt(el.dataset.wbPenArt); });
    const storageKey = 'eduportal.whiteboards.v1';
    let library = [], board, selected = null, tool = 'select', drag = null, space = false, panel = '', editing = null;
    let ink = '#3b3548', fill = '#e9ddff', penWidth = 3, fontSize = 24, history = M.history();
    const pens = { pen: { colour: '#1689f8', width: 3, opacity: 1 }, marker: { colour: '#ff485c', width: 5, opacity: 1 }, highlighter: { colour: '#ffe500', width: 18, opacity: .38 } };
    let activePen = 'marker', eraserSize = 28;
    const touches = new Map();
    let touchGesture = null, waitForTouchRelease = false, multiTouchCleared = false;
    let recognitionLabel = 'Recognition on', recognitionReady = false, recognitionBusy = false, recognitionTimer, recognitionController, recognitionRevision = 0, recognitionCheck = null, lastRecognitionCheck = 0;
    const recognitionPending = new Set();
    let reviews = [], activeReview = null, previewRevision = 0;
    let speechRecognition = null, voiceListening = false, voiceSilenceTimer = null, voiceResultTimer = null, voiceTranscriptBase = '', voiceSessionText = '', voicePreviewRevision = 0, voiceNetworkErrors = 0;
    let graphEditId = null, graphPreview = null, graphTableFunction = '';
    let aiResult = null, aiContext = null, aiAction = 'explain', aiController = null, aiRevision = 0;
    let saveTimeout, toastTimeout, timerInterval, timerRemaining = 300;
    if (P) { const loaded = P.load(localStorage, storageKey, M.restore); library = loaded.library; board = loaded.board; }
    if (!board) { board = M.newBoard(); library.push(board); }
    board = M.clone(board);
    function toast(message) {
        $('wb-toast').textContent = message; $('wb-toast').hidden = false;
        clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { $('wb-toast').hidden = true; }, 3800);
    }
    function saveNow() {
        clearTimeout(saveTimeout);
        try {
            if (P) P.save(localStorage, storageKey, library, board, M.clone);
            else localStorage.setItem(storageKey, JSON.stringify({ version: 1, activeId: board.id, boards: library }));
            $('wb-save-state').textContent = 'Saved on this device';
        } catch (_) { $('wb-save-state').textContent = 'Not saved · download a backup'; toast('Device storage is full or unavailable. Download an editable board from File to keep your work.'); }
    }
    function saveSoon() { $('wb-save-state').textContent = 'Saving…'; clearTimeout(saveTimeout); saveTimeout = setTimeout(saveNow, 350); }
    function commit(before) {
        if (history.commit(before, board.items)) { cancelRecognition(); saveSoon(); }
        render();
        if (recognitionPending.size) scheduleRecognition();
    }
    function recognitionStatus(text, unavailable = false) {
        $('wb-auto-status').textContent = text; $('wb-neat-ink').classList.toggle('is-unavailable', unavailable);
    }
    function cancelRecognition(clear = false) {
        recognitionRevision++; clearTimeout(recognitionTimer);
        if (recognitionController) recognitionController.abort();
        recognitionController = null; recognitionBusy = false;
        if (clear) { recognitionPending.clear(); reviews = []; }
        if (recognitionReady) recognitionStatus(recognitionLabel);
    }
    function queueRecognition(ids, delay = 2400) {
        for (const id of ids) if (board.items.some(i => i.id === id && M.canRecognize(i))) recognitionPending.add(id);
        if (!recognitionReady && Date.now() - lastRecognitionCheck > 10000) initializeRecognition();
        scheduleRecognition(delay);
    }
    function scheduleRecognition(delay = 2400) {
        clearTimeout(recognitionTimer);
        if (recognitionReady && recognitionPending.size) recognitionTimer = setTimeout(runRecognition, delay);
    }
    async function initializeRecognition() {
        if (recognitionCheck) return recognitionCheck;
        lastRecognitionCheck = Date.now();
        recognitionCheck = (async () => {
            try {
                const response = await fetch(app.dataset.recognitionUrl, { credentials: 'same-origin' });
                const status = await response.json();
                if (!response.ok || !status.available) throw new Error(status.message || 'Handwriting recognition is unavailable.');
                recognitionLabel = status.reviewRequired ? 'Recognition on · review' : 'Autocorrect on'; recognitionReady = true; recognitionStatus(recognitionLabel);
                $('wb-neat-ink').title = `${status.engine} · Review suggestions before applying them. Use separated printed letters and leave gaps between words. Original ink is kept.`;
                queueRecognition(board.items.filter(M.canRecognize).map(i => i.id));
            } catch (_) {
                recognitionReady = false; recognitionStatus('Recognition unavailable', true);
                $('wb-neat-ink').title = 'Original ink is kept. This server needs a working handwriting recognition engine.';
            } finally { recognitionCheck = null; render(); }
        })();
        return recognitionCheck;
    }
    async function runRecognition() {
        if (!recognitionReady || recognitionBusy || drag || editing || touchGesture || $('wb-review-dialog').open || $('wb-voice-dialog').open || $('wb-graph-dialog').open || $('wb-ai-dialog').open) { if (recognitionPending.size) scheduleRecognition(); return; }
        const request = M.recognitionRequest(board.items, recognitionPending);
        if (!request.strokes.length) { recognitionPending.clear(); return; }
        const snapshot = M.clone(request), revision = recognitionRevision, boardId = board.id;
        const controller = new AbortController(); recognitionController = controller; recognitionBusy = true;
        recognitionStatus('Correcting handwriting…'); render();
        try {
            const totalPoints=snapshot.strokes.reduce((sum,s)=>sum+s.points.length,0);
            const strokes = snapshot.strokes.map(s => {
                const budget=Math.min(2499,Math.max(1,Math.floor(59000*s.points.length/Math.max(1,totalPoints))));
                const step = Math.max(1, Math.ceil(s.points.length / budget)), points = s.points.filter((_, i) => i % step === 0);
                if (points[points.length - 1] !== s.points[s.points.length - 1]) points.push(s.points[s.points.length - 1]);
                return { id: s.id, points };
            });
            const response = await fetch(app.dataset.recognitionUrl, {
                method: 'POST', credentials: 'same-origin', signal: controller.signal,
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': app.querySelector('[name=csrfmiddlewaretoken]').value }, body: JSON.stringify({ strokes, mode: board.recognitionMode || 'auto' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Handwriting recognition did not respond.');
            if (boardId !== board.id || revision !== recognitionRevision || drag) return;
            for (const stroke of snapshot.strokes) recognitionPending.delete(stroke.id);
            recognitionController = null; recognitionBusy = false;
            const candidates = [...(result.words || []), ...(result.unread || [])];
            if (candidates.some(w => w.needsReview) && M.isRecognitionCurrent(board.items,snapshot)) {
                const ids = new Set(snapshot.strokes.map(s=>s.id));
                reviews = reviews.filter(r=>!r.request.strokes.some(s=>ids.has(s.id)));
                reviews.push({boardId,request:snapshot,submittedStrokes:strokes,result:M.clone(result),mode:board.recognitionMode||'auto',words:M.clone(candidates)});
                toast('Review the suggested correction. Your handwriting stays until you approve it.');
            } else {
                const converted = M.applyRecognition(board.items, snapshot, candidates);
                if (converted.corrected) {
                    const before = M.clone(board.items); board.items = converted.items; selected = null; commit(before);
                    toast('Writing corrected. Use Select to edit. Undo restores your original ink.');
                }
            }
            recognitionStatus(recognitionLabel);
            if (recognitionPending.size) scheduleRecognition(400);
        } catch (error) {
            if (error.name !== 'AbortError') {
                recognitionReady = false; recognitionStatus('Recognition unavailable · ink kept', true);
                toast('Could not read handwriting right now. Your original ink is safe; use Correct existing writing to retry.');
            }
        } finally {
            if (recognitionController === controller) { recognitionController = null; recognitionBusy = false; }
            render();
        }
    }
    function refreshReviews() {
        reviews = reviews.filter(r => r.boardId === board.id && M.isRecognitionCurrent(board.items,r.request));
        $('wb-review').hidden = !reviews.length;
        $('wb-review').textContent = `Review corrections (${reviews.length})`;
    }
    let exportingPng = false;
    // Render the same SVG that supplied the dimensions so trailing symbols
    // cannot be clipped by differences between KaTeX and MathJax metrics.
    const mathSvg = (entry,w=entry.w,h=entry.h) =>
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${entry.viewBox}" width="${w}" height="${h}" preserveAspectRatio="xMinYMin meet">${entry.markup}</svg>`;
    function sourcePreview(word,review) {
        if(!review.request)return '';
        const sources=M.recognitionSources(review.request,word);
        const b=M.allBounds(sources),pad=8;
        return `<div class="wb-source-preview"><small>Your handwriting</small><svg role="img" aria-label="Original handwriting for this correction" viewBox="${b.x-pad} ${b.y-pad} ${Math.max(20,b.w+pad*2)} ${Math.max(20,b.h+pad*2)}" style="min-width:${Math.min(1400,Math.max(200,b.w*140/Math.max(20,b.h)))}px">${sources.map(s=>`<path d="${s.points.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')}" fill="none" stroke="#25212e" stroke-width="${Math.max(.8,s.width||1)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg></div>`;
    }
    function openReview(review) {
        finishEdit(true); cancelRecognition(); activeReview = review;
        $('wb-review-heading').textContent = review.editId ? 'Edit equation' : review.request ? 'Review handwriting' : 'Add equation';
        $('wb-review-help').textContent = review.request ? 'Check the reading, line breaks and spacing. Uncertain ink is kept until you approve it.' : 'Use integral(x^2,x), integral(x^2,x,0,1), diff(x^2,x), diff(x^3,x,2), partial(f(x,y),x), fractions or LaTeX. The preview shows exactly what will appear on the board.';
        $('wb-review-keep').hidden = !review.request;
        $('wb-review-export').hidden = !review.request;
        $('wb-review-apply').textContent=review.request?'Apply selected lines':'Apply correction';
        $('wb-review-error').hidden = true;
        $('wb-review-cards').innerHTML = review.words.map((w,i)=>`<section class="wb-review-card"><div class="wb-review-card-heading"><label for="wb-review-text-${i}">Correction ${i+1}</label><select id="wb-review-format-${i}" aria-label="Correction ${i+1} format"><option value="paragraph"${w.format!=='math'?' selected':''}>Text & paragraphs</option><option value="math"${w.format==='math'?' selected':''}>Maths / equation</option></select></div><textarea id="wb-review-text-${i}" maxlength="5000" rows="3" placeholder="Type exactly what you wrote">${esc(w.text)}</textarea><div class="wb-text-alternatives">${(w.alternatives||[]).filter(a=>a!==w.text).map(a=>`<button data-review-alternative="${esc(a)}" data-review-index="${i}">${esc(a)}</button>`).join('')}</div><div class="wb-math-symbols" data-review-symbols="${i}"${w.format==='math'?'':' hidden'}>${['+','−','×','÷','=','π','θ','∞','≤','≥','≠','±','(a)/(b)','x^(2)','sqrt(x)','\u222b','\u222c','\u222e','\u2202','integral(x^2,x)','integral(x^2,x,0,1)','diff(x^2,x)','diff(x^3,x,2)','partial(f(x,y),x)'].map(s=>`<button data-review-insert="${esc(s)}" data-review-index="${i}" aria-label="Insert ${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="wb-review-preview" id="wb-review-preview-${i}" aria-label="Correction ${i+1} preview"></div></section>`).join('');
        review.words.forEach((w,i)=>{const card=$(`wb-review-text-${i}`).closest('section');card.insertAdjacentHTML('afterbegin',sourcePreview(w,review));
            if(review.request)card.insertAdjacentHTML('beforeend',`<p class="wb-review-reason">${esc((w.reviewReasons||['Check this line against your handwriting.']).join(' '))}</p><label class="wb-review-select"><input type="checkbox" id="wb-review-select-${i}"> Replace this line with the text above</label>`);
        });
        if (!$('wb-review-dialog').open) $('wb-review-dialog').showModal();
        updateReviewPreview(); $('wb-review-text-0').focus();
    }
    async function updateReviewPreview() {
        const revision = ++previewRevision, review = activeReview;
        if (!review) return;
        await Promise.all(review.words.map(async (w,i)=>{
            const text=$(`wb-review-text-${i}`).value, format=$(`wb-review-format-${i}`).value;
            const out=$(`wb-review-preview-${i}`), symbols=$('wb-review-cards').querySelector(`[data-review-symbols="${i}"]`);
            symbols.hidden=format!=='math'; out.classList.remove('has-error');
            if (format!=='math') { out.textContent=text || 'Your text preview'; return; }
            out.textContent='Formatting…';
            const entry=await window.WhiteboardMath.prepare(text,28,text===w.text&&format===w.format?w.latex:null);
            if (revision!==previewRevision || activeReview!==review) return;
            if (entry.error) { out.textContent=entry.error; out.classList.add('has-error'); }
            else out.innerHTML=mathSvg(entry);
        }));
    }
    $('wb-review').addEventListener('click',()=>{refreshReviews();if(reviews.length)openReview(reviews[0]);});
    $('wb-add-equation').addEventListener('click',()=>openReview({boardId:board.id,words:[{text:'',format:'math',fontSize:32}]}));
    function stopVoice(message='Microphone is off.') {
        voiceListening=false;clearTimeout(voiceSilenceTimer);voiceSilenceTimer=null;clearTimeout(voiceResultTimer);voiceResultTimer=null;
        if(speechRecognition){const recognition=speechRecognition;speechRecognition=null;try{recognition.stop();}catch(_){/* Already stopped. */}}
        $('wb-voice-dialog').classList.remove('is-listening');$('wb-voice-listen').textContent='Start listening';$('wb-voice-listen').disabled=false;$('wb-voice-status').textContent=message;
    }
    function armVoiceSilenceTimer() {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer=setTimeout(()=>{if(!speechRecognition)return;stopVoice('Listening stopped after 15 seconds of silence. Check the equation or start listening again.');updateVoicePreview(true);},15000);
    }
    async function updateVoicePreview(fromTranscript=false) {
        const error=$('wb-voice-error'),preview=$('wb-voice-preview'),apply=$('wb-voice-apply'),revision=++voicePreviewRevision;
        let expression=$('wb-voice-expression').value.trim();error.hidden=true;apply.disabled=true;
        try{
            if(fromTranscript){const parsed=V.parseSpokenMath($('wb-voice-transcript').value);$('wb-voice-expression').value=parsed.expression;}
            expression=$('wb-voice-expression').value.trim();if(!expression){preview.textContent='Your equation preview';return;}
            const tex=T.toLatex(expression);
            preview.innerHTML=window.katex.renderToString(tex,{displayMode:true,throwOnError:true,trust:false,maxExpand:500,maxSize:20});apply.disabled=false;
            if(voiceListening)return;
            const entry=await window.WhiteboardMath.prepare(expression,32);
            if(revision!==voicePreviewRevision)return;
            if(entry.ready)preview.innerHTML=mathSvg(entry);
        }catch(reason){if(revision!==voicePreviewRevision)return;preview.textContent=expression||'Your equation preview';error.textContent=reason.message;error.hidden=false;}
    }
    function openVoice() {
        finishEdit(true);cancelRecognition();stopVoice();
        voicePreviewRevision++;voiceTranscriptBase='';voiceSessionText='';$('wb-voice-transcript').value='';$('wb-voice-expression').value='';$('wb-voice-preview').textContent='Your equation preview';$('wb-voice-error').hidden=true;$('wb-voice-apply').disabled=true;
        const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
        if(!Recognition){$('wb-voice-status').textContent='Voice recognition is unavailable in this browser. Type the spoken phrase below instead.';$('wb-voice-listen').disabled=true;}
        else{$('wb-voice-listen').disabled=false;}
        if(!$('wb-voice-dialog').open)$('wb-voice-dialog').showModal();$('wb-voice-transcript').focus();
    }
    $('wb-voice-math').addEventListener('click',openVoice);
    function voiceLanguage(){const language=document.documentElement.lang||navigator.language||'en-US';return language.toLowerCase()==='en'?'en-US':language;}
    function bestVoiceTranscript(result,prefix) {
        const alternatives=[];for(let i=0;i<result.length;i++)alternatives.push(result[i].transcript.trim());
        return alternatives.find(text=>{try{V.parseSpokenMath([prefix,text].filter(Boolean).join(' '));return true;}catch(_){return false;}})||alternatives[0]||'';
    }
    function beginVoiceSession() {
        if(!voiceListening)return;
        const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return;
        const recognition=new Recognition();speechRecognition=recognition;voiceSessionText='';recognition.lang=voiceLanguage();recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=5;
        recognition.onstart=()=>{$('wb-voice-dialog').classList.add('is-listening');$('wb-voice-listen').textContent='Stop listening';$('wb-voice-status').textContent='Listening… Speak your complete equation.';if(!voiceSilenceTimer)armVoiceSilenceTimer();clearTimeout(voiceResultTimer);voiceResultTimer=setTimeout(()=>{if(voiceListening&&!voiceSessionText)$('wb-voice-status').textContent='No words received yet. Keep speaking, or check microphone permission beside the address bar.';},7000);};
        recognition.onresult=event=>{clearTimeout(voiceResultTimer);voiceResultTimer=null;let text='';for(let i=0;i<event.results.length;i++)text+=`${bestVoiceTranscript(event.results[i],[voiceTranscriptBase,text].filter(Boolean).join(' '))} `;voiceSessionText=text.trim();$('wb-voice-transcript').value=[voiceTranscriptBase,voiceSessionText].filter(Boolean).join(' ');voiceNetworkErrors=0;armVoiceSilenceTimer();updateVoicePreview(true);};
        recognition.onerror=event=>{if(speechRecognition!==recognition)return;if(event.error==='no-speech'){$('wb-voice-status').textContent='No words detected yet. Still listening…';return;}if(event.error==='aborted')return;if(event.error==='network'){$('wb-voice-status').textContent='The browser speech service did not respond. Retrying; you can also type the equation below.';voiceNetworkErrors++;return;}const messages={'not-allowed':'Microphone permission was not granted. Allow microphone access in the browser, then try again.','service-not-allowed':'The browser blocked its speech service. Check site microphone permission or use Chrome or Edge.','audio-capture':'No working microphone was found. Check the browser input device, then try again.','language-not-supported':'The browser speech service does not support the selected language.','bad-grammar':'The browser rejected the speech grammar.'};stopVoice(messages[event.error]||`Voice recognition stopped (${event.error||'unknown error'}). Your transcript is kept; press Start listening to continue.`);};
        recognition.onend=()=>{if(speechRecognition!==recognition||!voiceListening)return;speechRecognition=null;if(voiceSessionText){voiceTranscriptBase=[voiceTranscriptBase,voiceSessionText].filter(Boolean).join(' ');voiceSessionText='';$('wb-voice-transcript').value=voiceTranscriptBase;updateVoicePreview(true);}if(voiceNetworkErrors>2){stopVoice('The browser speech service is unavailable. Check your connection, or type the equation below.');return;}$('wb-voice-status').textContent='Listening…';setTimeout(beginVoiceSession,250);};
        try{recognition.start();}catch(_){speechRecognition=null;stopVoice('Could not start the microphone. Your transcript is kept; press Start listening to retry.');}
    }
    $('wb-voice-listen').addEventListener('click',()=>{
        if(voiceListening){stopVoice('Listening stopped. Check the equation before adding it.');updateVoicePreview(true);return;}
        const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return;
        voiceListening=true;voiceTranscriptBase=$('wb-voice-transcript').value.trim();voiceSessionText='';voiceNetworkErrors=0;$('wb-voice-dialog').classList.add('is-listening');$('wb-voice-listen').textContent='Stop listening';$('wb-voice-status').textContent='Starting the microphone…';armVoiceSilenceTimer();beginVoiceSession();
    });
    $('wb-voice-transcript').addEventListener('input',()=>updateVoicePreview(true));
    $('wb-voice-expression').addEventListener('input',()=>updateVoicePreview(false));
    function closeVoice(){stopVoice();if($('wb-voice-dialog').open)$('wb-voice-dialog').close();}
    $('wb-voice-close').addEventListener('click',closeVoice);$('wb-voice-cancel').addEventListener('click',closeVoice);
    $('wb-voice-dialog').addEventListener('close',()=>stopVoice());
    $('wb-voice-apply').addEventListener('click',async()=>{
        const expression=$('wb-voice-expression').value.trim(),error=$('wb-voice-error');error.hidden=true;
        try{
            if(!expression)throw new Error('Speak or type an equation first.');
            const tex=T.toLatex(expression);window.katex.renderToString(tex,{displayMode:true,throwOnError:true,trust:false,maxExpand:500,maxSize:20});
            const layout=T.mathLayout(expression,32);window.WhiteboardMath.prepare(expression,32);
            const before=M.clone(board.items),p=centre(),item=M.create('text',p.x-layout.w/2,p.y-layout.h/2,{text:expression,format:'math',manualText:true,fontSize:32,stroke:ink,w:layout.w,h:layout.h});
            board.items.push(M.placeRecognized(item,board.items));selected=item.id;closeVoice();commit(before);toast('Voice equation added. Undo removes it; double-click to edit it.');
        }catch(reason){error.textContent=reason.message;error.hidden=false;}
    });
    function graphTableRows(){return [...$('wb-graph-table-body').rows].map(row=>[...row.querySelectorAll('input')].map(input=>input.value));}
    function renderGraphTable(rows){
        $('wb-graph-table-body').innerHTML=rows.map(([x,y],i)=>`<tr><td><input type="text" inputmode="decimal" maxlength="24" aria-label="Row ${i+1} x" value="${esc(x)}"></td><td><input type="text" inputmode="decimal" maxlength="24" aria-label="Row ${i+1} y" value="${esc(y)}"></td><td><button type="button" data-remove-graph-row="${i}" aria-label="Remove row ${i+1}">Remove</button></td></tr>`).join('');
        $('wb-graph-add-row').disabled=rows.length>=30;
    }
    function graphModePanels(){
        const table=$('wb-graph-source').value==='table';
        $('wb-graph-table-panel').hidden=!table;$('wb-graph-function-panel').hidden=false;
        $('wb-graph-degree').disabled=table&&!!graphTableFunction;
        $('wb-graph-table-status').textContent=table&&graphTableFunction?'Values calculated from your function. Change x or the function, then fill the table again. Editing y switches to a manual table.':'';
    }
    $('wb-graph-source').addEventListener('change',()=>{graphModePanels();updateGraphPreview();});
    $('wb-graph-table-body').addEventListener('input',event=>{if(event.target.closest('td')?.cellIndex===1){graphTableFunction='';graphModePanels();}updateGraphPreview();});
    $('wb-graph-fill-table').addEventListener('click',()=>{
        try{
            const rows=G.fillTable($('wb-graph-expression').value,graphTableRows());
            graphTableFunction=G.sourceExpression($('wb-graph-expression').value);
            $('wb-graph-source').value='table';$('wb-graph-auto-range').checked=true;
            renderGraphTable(rows);graphModePanels();updateGraphPreview();
        }catch(reason){$('wb-graph-error').textContent=reason.message;$('wb-graph-error').hidden=false;}
    });
    $('wb-graph-table-body').addEventListener('click',event=>{
        const button=event.target.closest('[data-remove-graph-row]');if(!button)return;
        const rows=graphTableRows();rows.splice(Number(button.dataset.removeGraphRow),1);if(!rows.length)rows.push(['','']);renderGraphTable(rows);updateGraphPreview();
    });
    $('wb-graph-add-row').addEventListener('click',()=>{const rows=graphTableRows();if(rows.length>=30)return;rows.push(['','']);renderGraphTable(rows);updateGraphPreview();$('wb-graph-table-body').lastElementChild.querySelector('input').focus();});
    $('wb-graph-degree').addEventListener('change',updateGraphPreview);
    $('wb-graph-auto-range').addEventListener('change',updateGraphPreview);
    function graphOptions(){return{xMin:$('wb-graph-x-min').value,xMax:$('wb-graph-x-max').value,yMin:$('wb-graph-y-min').value,yMax:$('wb-graph-y-max').value};}
    function updateGraphPreview(){
        const error=$('wb-graph-error');error.hidden=true;
        try{
            const tableMode=$('wb-graph-source').value==='table';
            const options={...graphOptions(),degree:$('wb-graph-degree').value,autoRange:$('wb-graph-auto-range').checked};
            graphPreview=tableMode?(graphTableFunction?G.plotFunctionTable($('wb-graph-expression').value,graphTableRows(),options):G.plotTable(graphTableRows(),options)):{...G.plot($('wb-graph-expression').value,graphOptions()),graphSource:'function',tablePoints:[],tableDegree:'auto',tableFunction:''};
            if(tableMode&&$('wb-graph-auto-range').checked)for(const [id,key] of [['wb-graph-x-min','xMin'],['wb-graph-x-max','xMax'],['wb-graph-y-min','yMin'],['wb-graph-y-max','yMax']])$(id).value=graphPreview[key];
            $('wb-graph-apply').disabled=false;
            const previewItem={id:'preview',type:'graph',x:0,y:0,w:560,h:320,fill:'#fff',stroke:$('wb-graph-colour').value,width:Number($('wb-graph-width').value),showGrid:$('wb-graph-grid').checked,showAxes:$('wb-graph-axes').checked,...graphPreview};
            $('wb-graph-preview').innerHTML=graphMarkup(previewItem,{x:0,y:0,w:560,h:320});
        }catch(reason){graphPreview=null;$('wb-graph-apply').disabled=true;$('wb-graph-preview').innerHTML='';error.textContent=reason.message;error.hidden=false;}
    }
    function openGraph(item=null){
        finishEdit(true);cancelRecognition();graphEditId=item?.id||null;
        $('wb-graph-heading').textContent=item?'Edit graph':'Graph plotter';$('wb-graph-apply').textContent=item?'Apply changes':'Add to whiteboard';
        graphTableFunction=item?.tableFunction||'';
        $('wb-graph-expression').value=graphTableFunction?`y = ${graphTableFunction}`:item&&item.graphSource!=='table'?`y = ${item.expression}`:'y = x^2';
        $('wb-graph-source').value=item?.graphSource==='table'?'table':'function';
        $('wb-graph-degree').value=item?.tableDegree||'auto';
        $('wb-graph-auto-range').checked=!item;
        renderGraphTable(item?.graphSource==='table'?item.tablePoints:Array.from({length:5},(_,i)=>[i-2,'']));graphModePanels();
        for(const [id,value] of [['wb-graph-x-min',item?.xMin??-10],['wb-graph-x-max',item?.xMax??10],['wb-graph-y-min',item?.yMin??-10],['wb-graph-y-max',item?.yMax??10]])$(id).value=value;
        $('wb-graph-grid').checked=item?.showGrid!==false;$('wb-graph-axes').checked=item?.showAxes!==false;$('wb-graph-colour').value=item?.stroke||'#1689f8';$('wb-graph-width').value=item?.width||3;
        updateGraphPreview();if(!$('wb-graph-dialog').open)$('wb-graph-dialog').showModal();const focus=$('wb-graph-source').value==='table'?$('wb-graph-table-body').querySelector('input'):$('wb-graph-expression');focus.focus();focus.select();
    }
    $('wb-add-graph').addEventListener('click',()=>openGraph());
    for(const id of ['wb-graph-expression','wb-graph-x-min','wb-graph-x-max','wb-graph-y-min','wb-graph-y-max','wb-graph-grid','wb-graph-axes','wb-graph-colour','wb-graph-width'])$(id).addEventListener('input',()=>{if(id.match(/wb-graph-[xy]-(min|max)/))$('wb-graph-auto-range').checked=false;updateGraphPreview();});
    function closeGraph(){graphEditId=null;if($('wb-graph-dialog').open)$('wb-graph-dialog').close();}
    $('wb-graph-close').addEventListener('click',closeGraph);$('wb-graph-cancel').addEventListener('click',closeGraph);
    $('wb-graph-dialog').addEventListener('close',()=>{graphEditId=null;});
    $('wb-graph-apply').addEventListener('click',()=>{
        updateGraphPreview();if(!graphPreview)return;
        const before=M.clone(board.items),old=board.items.find(item=>item.id===graphEditId),p=centre();
        const item=M.create('graph',old?.x??p.x-280,old?.y??p.y-180,{...(old||{}),...graphPreview,stroke:$('wb-graph-colour').value,width:Number($('wb-graph-width').value),showGrid:$('wb-graph-grid').checked,showAxes:$('wb-graph-axes').checked});
        if(old){item.id=old.id;board.items=board.items.map(current=>current.id===old.id?item:current);}else board.items.push(item);
        setTool('select');selected=item.id;closeGraph();commit(before);toast(old?'Graph updated.':'Graph added. Double-click it to edit the table, function, or ranges.');
    });
    function resetAiAnswer(){
        aiRevision++;if(aiController)aiController.abort();aiController=null;aiResult=null;
        $('wb-ai-preview').hidden=true;$('wb-ai-insert').disabled=true;$('wb-ai-error').hidden=true;
        $('wb-ai-status').textContent='';$('wb-ai-generate').textContent='Get answer';
        $('wb-ai-generate').disabled=!$('wb-ai-prompt').value.trim();
    }
    function openAi(preferred){
        finishEdit(true);cancelRecognition();
        const text=preferred&&chosen()?.text;
        $('wb-ai-prompt').value=text?`Explain briefly: ${text}`.slice(0,1000):'';
        aiAction='answer';aiContext={sourceIds:[],items:[],scope:'question'};resetAiAnswer();
        D.open($('wb-ai-dialog'),$('wb-ai-prompt'));
    }
    function closeAi(){resetAiAnswer();D.close($('wb-ai-dialog'));}
    $('wb-ai-assist').addEventListener('click',()=>openAi());$('wb-selection-ai').addEventListener('click',()=>openAi('answer'));
    $('wb-ai-prompt').addEventListener('input',resetAiAnswer);
    $('wb-ai-close').addEventListener('click',closeAi);$('wb-ai-cancel').addEventListener('click',closeAi);
    $('wb-ai-dialog').addEventListener('close',resetAiAnswer);
    $('wb-ai-generate').addEventListener('click',async()=>{
        const question=$('wb-ai-prompt').value.trim();if(!question)return;
        resetAiAnswer();const revision=++aiRevision,controller=new AbortController();aiController=controller;
        const error=$('wb-ai-error'),button=$('wb-ai-generate');button.disabled=true;button.textContent='Answering…';$('wb-ai-status').textContent='Thinking about your question…';
        const timeout=setTimeout(()=>controller.abort(),Math.max(15000,Math.min(315000,Number(app.dataset.aiTimeoutMs)||45000)));
        try{
            const result=await AI.request(app.dataset.aiUrl,app.querySelector('[name=csrfmiddlewaretoken]').value,{action:'answer',prompt:question},controller.signal);
            if(revision!==aiRevision)return;
            aiResult=result;$('wb-ai-result-title').textContent='Answer';$('wb-ai-result-body').textContent=result.explanation;
            $('wb-ai-preview').hidden=false;$('wb-ai-insert').disabled=false;
        }catch(reason){
            if(revision!==aiRevision)return;
            error.textContent=reason.name==='AbortError'?'The answer took too long. Please try again.':reason.message;error.hidden=false;
        }finally{
            clearTimeout(timeout);
            if(revision===aiRevision){button.disabled=false;button.textContent='Get answer';$('wb-ai-status').textContent='';aiController=null;}
        }
    });
    $('wb-ai-insert').addEventListener('click',()=>{
        if(!aiResult)return;const p=centre(),raw=AI.insertion(aiResult,'answer',[],{x:p.x-180,y:p.y-110});
        raw.h=Math.max(raw.h,wrap(raw.text,30).length*raw.fontSize*1.35+40);
        const item=M.create('sticky',raw.x,raw.y,raw),before=M.clone(board.items);
        board.items.push(item);setTool('select');selected=item.id;closeAi();commit(before);toast('Answer added. Undo removes it.');
    });
    $('wb-review-close').addEventListener('click',()=>$('wb-review-dialog').close());
    $('wb-review-export').addEventListener('click',()=>{
        const review=activeReview;if(!review?.request)return;
        const example={schemaVersion:1,mode:review.mode||'auto',strokes:review.submittedStrokes||review.request.strokes.map(s=>({id:s.id,points:s.points})),
            originalStrokes:review.request.strokes,result:review.result||{},
            expected:review.words.map((w,i)=>({text:$(`wb-review-text-${i}`).value,format:$(`wb-review-format-${i}`).value,strokeIds:w.strokeIds})),
            verified:false,writer:'',session:''};
        download(new Blob([JSON.stringify(example,null,2)],{type:'application/json'}),'handwriting-example.json');
        toast('Example saved on this device. Check the expected text before using it to measure accuracy.');
    });
    $('wb-review-dialog').addEventListener('close',()=>{activeReview=null;previewRevision++;if(recognitionPending.size)scheduleRecognition();});
    $('wb-review-cards').addEventListener('input',updateReviewPreview);
    $('wb-review-cards').addEventListener('change',updateReviewPreview);
    $('wb-review-cards').addEventListener('click',event=>{
        const b=event.target.closest('button');if(!b)return;
        const input=$(`wb-review-text-${b.dataset.reviewIndex}`);
        if(b.dataset.reviewAlternative)input.value=b.dataset.reviewAlternative;
        if(b.dataset.reviewInsert){input.setRangeText(b.dataset.reviewInsert,input.selectionStart,input.selectionEnd,'end');input.focus();}
        updateReviewPreview();
    });
    $('wb-review-keep').addEventListener('click',()=>{
        const review=activeReview;if(!review?.request)return;
        const ids=new Set(review.request.strokes.map(s=>s.id));
        const contexts=new Set(review.request.contextIds);
        mutate(()=>{board.items=board.items.flatMap(i=>contexts.has(i.id)?i.inkSource.map(s=>({...s,keepInk:true})):i.type==='path'&&ids.has(i.id)?[{...i,keepInk:true}]:[i]);});
        reviews=reviews.filter(r=>r!==review);$('wb-review-dialog').close();render();
        toast('Original handwriting kept. Use Undo to restore autocorrection for these strokes.');
    });
    $('wb-review-apply').addEventListener('click',async()=>{
        const review=activeReview, button=$('wb-review-apply');if(!review)return;
        const revision=previewRevision;
        const words=M.reviewSelection(review.words,review.words.map((w,i)=>({text:$(`wb-review-text-${i}`).value,format:$(`wb-review-format-${i}`).value,selected:!review.request||$(`wb-review-select-${i}`).checked})));
        button.disabled=true;$('wb-review-error').hidden=true;
        try {
            if(!words.length)throw new Error('Select the lines you have checked, or choose Keep handwriting.');
            if(words.some(w=>!w.text))throw new Error('Enter a correction, or choose Keep handwriting.');
            for(const w of words)if(w.format==='math'){
                const entry=await window.WhiteboardMath.prepare(w.text,w.fontSize||32,w.latex);
                if(entry.error)throw new Error(entry.error);
            }
            if(activeReview!==review||revision!==previewRevision)return;
            if(review.boardId!==board.id || review.request&&!M.isRecognitionCurrent(board.items,review.request))throw new Error('This handwriting has changed. Close the review and check the updated strokes.');
            const before=M.clone(board.items);
            if(review.request){
                const converted=M.applyRecognition(board.items,review.request,words,true);
                if(!converted.corrected)throw new Error('The source drawing changed. Close the review and try again.');
                board.items=converted.items;
                for(const item of board.items.filter(i=>i.format==='math')){
                    const layout=window.WhiteboardMath.get(item.text,item.fontSize,item.latexSource===item.text?item.latex:null);
                    if(layout?.ready)Object.assign(item,M.placeRecognized({...item,w:layout.w,h:layout.h},board.items.filter(i=>i.id!==item.id)));
                }
            }else{
                const w=words[0],old=board.items.find(i=>i.id===review.editId),p=centre();
                const layout=w.format==='math'?window.WhiteboardMath.get(w.text,w.fontSize||32,w.latex):T.textLayout(w.text,w.fontSize||32);
                const next={...(old||M.create('text',p.x-180,p.y-60,{fontSize:32,stroke:ink})),text:w.text,format:w.format,manualText:true,w:layout.w,h:layout.h};
                board.items=board.items.filter(i=>i.id!==review.editId);board.items.push(M.placeRecognized(next,board.items));selected=next.id;
            }
            reviews=reviews.filter(r=>r!==review);$('wb-review-dialog').close();commit(before);
            if(review.request){
                const approved=new Set(words.flatMap(w=>w.strokeIds));
                const remaining=review.words.filter(w=>!w.strokeIds.some(id=>approved.has(id)));
                const sources=review.request.strokes.filter(s=>!approved.has(s.id));
                if(remaining.length&&sources.length)reviews.push({...review,submittedStrokes:(review.submittedStrokes||sources).filter(s=>!approved.has(s.id)),request:{...review.request,strokes:sources,contextIds:review.request.contextIds.filter(id=>board.items.some(i=>i.id===id))},words:remaining});
                refreshReviews();
            }
            toast('Correction applied. Your exact text is saved; Undo restores the previous writing.');
        }catch(error){$('wb-review-error').textContent=error.message;$('wb-review-error').hidden=false;}
        finally{button.disabled=false;}
    });
    function mutate(fn) { const before = M.clone(board.items); fn(); commit(before); }
    function chosen() { return board.items.find(item => item.id === selected); }
    function select(id) {
        selected = id;
        const item = chosen();
        if (item) { ink = item.stroke; fill = item.fill; penWidth = item.width; fontSize = item.fontSize; }
        render();
        if (panel === 'style') renderPanel();
    }
    function closeDrawMenus() {
        for (const id of ['wb-ink-menu', 'wb-stroke-menu']) $(id).hidden = true;
        $('wb-ink-toggle').setAttribute('aria-expanded', 'false'); $('wb-stroke-toggle').setAttribute('aria-expanded', 'false');
    }
    function showDrawTray(show) {
        $('wb-pen-tray').hidden = !show; $('wb-draw-toggle').setAttribute('aria-expanded', String(show));
        if (show) { $('wb-shape-tray').hidden = true; $('wb-shapes-toggle').setAttribute('aria-expanded', 'false'); }
        else closeDrawMenus();
    }
    function syncDrawTools() {
        $('wb-draw-toggle').classList.toggle('is-active', tool === 'pencil' || tool === 'eraser');
        app.querySelectorAll('[data-wb-pen]').forEach(button => button.setAttribute('aria-pressed', String(tool === 'eraser' ? button.dataset.wbPen === 'eraser' : tool === 'pencil' && button.dataset.wbPen === activePen)));
        $('wb-ink-swatch').style.background = pens[activePen].colour;
        $('wb-pen-colour').value = pens[activePen].colour;
        $('wb-pen-size-label').textContent = tool === 'eraser' ? 'Eraser size' : 'Stroke thickness';
        $('wb-pen-size').max = tool === 'eraser' ? '80' : '30';
        $('wb-pen-size').min = tool === 'eraser' ? '8' : '1';
        $('wb-pen-size').value = tool === 'eraser' ? eraserSize : pens[activePen].width;
        $('wb-pen-size-value').textContent = `${tool === 'eraser' ? eraserSize : pens[activePen].width} px`;
        $('wb-eraser-cursor').style.width = $('wb-eraser-cursor').style.height = `${eraserSize * board.view.zoom}px`;
        app.querySelector('[data-wb-panel="tools"]').setAttribute('aria-expanded', String(!$('wb-floating-tools').hidden));
    }
    function choosePen(name) {
        if (name !== 'eraser') activePen = name;
        $('wb-floating-tools').hidden = false;
        setTool(name === 'eraser' ? 'eraser' : 'pencil'); showDrawTray(true);
    }
    function setPenColour(value) {
        pens[activePen].colour = value;
        app.querySelectorAll(`[data-wb-pen-art="${activePen}"]`).forEach(el => { el.innerHTML = penArt(activePen, value); });
        if (tool !== 'pencil') setTool('pencil');
        ink = value; syncDrawTools();
    }
    function setTool(name) {
        finishEdit(true); tool = name; selected = null; lastSelectionTap = null;
        if (name === 'pencil') { ink = pens[activePen].colour; penWidth = pens[activePen].width; }
        if (name !== 'pencil' && name !== 'eraser') showDrawTray(false);
        $('wb-eraser-cursor').hidden = true;
        stage.dataset.tool = name;
        app.querySelectorAll('[data-wb-tool]').forEach(button => { const active = button.dataset.wbTool === name; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
        render(); svg.focus({ preventScroll: true });
    }
    function size() { return { w: stage.clientWidth || 1000, h: stage.clientHeight || 650 }; }
    function position(event) {
        const rect = svg.getBoundingClientRect();
        return { x: (event.clientX - rect.left - board.view.x) / board.view.zoom, y: (event.clientY - rect.top - board.view.y) / board.view.zoom };
    }
    function centre() { const s = size(); return { x: (s.w / 2 - board.view.x) / board.view.zoom, y: (s.h / 2 - board.view.y) / board.view.zoom }; }
    function wrap(text, maxChars) {
        const lines = [];
        for (const line of String(text).split('\n')) {
            if (!line.length) { lines.push(''); continue; }
            let remaining = line;
            while (remaining.length > maxChars) {
                let end = remaining.lastIndexOf(' ', maxChars); if (end < maxChars / 3) end = maxChars;
                lines.push(remaining.slice(0, end)); remaining = remaining.slice(end).replace(/^ /, '');
            }
            lines.push(remaining);
        }
        return lines;
    }
    function textMarkup(item, box, inset, colour) {
        if (item.format === 'math') {
            const latex=item.latexSource===item.text?item.latex:null;
            const formatted=window.WhiteboardMath.get(item.text,item.fontSize,latex);
            if(formatted?.ready)return `<g role="img" aria-label="${esc('Equation: '+item.text)}" transform="translate(${box.x+4} ${box.y+4})" color="${colour}">${mathSvg(formatted,box.w-8,box.h-8)}</g>`;
            if(!formatted)window.WhiteboardMath.prepare(item.text,item.fontSize,latex).then(entry=>{
                const current=board.items.find(i=>i.id===item.id);
                if(!entry.ready||!current||current.text!==item.text||current.fontSize!==item.fontSize)return;
                Object.assign(current,M.placeRecognized({...current,w:entry.w,h:entry.h},board.items.filter(i=>i.id!==current.id)));
                saveSoon();render();
            });
            const layout = T.mathLayout(item.text,item.fontSize);
            return `<g role="img" aria-label="${esc('Equation: '+item.text)}">${layout.runs.map(r => r.kind === 'bar' ? `<path data-wb-fraction-bar="true" d="M${box.x+r.x},${box.y+r.y}h${r.w}" stroke="${colour}" stroke-width="${Math.max(1,item.fontSize*.035)}"/>` : `<text x="${box.x+r.x}" y="${box.y+r.y}" fill="${colour}" font-family="Cambria Math,Times New Roman,serif" font-size="${r.fontSize}">${esc(r.text)}</text>`).join('')}</g>`;
        }
        if (item.format === 'paragraph') {
            const layout = T.textLayout(item.text,item.fontSize,Math.max(10,box.w-8));
            return `<text x="${box.x+inset}" y="${box.y+item.fontSize}" fill="${colour}" font-family="Segoe UI,Arial,sans-serif" font-size="${item.fontSize}" xml:space="preserve">${layout.lines.map((line,i)=>`<tspan x="${box.x+inset}" y="${box.y+item.fontSize+i*item.fontSize*1.5}">${esc(line)}</tspan>`).join('')}</text>`;
        }
        const lines = wrap(item.text, Math.max(2, Math.floor((box.w - inset * 2) / (item.fontSize * .56))));
        return `<text x="${box.x + inset}" y="${box.y + inset + item.fontSize}" fill="${colour}" font-family="Segoe UI,Arial,sans-serif" font-size="${item.fontSize}">${lines.map((line, i) => `<tspan x="${box.x + inset}" y="${box.y+inset+item.fontSize+i*item.fontSize*1.35}">${esc(line)}</tspan>`).join('')}</text>`;
    }
    function graphMarkup(item, box) {
        const left=46, right=16, top=35, bottom=32, width=Math.max(1,box.w-left-right), height=Math.max(1,box.h-top-bottom);
        const px=x=>box.x+left+(x-item.xMin)/(item.xMax-item.xMin)*width;
        const py=y=>box.y+top+height-(y-item.yMin)/(item.yMax-item.yMin)*height;
        const tick=value=>Number(value.toPrecision(6));
        const clip=`wb-graph-${String(item.id).replace(/[^a-z0-9_-]/gi,'')}`;
        let art=`<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="10" fill="${item.fill||'#fff'}" stroke="#cbc4d4"/><text x="${box.x+14}" y="${box.y+23}" fill="#332b42" font-family="Segoe UI,Arial,sans-serif" font-size="15" font-weight="700">${esc(item.graphSource==='table'?item.expression:'y = '+item.expression)}</text><defs><clipPath id="${clip}"><rect x="${box.x+left}" y="${box.y+top}" width="${width}" height="${height}"/></clipPath></defs>`;
        if(item.showGrid!==false)for(let i=0;i<=10;i++){
            const x=box.x+left+width*i/10,y=box.y+top+height*i/10;
            art+=`<path d="M${x},${box.y+top}v${height}M${box.x+left},${y}h${width}" stroke="#ece8f0" stroke-width="1"/>`;
        }
        art+=`<rect x="${box.x+left}" y="${box.y+top}" width="${width}" height="${height}" fill="none" stroke="#bcb3c8"/>`;
        if(item.showAxes!==false){
            if(item.xMin<=0&&item.xMax>=0)art+=`<path d="M${px(0)},${box.y+top}v${height}" stroke="#6e657a" stroke-width="1.4"/>`;
            if(item.yMin<=0&&item.yMax>=0)art+=`<path d="M${box.x+left},${py(0)}h${width}" stroke="#6e657a" stroke-width="1.4"/>`;
            art+=`<text x="${box.x+left}" y="${box.y+box.h-10}" fill="#6e657a" font-size="11">${esc(tick(item.xMin))}</text><text x="${box.x+box.w-right}" y="${box.y+box.h-10}" fill="#6e657a" font-size="11" text-anchor="end">${esc(tick(item.xMax))}</text><text x="${box.x+left-7}" y="${box.y+top+10}" fill="#6e657a" font-size="11" text-anchor="end">${esc(tick(item.yMax))}</text><text x="${box.x+left-7}" y="${box.y+top+height}" fill="#6e657a" font-size="11" text-anchor="end">${esc(tick(item.yMin))}</text>`;
        }
        art+=`<g clip-path="url(#${clip})">${(item.samples||[]).map(segment=>`<path d="${segment.map(([x,y],i)=>`${i?'L':'M'}${px(x)},${py(y)}`).join(' ')}" fill="none" stroke="${item.stroke}" stroke-width="${item.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}${item.graphSource==='table'?(item.tablePoints||[]).map(([x,y])=>`<circle cx="${px(x)}" cy="${py(y)}" r="4" fill="${item.stroke}" stroke="#fff" stroke-width="1.5"/>`).join(''):''}</g>`;
        return art;
    }
    function itemMarkup(item) {
        const b = M.bounds(item), style = `stroke="${item.stroke}" stroke-width="${item.width}" stroke-linecap="round" stroke-linejoin="round"`;
        let art = '';
        switch (item.type) {
        case 'path': {
            const d = item.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
            art = item.points.length === 1 ? `<circle cx="${item.points[0][0]}" cy="${item.points[0][1]}" r="${item.width / 2}" fill="${item.stroke}"/>` : `<path d="${d}" fill="none" ${style}/><path d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(14, item.width)}"/>`;
            art = `<g opacity="${item.opacity ?? 1}">${art}</g>`;
            break;
        }
        case 'line': case 'arrow': {
            const x = item.x + item.w, y = item.y + item.h, a = Math.atan2(item.h, item.w), length = 13 + item.width;
            art = `<line x1="${item.x}" y1="${item.y}" x2="${x}" y2="${y}" ${style}/><line x1="${item.x}" y1="${item.y}" x2="${x}" y2="${y}" stroke="transparent" stroke-width="16"/>`;
            if (item.type === 'arrow') art += `<path d="M${x - length * Math.cos(a - .45)},${y - length * Math.sin(a - .45)} L${x},${y} L${x - length * Math.cos(a + .45)},${y - length * Math.sin(a + .45)}" fill="none" ${style}/>`;
            break;
        }
        case 'ellipse': art = `<ellipse cx="${b.x + b.w / 2}" cy="${b.y + b.h / 2}" rx="${b.w / 2}" ry="${b.h / 2}" fill="${item.fill}" ${style}/>`; break;
        case 'rectangle': art = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="${item.fill}" ${style}/>`; break;
        case 'sticky': art = `<rect x="${b.x + 2}" y="${b.y + 4}" width="${b.w}" height="${b.h}" rx="2" fill="#29203d" opacity=".08"/><path d="M${b.x},${b.y}h${b.w}v${b.h - 22}l-22,22H${b.x}Z" fill="${item.fill}"/><path d="M${b.x + b.w - 22},${b.y + b.h}v-22h22" fill="#000000" opacity=".07"/>${textMarkup(item, b, 20, item.stroke)}`; break;
        case 'text': art = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="transparent"/>${textMarkup(item, b, 4, item.stroke)}`; break;
        case 'file': {
            const lines=wrap(item.fileName,Math.max(12,Math.floor((b.w-32)/8))).slice(0,2);
            art=`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="#ffffff" stroke="#b69bd7" stroke-width="2"/><text x="${b.x+16}" y="${b.y+25}" fill="#7136b4" font-family="Segoe UI,Arial,sans-serif" font-size="12" font-weight="700">${esc(item.fileName.split('.').pop().toUpperCase())} FILE</text>${lines.map((line,i)=>`<text x="${b.x+16}" y="${b.y+50+i*19}" fill="#302941" font-family="Segoe UI,Arial,sans-serif" font-size="15">${esc(line)}</text>`).join('')}<text x="${b.x+16}" y="${b.y+b.h-16}" fill="#6e657a" font-family="Segoe UI,Arial,sans-serif" font-size="12">${(item.fileSize/1024).toFixed(1)} KB · Double-click to download</text>`;break;
        }
        case 'image': art = `<image href="${esc(item.src)}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid meet"/>`; break;
        case 'graph': art = graphMarkup(item,b); break;
        case 'table': {
            const rows = item.text.split('\n').slice(0, 20).map(row => row.split('\t').slice(0, 10));
            const columns = Math.max(1, ...rows.map(row => row.length)), rowHeight = b.h / rows.length, columnWidth = b.w / columns;
            art = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="white" stroke="#bcb0ce"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${rowHeight}" fill="${item.fill}"/>`;
            for (let r = 0; r < rows.length; r++) {
                if (r) art += `<path d="M${b.x},${b.y + r * rowHeight}h${b.w}" stroke="#d7cede"/>`;
                for (let c = 0; c < columns; c++) {
                    if (c && r === 0) art += `<path d="M${b.x + c * columnWidth},${b.y}v${b.h}" stroke="#d7cede"/>`;
                    art += `<text x="${b.x + c * columnWidth + 10}" y="${b.y + r * rowHeight + Math.min(rowHeight - 6, 25)}" fill="${item.stroke}" font-size="${Math.min(item.fontSize, 18)}" font-family="Segoe UI,Arial,sans-serif">${esc((rows[r][c] || '').slice(0, Math.max(1, Math.floor(columnWidth / 10))))}</text>`;
                }
            }
            break;
        }
        }
        if(item.aiGenerated)art+=`<text class="wb-ai-note-label" x="${b.x+8}" y="${b.y+b.h-8}" font-family="Segoe UI,Arial,sans-serif">AI-generated</text>`;
        const accessibility=item.type==='graph'?` role="img" aria-label="${esc(`${item.graphSource==='table'?item.expression:'Graph of y = '+item.expression}, x from ${item.xMin} to ${item.xMax}, y from ${item.yMin} to ${item.yMax}`)}"`:'';
        return `<g data-wb-item="${esc(item.id)}"${accessibility}>${art}</g>`;
    }
    function render() {
        const view = board.view;
        world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.zoom})`);
        let markup = board.items.map(itemMarkup).join('');
        const item = chosen();
        if (item && !drag?.drawing && tool === 'select') {
            const b = M.bounds(item), pad = 6 / view.zoom, handle = 9 / view.zoom;
            markup += `<g data-wb-selection="true"><rect x="${b.x - pad}" y="${b.y - pad}" width="${b.w + pad * 2}" height="${b.h + pad * 2}" fill="none" stroke="#8b3dff" stroke-width="${1.5 / view.zoom}" pointer-events="none"/><rect data-wb-resize="true" x="${b.x + b.w + pad - handle / 2}" y="${b.y + b.h + pad - handle / 2}" width="${handle}" height="${handle}" rx="${2 / view.zoom}" fill="white" stroke="#8b3dff" stroke-width="${1.5 / view.zoom}" style="cursor:nwse-resize"/></g>`;
        }
        world.innerHTML = markup;
        stage.style.backgroundSize = `${20 * view.zoom}px ${20 * view.zoom}px`;
        stage.style.backgroundPosition = `${view.x}px ${view.y}px`;
        $('wb-zoom').value = Math.round(view.zoom * 100); $('wb-zoom-label').textContent = `${Math.round(view.zoom * 100)}%`;
        $('wb-object-count').textContent = `${board.items.length} element${board.items.length === 1 ? '' : 's'}`;
        $('wb-recognition-mode').value = board.recognitionMode || 'auto';
        $('wb-selection-tools').hidden = !item || tool !== 'select';
        const editButton=$('wb-selection-tools').querySelector('[data-wb-action=edit]');
        editButton.disabled = !item || !['text', 'sticky', 'table', 'graph', 'file'].includes(item.type);
        editButton.title=item?.type==='file'?'Download file':'Edit element';editButton.setAttribute('aria-label',editButton.title);
        $('wb-undo').disabled = !history.canUndo; $('wb-redo').disabled = !history.canRedo;
        $('wb-tidy-existing').disabled = recognitionBusy || !board.items.some(M.canRetryRecognition);
        $('wb-selection-tools').querySelector('[data-wb-action="restore-ink"]').disabled = !item?.inkSource?.length;
        refreshReviews();
        syncDrawTools();
    }
    function add(type, options = {}) {
        const p = centre(), item = M.create(type, p.x - 100, p.y - 70, { stroke: ink, fill, width: penWidth, fontSize, ...options });
        mutate(() => { board.items.push(item); selected = item.id; });
        setTool('select'); select(item.id);
        if (['text', 'sticky', 'table', 'graph'].includes(type)) edit(item);
        return item;
    }
    function edit(item) {
        if (!item || !['text', 'sticky', 'table', 'graph', 'file'].includes(item.type)) return;
        if(item.type==='file'){downloadAttachment(item);return;}
        if(item.type==='graph'){openGraph(item);return;}
        if(item.format==='math'){openReview({boardId:board.id,editId:item.id,words:[{text:item.text,format:'math',fontSize:item.fontSize}]});return;}
        editing = item.id; $('wb-edit-text').value = item.text; $('wb-editor').hidden = false;
        $('wb-text-alternatives').innerHTML = (item.alternatives || []).filter(a => a !== item.text).map(a => `<button data-wb-alternative="${esc(a)}">${esc(a)}</button>`).join('');
        $('wb-editor').querySelector('label').firstChild.textContent = item.format === 'math' ? 'Edit equation · (a)/(b), x^(2), sqrt(x) ' : item.type === 'table' ? 'Table · tabs separate columns ' : 'Edit text · Enter for a new line ';
        $('wb-edit-text').focus(); $('wb-edit-text').select();
    }
    function finishEdit(apply) {
        if (!editing) return;
        const item = board.items.find(i => i.id === editing);
        if (item && apply) mutate(() => {
            item.text = $('wb-edit-text').value;
            if (item.format) {
                const layout = item.format === 'math' ? T.mathLayout(item.text,item.fontSize) : T.textLayout(item.text,item.fontSize,Math.max(10,item.w-8));
                item.w = Math.max(item.w,layout.w); item.h=layout.h;
                item.manualText = true;
            } else if (item.type !== 'table') item.h = Math.max(item.type === 'sticky' ? 180 : 45, wrap(item.text, Math.max(2, Math.floor((item.w - 40) / (item.fontSize * .56)))).length * item.fontSize * 1.35 + 40);
        });
        editing = null; $('wb-editor').hidden = true;
    }
    function zoomTo(value, anchor) {
        const old = board.view.zoom, next = Math.max(.25, Math.min(2, value)), s = size();
        const point = anchor || { x: s.w / 2, y: s.h / 2 };
        board.view.x = point.x - (point.x - board.view.x) * next / old;
        board.view.y = point.y - (point.y - board.view.y) * next / old;
        board.view.zoom = next; render(); saveSoon();
    }
    function fit() {
        if (!board.items.length) { board.view = { x: 0, y: 0, zoom: 1 }; render(); saveSoon(); return; }
        const b = M.allBounds(board.items), s = size(), z = Math.max(.25, Math.min(1.5, (s.w - 180) / Math.max(1, b.w), (s.h - 100) / Math.max(1, b.h)));
        board.view = { x: (s.w - b.w * z) / 2 - b.x * z + 25, y: (s.h - b.h * z) / 2 - b.y * z, zoom: z }; render(); saveSoon();
    }
    function moveView(dx, dy) {
        board.view = M.panView(board.view, dx, dy); render(); saveSoon();
    }
    function touchPosition() {
        return Gesture.midpoint(touches, svg.getBoundingClientRect());
    }
    function startTouch(event) {
        if (event.pointerType !== 'touch') return false;
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (Gesture.touchIntent(touches.size) === 'clear') {
            event.preventDefault();
            if (drag) endDrag({ pointerId: drag.pointer }, true);
            if (!multiTouchCleared) {
                multiTouchCleared = true;
                if (touchGesture) board.view = touchGesture.view;
                const before = M.clone(board.items);
                board.items = []; selected = null; touchGesture = null; cancelRecognition(true); commit(before);
                toast(before.length ? 'Whiteboard cleared. Undo restores everything.' : 'The whiteboard is already empty.');
            }
            for (const id of touches.keys()) svg.setPointerCapture(id);
            waitForTouchRelease = true; stage.classList.add('is-panning'); $('wb-eraser-cursor').hidden = true; return true;
        }
        if (Gesture.touchIntent(touches.size) === 'pan-zoom') {
            event.preventDefault();
            if (drag) endDrag({ pointerId: drag.pointer }, true);
            if (!touchGesture) touchGesture = { view: { ...board.view }, start: touchPosition() };
            for (const id of touches.keys()) svg.setPointerCapture(id);
            waitForTouchRelease = true; stage.classList.add('is-panning');
            $('wb-eraser-cursor').hidden = true; return true;
        }
        return waitForTouchRelease;
    }
    function finishTouch(event, cancelled) {
        if (!touches.has(event.pointerId)) return false;
        const wasGesture = waitForTouchRelease;
        touches.delete(event.pointerId);
        if (wasGesture) {
            if (cancelled && touchGesture) board.view = touchGesture.view;
            touchGesture = null;
            if (!touches.size) { waitForTouchRelease = false; multiTouchCleared = false; }
            stage.classList.remove('is-panning');
            if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
            render(); saveSoon();
        }
        return wasGesture;
    }
    function erase(from, to) { board.items = M.eraseInk(board.items, from, to, eraserSize / 2); }
    function updateEraserCursor(event) {
        if (tool !== 'eraser') return;
        const rect = svg.getBoundingClientRect(), cursor = $('wb-eraser-cursor');
        cursor.style.left = `${event.clientX - rect.left}px`; cursor.style.top = `${event.clientY - rect.top}px`; cursor.hidden = false;
    }
    let lastSelectionTap = null;
    svg.addEventListener('pointerdown', event => {
        if (startTouch(event)) return;
        if (event.button !== 0 && event.button !== 1) return;
        if (drag && drag.pointer !== event.pointerId) return;
        if (editing) { finishEdit(true); return; }
        event.preventDefault(); svg.focus({ preventScroll: true });
        const p = position(event), before = M.clone(board.items);
        cancelRecognition();
        updateEraserCursor(event); closeDrawMenus();
        svg.setPointerCapture(event.pointerId);
        if (tool === 'pan' || space || event.button === 1) {
            drag = { type: 'pan', pointer: event.pointerId, x: event.clientX, y: event.clientY, view: { ...board.view } }; stage.classList.add('is-panning'); return;
        }
        const targetId = event.target.closest('[data-wb-item]')?.dataset.wbItem;
        if (tool === 'select') {
            if (event.target.closest('[data-wb-resize]') && chosen()) { drag = { type: 'resize', pointer: event.pointerId, before, original: M.clone(chosen()), start: p }; return; }
            if (targetId && lastSelectionTap?.id === targetId && performance.now()-lastSelectionTap.at < 450 && Math.hypot(p.x-lastSelectionTap.x,p.y-lastSelectionTap.y)*board.view.zoom < 6) {
                lastSelectionTap=null;
                svg.releasePointerCapture(event.pointerId);
                edit(chosen()); return;
            }
            if (targetId) { select(targetId); drag = { type: 'move', pointer: event.pointerId, before, original: M.clone(chosen()), start: p }; }
            else select(null);
            return;
        }
        if (tool === 'eraser') { selected = null; erase(p, p); drag = { type: 'erase', before, last: p, pointer: event.pointerId }; render(); return; }
        if (tool === 'text' || tool === 'sticky') {
            const type = tool, item = M.create(type, p.x, p.y, { stroke: ink, fill: type === 'sticky' ? '#ffdf80' : fill, fontSize });
            board.items.push(item); commit(before); setTool('select'); select(item.id); edit(item); return;
        }
        const item = M.create(tool === 'pencil' ? 'path' : tool, p.x, p.y, { w: 0, h: 0, stroke: ink, fill, width: penWidth, ...(tool === 'pencil' ? { pen: activePen, opacity: pens[activePen].opacity } : {}) });
        board.items.push(item); selected = item.id;
        drag = { type: tool === 'pencil' ? 'pencil' : 'shape', before, start: p, pointer: event.pointerId, id: item.id, drawing: true }; render();
    });
    svg.addEventListener('pointermove', event => {
        if (touches.has(event.pointerId)) {
            touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (multiTouchCleared) { event.preventDefault(); return; }
            if (touchGesture && touches.size >= 2) {
                event.preventDefault(); board.view = M.gestureView(touchGesture.view, touchGesture.start, touchPosition()); render(); return;
            }
            if (waitForTouchRelease) return;
        }
        updateEraserCursor(event);
        if (!drag || drag.pointer !== event.pointerId) return;
        const p = position(event);
        if (drag.type === 'pan') { board.view.x = drag.view.x + event.clientX - drag.x; board.view.y = drag.view.y + event.clientY - drag.y; }
        else if (drag.type === 'move' || drag.type === 'resize') {
            const index = board.items.findIndex(i => i.id === drag.original.id), dx = p.x - drag.start.x, dy = p.y - drag.start.y;
            if (index >= 0) board.items[index] = drag.type === 'move' ? M.move(drag.original, dx, dy) : M.resize(drag.original, M.bounds(drag.original).w + dx, M.bounds(drag.original).h + dy);
        } else if (drag.type === 'erase') { erase(drag.last, p); drag.last = p; }
        else {
            const item = board.items.find(i => i.id === drag.id);
            if (drag.type === 'pencil') {
                const last = item.points[item.points.length - 1];
                if (Math.hypot(p.x - last[0], p.y - last[1]) > .6 / board.view.zoom && item.points.length < 20000) item.points.push([p.x, p.y]);
            } else {
                item.w = p.x - drag.start.x; item.h = p.y - drag.start.y;
                if (event.shiftKey && ['rectangle', 'ellipse'].includes(item.type)) { const side = Math.max(Math.abs(item.w), Math.abs(item.h)); item.w = side * (item.w < 0 ? -1 : 1); item.h = side * (item.h < 0 ? -1 : 1); }
                if (event.shiftKey && ['line', 'arrow'].includes(item.type)) { const a = Math.round(Math.atan2(item.h, item.w) / (Math.PI / 4)) * Math.PI / 4, r = Math.hypot(item.w, item.h); item.w = r * Math.cos(a); item.h = r * Math.sin(a); }
            }
        }
        render();
    });
    function endDrag(event, cancel = false) {
        if (!drag || event.pointerId !== drag.pointer) return;
        const action = drag; drag = null; stage.classList.remove('is-panning');
        if (action.type === 'move' && !cancel) {
            const p=position(event);
            lastSelectionTap=Math.hypot(p.x-action.start.x,p.y-action.start.y)*board.view.zoom<5 ? {id:action.original.id,x:p.x,y:p.y,at:performance.now()} : null;
        }
        if (cancel) { if (action.before) board.items = action.before; if (action.view) board.view = action.view; }
        else if (action.before) {
            if (action.type === 'pencil') {
                const index = board.items.findIndex(i => i.id === action.id);
                if (index >= 0) board.items[index] = M.neatenStroke(board.items[index]);
            }
            if (action.type === 'shape') {
                const item = board.items.find(i => i.id === action.id);
                if (Math.hypot(item.w, item.h) < 4) { item.w = 150; item.h = ['line', 'arrow'].includes(item.type) ? 0 : 100; }
            }
            commit(action.before);
            if (action.type === 'pencil') queueRecognition([action.id]);
        } else saveSoon();
        if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
        render();
    }
    svg.addEventListener('pointerup', event => { if (!finishTouch(event, false)) endDrag(event); if (recognitionPending.size) scheduleRecognition(); });
    svg.addEventListener('pointercancel', event => { if (!finishTouch(event, true)) endDrag(event, true); if (recognitionPending.size) scheduleRecognition(); });
    svg.addEventListener('pointerleave', () => { $('wb-eraser-cursor').hidden = true; });
    svg.addEventListener('dblclick', event => {
        // Selection redraws the SVG between clicks, so the browser can target
        // the canvas rather than the glyph on the second click.
        if (tool === 'select' && !editing) edit(board.items.find(i => i.id === event.target.closest('[data-wb-item]')?.dataset.wbItem) || chosen());
    });
    svg.addEventListener('wheel', event => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) { const rect = svg.getBoundingClientRect(); zoomTo(board.view.zoom * Math.exp(-event.deltaY * .003), { x: event.clientX - rect.left, y: event.clientY - rect.top }); }
        else moveView(-event.deltaX, -event.deltaY);
    }, { passive: false });

    function button(action, label, symbol = 'plus', extra = '') { return `<button class="wb-panel-button" data-wb-action="${action}" ${extra}>${icon(symbol)}${label}</button>`; }
    function renderPanel() {
        if (!panel) return;
        const titles = { templates: 'Start with a little structure', elements: 'Elements', text: 'Add your words', uploads: 'Images & files', style: 'Element style', projects: 'Your whiteboards' };
        $('wb-panel-title').textContent = titles[panel];
        let html = '';
        if (panel === 'templates') {
            html = '<p>A starting point for your next lesson. Templates are added to your board.</p>';
            for (const [key, title, description] of [['brainstorm', 'Brainstorm', 'One big question, many possibilities'], ['compare', 'Compare & contrast', 'Put two ideas side by side'], ['lesson', 'Lesson planner', 'Learn it. Try it. Reflect on it.']]) html += `<button class="wb-template" data-wb-template="${key}"><span class="wb-template-preview"><i></i><i></i><i></i></span><strong>${title}</strong><small>${description}</small></button>`;
        } else if (panel === 'elements') {
            html = '<p>Add a shape, then drag it into place. Use the corner handle to resize it.</p><div class="wb-shape-grid">';
            for (const [type, label, symbol] of [['rectangle', 'Rectangle', 'rectangle'], ['ellipse', 'Circle', 'circle'], ['arrow', 'Arrow', 'arrow'], ['line', 'Line', 'line'], ['sticky', 'Sticky note', 'sticky'], ['table', 'Table', 'table']]) html += `<button data-wb-add="${type}">${icon(symbol)}${label}</button>`;
            html += '</div>';
        } else if (panel === 'text') {
            html = '<p>A headline, a question, a thought. Double-click text on your board to edit it.</p>' + button('heading', 'Add a heading', 'text') + button('body', 'Add body text', 'text') + button('note', 'Add a sticky note', 'sticky');
        } else if (panel === 'uploads') {
            html = `<div class="wb-upload-area">${icon('upload')}<p>Add images and lesson files to your board.</p>${button('upload', 'Choose images', 'plus')}${button('upload-files', 'Choose files', 'folder')}</div><p>Images: PNG, JPEG, WebP.<br>Files: PDF, Word, Excel, PowerPoint, TXT, CSV.<br>Up to 10 MB each. Drag and drop either onto the board. Files stay on this device and are included in editable board backups.</p>`;
            html+=board.items.filter(item=>item.type==='file').map(item=>`<button class="wb-board-card" data-wb-download="${esc(item.id)}"><strong>${esc(item.fileName)}</strong><small>Download · ${(item.fileSize/1024).toFixed(1)} KB</small></button>`).join('');
        } else if (panel === 'style') {
            html = `<p>Choose a tool from the floating toolbar. Select an element to change its style.</p><label for="wb-ink">Ink &amp; outline</label><input id="wb-ink" type="color" value="${ink}" data-wb-property="stroke"><div class="wb-swatches">${['#3b3548', '#ef476f', '#1689f8', '#24a87c', '#8b3dff', '#f29b22'].map(c => `<button style="--swatch:${c}" data-wb-colour="${c}" aria-label="Use ${c}"></button>`).join('')}</div><label for="wb-fill">Shape &amp; sticky note colour</label><input id="wb-fill" type="color" value="${fill}" data-wb-property="fill"><label for="wb-width">Stroke width <output id="wb-width-value">${penWidth}</output></label><input id="wb-width" type="range" min="1" max="18" value="${penWidth}" data-wb-property="width"><label for="wb-font-size">Text size</label><select id="wb-font-size" data-wb-property="fontSize">${[14, 18, 24, 32, 40, 56, 72].map(v => `<option value="${v}" ${fontSize === v ? 'selected' : ''}>${v} px</option>`).join('')}</select>`;
        } else if (panel === 'projects') {
            html = '<p>Saved in this browser on this device. Download an editable file from File to keep a portable backup.</p>' + button('new', 'New whiteboard', 'plus');
            html += [...library].sort((a, b) => b.updated - a.updated).map(b => `<button class="wb-board-card ${b.id === board.id ? 'is-current' : ''}" data-wb-board="${esc(b.id)}"><strong>${esc(b.id === board.id ? board.title : b.title)}</strong><small>${b.id === board.id ? 'Current board · ' : ''}${b.items.length} elements · ${new Date(b.updated).toLocaleDateString()}</small></button>`).join('');
        }
        $('wb-panel-content').innerHTML = html;
    }
    function openPanel(name) {
        if (name === 'tools') {
            panel = ''; $('wb-panel').hidden = true;
            app.querySelectorAll('[data-wb-panel]').forEach(el => el.setAttribute('aria-expanded', 'false'));
            choosePen(activePen); return;
        }
        panel = panel === name ? '' : name;
        $('wb-panel').hidden = !panel;
        app.querySelectorAll('[data-wb-panel]').forEach(el => el.setAttribute('aria-expanded', String(el.dataset.wbPanel === panel)));
        renderPanel();
        syncDrawTools();
    }
    function changeProperty(name, value) {
        if (name === 'stroke') ink = value;
        if (name === 'fill') fill = value;
        if (name === 'width') { penWidth = Number(value); if ($('wb-width-value')) $('wb-width-value').textContent = value; }
        if (name === 'fontSize') fontSize = Number(value);
        if (chosen()) mutate(() => {
            chosen()[name] = ['width', 'fontSize'].includes(name) ? Number(value) : value;
            if (name==='fontSize' && chosen().format==='math') {
                const layout=T.mathLayout(chosen().text,chosen().fontSize);
                chosen().w=layout.w; chosen().h=layout.h;
            }
        });
    }
    function loadBoard(next) {
        cancelRecognition(true);
        finishEdit(true); saveNow(); board = M.clone(next); history = M.history(); selected = null;
        $('wb-title').value = board.title; $('wb-notes').value = board.notes;
        setTool('select'); saveNow(); renderPanel();
        queueRecognition(board.items.filter(M.canRecognize).map(i => i.id));
    }
    function template(name) {
        const p = centre(), x = p.x - 320, y = p.y - 180;
        const heading = name === 'brainstorm' ? 'What could we create?' : name === 'compare' ? 'Compare & contrast' : 'Our lesson, at a glance';
        const labels = name === 'brainstorm' ? ['An idea…', 'What if…', 'Let’s explore…'] : name === 'compare' ? ['What is similar?', 'What is different?', 'What did we discover?'] : ['Learning goals', 'Let’s practise', 'What we learned'];
        mutate(() => {
            board.items.push(M.create('text', x, y, { text: heading, w: 680, h: 70, fontSize: 36, stroke: '#4c3067' }));
            labels.forEach((text, i) => board.items.push(M.create('sticky', x + i * 235, y + 100, { text, fill: ['#ffdf80', '#ddccff', '#bce8df'][i], fontSize: 23 })));
        });
        fit(); toast('Template added. Double-click a note to make it yours.');
    }
    function download(blob, name) {
        const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function filename(extension) { return `${board.title.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'whiteboard'}.${extension}`; }
    async function exportPng() {
        finishEdit(true);
        await Promise.all(board.items.filter(i=>i.format==='math').map(i=>window.WhiteboardMath.prepare(i.text,i.fontSize,i.latexSource===i.text?i.latex:null)));
        const b = M.allBounds(board.items), pad = 45, width = Math.max(200, b.w + pad * 2), height = Math.max(150, b.h + pad * 2), scale = Math.min(2, 4096 / Math.max(width, height));
        exportingPng = true;
        let artwork;
        try { artwork = board.items.map(itemMarkup).join(''); } finally { exportingPng = false; }
        const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${b.x - pad} ${b.y - pad} ${width} ${height}"><rect x="${b.x - pad}" y="${b.y - pad}" width="${width}" height="${height}" fill="white"/>${artwork}</svg>`;
        const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
        try {
            const image = new Image(); image.src = url; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error(); download(blob, filename('png')); toast('Your whiteboard image is ready.');
        } catch (_) { toast('Could not create the image. You can still download an editable board from File.'); }
        finally { URL.revokeObjectURL(url); }
    }
    const actions = {
        new() { loadBoard(M.newBoard()); if (panel === 'projects') renderPanel(); toast('A fresh whiteboard. Your previous board is saved in Projects.'); },
        projects() { if (panel !== 'projects') openPanel('projects'); },
        import() { $('wb-import').click(); }, upload() { $('wb-upload').click(); }, 'upload-files'() { $('wb-upload-files').click(); },
        png: exportPng,
        async json() { finishEdit(true); saveNow();try{const portable=await U.pack(M.clone(board));download(new Blob([JSON.stringify(portable)],{type:'application/json'}),filename('whiteboard.json'));}catch(error){toast(error.message);} },
        heading() { add('text', { text: 'Your big idea', fontSize: 40, w: 420, h: 100 }); },
        body() { add('text', { text: 'Add a little detail', fontSize: 24 }); }, note() { add('sticky', { fill: '#ffdf80' }); }, table() { add('table'); },
        edit() { edit(chosen()); },
        'restore-ink'() { if (chosen()?.inkSource?.length) mutate(() => { board.items = M.restoreHandwriting(board.items, selected); selected = null; }); },
        style() { if (panel !== 'style') openPanel('style'); $('wb-shape-tray').hidden = true; $('wb-shapes-toggle').setAttribute('aria-expanded', 'false'); },
        duplicate() { const item = chosen(); if (item) mutate(() => { const next = M.move(M.clone(item), 25, 25); next.id = M.uid(); board.items.push(next); selected = next.id; }); },
        delete() { if (selected) mutate(() => { board.items = board.items.filter(i => i.id !== selected); selected = null; }); },
        front() { if (chosen()) mutate(() => { const item = chosen(); board.items = board.items.filter(i => i.id !== selected); board.items.push(item); }); },
    };
    app.addEventListener('click', event => {
        const target = event.target.closest('button'); if (!target) return;
        if(target.dataset.wbDownload)downloadAttachment(board.items.find(item=>item.id===target.dataset.wbDownload));
        if (target.dataset.wbTool) setTool(target.dataset.wbTool);
        if (target.dataset.wbAlternative) $('wb-edit-text').value = target.dataset.wbAlternative;
        if (target.dataset.wbPen) choosePen(target.dataset.wbPen);
        if (target.dataset.wbPanel) openPanel(target.dataset.wbPanel);
        if (target.dataset.wbAdd) add(target.dataset.wbAdd);
        if (target.dataset.wbTemplate) template(target.dataset.wbTemplate);
        if (target.dataset.wbBoard && target.dataset.wbBoard !== board.id) { const next = library.find(b => b.id === target.dataset.wbBoard); if (next) loadBoard(next); }
        if (target.dataset.wbColour) {
            if (target.closest('#wb-ink-menu')) { setPenColour(target.dataset.wbColour); closeDrawMenus(); }
            else { changeProperty('stroke', target.dataset.wbColour); renderPanel(); }
        }
        if (target.dataset.wbSize) {
            if (tool === 'eraser') eraserSize = Number(target.dataset.wbSize) * 5;
            else { pens[activePen].width = Number(target.dataset.wbSize); penWidth = pens[activePen].width; }
            syncDrawTools();
        }
        if (target.dataset.wbAction) { actions[target.dataset.wbAction]?.(); $('wb-file-menu').hidden = true; $('wb-file').setAttribute('aria-expanded', 'false'); }
    });
    app.addEventListener('change', event => { if (event.target.dataset.wbProperty) changeProperty(event.target.dataset.wbProperty, event.target.value); });
    $('wb-draw-toggle').addEventListener('click', () => {
        const open = $('wb-pen-tray').hidden;
        if (tool !== 'pencil' && tool !== 'eraser') setTool('pencil');
        showDrawTray(open);
    });
    $('wb-toolbar-close').addEventListener('click', () => { showDrawTray(false); $('wb-floating-tools').hidden = true; setTool('select'); });
    $('wb-shapes-toggle').addEventListener('click', () => {
        const open = $('wb-shape-tray').hidden; showDrawTray(false);
        $('wb-shape-tray').hidden = !open; $('wb-shapes-toggle').setAttribute('aria-expanded', String(open));
    });
    for (const [buttonId, menuId] of [['wb-ink-toggle', 'wb-ink-menu'], ['wb-stroke-toggle', 'wb-stroke-menu']]) {
        $(buttonId).addEventListener('click', () => {
            const open = $(menuId).hidden; closeDrawMenus(); $(menuId).hidden = !open; $(buttonId).setAttribute('aria-expanded', String(open));
        });
    }
    $('wb-pen-colour').addEventListener('input', event => setPenColour(event.target.value));
    $('wb-pen-size').addEventListener('input', event => {
        if (tool === 'eraser') eraserSize = Number(event.target.value);
        else { pens[activePen].width = Number(event.target.value); penWidth = pens[activePen].width; }
        syncDrawTools();
    });
    $('wb-file').addEventListener('click', () => { $('wb-file-menu').hidden = !$('wb-file-menu').hidden; $('wb-file').setAttribute('aria-expanded', String(!$('wb-file-menu').hidden)); });
    document.addEventListener('pointerdown', event => { if (!event.target.closest('.wb-menu-wrap')) { $('wb-file-menu').hidden = true; $('wb-file').setAttribute('aria-expanded', 'false'); $('wb-timer-panel').hidden = true; $('wb-timer-toggle').setAttribute('aria-expanded', 'false'); } });
    $('wb-panel-close').addEventListener('click', () => openPanel(panel));
    $('wb-title').addEventListener('input', () => { board.title = $('wb-title').value.trim() || 'Untitled whiteboard'; saveSoon(); });
    $('wb-title').addEventListener('blur', () => { $('wb-title').value = board.title; });
    $('wb-notes').addEventListener('input', () => { board.notes = $('wb-notes').value; saveSoon(); });
    $('wb-notes-toggle').addEventListener('click', () => { const open = $('wb-notes-panel').hidden; $('wb-notes-panel').hidden = !open; $('wb-notes-toggle').setAttribute('aria-expanded', String(open)); if (open) $('wb-notes').focus(); });
    $('wb-edit-done').addEventListener('click', () => { finishEdit(true); svg.focus(); });
    $('wb-edit-cancel').addEventListener('click', () => { finishEdit(false); svg.focus(); });
    function undo() { cancelRecognition(true); finishEdit(true); const items = history.undo(board.items); if (items) { board.items = items; selected = null; render(); saveSoon(); } }
    function redo() { cancelRecognition(true); finishEdit(true); const items = history.redo(board.items); if (items) { board.items = items; selected = null; render(); saveSoon(); } }
    $('wb-undo').addEventListener('click', undo); $('wb-redo').addEventListener('click', redo);
    $('wb-zoom-out').addEventListener('click', () => zoomTo(board.view.zoom - .1));
    $('wb-zoom-in').addEventListener('click', () => zoomTo(board.view.zoom + .1));
    $('wb-zoom').addEventListener('input', () => zoomTo(Number($('wb-zoom').value) / 100));
    $('wb-zoom-label').addEventListener('click', () => zoomTo(1)); $('wb-fit').addEventListener('click', fit);
    $('wb-tidy-existing').addEventListener('click', async () => {
        if (!recognitionReady) await initializeRecognition();
        if (!recognitionReady) return;
        cancelRecognition(true);
        mutate(()=>{board.items=M.retryHandwriting(board.items);selected=null;});
        queueRecognition(board.items.filter(M.canRecognize).map(i => i.id), 0);
    });
    $('wb-recognition-mode').addEventListener('change', () => {
        cancelRecognition(true); board.recognitionMode=$('wb-recognition-mode').value; saveSoon();
        queueRecognition(board.items.filter(M.canRecognize).map(i=>i.id));
    });
    $('wb-move-up').addEventListener('click', () => moveView(0, size().h * .65));
    $('wb-move-down').addEventListener('click', () => moveView(0, -size().h * .65));
    $('wb-more-space').addEventListener('click', () => { moveView(0, -size().h * .75); toast('Fresh writing space below. Use the up arrow to return to your writing.'); });
    $('wb-view-top').addEventListener('click', () => { board.view.x = 0; board.view.y = 0; render(); saveSoon(); });
    $('wb-fullscreen').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await app.requestFullscreen(); } catch (_) { toast('Full screen is unavailable in this browser.'); } });
    $('wb-help').addEventListener('click', () => $('wb-help-dialog').showModal());
    document.addEventListener('keydown', event => {
        const typing = event.target.closest('input,textarea,select,[contenteditable=true]'), command = event.ctrlKey || event.metaKey;
        if (event.key === 'Escape') { if (editing) finishEdit(false); else if (drag) endDrag({ pointerId: drag.pointer }, true); else { selected = null; showDrawTray(false); $('wb-shape-tray').hidden = true; $('wb-shapes-toggle').setAttribute('aria-expanded', 'false'); render(); } return; }
        if (editing && command && event.key === 'Enter') { event.preventDefault(); finishEdit(true); svg.focus(); return; }
        if (typing || !$('whiteboard-app').contains(document.activeElement) || $('wb-help-dialog').open || $('wb-review-dialog').open || $('wb-voice-dialog').open || $('wb-graph-dialog').open) return;
        const key = event.key.toLowerCase();
        if (command && ['z', 'y', 'd', 's'].includes(key)) {
            event.preventDefault(); if (key === 'z') (event.shiftKey ? redo : undo)(); if (key === 'y') redo(); if (key === 'd') actions.duplicate(); if (key === 's') { saveNow(); toast('Saved on this device.'); } return;
        }
        if (command || event.altKey) return;
        if (key === 'pageup' || key === 'pagedown') { event.preventDefault(); moveView(0, size().h * .75 * (key === 'pageup' ? 1 : -1)); return; }
        if (key === 'home') { event.preventDefault(); board.view.x = 0; board.view.y = 0; render(); saveSoon(); return; }
        if (key === ' ') { event.preventDefault(); space = true; stage.classList.add('is-panning'); }
        if (key === 'delete' || key === 'backspace') { event.preventDefault(); actions.delete(); }
        const shortcuts = { v: 'select', h: 'pan', p: 'pencil', e: 'eraser', r: 'rectangle', o: 'ellipse', l: 'line', a: 'arrow', n: 'sticky', t: 'text' };
        if (shortcuts[key]) { event.preventDefault(); if (key === 'p') choosePen(activePen); else if (key === 'e') choosePen('eraser'); else setTool(shortcuts[key]); }
        if (chosen() && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
            event.preventDefault(); const n = event.shiftKey ? 10 : 1, dx = key === 'arrowleft' ? -n : key === 'arrowright' ? n : 0, dy = key === 'arrowup' ? -n : key === 'arrowdown' ? n : 0;
            mutate(() => { const i = board.items.findIndex(item => item.id === selected); board.items[i] = M.move(board.items[i], dx, dy); });
        }
    });
    document.addEventListener('keyup', event => { if (event.key === ' ') { space = false; if (drag?.type !== 'pan') stage.classList.remove('is-panning'); } });
    window.addEventListener('blur', () => { space = false; if (drag) endDrag({ pointerId: drag.pointer }, true); touches.clear(); touchGesture = null; waitForTouchRelease = false; multiTouchCleared = false; stage.classList.remove('is-panning'); $('wb-eraser-cursor').hidden = true; });
    window.addEventListener('pagehide', saveNow);
    async function uploadImage(file) {
        const targetBoard=board.id;
        if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { toast('Choose a PNG, JPEG, or WebP image smaller than 10 MB.'); return; }
        const url = URL.createObjectURL(file);
        try {
            const image = new Image(); image.src = url; await image.decode();
            const ratio = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight)), canvas = document.createElement('canvas');
            canvas.width = Math.round(image.naturalWidth * ratio); canvas.height = Math.round(image.naturalHeight * ratio); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            const src = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', .85);
            if (src.length > 4e6) throw new Error('large');
            const width = Math.min(450, canvas.width), height = width * canvas.height / canvas.width;
            if(board.id!==targetBoard){toast('The board changed. Upload the image again on the correct board.');return;}
            add('image', { src, w: width, h: height }); toast('Image added. Drag to move; use the corner to resize.');
        } catch (_) { toast('This image could not be opened. Try a smaller PNG or JPEG.'); }
        finally { URL.revokeObjectURL(url); }
    }
    async function downloadAttachment(item){
        if(!item||item.type!=='file')return;
        try{download(await U.get(item.attachmentId),item.fileName);}catch(error){toast(error.message);}
    }
    async function uploadFiles(files){
        const targetBoard=board.id;
        for(const [index,file] of Array.from(files).entries()){
            if(board.id!==targetBoard){toast('Upload stopped because the board changed.');break;}
            if(['image/png','image/jpeg','image/webp'].includes(file.type)){await uploadImage(file);continue;}
            try{
                const meta=await U.store(file,M.uid());
                if(board.id!==targetBoard){toast('The board changed. Upload the file again on the correct board.');break;}
                const p=centre();add('file',{...meta,x:p.x-170,y:p.y-65+index*150});
                toast(`${meta.fileName} added. Double-click the file card to download.`);
                if(panel==='uploads')renderPanel();
            }catch(error){toast(`${file.name}: ${error.message}`);}
        }
    }
    for(const id of ['wb-upload','wb-upload-files'])$(id).addEventListener('change',async()=>{const input=$(id);await uploadFiles(input.files);input.value='';});
    for(const area of [stage,$('wb-panel')]){
        area.addEventListener('dragover',event=>event.preventDefault());
        area.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer.files.length)uploadFiles(event.dataTransfer.files);});
    }
    $('wb-import').addEventListener('change', async () => {
        const file = $('wb-import').files[0];
        try {
            if (!file || file.size > 64 * 1024 * 1024) throw new Error('Choose a board file smaller than 64 MB.');
            const raw=JSON.parse(await file.text());const imported=await U.unpack(M.restore(raw),raw.attachments,M.uid);imported.id=M.uid();loadBoard(imported); fit(); toast('Board imported. Your other boards are still in Projects.');
        } catch (error) { toast(error instanceof SyntaxError ? 'This is not a valid whiteboard file.' : error.message); }
        $('wb-import').value = '';
    });
    function updateTimer() {
        const text = `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')}`;
        $('wb-timer-display').textContent = text; $('wb-timer-label').textContent = timerInterval ? text : 'Timer';
    }
    $('wb-timer-toggle').addEventListener('click', () => { $('wb-timer-panel').hidden = !$('wb-timer-panel').hidden; $('wb-timer-toggle').setAttribute('aria-expanded', String(!$('wb-timer-panel').hidden)); });
    $('wb-timer-minutes').addEventListener('change', () => { if (!timerInterval) { timerRemaining = Math.max(1, Math.min(120, Number($('wb-timer-minutes').value) || 5)) * 60; updateTimer(); } });
    $('wb-timer-start').addEventListener('click', () => {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; $('wb-timer-start').textContent = 'Resume'; }
        else {
            if (!timerRemaining) timerRemaining = Math.max(1, Math.min(120, Number($('wb-timer-minutes').value) || 5)) * 60;
            const end = Date.now() + timerRemaining * 1000;
            timerInterval = setInterval(() => { timerRemaining = Math.max(0, Math.ceil((end - Date.now()) / 1000)); if (!timerRemaining) { clearInterval(timerInterval); timerInterval = null; $('wb-timer-start').textContent = 'Start'; toast('Time’s up! Take a moment to reflect on your work.'); } updateTimer(); }, 250);
            $('wb-timer-start').textContent = 'Pause';
        }
        updateTimer();
    });
    $('wb-timer-reset').addEventListener('click', () => { clearInterval(timerInterval); timerInterval = null; timerRemaining = Math.max(1, Math.min(120, Number($('wb-timer-minutes').value) || 5)) * 60; $('wb-timer-start').textContent = 'Start'; updateTimer(); });
    $('wb-title').value = board.title; $('wb-notes').value = board.notes; choosePen('marker'); render(); saveNow(); initializeRecognition();
})();
