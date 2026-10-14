(() => {
    const root = document.getElementById("evaporation-activity");
    if (!root) return;
    const get = (id) => root.querySelector(`#evap-${id}`);
    const items = ["mat", "burner", "tripod", "gauze", "dish", "solution"];
    let placed = [];
    let level = 100;
    let poured = false;
    let returned = false;
    let running = false;
    let hot = false;
    let timer = null;
    let coolTimer = null;
    let entries = 0;
    let prediction = "";
    const tell = (message) => { get("feedback").textContent = message; };
    function stageName() {
        if (!poured) return "Setting up";
        if (level === 0) return hot ? "Cooling" : "Cooled salt crystals";
        return running ? "Heating" : hot ? "Heating paused" : "Before heating";
    }
    function observedResidue() {
        return level === 0 ? "salt" : level <= 30 ? "crystals-solution" : "solution";
    }
    const residueLabels = { salt: "White salt crystals", "crystals-solution": "Salt crystals and some solution", solution: "Salt solution", empty: "Nothing" };
    const waterLabels = { vapour: "It escapes as water vapour", salt: "It becomes salt", collected: "It is collected in another beaker" };
    function render() {
        root.dataset.heating = String(running);
        root.dataset.hot = String(hot);
        root.dataset.phase = level === 0 ? "dry" : level <= 30 ? "crystallising" : poured ? "solution" : "setup";
        get("water").style.setProperty("--evap-level", `${poured ? level * .7 : 0}%`);
        get("crystals").style.opacity = poured && level <= 30 ? String(1 - level / 40) : "0";
        get("heat").disabled = !poured || !returned || level === 0;
        get("heat").textContent = level === 0 ? hot ? "Cooling…" : "Experiment complete" : running ? "Pause heating" : hot ? "Resume gentle heating" : "Start gentle heating";
        get("save").disabled = !poured;
        get("bench-label").textContent = poured ? `${stageName()} · water remaining: ${Math.round(level)}% (model)` : placed.length ? "Assemble the apparatus on the heatproof mat" : "Your workbench is empty";
        if (poured) {
            get("observation").textContent = level === 0 ? hot ? "The water has evaporated. White salt crystals remain. The dish is hot; allow it to cool." : "The cooled dish contains white salt crystals. The water escaped into the air and was not collected." : level <= 30 ? "The water level is low and white salt crystals are appearing. Some salt solution remains." : "The solution is clear and colourless. Watch its level fall during gentle heating; the salt stays in the dish.";
        }
    }
    function useItem(item) {
        if (!items.includes(item)) return;
        if (placed.includes(item)) return tell("That item is already on the bench. Use the controls below the apparatus.");
        if (item !== items[placed.length]) return tell(`First place the ${ { mat: "heatproof mat", burner: "Bunsen burner", tripod: "tripod stand", gauze: "wire gauze", dish: "evaporating dish", solution: "salt solution" }[items[placed.length]]} from the shelf.`);
        placed.push(item);
        get("observation").textContent = { mat: "The heatproof mat provides a stable surface beneath the burner.", burner: "The Bunsen burner rests on the mat. The flame is off.", tripod: "The tripod straddles the burner and supports the heating apparatus.", gauze: "Wire gauze rests on the tripod, supporting the dish and spreading the heat.", dish: "The empty evaporating dish rests on the wire gauze above the burner.", solution: "The beaker contains clear, colourless salt solution. Dissolved salt cannot be seen separately." }[item];
        get(item === "solution" ? "source" : item).hidden = false;
        root.querySelector(`[data-evap-item="${item}"]`).disabled = true;
        if (item === "solution") {
            get("pour").hidden = false;
            tell("Salt solution is ready in its beaker. Pour it into the evaporating dish.");
        } else tell({ mat: "Mat placed. Add the Bunsen burner.", burner: "Burner placed. Position the tripod over it.", tripod: "Tripod placed. Lay wire gauze across the top.", gauze: "Gauze placed. Put the evaporating dish on it.", dish: "Dish supported on the gauze. Bring the salt solution from the shelf." }[item]);
        render();
    }
    root.querySelectorAll("[data-evap-item]").forEach((button) => {
        button.onclick = () => useItem(button.dataset.evapItem);
        button.addEventListener("dragstart", (event) => {
            if (button.disabled) { event.preventDefault(); return; }
            event.dataTransfer.setData("application/x-evaporation", button.dataset.evapItem);
            event.dataTransfer.setData("text/plain", button.dataset.evapItem);
        });
    });
    get("bench").addEventListener("dragover", (event) => { event.preventDefault(); });
    get("bench").addEventListener("drop", (event) => {
        event.preventDefault();
        useItem(event.dataTransfer.getData("application/x-evaporation") || event.dataTransfer.getData("text/plain"));
    });
    get("pour").onclick = () => {
        if (poured || !placed.includes("solution")) return;
        poured = true;
        get("source").classList.add("evap-pouring");
        get("source").querySelector("span").textContent = "Empty beaker";
        get("pour").hidden = true;
        get("return").hidden = false;
        get("return").disabled = true;
        window.setTimeout(() => { get("return").disabled = false; }, 1500);
        tell("Salt solution poured into the dish. Return the empty beaker to the shelf.");
        render();
    };
    get("return").onclick = () => {
        if (!poured || returned) return;
        returned = true;
        get("source").classList.add("evap-returning");
        window.setTimeout(() => { if (returned) get("source").hidden = true; }, 650);
        get("return").hidden = true;
        const button = root.querySelector('[data-evap-item="solution"]');
        button.disabled = false;
        button.querySelector("strong").textContent = "Empty solution beaker";
        tell("Empty beaker returned. Predict what will remain, then start gentle heating.");
        render();
    };
    function pauseHeating() {
        window.clearInterval(timer); timer = null; running = false;
    }
    get("heat").onclick = () => {
        if (!poured || !returned || level === 0) return;
        if (running) { pauseHeating(); tell("Burner flame extinguished. Record an observation or resume heating."); render(); return; }
        if (!prediction) {
            if (!get("prediction").value) { tell("Choose what you predict will remain in the dish before heating."); get("prediction").focus(); return; }
            prediction = get("prediction").value;
            get("prediction").disabled = true;
        }
        running = true; hot = true;
        tell("Bunsen burner lit with a blue flame. Gentle heating started. Watch the liquid level fall, and record observations at any stage.");
        timer = window.setInterval(() => {
            level = Math.max(0, level - 2.5);
            if (level === 0) {
                pauseHeating();
                tell("Burner flame extinguished. White salt remains. Wait for the dish to cool.");
                coolTimer = window.setTimeout(() => {
                    hot = false; coolTimer = null;
                    tell("Dish cooled. Record your final observation: what remains and where did the water go?");
                    render();
                }, 2000);
            }
            render();
        }, 250);
        render();
    };
    get("save").onclick = () => {
        if (!poured) return;
        const residue = get("residue").value;
        const water = get("water-answer").value;
        if (!residue || !water) return tell("Choose both notebook answers, then select Record & check.");
        const expected = observedResidue();
        const score = Number(residue === expected) + Number(water === "vapour");
        const correction = `${residue === expected ? "✓ Dish contents correct." : `✗ At this stage: ${residueLabels[expected].toLowerCase()}.`} ${water === "vapour" ? "✓ Water leaves as vapour." : "✗ Water evaporates into the air; it does not turn into salt and is not collected."}`;
        const row = document.createElement("tr");
        const observation = `${get("note").value.trim() || "No written note."} Dish: ${residueLabels[residue]}. Water: ${waterLabels[water]}.`;
        if (!entries) get("log").replaceChildren();
        [stageName(), observation, `${score}/2 · ${correction}`].forEach((text) => { const cell = document.createElement("td"); cell.textContent = text; row.append(cell); });
        get("log").append(row);
        entries += 1;
        get("mark").textContent = `${score}/2. ${correction}${level === 0 && prediction ? ` Your prediction ${prediction === "salt" ? "matched" : "differed from"} the result: salt remains.` : ""} Written notes are kept for teacher review.`;
        get("note").value = "";
        get("residue").value = "";
        get("water-answer").value = "";
        tell("Observation recorded. Continue exploring or compare your earlier and final observations.");
    };
    get("reset").onclick = () => {
        pauseHeating(); window.clearTimeout(coolTimer); coolTimer = null;
        placed = []; level = 100; poured = false; returned = false; hot = false; entries = 0; prediction = "";
        ["mat", "burner", "tripod", "gauze", "dish", "source", "pour", "return"].forEach((id) => { get(id).hidden = true; });
        root.querySelectorAll("[data-evap-item]").forEach((button) => { button.disabled = false; });
        root.querySelector('[data-evap-item="solution"] strong').textContent = "Salt solution";
        get("source").classList.remove("evap-pouring", "evap-returning");
        get("source").querySelector("span").textContent = "Salt solution";
        get("prediction").disabled = false;
        ["prediction", "note", "residue", "water-answer"].forEach((id) => { get(id).value = ""; });
        get("log").innerHTML = '<tr><td colspan="3">Your checked observations will appear here.</td></tr>';
        get("mark").textContent = "";
        get("observation").textContent = "Observe the liquid level, appearance, and material remaining in the dish.";
        tell("Place the heatproof mat on the bench to begin."); render();
    };
    // Leaving the experiment pauses heat so unseen animation cannot finish a trial.
    new MutationObserver(() => {
        const app = document.getElementById("mixture-lab-app");
        if (running && (app.hidden || app.dataset.activeMethod !== "evaporation" || document.getElementById("simulation-view").hidden)) {
            pauseHeating(); render();
        }
    }).observe(document.getElementById("simulation-view"), { attributes: true, subtree: true, attributeFilter: ["hidden", "data-active-method"] });
    render();
})();
