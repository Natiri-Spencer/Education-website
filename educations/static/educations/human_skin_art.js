(() => {
    'use strict';
    const model = window.HumanSkinModel;

    function shape(ctx, path, paint, border, width = 1) {
        const outline = new Path2D(path);
        if (paint) {
            ctx.fillStyle = paint;
            ctx.fill(outline);
        }
        if (border) {
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = border;
            ctx.lineWidth = width;
            ctx.stroke(outline);
        }
    }

    function blend(ctx, y1, y2, from, to) {
        const gradient = ctx.createLinearGradient(0, y1, 0, y2);
        gradient.addColorStop(0, from);
        gradient.addColorStop(1, to);
        return gradient;
    }

    function layer(ctx, thickness, colours, texture) {
        const top = 'M-240 0 L240 0 L294 -40 L-186 -40 Z';
        shape(ctx, `M240 0 L294 -40 V${thickness - 40} L240 ${thickness} Z`, colours[2], colours[3]);
        shape(ctx, top, colours[0], colours[3]);
        const face = `M-240 0 H240 V${thickness} H-240 Z`;
        shape(ctx, face, blend(ctx, 0, thickness, colours[0], colours[1]), colours[3]);
        ctx.save();
        ctx.clip(new Path2D(face));
        texture(ctx);
        ctx.restore();
    }

    const duct = 'M10 61 C10 47 2 30 0 0 C-4 -23 3 -35 -9 -54 Q-20 -65 -10 -78';
    // The trace follows the same curve as the duct that was just checked.
    const ductRoute = new Path2D(duct);
    const sweatRoute = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    sweatRoute.setAttribute('d', 'M499 305 C498 293 479 299 469 289 C469 275 461 258 459 228 C455 205 462 193 450 174 Q439 163 449 150 Q450 145 452 133');
    const routeLength = sweatRoute.getTotalLength();
    function renderPart(ctx, id, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        const draw = (d, fill, stroke, width) => shape(ctx, d, fill, stroke, width);
        switch (id) {
            case 'epidermis':
                layer(ctx, 31, ['#b97858', '#984e43', '#80423a', '#754536'], () => {
                    for (let x = -232; x < 240; x += 14) {
                        draw(`M${x} 12 q7 2 13 0 m-8 10 q7 3 13 0`, null, '#d49b78', 1.3);
                    }
                    draw('M-240 5 H240', null, '#e7ae88', 2);
                });
                break;
            case 'dermis':
                layer(ctx, 178, ['#f0bbb1', '#e49d91', '#bf726f', '#a36260'], () => {
                    for (let i = 0; i < 45; i++) {
                        const x = -248 + (i * 67) % 486;
                        const y = 10 + (i * 37) % 164;
                        draw(`M${x} ${y} q14 -10 32 -1 t27 0`, null, i % 2 ? '#e29b99' : '#f7c8ba', 2);
                    }
                });
                break;
            case 'fat':
                layer(ctx, 68, ['#f8d48c', '#e2a749', '#c58a3f', '#9f763d'], () => {
                    for (let i = 0; i < 26; i++) {
                        const x = -239 + (i % 13) * 38 + (i > 12 ? 15 : 0);
                        const y = i > 12 ? 54 : 19;
                        ctx.beginPath();
                        ctx.ellipse(x, y, 18, 15, 0.2, 0, Math.PI * 2);
                        ctx.fillStyle = '#ffe6a8';
                        ctx.fill();
                        ctx.strokeStyle = '#d8a249';
                        ctx.stroke();
                    }
                });
                break;
            case 'follicle':
                draw('M-33 -170 C-42 -140 -43 -119 -35 -93 C-26 -62 -19 -44 -17 -16 C-23 12 -7 29 8 20 C26 12 19 -8 10 -23 C8 -55 -8 -77 -15 -100 C-22 -125 -23 -146 -19 -170 Z',
                    blend(ctx, -170, 22, '#db927c', '#ad5f62'), '#7f444e', 2.4);
                draw('M-28 -169 C-35 -126 -27 -105 -21 -82 C-11 -54 -6 -31 -4 -8 Q10 5 2 16', null, '#f5b7a3', 5);
                break;
            case 'hair':
                draw('M6 35 C2 11 -6 -17 -13 -44 C-24 -81 -35 -111 -23 -129 C-19 -175 -26 -188 -57 -216',
                    null, '#3e241e', 7);
                draw('M4 30 C-2 -10 -10 -40 -21 -73 C-27 -95 -31 -112 -25 -129 Q-18 -178 -54 -213',
                    null, '#9a6142', 1.7);
                break;
            case 'gland':
                draw('M0 -19 C10 -9 29 -15 30 -3 C31 9 0 11 -7 1 C-19 -13 11 -16 22 -8 C39 2 16 18 -3 16 C-20 14 -22 -4 -9 -10 C2 -16 29 -8 24 8 C18 25 -23 20 -29 5 C-34 -9 -18 -24 -3 -13 C6 -5 -3 11 -14 11',
                    null, '#235861', 8);
                draw('M0 -19 C10 -9 29 -15 30 -3 C31 9 0 11 -7 1 C-19 -13 11 -16 22 -8 C39 2 16 18 -3 16 C-20 14 -22 -4 -9 -10 C2 -16 29 -8 24 8 C18 25 -23 20 -29 5 C-34 -9 -18 -24 -3 -13 C6 -5 -3 11 -14 11',
                    null, '#65b7b9', 4);
                break;
            case 'duct':
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#235861';
                ctx.lineWidth = 8;
                ctx.stroke(ductRoute);
                ctx.strokeStyle = '#a6ded9';
                ctx.lineWidth = 3;
                ctx.stroke(ductRoute);
                break;
            case 'pore':
                draw('M-10 -1 Q-1 -11 10 -3 Q4 7 -10 -1Z', '#30232b', '#e6b28f', 3);
                draw('M-5 -2 Q0 -5 5 -2', null, '#afdedb', 1);
                break;
            case 'oil':
                draw('M-33 1 L-7 -9 C-15 -23 5 -31 11 -18 C27 -30 42 -14 32 -2 C49 11 26 26 15 16 C0 25 -15 11 -9 3 Z',
                    blend(ctx, -30, 24, '#ffe1a4', '#d89352'), '#a26648', 2.5);
                draw('M-7 -3 Q6 -4 12 -15 M-5 -1 Q8 -1 18 11', null, '#bd8050', 2);
                break;
            case 'vessels':
                draw('M-161 2 Q-120 -9 -76 -4 T0 -2 T78 -4 T164 -2 M-79 -4 q-18 -10 -5 -20 M8 -1 q10 -35 38 -33 M86 -5 q21 -5 28 -25',
                    null, '#ac3c57', 5);
                draw('M-158 9 Q-117 0 -77 4 T0 6 T80 3 T165 6 M-36 4 q-28 -6 -34 -22 M87 4 q18 -24 52 -15',
                    null, '#554789', 4);
                break;
            case 'nerves':
                draw('M6 59 Q25 24 0 0 Q-18 -20 -16 -48 M0 0 Q1 -25 19 -39 M5 8 Q-20 -5 -36 -25', null, '#795328', 6);
                draw('M6 59 Q25 24 0 0 Q-18 -20 -16 -48 M0 0 Q1 -25 19 -39 M5 8 Q-20 -5 -36 -25', null, '#f7c956', 3);
                break;
        }
        ctx.restore();
    }

    const thumbnail = {
        epidermis: [59, 31, .16], dermis: [59, 14, .16], fat: [59, 26, .16],
        hair: [65, 54, .22], follicle: [63, 52, .25], gland: [60, 34, 1],
        duct: [61, 37, .40], pore: [60, 34, 2.6], oil: [54, 35, .85],
        vessels: [60, 41, .30], nerves: [64, 35, .50],
    };

    function preview(canvas, id) {
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        renderPart(ctx, id, ...thumbnail[id]);
    }

    function board(canvas, placements, progress = null, moving = null) {
        const ctx = canvas.getContext('2d');
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        ctx.clearRect(0, 0, 720, 480);
        for (const id of ['fat','dermis','epidermis','vessels','nerves','follicle','oil','hair','gland','duct','pore']) {
            const pos = model.point[placements[id]];
            if (pos && id !== moving?.id) renderPart(ctx, id, pos.x, pos.y);
        }
        if (moving) {
            ctx.globalAlpha = .65;
            renderPart(ctx, moving.id, moving.x, moving.y);
            ctx.globalAlpha = 1;
        }
        if (progress !== null) {
            const {x, y} = sweatRoute.getPointAtLength(progress * routeLength);
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#23d3f1';
            ctx.fill();
            ctx.strokeStyle = '#07576b';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    window.HumanSkinArt = {preview, board};
})();
