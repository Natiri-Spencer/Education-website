(() => {
    const root = document.getElementById("commercial-lab-app");
    if (!root) return;
    const solutions = {
        acid: { name: "Dilute hydrochloric acid", pH: 2 },
        alkali: { name: "Dilute sodium hydroxide", pH: 11 },
        water: { name: "Distilled water", pH: 7 },
        vinegar: { name: "Vinegar", pH: 3 },
        soap: { name: "Soapy water", pH: 10 },
        sugar: { name: "Sugar solution", pH: 7 },
    };
    const indicators = {
        red: { name: "Red litmus paper", kind: "paper", start: "#d95765" },
        blue: { name: "Blue litmus paper", kind: "paper", start: "#527cde" },
        methyl: { name: "Methyl orange", kind: "liquid", start: "#f5ad38" },
        phenol: { name: "Phenolphthalein", kind: "liquid", start: "#e2eef4" },
    };
    function indicatorResult(sampleKey, indicatorKey) {
        const pH = solutions[sampleKey].pH;
        if (indicatorKey === "red" || indicatorKey === "blue") {
            const blue = pH > 8 || (pH === 7 && indicatorKey === "blue");
            const colour = blue ? "Blue" : "Red";
            return { colour, hex: blue ? "#527cde" : "#d95765", changed: (indicatorKey === "red") === blue };
        }
        if (indicatorKey === "methyl") {
            const red = pH < 3.1;
            return { colour: red ? "Red" : "Yellow", hex: red ? "#dd4552" : "#f0d447", changed: true };
        }
        const pink = pH >= 10;
        return { colour: pink ? "Pink" : "Colourless", hex: pink ? "#e957a6" : "#e2eef4", changed: pink };
    }
    const bench = root.querySelector("#ci-bench");
    const feedback = root.querySelector("#ci-feedback");
    const prediction = root.querySelector("#ci-prediction");
    const record = root.querySelector("#ci-record");
    let vessels = [];
    let selected = null;
    let dropperReady = false;
    let loadedIndicator = null;
    let busy = false;
    let timer = null;
    let sequence = 0;
    let notebook = [];
    const tell = (text) => { feedback.textContent = text; };
    function renderDropper() {
        const shelfDropper = root.querySelector('[data-ci-item="dropper"]');
        shelfDropper.querySelector("strong").textContent = loadedIndicator ? `${indicators[loadedIndicator].name} dropper · add drops` : "Clean dropper";
        shelfDropper.style.setProperty("--ci-dropper-fill", loadedIndicator ? indicators[loadedIndicator].start : "transparent");
        const tool = root.querySelector("#ci-dropper-tool");
        tool.hidden = !dropperReady;
        tool.draggable = Boolean(loadedIndicator);
        tool.textContent = loadedIndicator ? `${indicators[loadedIndicator].name} loaded · Add drops to selected sample` : "Empty dropper · choose a liquid indicator";
        tool.style.setProperty("--ci-start", loadedIndicator ? indicators[loadedIndicator].start : "#e2eef4");
        root.querySelector("#ci-tool-status").textContent = loadedIndicator ? `Dropper filled with ${indicators[loadedIndicator].name}. Click it or drag it onto your sample.` : "Clean dropper ready · choose methyl orange or phenolphthalein to fill it";
    }

    function shelfButton(key, name, type) {
        const button = document.createElement("button");
        button.type = "button";
        button.draggable = true;
        button.dataset.ciItem = key;
        const art = document.createElement("span");
        art.className = `ci-shelf-art ci-art-${type}`;
        art.setAttribute("aria-hidden", "true");
        if (indicators[key]) art.style.setProperty("--ci-art", indicators[key].start);
        const label = document.createElement("strong");
        label.textContent = name;
        button.append(art, label);
        return button;
    }
    Object.entries(solutions).forEach(([key, value]) => root.querySelector("#ci-samples").append(shelfButton(key, value.name, "bottle")));
    Object.entries(indicators).forEach(([key, value]) => root.querySelector("#ci-indicators").append(shelfButton(key, value.name, value.kind)));

    function activeVessel() { return vessels.find((v) => v.id === selected); }
    function renderRecord() {
        const v = activeVessel();
        record.hidden = !v?.result || busy;
        if (record.hidden) return;
        root.querySelector("#ci-observed").textContent = `${solutions[v.sample].name} + ${indicators[v.indicator].name}: ${v.result.colour}${v.result.changed ? "" : " (no change)"}.`;
        root.querySelector("#ci-inference").value = v.inference || "";
        root.querySelector("#ci-reason").value = v.reason || "";
        root.querySelector("#ci-save").disabled = Boolean(v.saved);
        root.querySelector("#ci-save").textContent = v.saved ? "Recorded in notebook" : "Record observation";
    }
    function selectVessel(v) {
        selected = v.id;
        vessels.forEach((other) => {
            other.element.classList.toggle("ci-selected", other === v);
            other.element.querySelector(".ci-select").setAttribute("aria-pressed", String(other === v));
        });
        renderRecord();
    }
    function freshPortion(v) {
        if (busy) return tell("Wait for this test's colour change to finish.");
        v.indicator = null;
        v.result = null;
        v.saved = false;
        v.inference = "";
        v.reason = "";
        v.element.classList.remove("ci-testing", "ci-paper-test", "ci-liquid-test");
        v.element.querySelector(".ci-test-tool").replaceChildren();
        v.element.querySelector(".ci-liquid").style.backgroundColor = "#e2eef4";
        v.element.querySelector(".ci-colour-label").textContent = v.sample ? "Fresh portion · colourless" : "Empty beaker";
        selectVessel(v);
        tell(v.sample ? "Fresh portion ready. Predict a colour and choose another indicator." : "Choose a sample from the shelf.");
    }
    function addBeaker() {
        if (vessels.length >= 4) return tell("Your bench holds four beakers. Remove a beaker to make space.");
        bench.querySelector(".ci-empty")?.remove();
        const v = { id: ++sequence, sample: null, indicator: null, result: null };
        const element = document.createElement("article");
        element.className = "ci-beaker-card";
        element.innerHTML = `<button type="button" class="ci-select" aria-pressed="false">Beaker ${v.id}</button><p class="ci-sample-name">Empty · choose a sample</p><div class="ci-test-tool" aria-hidden="true"></div><div class="ci-glass"><div class="ci-liquid"></div><span class="ci-graduations" aria-hidden="true">100 ─<br>50 ─</span></div><p class="ci-colour-label">Empty beaker</p><div class="ci-vessel-actions"><button type="button" class="ci-fresh">Fresh portion</button><button type="button" class="ci-remove">Remove</button></div>`;
        v.element = element;
        element.querySelector(".ci-select").onclick = () => {
            if (busy) return tell("Watch the current test finish before selecting another beaker.");
            selectVessel(v);
            tell("Beaker selected. Choose a sample or an indicator from the shelf.");
        };
        element.querySelector(".ci-fresh").onclick = () => freshPortion(v);
        element.querySelector(".ci-remove").onclick = () => {
            if (busy) return tell("Wait for the colour change to finish.");
            vessels = vessels.filter((other) => other !== v);
            element.remove();
            if (selected === v.id) {
                selected = null;
                if (vessels.length) selectVessel(vessels[0]);
            }
            renderRecord();
            tell("Beaker removed. Your notebook observations are kept.");
        };
        element.addEventListener("dragover", (event) => { event.preventDefault(); });
        element.addEventListener("drop", (event) => {
            event.preventDefault();
            event.stopPropagation();
            useShelfItem(event.dataTransfer.getData("application/x-commercial-lab") || event.dataTransfer.getData("text/plain"), v);
        });
        vessels.push(v);
        bench.append(element);
        selectVessel(v);
        tell("Clean beaker ready. Drag a sample onto it, or click a sample on the shelf.");
    }
    function testIndicator(v, key) {
        if (!v.sample) return tell("Pour a sample into this beaker before adding an indicator.");
        if (v.indicator) return tell("Use Fresh portion or another beaker for each indicator to avoid mixing indicators.");
        if (!prediction.value) { prediction.focus(); return tell("What colour do you predict? Choose your prediction before testing."); }
        if (indicators[key].kind === "liquid" && !dropperReady) return tell("Bring the clean dropper from the shelf before using a liquid indicator.");
        v.prediction = prediction.value;
        v.indicator = key;
        const result = indicatorResult(v.sample, key);
        const paper = indicators[key].kind === "paper";
        v.element.style.setProperty("--ci-start", indicators[key].start);
        v.element.style.setProperty("--ci-result", result.hex);
        const tool = document.createElement("span");
        tool.className = paper ? "ci-litmus-strip" : "ci-testing-dropper";
        v.element.querySelector(".ci-test-tool").append(tool);
        v.element.classList.add("ci-testing", paper ? "ci-paper-test" : "ci-liquid-test");
        v.element.querySelector(".ci-colour-label").textContent = paper ? "Dipping litmus paper…" : "Adding indicator drops…";
        busy = true;
        renderRecord();
        tell(paper ? "Watch the immersed end of the litmus strip. The solution itself stays colourless." : "Watch the drops enter the sample and the indicator colour spread through it.");
        timer = window.setTimeout(() => {
            timer = null;
            busy = false;
            v.result = result;
            v.element.classList.remove("ci-testing");
            if (paper) tool.style.background = `linear-gradient(to bottom, ${indicators[key].start} 45%, ${result.hex} 45%)`;
            else v.element.querySelector(".ci-liquid").style.backgroundColor = result.hex;
            v.element.querySelector(".ci-colour-label").textContent = `${result.colour}${result.changed ? "" : " · no change"}`;
            prediction.value = "";
            renderRecord();
            tell(`Observed: ${result.colour}${result.changed ? "" : " — no change"}. Record what this test can tell you, then compare another indicator.`);
        }, 2800);
    }
    function useShelfItem(key, target) {
        if (busy) return tell("Watch the colour change finish before beginning another test.");
        if (key === "beaker") return addBeaker();
        if (key === "dropper") {
            if (loadedIndicator) return useShelfItem("loaded-dropper", target);
            dropperReady = true;
            renderDropper();
            return tell(loadedIndicator ? "The dropper is filled. Click it or drag it onto a fresh sample portion." : "Dropper ready. Choose methyl orange or phenolphthalein to fill it.");
        }
        if (key === "loaded-dropper") {
            if (!loadedIndicator) return tell("Fill the dropper from a liquid indicator first.");
            const vessel = target || activeVessel();
            if (!vessel) return tell("Choose a sample beaker before dispensing.");
            selectVessel(vessel);
            testIndicator(vessel, loadedIndicator);
            if (busy) { loadedIndicator = null; renderDropper(); }
            return;
        }
        if (indicators[key]?.kind === "liquid") {
            if (!dropperReady) return tell("Bring the clean dropper from the shelf first, then choose the indicator to fill it.");
            loadedIndicator = key;
            renderDropper();
            return tell(`Dropper filled with ${indicators[key].name}. Make your prediction, then click the filled dropper or drag it onto your sample.`);
        }
        if (!solutions[key] && !indicators[key]) return;
        const v = target || activeVessel();
        if (!v) return tell("Bring a clean beaker to the bench first.");
        selectVessel(v);
        if (solutions[key]) {
            if (v.sample) return tell("This beaker already contains a sample. Use another clean beaker for a different solution.");
            v.sample = key;
            v.element.querySelector(".ci-sample-name").textContent = solutions[key].name;
            v.element.querySelector(".ci-liquid").style.backgroundColor = "#e2eef4";
            v.element.querySelector(".ci-colour-label").textContent = "Sample ready · colourless";
            return tell("Sample added. Make a prediction, then choose an indicator to test it.");
        }
        testIndicator(v, key);
    }
    root.querySelectorAll("[data-ci-item]").forEach((button) => {
        button.onclick = () => useShelfItem(button.dataset.ciItem);
        button.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("application/x-commercial-lab", button.dataset.ciItem);
            event.dataTransfer.setData("text/plain", button.dataset.ciItem);
            event.dataTransfer.effectAllowed = "copy";
        });
        if (button.dataset.ciItem === "dropper" || indicators[button.dataset.ciItem]?.kind === "liquid") {
            button.addEventListener("dragover", (event) => event.preventDefault());
            button.addEventListener("drop", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const item = event.dataTransfer.getData("application/x-commercial-lab") || event.dataTransfer.getData("text/plain");
                const bottle = button.dataset.ciItem;
                if (bottle === "dropper" && indicators[item]?.kind === "liquid") {
                    dropperReady = true;
                    useShelfItem(item);
                } else if (item === "dropper" && indicators[bottle]?.kind === "liquid") {
                    dropperReady = true;
                    useShelfItem(bottle);
                }
            });
        }
    });
    bench.addEventListener("dragover", (event) => { event.preventDefault(); });
    bench.addEventListener("drop", (event) => {
        event.preventDefault();
        useShelfItem(event.dataTransfer.getData("application/x-commercial-lab") || event.dataTransfer.getData("text/plain"));
    });
    root.querySelector("#ci-dropper-tool").onclick = () => useShelfItem("loaded-dropper");
    root.querySelector("#ci-dropper-tool").addEventListener("dragstart", (event) => {
        if (!loadedIndicator || busy) { event.preventDefault(); return; }
        event.dataTransfer.setData("application/x-commercial-lab", "loaded-dropper");
        event.dataTransfer.setData("text/plain", "loaded-dropper");
        event.dataTransfer.effectAllowed = "copy";
    });
    root.querySelector("#ci-inference").onchange = (event) => { const v = activeVessel(); if (v) v.inference = event.target.value; };
    root.querySelector("#ci-reason").oninput = (event) => { const v = activeVessel(); if (v) v.reason = event.target.value; };
    root.querySelector("#ci-save").onclick = () => {
        const v = activeVessel();
        if (!v?.result || v.saved || busy) return;
        if (!v.inference) return tell("Choose your conclusion before recording this test.");
        const opposite = v.indicator === "red" ? "blue" : "red";
        const neutralEvidence = !v.result.changed && ["red", "blue"].includes(v.indicator) && notebook.some((entry) => entry.sample === v.sample && entry.indicator === opposite && !entry.changed);
        let supported = "inconclusive";
        if (neutralEvidence) supported = "neutral";
        else if ((v.indicator === "blue" && v.result.colour === "Red") || (v.indicator === "methyl" && v.result.colour === "Red")) supported = "acid";
        else if ((v.indicator === "red" && v.result.colour === "Blue") || (v.indicator === "phenol" && v.result.colour === "Pink")) supported = "base";
        const matched = v.prediction === v.result.colour || (v.prediction === "No change" && !v.result.changed);
        const conclusionCorrect = v.inference === supported;
        const score = Number(matched) + Number(conclusionCorrect);
        const correction = supported === "inconclusive" ? "This test alone is inconclusive. Compare another indicator on a fresh portion." : supported === "neutral" ? "Both red and blue litmus stayed unchanged on separate portions, supporting a neutral solution." : `The observed ${v.result.colour.toLowerCase()} supports ${supported === "acid" ? "an acid" : "a base"}.`;
        const log = root.querySelector("#ci-log");
        if (!notebook.length) log.replaceChildren();
        const row = document.createElement("tr");
        [solutions[v.sample].name, indicators[v.indicator].name, v.prediction, `${v.result.colour}${v.result.changed ? "" : " (no change)"}`, `${v.inference}: ${v.reason || "No evidence note entered."}`].forEach((text) => {
            const cell = document.createElement("td"); cell.textContent = text; row.append(cell);
        });
        log.append(row);
        const markingCell = document.createElement("td");
        markingCell.className = "ci-marking";
        const grade = document.createElement("strong");
        grade.textContent = `${score}/2 · ${score === 2 ? "Correct" : "Review"}`;
        grade.className = score === 2 ? "ci-mark-correct" : "ci-mark-review";
        const notes = document.createElement("p");
        notes.textContent = `Prediction: ${matched ? "✓" : `✗ Expected ${v.result.colour}${v.result.changed ? "" : " / No change"}`}. Conclusion: ${conclusionCorrect ? "✓" : "✗"}. ${correction}`;
        markingCell.append(grade, notes);
        row.append(markingCell);
        notebook.push({ sample: v.sample, indicator: v.indicator, changed: v.result.changed });
        v.saved = true;
        root.querySelector("#ci-test-count").textContent = `${notebook.length} tests recorded`;
        tell(`${matched ? "Your prediction matched." : "Your prediction differed from the observation."} ${v.inference === supported ? "Your conclusion is supported by your recorded evidence." : `Reconsider your conclusion: the evidence supports ${supported === "inconclusive" ? "more than one possibility; compare another indicator" : supported}.`} Try a fresh portion to compare.`);
        renderRecord();
    };
    root.querySelector("#ci-reset").onclick = () => {
        window.clearTimeout(timer); timer = null; busy = false;
        vessels = []; selected = null; notebook = []; sequence = 0; dropperReady = false; loadedIndicator = null;
        renderDropper();
        root.querySelector("#ci-dropper-tool").hidden = true;
        bench.innerHTML = '<p class="ci-empty">Drop a clean beaker here<br><small>Compare up to four beakers side by side.</small></p>';
        root.querySelector("#ci-log").innerHTML = '<tr><td colspan="6">Your recorded tests will appear here.</td></tr>';
        root.querySelector("#ci-test-count").textContent = "0 tests recorded";
        root.querySelector("#ci-tool-status").textContent = "Dropper: on the shelf";
        prediction.value = ""; renderRecord(); tell("New investigation ready. Choose a clean beaker to begin.");
    };
    root.querySelector("#commercial-fullscreen").onclick = async () => {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); }
        catch { tell("Full screen is unavailable. Continue your investigation here."); }
    };
})();
