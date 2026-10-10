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
    document.querySelectorAll("[data-lesson-tab]").forEach((tab) => {
        tab.addEventListener("click", () => selectLessonTab(tab.dataset.lessonTab));
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest("#view-experiment")) return;
        document.querySelector("#simulation-view > .lab-app").hidden = selectedLesson !== "acids";
        document.getElementById("apparatus-lab-app").hidden = selectedLesson !== "apparatus";
        selectLessonTab("procedure");
        showStage("simulation");
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

    updateProcedure();
    updateApparatusActivity();
})();
