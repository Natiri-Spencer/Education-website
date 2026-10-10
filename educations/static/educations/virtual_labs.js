(() => {
    const lab = document.querySelector(".lab-app");
    if (!lab) return;

    const stages = {
        picker: document.getElementById("grade-picker"),
        dashboard: document.getElementById("grade-dashboard"),
        lesson: document.getElementById("lesson-view"),
        simulation: document.getElementById("simulation-view"),
    };
    function showStage(name) {
        Object.entries(stages).forEach(([stageName, element]) => {
            element.hidden = stageName !== name;
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function selectLessonTab(tabName) {
        document.querySelectorAll("[data-lesson-tab]").forEach((tab) => {
            const active = tab.dataset.lessonTab === tabName;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll(".lesson-panel").forEach((panel) => {
            const active = panel.id === `lesson-panel-${tabName}`;
            panel.hidden = !active;
            panel.classList.toggle("active", active);
        });
    }

    const lessonContent = document.getElementById("lesson-content");
    const lessonConfig = {
        acids: {
            title: "Acids, Bases, and Indicators",
            template: "acids-lesson-panels",
            labTitle: "INTEGRATED SCIENCE | ACIDS, BASES, AND INDICATORS | GRADE 7",
        },
        apparatus: {
            title: "Laboratory Apparatus & Instruments",
            template: "apparatus-lesson-panels",
            labTitle: "INTEGRATED SCIENCE | LABORATORY APPARATUS & INSTRUMENTS | GRADE 7",
        },
        mixtures: {
            title: "Mixtures",
            template: "mixtures-lesson-panels",
            labTitle: "INTEGRATED SCIENCE | MIXTURES | GRADE 7",
        },
    };
    let selectedLesson = "acids";

    function openLesson(lessonName) {
        const lesson = lessonConfig[lessonName];
        if (!lesson) return;
        selectedLesson = lessonName;
        document.getElementById("lesson-page-title").textContent = lesson.title;
        document.getElementById("lesson-science-link").textContent = lesson.title;
        lessonContent.replaceChildren(document.getElementById(lesson.template).content.cloneNode(true));
        selectLessonTab("introduction");
        showStage("lesson");
    }

    document.getElementById("brand-back").addEventListener("click", (event) => {
        if (!stages.lesson.hidden) {
            event.preventDefault();
            showStage("dashboard");
        } else if (!stages.simulation.hidden) {
            event.preventDefault();
            showStage("lesson");
        }
    });
    document.getElementById("dashboard-home").addEventListener("click", () => showStage("dashboard"));
    document.getElementById("lesson-home").addEventListener("click", () => showStage("dashboard"));
    [
        ["science-toggle", "science-home"],
        ["math-toggle", "math-coming"],
        ["others-toggle", "others-coming"],
        ["lesson-science-toggle", "lesson-science-link"],
        ["lesson-math-toggle", "lesson-math-coming"],
        ["lesson-others-toggle", "lesson-others-coming"],
    ].forEach(([buttonId, panelId]) => {
        document.getElementById(buttonId).addEventListener("click", (event) => {
            const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
            event.currentTarget.setAttribute("aria-expanded", String(!expanded));
            document.getElementById(panelId).hidden = expanded;
        });
    });
    document.getElementById("lesson-science-link").addEventListener("click", () => selectLessonTab("introduction"));
    document.getElementById("science-home").addEventListener("click", () => {
        document.querySelector("#grade-dashboard .lab-card-group").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("open-acids-lesson").addEventListener("click", () => openLesson("acids"));
    document.getElementById("open-apparatus-lesson").addEventListener("click", () => openLesson("apparatus"));
    document.getElementById("open-mixtures-lesson").addEventListener("click", () => openLesson("mixtures"));
    document.querySelectorAll("[data-lesson-tab]").forEach((tab) => {
        tab.addEventListener("click", () => selectLessonTab(tab.dataset.lessonTab));
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest("#view-experiment")) return;
        document.querySelector("#simulation-view > .lab-app").hidden = selectedLesson !== "acids";
        document.getElementById("apparatus-lab-app").hidden = selectedLesson !== "apparatus";
        document.getElementById("mixture-lab-app").hidden = selectedLesson !== "mixtures";
        selectLessonTab("procedure");
        showStage("simulation");
    });
    document.addEventListener("click", (event) => {
        const methodButton = event.target.closest("[data-mixture-method]");
        if (!methodButton) return;
        startMixtureSimulation(methodButton.dataset.mixtureMethod);
    });
    document.getElementById("back-to-lesson").addEventListener("click", () => {
        if (document.fullscreenElement) document.exitFullscreen();
        showStage("lesson");
        selectLessonTab("procedure");
    });
    document.getElementById("apparatus-back-to-lesson").addEventListener("click", () => {
        if (document.fullscreenElement) document.exitFullscreen();
        showStage("lesson");
        selectLessonTab("procedure");
    });
    document.getElementById("apparatus-fullscreen").addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.getElementById("apparatus-lab-app").requestFullscreen();
        } catch {
            document.getElementById("apparatus-feedback").textContent = "Full screen is unavailable in this browser. You can continue here.";
        }
    });
    document.getElementById("mixture-back-to-lesson").addEventListener("click", () => {
        if (document.fullscreenElement) document.exitFullscreen();
        showStage("lesson");
        selectLessonTab("procedure");
    });
    document.getElementById("mixture-fullscreen").addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.getElementById("mixture-lab-app").requestFullscreen();
        } catch {
            document.getElementById("mixture-live-feedback").textContent = "Full screen is unavailable in this browser. You can continue here.";
        }
    });
    const procedureCollapse = document.querySelector(".procedure-collapse");
    procedureCollapse.addEventListener("click", () => {
        const collapsed = document.querySelector(".lab-layout").classList.toggle("procedure-collapsed");
        procedureCollapse.setAttribute("aria-expanded", String(!collapsed));
        procedureCollapse.setAttribute("aria-label", collapsed ? "Expand procedure panel" : "Collapse procedure panel");
    });

    const bench = document.getElementById("lab-bench");
    const hint = document.getElementById("lab-hint");
    const benchStatus = document.getElementById("bench-status");
    const equipment = document.getElementById("bench-equipment");
    const resultPanel = document.getElementById("indicator-result");
    const resultSwatch = document.getElementById("result-swatch");
    const resultText = document.getElementById("result-text");
    const classificationPanel = document.getElementById("classification-panel");
    const observationRows = document.getElementById("observation-rows");
    const sampleCount = document.getElementById("sample-count");
    const progressFill = document.getElementById("lab-progress-fill");
    const progressTrack = document.querySelector(".lab-progress-track");
    const stepLabel = document.getElementById("step-label");
    const progressLabel = document.getElementById("progress-label");

    const shelfData = {
        mortar: { icon: "🥣", label: "Mortar" },
        petals: { icon: "🌺", label: "Hibiscus petals" },
        pestle: { icon: "🪄", label: "Pestle" },
        water: { icon: "💧", label: "Distilled water" },
        filter: { icon: "🔻", label: "Filter funnel" },
        beaker: { icon: "🧪", label: "Indicator beaker" },
        lemon: { icon: "🍋", label: "Lemon juice" },
        soap: { icon: "🫧", label: "Soapy water" },
        "plain-water": { icon: "🚰", label: "Plain water" },
        dropper: { icon: "🧴", label: "Indicator dropper" },
    };
    const samples = {
        lemon: {
            name: "Lemon juice",
            className: "acid",
            colour: "Red / pink",
            swatch: "#c83755",
            explanation: "Acids turn the hibiscus indicator red or pink.",
        },
        soap: {
            name: "Soapy water",
            className: "base",
            colour: "Green",
            swatch: "#3b995c",
            explanation: "Bases shift the hibiscus indicator toward green.",
        },
        "plain-water": {
            name: "Plain water",
            className: "neutral",
            colour: "Purple",
            swatch: "#8056a4",
            explanation: "A neutral solution keeps the hibiscus indicator purple in this simulation.",
        },
    };
    const preparation = ["mortar", "petals", "pestle", "water", "beaker", "filter"];
    const state = { step: 1, sample: null, classified: {} };

    document.getElementById("procedure-next").addEventListener("click", () => {
        let nextItem;
        if (state.step <= 6) {
            nextItem = preparation[state.step - 1];
        } else if (state.step === 7) {
            nextItem = Object.keys(samples).find((item) => !state.classified[item]);
        } else if (state.step === 8) {
            nextItem = "dropper";
        }

        if (nextItem) {
            const itemButton = document.querySelector(`.shelf-item[data-lab-item="${nextItem}"]`);
            setHint(`Next, choose ${shelfData[nextItem].label.toLowerCase()} from the apparatus shelf.`);
            itemButton?.focus();
        } else if (state.step === 9) {
            setHint("Next, classify the solution using the colour you observed.");
            document.querySelector("[data-classification]")?.focus();
        }
    });

    const fullscreenButton = document.getElementById("toggle-lab-fullscreen");
    fullscreenButton.addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await stages.simulation.requestFullscreen();
        } catch {
            setHint("Full screen is unavailable in this browser. You can continue in this window.");
        }
    });
    document.addEventListener("fullscreenchange", () => {
        const isFullscreen = Boolean(document.fullscreenElement);
        fullscreenButton.setAttribute("aria-label", isFullscreen ? "Exit full screen" : "Enter full screen");
        fullscreenButton.title = isFullscreen ? "Exit full screen" : "Full screen";
    });

    function setHint(message) {
        hint.textContent = message;
    }

    function addEquipment(item) {
        const data = shelfData[item];
        const chip = document.createElement("div");
        chip.className = "bench-object";
        const icon = document.createElement("span");
        icon.textContent = data.icon;
        const name = document.createElement("span");
        name.textContent = data.label;
        chip.append(icon, name);
        equipment.appendChild(chip);
    }

    function progressValue() {
        const completedSamples = Object.keys(state.classified).length;
        if (state.step <= 6) return Math.round(((state.step - 1) / 15) * 100);
        if (state.step === 7) return Math.round(((6 + completedSamples * 3) / 15) * 100);
        if (state.step === 8) return Math.round(((7 + completedSamples * 3) / 15) * 100);
        if (state.step === 9) return Math.round(((8 + completedSamples * 3) / 15) * 100);
        return 100;
    }

    function updateProcedure() {
        document.querySelectorAll(".procedure-steps li").forEach((row) => {
            const number = Number(row.dataset.step);
            row.classList.remove("active", "complete");
            if (state.step === 10 || (number <= 6 && number < state.step)) {
                row.classList.add("complete");
            } else if (state.step >= 7 && state.step < 10 && number < state.step && number >= 7) {
                row.classList.add("complete");
            } else if (number === state.step) {
                row.classList.add("active");
            }
        });

        const value = progressValue();
        progressFill.style.width = `${value}%`;
        progressTrack.setAttribute("aria-valuenow", String(value));
        if (state.step <= 6) {
            stepLabel.textContent = `Preparation · step ${state.step} of 6`;
        } else if (state.step === 10) {
            stepLabel.textContent = "Experiment complete";
        } else {
            const phase = {
                7: "Choose a solution",
                8: "Add the indicator",
                9: "Classify the sample",
            }[state.step];
            stepLabel.textContent = `Sample ${Object.keys(state.classified).length + 1} of 3 · ${phase}`;
        }
        progressLabel.textContent = `${value}% complete`;
        sampleCount.textContent = `${Object.keys(state.classified).length} of 3 samples classified`;
    }

    function useItem(item) {
        if (!shelfData[item] || state.step === 10) return;

        if (state.step <= 6) {
            const expected = preparation[state.step - 1];
            if (item !== expected) {
                setHint(`For this step, choose the ${shelfData[expected].label.toLowerCase()}.`);
                return;
            }
            addEquipment(item);
            const preparationMessages = [
                "Mortar placed. Add the hibiscus petals next.",
                "Petals added. Grind them with the pestle.",
                "Petals ground. Add distilled water to release the pigment.",
                "Water added. Place an empty beaker on the workbench.",
                "Beaker ready. Place the filter funnel above it to strain the mixture.",
                "Hibiscus indicator prepared. Choose a household solution to test.",
            ];
            benchStatus.textContent = preparationMessages[state.step - 1];
            state.step += 1;
            if (state.step === 7) setHint("Choose lemon juice, soapy water, or plain water from the shelf.");
            else setHint(preparationMessages[state.step - 2]);
            updateProcedure();
            return;
        }

        if (state.step === 7) {
            if (!samples[item]) {
                setHint("Choose one of the three solution samples to test.");
                return;
            }
            if (state.classified[item]) {
                setHint("You have already classified that sample. Choose a different one.");
                return;
            }
            state.sample = item;
            addEquipment(item);
            benchStatus.textContent = `${samples[item].name} is on the workbench. Add the indicator dropper.`;
            state.step = 8;
            setHint("Now add a few drops from the hibiscus indicator dropper.");
            updateProcedure();
            return;
        }

        if (state.step === 8) {
            if (item !== "dropper") {
                setHint("Use the indicator dropper for this step.");
                return;
            }
            addEquipment(item);
            const sample = samples[state.sample];
            resultSwatch.style.backgroundColor = sample.swatch;
            resultText.textContent = `${sample.name}: ${sample.colour} indicator`;
            resultPanel.hidden = false;
            classificationPanel.hidden = false;
            benchStatus.textContent = "Observe the colour change, then classify the sample.";
            state.step = 9;
            setHint("Use the colour change to decide whether this sample is acidic, neutral, or basic.");
            updateProcedure();
        }
    }

    function classify(value) {
        if (state.step !== 9 || !state.sample) return;
        const sample = samples[state.sample];
        if (value !== sample.className) {
            setHint(`Try again. The ${sample.colour.toLowerCase()} colour is your clue; compare it with the colour guide.`);
            return;
        }

        const emptyRow = observationRows.querySelector(".empty-observation");
        if (emptyRow) emptyRow.remove();
        const row = document.createElement("tr");
        [sample.name, sample.colour, value[0].toUpperCase() + value.slice(1), sample.explanation].forEach((text) => {
            const cell = document.createElement("td");
            cell.textContent = text;
            row.appendChild(cell);
        });
        observationRows.appendChild(row);
        state.classified[state.sample] = true;
        state.sample = null;
        resultPanel.hidden = true;
        classificationPanel.hidden = true;

        if (Object.keys(state.classified).length === 3) {
            state.step = 10;
            benchStatus.textContent = "All three samples have been classified. Review your observation log.";
            setHint("Experiment complete. Review your observations: which colour indicated an acid, and which indicated a base?");
        } else {
            state.step = 7;
            benchStatus.textContent = "Choose another household solution to test.";
            setHint(`Correct — ${sample.name} is ${sample.className}. ${sample.explanation} Choose a different sample.`);
        }
        updateProcedure();
    }

    document.querySelectorAll(".shelf-item").forEach((button) => {
        button.addEventListener("click", () => useItem(button.dataset.labItem));
        button.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/plain", button.dataset.labItem);
            event.dataTransfer.effectAllowed = "copy";
        });
    });

    bench.addEventListener("dragover", (event) => {
        event.preventDefault();
        bench.classList.add("drag-over");
    });
    bench.addEventListener("dragleave", (event) => {
        if (!bench.contains(event.relatedTarget)) bench.classList.remove("drag-over");
    });
    bench.addEventListener("drop", (event) => {
        event.preventDefault();
        bench.classList.remove("drag-over");
        useItem(event.dataTransfer.getData("text/plain"));
    });

    document.querySelectorAll("[data-classification]").forEach((button) => {
        button.addEventListener("click", () => classify(button.dataset.classification));
    });

    document.getElementById("reset-lab").addEventListener("click", () => {
        state.step = 1;
        state.sample = null;
        state.classified = {};
        equipment.replaceChildren();
        observationRows.innerHTML = '<tr class="empty-observation"><td colspan="4">Your observations will appear here.</td></tr>';
        resultPanel.hidden = true;
        classificationPanel.hidden = true;
        benchStatus.textContent = "Your workbench is ready. Add the mortar to begin.";
        setHint("Start by choosing the mortar from the apparatus shelf.");
        updateProcedure();
    });

    document.querySelectorAll(".grade-switch").forEach((button) => {
        button.addEventListener("click", () => {
            const grade = button.dataset.grade;
            document.querySelectorAll(".grade-switch").forEach((choice) => {
                const active = choice === button;
                choice.classList.toggle("active", active);
                choice.setAttribute("aria-pressed", String(active));
            });
            const available = grade === "7";
            lab.hidden = !available;
            document.getElementById("grade-lab-note").textContent = available
                ? "Grade 7 sample lab selected."
                : `Grade ${grade} virtual labs are being prepared. The Grade 7 sample lab is available now.`;
        });
    });

    const apparatusTasks = [
        { prompt: "Which instrument would you use to hold and mix a liquid?", answer: "beaker", name: "Beaker", explanation: "A beaker holds, mixes, and pours liquids. Its markings give an estimate, not a precise volume." },
        { prompt: "Which instrument is best for measuring a liquid volume accurately?", answer: "cylinder", name: "Measuring cylinder", explanation: "A measuring cylinder is designed to measure liquid volume. Read the level at eye height for a more accurate result." },
        { prompt: "Which instrument helps you transfer just a few drops of liquid?", answer: "dropper", name: "Dropper", explanation: "A dropper transfers a small amount of liquid one drop at a time." },
        { prompt: "Which instrument helps you pour liquid into a container with a narrow opening?", answer: "funnel", name: "Funnel", explanation: "A funnel guides liquid into a narrow opening and can hold filter paper when filtering." },
        { prompt: "Which instrument measures how hot or cold a substance is?", answer: "thermometer", name: "Thermometer", explanation: "A thermometer measures temperature. Use one with a range suitable for the substance." },
        { prompt: "Which instrument helps you see the details of a tiny specimen?", answer: "microscope", name: "Microscope", explanation: "A microscope magnifies small specimens so details that are hard to see with the eye become visible." },
    ];
    const apparatusState = { step: 0, completed: 0 };
    const apparatusQuestion = document.getElementById("apparatus-question");
    const apparatusFeedback = document.getElementById("apparatus-feedback");
    const apparatusResult = document.getElementById("apparatus-result-card");
    const apparatusChoiceButtons = [...document.querySelectorAll("[data-apparatus-choice]")];
    const apparatusProgress = document.querySelector(".apparatus-progress-track");

    function updateApparatusActivity() {
        const finished = apparatusState.step >= apparatusTasks.length;
        const task = apparatusTasks[apparatusState.step];
        document.getElementById("apparatus-counter").textContent = finished ? "Complete" : `${apparatusState.step + 1} of ${apparatusTasks.length}`;
        document.getElementById("apparatus-progress-label").textContent = `${apparatusState.completed} of ${apparatusTasks.length} matched`;
        document.getElementById("apparatus-progress-fill").style.width = `${(apparatusState.completed / apparatusTasks.length) * 100}%`;
        apparatusProgress.setAttribute("aria-valuenow", String(apparatusState.completed));
        document.querySelectorAll("[data-apparatus-step]").forEach((item, index) => {
            item.classList.toggle("active", !finished && index === apparatusState.step);
            item.classList.toggle("complete", index < apparatusState.completed);
        });
        apparatusQuestion.textContent = finished ? "You have matched all the instruments!" : task.prompt;
        apparatusFeedback.textContent = finished ? "Review the instrument descriptions, or start again to practise." : "Select an instrument from the shelf.";
        apparatusChoiceButtons.forEach((button) => {
            button.disabled = finished;
            button.classList.remove("is-correct", "is-wrong");
        });
        apparatusResult.hidden = true;
        document.getElementById("apparatus-complete").hidden = !finished;
        document.getElementById("apparatus-next").hidden = true;
    }

    apparatusChoiceButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const task = apparatusTasks[apparatusState.step];
            if (!task) return;
            if (button.dataset.apparatusChoice !== task.answer) {
                button.classList.add("is-wrong");
                apparatusFeedback.textContent = "Not quite. Think about the job the instrument needs to do, then try again.";
                window.setTimeout(() => button.classList.remove("is-wrong"), 700);
                return;
            }
            apparatusState.completed += 1;
            button.classList.add("is-correct");
            apparatusChoiceButtons.forEach((choice) => { choice.disabled = true; });
            apparatusFeedback.textContent = "Correct. Read the instrument note, then continue.";
            document.getElementById("apparatus-result-icon").textContent = "✓";
            document.getElementById("apparatus-result-title").textContent = task.name;
            document.getElementById("apparatus-result-description").textContent = task.explanation;
            apparatusResult.hidden = false;
            document.getElementById("apparatus-next").hidden = false;
            document.getElementById("apparatus-progress-label").textContent = `${apparatusState.completed} of ${apparatusTasks.length} matched`;
            document.getElementById("apparatus-progress-fill").style.width = `${(apparatusState.completed / apparatusTasks.length) * 100}%`;
            apparatusProgress.setAttribute("aria-valuenow", String(apparatusState.completed));
            const completedStep = document.querySelector(`[data-apparatus-step="${apparatusState.step + 1}"]`);
            completedStep.classList.remove("active");
            completedStep.classList.add("complete");
        });
    });

    document.getElementById("apparatus-next").addEventListener("click", () => {
        apparatusState.step += 1;
        updateApparatusActivity();
    });
    document.getElementById("apparatus-reset").addEventListener("click", () => {
        apparatusState.step = 0;
        apparatusState.completed = 0;
        updateApparatusActivity();
    });

    const mixtureMethods = {
        evaporation: {
            title: "Evaporation",
            objective: "Separate dissolved salt from salt solution.",
            safety: "In a real lab, heat gently with teacher supervision. The water evaporates and is not collected in this method.",
            steps: [
                { title: "Place the salt solution in an evaporating dish.", description: "Salt is dissolved in the water, so it cannot be removed with filter paper.", icon: "🧂", label: "Salt solution in an evaporating dish", caption: "Salt particles are dissolved throughout the water.", color: "The salt solution is clear and colourless.", swatches: [{ label: "Clear, colourless solution", color: "#dcecf5" }] },
                { title: "Warm the solution gently.", description: "Heat supplies energy to the water. Do not cover or seal the dish.", icon: "♨️", label: "Gentle heating", caption: "Water begins to change into water vapour.", color: "The liquid remains clear and colourless; water vapour is invisible.", swatches: [{ label: "Clear, colourless solution", color: "#dcecf5" }] },
                { title: "Allow the water to evaporate.", description: "Water vapour leaves the dish. The dissolved salt stays behind and begins to form crystals.", icon: "💨", label: "Water vapour leaves; salt remains", caption: "The dissolved solid is left in the dish as the solvent evaporates.", color: "There is no colour change. As the water disappears, white salt crystals become visible.", swatches: [{ label: "White salt crystals", color: "#f4f1e8" }] },
            ],
            result: "Salt crystals remain in the dish. Evaporation recovers the dissolved solid, but it does not collect the water.",
            resultColor: "No colour change occurs: the solution starts clear and colourless, and white salt crystals remain after the water evaporates.",
            resultSwatches: [{ label: "White salt crystals", color: "#f4f1e8" }],
        },
        sublimation: {
            title: "Sublimation",
            objective: "Separate ammonium chloride from a mixture with sand.",
            safety: "Ammonium chloride vapour and dust can be harmful. This is a virtual demonstration only; real work requires a fume cupboard and teacher supervision.",
            steps: [
                { title: "Place the ammonium chloride and sand mixture in a dish.", description: "Set a cool surface, such as an inverted funnel, above the mixture to collect the separated solid.", icon: "⚗️", label: "Ammonium chloride mixed with sand", caption: "The mixture contains a solid that sublimes and a solid that does not.", color: "Ammonium chloride crystals are white; sand is usually tan or brown.", swatches: [{ label: "White ammonium chloride", color: "#f4f1e8" }, { label: "Tan sand", color: "#b89562" }] },
                { title: "Heat the mixture gently in the simulation.", description: "Ammonium chloride changes into vapour when heated. Sand remains in the dish.", icon: "♨️", label: "Ammonium chloride vapour rises", caption: "The subliming substance moves away from the non-subliming sand.", color: "The vapour may be hard to see. The white ammonium chloride separates from the tan sand.", swatches: [{ label: "White ammonium chloride", color: "#f4f1e8" }, { label: "Tan sand", color: "#b89562" }] },
                { title: "Observe the cool collecting surface.", description: "The vapour cools and deposits as solid ammonium chloride crystals. The sand stays in the dish.", icon: "❄️", label: "Crystals deposit on the cool surface", caption: "Cooling changes the vapour back into solid crystals.", color: "White crystals collect on the cool surface; tan sand remains in the dish.", swatches: [{ label: "White crystals", color: "#f4f1e8" }, { label: "Tan sand", color: "#b89562" }] },
            ],
            result: "Ammonium chloride crystals collect on the cool surface, while sand remains in the dish. The activity is a simulation because ammonium chloride vapour must not be inhaled.",
            resultColor: "The deposited ammonium chloride is white; sand remains tan or brown. The method separates the solids without a colour change.",
            resultSwatches: [{ label: "White ammonium chloride", color: "#f4f1e8" }, { label: "Tan sand", color: "#b89562" }],
        },
        distillation: {
            title: "Fractional distillation",
            objective: "Separate an ethanol and water mixture into fractions.",
            safety: "Ethanol is flammable. This is a virtual demonstration only; real distillation must use suitable electric heating and teacher supervision, away from flames.",
            steps: [
                { title: "Set up the mixture with a fractionating column and condenser.", description: "The thermometer monitors vapour temperature. The condenser cools vapour so it can be collected as liquid.", icon: "⚗️", label: "Flask, fractionating column, and condenser", caption: "The fractionating column helps separate liquids with different boiling points.", color: "Water and ethanol are both clear and colourless, so colour does not distinguish them.", swatches: [{ label: "Colourless water and ethanol", color: "#dcecf5" }] },
                { title: "Heat the mixture in a controlled way.", description: "At normal atmospheric pressure, ethanol boils at about 78 °C and water at about 100 °C. Ethanol-rich vapour rises first.", icon: "🌡️", label: "Ethanol-rich vapour rises first", caption: "The lower-boiling liquid is more volatile and enters the vapour phase more readily.", color: "There is no visible colour change. The thermometer and boiling points show which fraction is coming through.", swatches: [{ label: "Colourless liquids", color: "#dcecf5" }] },
                { title: "Cool the vapour and collect the first fraction.", description: "The condenser turns the vapour back into liquid. The collected fraction is richer in ethanol, not necessarily pure ethanol.", icon: "💧", label: "Ethanol-rich liquid is collected", caption: "Repeated vapourisation and condensation improve the separation.", color: "The collected ethanol-rich fraction and the remaining water are both clear and colourless.", swatches: [{ label: "Colourless ethanol-rich fraction", color: "#dcecf5" }] },
            ],
            result: "The first collected fraction is richer in ethanol because ethanol has the lower boiling point. Fractional distillation improves separation but does not guarantee a perfectly pure liquid.",
            resultColor: "No colour change is expected: both the ethanol-rich fraction and water are clear and colourless. Separation is indicated by temperature and collection, not colour.",
            resultSwatches: [{ label: "Colourless fractions", color: "#dcecf5" }],
        },
        chromatography: {
            title: "Paper chromatography",
            objective: "Separate soluble pigments in a prepared groundnut-skin extract.",
            safety: "Groundnuts can cause severe allergic reactions. This is a virtual demonstration; do not handle groundnuts if you have an allergy. Visible results depend on the extract and solvent used.",
            steps: [
                { title: "Prepare a coloured extract from groundnut skins.", description: "The simulation uses a prepared extract containing soluble coloured substances from the skins, rather than claiming the whole groundnut separates into visible colours.", icon: "🥜", label: "Prepared groundnut-skin extract", caption: "Only substances that dissolve in the chosen solvent can travel on the paper.", color: "The prepared extract is shown as reddish-brown. Actual extract colour can vary.", swatches: [{ label: "Illustrative reddish-brown extract", color: "#8b4a32" }] },
                { title: "Place a small spot on a pencil baseline.", description: "Keep the spot above the solvent level. Pencil graphite stays in place; ink could dissolve and affect the result.", icon: "🧻", label: "Extract spot above the solvent", caption: "The paper is placed upright with its lower edge in the solvent.", color: "The extract spot appears reddish-brown before the solvent rises.", swatches: [{ label: "Reddish-brown starting spot", color: "#8b4a32" }] },
                { title: "Let the solvent rise up the paper.", description: "Different soluble substances travel at different rates and distances, forming separate bands on the paper.", icon: "🎨", label: "Pigment bands separate", caption: "The moving solvent is the mobile phase; the paper is the stationary phase.", color: "The simulation illustrates separate red, orange, and yellow-brown bands. Actual colours depend on the extract and solvent.", swatches: [{ label: "Red band", color: "#b83b45" }, { label: "Orange band", color: "#e87832" }, { label: "Yellow-brown band", color: "#c0a243" }] },
            ],
            result: "The prepared extract may separate into bands because soluble components move different distances with the solvent. The pattern depends on the extract and solvent used.",
            resultColor: "The simulation shows red, orange, and yellow-brown pigment bands. These are illustrative; real colours and separation depend on the groundnut-skin extract and solvent.",
            resultSwatches: [{ label: "Illustrative red band", color: "#b83b45" }, { label: "Illustrative orange band", color: "#e87832" }, { label: "Illustrative yellow-brown band", color: "#c0a243" }],
        },
        filtration: {
            title: "Filtration",
            objective: "Separate insoluble sand from water.",
            safety: "The simulation uses clean materials. In a real lab, never taste laboratory mixtures or drink the filtrate.",
            steps: [
                { title: "Fold filter paper and place it in a funnel.", description: "Place the funnel over a clean collecting container. The paper acts as a barrier with tiny spaces.", icon: "🧻", label: "Filter paper in a funnel", caption: "The apparatus is ready to separate an insoluble solid from a liquid.", color: "The water is clear; dry sand is usually tan or brown.", swatches: [{ label: "Clear water", color: "#dcecf5" }, { label: "Tan sand", color: "#b89562" }] },
                { title: "Pour the sand and water mixture through the filter.", description: "Water passes through the paper. Sand particles are too large to pass through and remain on the paper.", icon: "🫗", label: "Mixture passes through the filter", caption: "The solid caught on the paper is called the residue.", color: "The mixture may look cloudy. Tan sand collects on the paper while clearer water passes through.", swatches: [{ label: "Cloudy sand-water mixture", color: "#b4a184" }, { label: "Sand residue", color: "#b89562" }] },
                { title: "Observe the residue and filtrate.", description: "Sand remains as the residue; water collected below is the filtrate. Filtration does not remove substances dissolved in water.", icon: "💧", label: "Sand residue and water filtrate", caption: "The filtrate is the liquid that has passed through the filter.", color: "The sand residue is tan or brown; the water filtrate should be clear and colourless.", swatches: [{ label: "Tan sand residue", color: "#b89562" }, { label: "Clear filtrate", color: "#dcecf5" }] },
            ],
            result: "Sand is collected as the residue on the filter paper. Water passes through as the filtrate. Dissolved substances would pass through with the water.",
            resultColor: "The residue is usually tan or brown sand. The filtrate should be clear and colourless if the sand is the only suspended material.",
            resultSwatches: [{ label: "Tan sand residue", color: "#b89562" }, { label: "Clear, colourless filtrate", color: "#dcecf5" }],
        },
    };
    const mixtureShelfItems = {
        evaporation: [
            { icon: "🥣", name: "Evaporating dish", note: "Holds the salt solution." },
            { icon: "♜", name: "Tripod and wire gauze", note: "Support the dish above the heater." },
            { icon: "♨️", name: "Heat source", note: "Use only with teacher supervision." },
            { icon: "🧤", name: "Heat-resistant tongs", note: "Move hot equipment safely in a real lab." },
            { icon: "▰", name: "Heatproof mat", note: "Protects the work surface from heat." },
            { icon: "🥽", name: "Safety goggles", note: "Protect the eyes during real lab work." },
            { icon: "🧂", name: "Salt solution", states: [
                { label: "Clear and colourless", colors: [{ label: "Clear solution", color: "#dcecf5" }] },
                { label: "Still clear; water is evaporating", colors: [{ label: "Clear solution", color: "#dcecf5" }] },
                { label: "White salt crystals are visible", colors: [{ label: "White salt", color: "#f4f1e8" }] },
                { label: "White salt crystals remain", colors: [{ label: "White salt crystals", color: "#f4f1e8" }] },
            ] },
            { icon: "💧", name: "Water", states: [
                { label: "Dissolved in the clear solution", colors: [{ label: "Colourless water", color: "#dcecf5" }] },
                { label: "Changing to invisible vapour", colors: [] },
                { label: "Vapour leaves the dish", colors: [] },
                { label: "Not collected by evaporation", colors: [] },
            ] },
        ],
        sublimation: [
            { icon: "🥣", name: "Evaporating dish", note: "Contains the solid mixture." },
            { icon: "♜", name: "Tripod and wire gauze", note: "Support the dish above the heater." },
            { icon: "♨️", name: "Heat source", note: "Virtual heating only." },
            { icon: "⏳", name: "Inverted funnel and cotton wool", note: "Cool surface collects the crystals; cotton reduces vapour escape." },
            { icon: "🛡️", name: "Fume cupboard", note: "Required for supervised real demonstrations." },
            { icon: "🧤", name: "Heat-resistant tongs", note: "For handling hot equipment after heating." },
            { icon: "⚗️", name: "Ammonium chloride", states: [
                { label: "White solid crystals", colors: [{ label: "White ammonium chloride", color: "#f4f1e8" }] },
                { label: "White vapour rises", colors: [{ label: "White vapour", color: "#e8edf1" }] },
                { label: "White crystals deposit on the cool surface", colors: [{ label: "White crystals", color: "#f4f1e8" }] },
                { label: "White solid collected separately", colors: [{ label: "White crystals", color: "#f4f1e8" }] },
            ] },
            { icon: "🏖️", name: "Sand", states: [
                { label: "Tan solid mixed with the crystals", colors: [{ label: "Tan sand", color: "#b89562" }] },
                { label: "Tan sand stays in the dish", colors: [{ label: "Tan sand", color: "#b89562" }] },
                { label: "Tan sand remains behind", colors: [{ label: "Tan sand", color: "#b89562" }] },
                { label: "Tan residue in the dish", colors: [{ label: "Tan sand residue", color: "#b89562" }] },
            ] },
        ],
        distillation: [
            { icon: "⚗️", name: "Distillation flask", note: "Holds the liquid mixture." },
            { icon: "〰️", name: "Fractionating column", note: "Encourages repeated condensation and vaporisation." },
            { icon: "🌡️", name: "Thermometer", note: "Measures vapour temperature." },
            { icon: "🚰", name: "Water-cooled condenser and tubing", note: "Cools vapour back into liquid." },
            { icon: "🧪", name: "Receiving flask", note: "Collects the distillate." },
            { icon: "♨️", name: "Controlled electric heater", note: "No naked flame near ethanol." },
            { icon: "🗜️", name: "Retort stands and clamps", note: "Hold the glassware securely in position." },
            { icon: "⚪", name: "Anti-bumping granules", note: "Promote smooth boiling; add before heating." },
            { icon: "💧", name: "Ethanol and water mixture", states: [
                { label: "Both liquids are clear and colourless", colors: [{ label: "Colourless mixture", color: "#dcecf5" }] },
                { label: "Ethanol-rich vapour rises; colourless", colors: [{ label: "Colourless vapour", color: "#dcecf5" }] },
                { label: "Ethanol-rich liquid condenses; colourless", colors: [{ label: "Colourless distillate", color: "#dcecf5" }] },
                { label: "Both fractions remain colourless", colors: [{ label: "Colourless fractions", color: "#dcecf5" }] },
            ] },
        ],
        chromatography: [
            { icon: "🪨", name: "Mortar and pestle", note: "Can crush the groundnut skins to prepare an extract." },
            { icon: "🧻", name: "Chromatography paper", note: "Stationary phase for the separation." },
            { icon: "✏️", name: "Pencil and ruler", note: "Mark a straight baseline in pencil." },
            { icon: "🧴", name: "Capillary tube or dropper", note: "Places a small extract spot on the baseline." },
            { icon: "🥛", name: "Beaker or chromatography jar", note: "Holds the solvent and paper upright." },
            { icon: "🫙", name: "Lid or watch glass", note: "Covers the chamber to reduce solvent evaporation." },
            { icon: "🗜️", name: "Paper clip or support", note: "Keeps the paper upright without touching the chamber bottom." },
            { icon: "🧪", name: "Suitable solvent", note: "Choice depends on the extract; keep the spot above the solvent." },
            { icon: "🥜", name: "Prepared groundnut-skin extract", states: [
                { label: "Reddish-brown extract", colors: [{ label: "Reddish-brown extract", color: "#8b4a32" }] },
                { label: "Reddish-brown starting spot", colors: [{ label: "Starting spot", color: "#8b4a32" }] },
                { label: "Illustrative red, orange, and yellow-brown bands", colors: [{ label: "Red band", color: "#b83b45" }, { label: "Orange band", color: "#e87832" }, { label: "Yellow-brown band", color: "#c0a243" }] },
                { label: "Pigment bands remain separated", colors: [{ label: "Red band", color: "#b83b45" }, { label: "Orange band", color: "#e87832" }, { label: "Yellow-brown band", color: "#c0a243" }] },
            ] },
        ],
        filtration: [
            { icon: "🧪", name: "Beaker", note: "Holds the sand-and-water mixture." },
            { icon: "⏳", name: "Filter funnel", note: "Supports the filter paper." },
            { icon: "🧻", name: "Filter paper", note: "Traps insoluble sand as residue." },
            { icon: "🥛", name: "Conical flask or beaker", note: "Collects the filtrate." },
            { icon: "〰️", name: "Glass rod", note: "Guides the liquid while pouring." },
            { icon: "🧷", name: "Stand and clamp", note: "Can support the funnel." },
            { icon: "🏖️", name: "Sand and water", states: [
                { label: "Cloudy mixture; tan sand is visible", colors: [{ label: "Cloudy tan mixture", color: "#b4a184" }] },
                { label: "Sand is trapped; water passes through", colors: [{ label: "Tan sand residue", color: "#b89562" }, { label: "Clearer water", color: "#dcecf5" }] },
                { label: "Tan residue and clear, colourless filtrate", colors: [{ label: "Tan sand residue", color: "#b89562" }, { label: "Clear filtrate", color: "#dcecf5" }] },
                { label: "Sand residue and colourless water filtrate", colors: [{ label: "Tan sand residue", color: "#b89562" }, { label: "Colourless filtrate", color: "#dcecf5" }] },
            ] },
        ],
    };
    let selectedMixtureMethod = "evaporation";
    let mixtureStep = 0;
    let mixtureComplete = false;

    function renderMixtureSimulation() {
        const method = mixtureMethods[selectedMixtureMethod];
        const finished = mixtureComplete;
        const step = method.steps[mixtureStep];
        document.querySelectorAll("[data-mixture-select]").forEach((button) => {
            const active = button.dataset.mixtureSelect === selectedMixtureMethod;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });
        document.getElementById("mixture-method-title").textContent = method.title;
        document.getElementById("mixture-objective").textContent = method.objective;
        document.getElementById("mixture-method-safety").textContent = method.safety;
        const shelfItems = mixtureShelfItems[selectedMixtureMethod];
        const shelfStage = finished ? 3 : mixtureStep;
        document.getElementById("mixture-shelf-count").textContent = `${shelfItems.length} items`;
        document.getElementById("mixture-shelf-state").textContent = finished ? "Final products and remaining materials" : mixtureStep === 0 ? "Equipment and starting materials" : `During step ${mixtureStep + 1}: ${step.title}`;
        document.getElementById("mixture-shelf-items").replaceChildren(...shelfItems.map((item) => {
            const row = document.createElement("li");
            row.className = "mixture-shelf-item";
            const icon = document.createElement("span");
            icon.className = "mixture-shelf-item-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = item.icon;
            const name = document.createElement("strong");
            name.textContent = item.name;
            row.append(icon, name);
            const state = item.states?.[Math.min(shelfStage, item.states.length - 1)];
            const stateColors = state?.colors || [];
            const colorGroup = document.createElement("span");
            colorGroup.className = "mixture-shelf-color-group";
            stateColors.forEach((swatch) => {
                const chip = document.createElement("span");
                chip.className = "mixture-shelf-color";
                chip.style.backgroundColor = swatch.color;
                chip.setAttribute("role", "img");
                chip.setAttribute("aria-label", swatch.label);
                chip.title = swatch.label;
                colorGroup.appendChild(chip);
            });
            row.appendChild(colorGroup);
            const detail = document.createElement("small");
            detail.textContent = state?.label || item.note;
            row.appendChild(detail);
            return row;
        }));
        document.getElementById("mixture-step-count").textContent = finished ? "Complete" : `Step ${mixtureStep + 1} of ${method.steps.length}`;
        document.getElementById("mixture-progress-fill").style.width = `${finished ? 100 : (mixtureStep / method.steps.length) * 100}%`;
        document.querySelector(".mixture-progress-track").setAttribute("aria-valuenow", String(finished ? 100 : Math.round((mixtureStep / method.steps.length) * 100)));
        document.getElementById("mixture-step-list").replaceChildren(...method.steps.map((item, index) => {
            const entry = document.createElement("li");
            entry.textContent = `Step ${index + 1}`;
            entry.classList.toggle("active", !finished && index === mixtureStep);
            entry.classList.toggle("complete", finished || index < mixtureStep);
            return entry;
        }));
        document.getElementById("mixture-step-title").textContent = finished ? "Separation complete" : step.title;
        document.getElementById("mixture-step-description").textContent = finished ? method.result : step.description;
        document.getElementById("mixture-scene").dataset.method = selectedMixtureMethod;
        document.getElementById("mixture-scene").dataset.stage = finished ? "result" : String(mixtureStep);
        document.getElementById("mixture-scene-icon").textContent = finished ? "✅" : step.icon;
        document.getElementById("mixture-scene-label").textContent = finished ? "Separated materials" : step.label;
        document.getElementById("mixture-scene-caption").textContent = finished ? method.result : step.caption;
        const colorObservation = document.getElementById("mixture-color-observation");
        const colorText = finished ? method.resultColor : step.color;
        const swatches = finished ? method.resultSwatches : step.swatches;
        document.getElementById("mixture-color-text").textContent = colorText || "No colour change is expected in this step.";
        document.getElementById("mixture-color-swatches").replaceChildren(...(swatches || []).map((swatch) => {
            const chip = document.createElement("span");
            chip.className = "mixture-color-swatch";
            chip.style.backgroundColor = swatch.color;
            chip.setAttribute("role", "img");
            chip.setAttribute("aria-label", swatch.label);
            chip.title = swatch.label;
            return chip;
        }));
        colorObservation.hidden = !colorText;
        document.getElementById("mixture-result-note").textContent = finished ? method.result : "";
        document.getElementById("mixture-result-note").hidden = !finished;
        document.getElementById("mixture-live-feedback").textContent = finished ? "Simulation complete. Choose another method or start again." : "Follow the step, then continue to see what happens.";
        document.getElementById("mixture-previous").disabled = !finished && mixtureStep === 0;
        document.getElementById("mixture-next").disabled = finished;
        document.getElementById("mixture-next").textContent = finished ? "Completed" : mixtureStep === method.steps.length - 1 ? "Show result →" : "Next step →";
    }

    function startMixtureSimulation(methodName) {
        if (!mixtureMethods[methodName]) return;
        selectedMixtureMethod = methodName;
        mixtureStep = 0;
        mixtureComplete = false;
        document.querySelector("#simulation-view > .lab-app").hidden = true;
        document.getElementById("apparatus-lab-app").hidden = true;
        document.getElementById("mixture-lab-app").hidden = false;
        renderMixtureSimulation();
        showStage("simulation");
    }

    document.querySelectorAll("[data-mixture-select]").forEach((button) => {
        button.addEventListener("click", () => {
            selectedMixtureMethod = button.dataset.mixtureSelect;
            mixtureStep = 0;
            mixtureComplete = false;
            renderMixtureSimulation();
        });
    });
    document.getElementById("mixture-next").addEventListener("click", () => {
        const method = mixtureMethods[selectedMixtureMethod];
        if (mixtureStep < method.steps.length - 1) mixtureStep += 1;
        else mixtureComplete = true;
        renderMixtureSimulation();
    });
    document.getElementById("mixture-previous").addEventListener("click", () => {
        if (mixtureComplete) mixtureComplete = false;
        else if (mixtureStep > 0) mixtureStep -= 1;
        renderMixtureSimulation();
    });
    document.getElementById("mixture-reset").addEventListener("click", () => {
        mixtureStep = 0;
        mixtureComplete = false;
        renderMixtureSimulation();
    });

    updateProcedure();
    updateApparatusActivity();
    renderMixtureSimulation();
})();
