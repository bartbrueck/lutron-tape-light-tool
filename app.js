(() => {
  const FULL_REEL_FT = 16.4;
  const DUAL_END_MAX_FT = FULL_REEL_FT * 2;
  const POWER_LIMIT_W = 96;
  const CONTROLLER_STANDBY_A = 0.01132;
  const RUN_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const MAX_RUNS = 12;

  const tapeTypes = [
    {
      id: "lumaris-rgb-tw",
      label: "Lumaris RGB + Tunable White",
      detail: "1800K-4000K / RGB",
      droopPerVolt: 0.17,
      currentFullReel: 1.472,
      calculatedResistance: 0.75927109974424556,
      maxControllerFt: 32.8
    },
    {
      id: "lumaris-tw",
      label: "Lumaris Tunable White",
      detail: "1800K-4000K",
      droopPerVolt: 0.308,
      currentFullReel: 1.1967,
      calculatedResistance: 0.39,
      maxControllerFt: 49.2
    },
    {
      id: "rania-long",
      label: "Rania Long Run",
      detail: "1800K-5500K",
      droopPerVolt: 0.1912,
      currentFullReel: 1.715,
      calculatedResistance: 0.46,
      maxControllerFt: 32.8
    },
    {
      id: "rania-high",
      label: "Rania High Output",
      detail: "1800K-5500K",
      droopPerVolt: 0.2,
      currentFullReel: 3.02,
      calculatedResistance: 0.57,
      maxControllerFt: 16.4
    }
  ];

  const tapeTypeById = Object.fromEntries(tapeTypes.map((item) => [item.id, item]));

  const awgOhmsPerFt = {
    12: 0.003176,
    14: 0.00505,
    16: 0.00804,
    18: 0.01278,
    20: 0.021,
    22: 0.03228,
    24: 0.05134,
    26: 0.08162
  };

  const wireSizes = Object.keys(awgOhmsPerFt).map(Number);

  const simpleExample = {
    projectName: "",
    powerMode: "separate",
    sharedPower: {
      distance: 0,
      wireSize: 20
    },
    controllers: [
      {
        ...blankController(),
        enabled: true,
        tapeType: "lumaris-rgb-tw",
        runCount: 1,
        distancePowerToController: 20,
        wireSizePowerToController: 20,
        runs: [
          {
            ...blankRun(),
            distanceControllerToTapeStart: 8,
            wireSizeToTapeStart: 22,
            tapeLength: 12
          }
        ]
      },
      blankController(),
      blankController()
    ]
  };

  const workbookExample = {
    projectName: "",
    powerMode: "shared",
    sharedPower: {
      distance: 5,
      wireSize: 20
    },
    controllers: [
      {
        ...blankController(),
        enabled: true,
        tapeType: "lumaris-rgb-tw",
        runCount: 2,
        distanceSplitToController: 15,
        wireSizeSplitToController: 20,
        tapeMode: "shared",
        distanceControllerToTapeSplit: 2,
        wireSizeControllerToTapeSplit: 22,
        runs: [
          {
            ...blankRun(),
            distanceSplitToTapeStart: 32,
            wireSizeToTapeStart: 22,
            tapeLength: 22
          },
          blankRun()
        ]
      },
      blankController(),
      blankController()
    ]
  };

  let state = clone(simpleExample);
  let activePreset = "simple";
  const collapsedControllers = new Set();
  let mapPan = null;
  let suppressNextMapJump = false;

  const els = {
    projectName: document.querySelector("#projectName"),
    sharedPowerFields: document.querySelector("#sharedPowerFields"),
    controllers: document.querySelector("#controllers"),
    simpleExample: document.querySelector("#simpleExample"),
    workbookExample: document.querySelector("#workbookExample"),
    clearAll: document.querySelector("#clearAll"),
    systemMap: document.querySelector("#systemMap"),
    panMapLeft: document.querySelector("#panMapLeft"),
    panMapRight: document.querySelector("#panMapRight"),
    overallStatus: document.querySelector("#overallStatus"),
    overallPill: document.querySelector("#overallPill"),
    summaryMetrics: document.querySelector("#summaryMetrics"),
    issueList: document.querySelector("#issueList"),
    statusStrip: document.querySelector("#statusStrip")
  };

  function blankRun() {
    return {
      distanceControllerToTapeStart: 0,
      distanceSplitToTapeStart: 0,
      wireSizeToTapeStart: 22,
      tapeLength: 0,
      feedBothEnds: false,
      farEndDistance: 0,
      farEndWireSize: 22
    };
  }

  function blankController() {
    return {
      enabled: false,
      tapeType: "lumaris-rgb-tw",
      runCount: 1,
      distancePowerToController: 0,
      wireSizePowerToController: 20,
      distanceSplitToController: 0,
      wireSizeSplitToController: 20,
      tapeMode: "direct",
      distanceControllerToTapeSplit: 0,
      wireSizeControllerToTapeSplit: 22,
      extraShortTapeLength: 0,
      runs: [blankRun()]
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clampRunCount(value) {
    return Math.min(MAX_RUNS, Math.max(1, Math.round(number(value) || 1)));
  }

  function normalizeState(targetState) {
    targetState.controllers.forEach((controller) => {
      controller.runCount = clampRunCount(controller.runCount);
      while (controller.runs.length < controller.runCount) {
        controller.runs.push(blankRun());
      }
    });
  }

  function fmt(value, digits = 1) {
    if (!Number.isFinite(value)) return "0";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    });
  }

  function ft(value) {
    return `${fmt(value, 1)} ft`;
  }

  function watts(value) {
    return `${fmt(value, 1)} W`;
  }

  function amps(value) {
    return `${fmt(value, 2)} A`;
  }

  function pct(value) {
    return `${fmt(value, 1)}%`;
  }

  function ohmsForWire(wireSize) {
    return awgOhmsPerFt[Number(wireSize)] ?? awgOhmsPerFt[22];
  }

  function currentForTapeLength(lengthFt, tape) {
    return (Math.max(0, number(lengthFt)) / FULL_REEL_FT) * tape.currentFullReel;
  }

  function fadeBucket(percent) {
    if (percent <= 0) return { label: "No tape", level: "neutral" };
    if (percent < 25) return { label: "Within recommended range", level: "ok" };
    if (percent <= 40) return { label: "May be visible", level: "warn" };
    return { label: "Not recommended", level: "fail" };
  }

  function startFadeBucket(percent, hasTape) {
    if (!hasTape) return { label: "No tape", level: "neutral" };
    if (percent <= 0) return { label: "Within recommended range", level: "ok" };
    return fadeBucket(percent);
  }

  function issue(level, title, detail) {
    return { level, title, detail };
  }

  function runDistance(controller, run) {
    return controller.tapeMode === "shared"
      ? Math.max(0, number(run.distanceSplitToTapeStart))
      : Math.max(0, number(run.distanceControllerToTapeStart));
  }

  function internalFadeForSegment(lengthFt, currentA, tape) {
    return tape.droopPerVolt * (currentA * ((lengthFt / FULL_REEL_FT) * tape.calculatedResistance)) * 100;
  }

  function addWireLength(summary, wireSize, distanceFt) {
    const length = Math.max(0, number(distanceFt));
    if (length <= 0) return;

    const normalizedWireSize = Number(wireSize);
    const existing = summary.find((item) => item.wireSize === normalizedWireSize);
    if (existing) {
      existing.length += length;
      return;
    }

    summary.push({
      wireSize: normalizedWireSize,
      length
    });
  }

  function wireLengthText(summary) {
    const parts = summary
      .filter((item) => item.length > 0)
      .map((item) => `${ft(item.length)} of ${item.wireSize} AWG`);

    if (!parts.length) return "0 ft";
    if (parts.length === 1) return parts[0];
    return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  }

  function summarizeWireLengths(inputState, controllers) {
    const summary = [];
    const activeControllers = controllers.filter((controller) => controller.enabled);

    if (inputState.powerMode === "shared" && activeControllers.length) {
      addWireLength(summary, inputState.sharedPower.wireSize, inputState.sharedPower.distance);
    }

    activeControllers.forEach((controller) => {
      if (inputState.powerMode === "shared") {
        addWireLength(summary, controller.wireSizeSplitToController, controller.distanceSplitToController);
      } else {
        addWireLength(summary, controller.wireSizePowerToController, controller.distancePowerToController);
      }

      const activeTapeRuns = controller.runs.filter((run) => run.tapeLength > 0);
      if (controller.tapeMode === "shared" && activeTapeRuns.length) {
        addWireLength(summary, controller.wireSizeControllerToTapeSplit, controller.distanceControllerToTapeSplit);
      }

      activeTapeRuns.forEach((run) => {
        const nearDistance = runDistance(controller, run);
        addWireLength(summary, run.wireSizeToTapeStart, nearDistance);

        if (run.feedBothEnds) {
          addWireLength(summary, run.farEndWireSize || run.wireSizeToTapeStart, run.farEndDistance || nearDistance);
        }
      });
    });

    return {
      summary,
      totalLength: summary.reduce((sum, item) => sum + item.length, 0),
      text: wireLengthText(summary)
    };
  }

  function evaluate(inputState) {
    normalizeState(inputState);
    const issues = [];
    const preparedControllers = inputState.controllers.map((controller, controllerIndex) => {
      const tape = tapeTypeById[controller.tapeType] || tapeTypes[0];
      const activeRuns = controller.runs.slice(0, controller.runCount);
      const runs = activeRuns.map((run, runIndex) => {
        const tapeLength = Math.max(0, number(run.tapeLength));
        return {
          ...run,
          runName: RUN_NAMES[runIndex] || String(runIndex + 1),
          tapeLength,
          tapeCurrent: controller.enabled ? currentForTapeLength(tapeLength, tape) : 0
        };
      });
      const extraShortTapeLength = Math.max(0, number(controller.extraShortTapeLength));
      const extraCurrent = controller.enabled ? currentForTapeLength(extraShortTapeLength, tape) : 0;
      const totalTapeCurrent = runs.reduce((sum, run) => sum + run.tapeCurrent, 0) + extraCurrent;
      const inputCurrent = controller.enabled ? totalTapeCurrent + CONTROLLER_STANDBY_A : 0;
      const totalTapeLength = runs.reduce((sum, run) => sum + run.tapeLength, 0) + extraShortTapeLength;

      return {
        ...controller,
        controllerIndex,
        tape,
        runs,
        extraShortTapeLength,
        extraCurrent,
        totalTapeCurrent,
        inputCurrent,
        totalTapeLength
      };
    });

    const totalCurrent = preparedControllers.reduce((sum, controller) => sum + controller.inputCurrent, 0);
    const powerW = 24 * totalCurrent;
    const sharedPowerDropV =
      inputState.powerMode === "shared"
        ? ohmsForWire(inputState.sharedPower.wireSize) *
          Math.max(0, number(inputState.sharedPower.distance)) *
          totalCurrent
        : 0;

    if (powerW >= POWER_LIMIT_W) {
      issues.push(issue("fail", "Power box is overloaded", `${watts(powerW)} is above the 96 W limit.`));
    } else if (powerW > 0) {
      issues.push(issue("ok", "Power box load is okay", `${watts(powerW)} of 96 W.`));
    }

    const controllers = preparedControllers.map((controller) => {
      if (!controller.enabled) {
        return {
          ...controller,
          controllerDropV: 0,
          tapeSplitDropV: 0,
          tapeStatus: { label: "Off", level: "neutral" },
          runResults: controller.runs.map((run) => emptyRunResult(run)),
          worstStartFade: 0,
          worstRunFade: 0
        };
      }

      const controllerDropV =
        inputState.powerMode === "shared"
          ? sharedPowerDropV +
            ohmsForWire(controller.wireSizeSplitToController) *
              Math.max(0, number(controller.distanceSplitToController)) *
              controller.inputCurrent
          : ohmsForWire(controller.wireSizePowerToController) *
            Math.max(0, number(controller.distancePowerToController)) *
            controller.inputCurrent;

      const tapeSplitDropV =
        controller.tapeMode === "shared"
          ? controllerDropV +
            ohmsForWire(controller.wireSizeControllerToTapeSplit) *
              Math.max(0, number(controller.distanceControllerToTapeSplit)) *
              controller.totalTapeCurrent
          : controllerDropV;

      const overControllerTapeLimit = controller.totalTapeLength > controller.tape.maxControllerFt;
      const tapeStatus = overControllerTapeLimit
        ? { label: "Too much tape", level: "fail" }
        : { label: "Tape length okay", level: "ok" };

      if (overControllerTapeLimit) {
        issues.push(
          issue(
            "fail",
            `Controller ${controller.controllerIndex + 1} has too much tape`,
            `${ft(controller.totalTapeLength)} entered. ${controller.tape.label} allows ${ft(
              controller.tape.maxControllerFt
            )} per controller.`
          )
        );
      }

      const runResults = controller.runs.map((run) => {
        const hasTape = run.tapeLength > 0;
        const baseDropV = tapeSplitDropV;
        const nearDistance = runDistance(controller, run);
        const nearWireSize = run.wireSizeToTapeStart;
        const lengthLimit = run.feedBothEnds ? DUAL_END_MAX_FT : FULL_REEL_FT;

        let fadeAtTapeStartPct = 0;
        let fadeAtTapeEndPct = 0;
        let visibleRunFadePct = 0;
        let leadDropV = 0;

        if (hasTape && run.feedBothEnds) {
          const halfLength = run.tapeLength / 2;
          const halfCurrent = currentForTapeLength(halfLength, controller.tape);
          const farDistance = Math.max(0, number(run.farEndDistance || nearDistance));
          const farWireSize = run.farEndWireSize || nearWireSize;
          const nearFeedPct =
            (baseDropV + ohmsForWire(nearWireSize) * nearDistance * halfCurrent) * controller.tape.droopPerVolt * 100;
          const farFeedPct =
            (baseDropV + ohmsForWire(farWireSize) * farDistance * halfCurrent) * controller.tape.droopPerVolt * 100;
          const nearInternalPct = internalFadeForSegment(halfLength, halfCurrent, controller.tape);
          const farInternalPct = internalFadeForSegment(halfLength, halfCurrent, controller.tape);
          fadeAtTapeStartPct = Math.max(nearFeedPct, farFeedPct);
          visibleRunFadePct = Math.max(nearInternalPct, farInternalPct, Math.abs(nearFeedPct - farFeedPct));
          fadeAtTapeEndPct = fadeAtTapeStartPct + visibleRunFadePct;
          leadDropV = Math.max(
            baseDropV + ohmsForWire(nearWireSize) * nearDistance * halfCurrent,
            baseDropV + ohmsForWire(farWireSize) * farDistance * halfCurrent
          );
        } else if (hasTape) {
          leadDropV = baseDropV + ohmsForWire(nearWireSize) * nearDistance * run.tapeCurrent;
          fadeAtTapeStartPct = leadDropV * controller.tape.droopPerVolt * 100;
          visibleRunFadePct = internalFadeForSegment(run.tapeLength, run.tapeCurrent, controller.tape);
          fadeAtTapeEndPct = fadeAtTapeStartPct + visibleRunFadePct;
        }

        const startStatus = startFadeBucket(fadeAtTapeStartPct, hasTape);
        const runStatus = fadeBucket(visibleRunFadePct);

        if (run.tapeLength > lengthLimit) {
          const detail = run.feedBothEnds
            ? `${ft(run.tapeLength)} entered. Even with both ends fed, keep this continuous tape near ${ft(
                DUAL_END_MAX_FT
              )} or split it into separate runs.`
            : `${ft(run.tapeLength)} entered. Feed both ends or split it into separate tape runs.`;
          issues.push(
            issue(
              "warn",
              `Run ${run.runName} on Controller ${controller.controllerIndex + 1} is too long`,
              detail
            )
          );
        }

        if (startStatus.level === "fail") {
          issues.push(
            issue(
              "fail",
              `Run ${run.runName} may start too dim`,
              `${pct(fadeAtTapeStartPct)} light loss before the tape starts. Shorten wire, use larger wire, or move the controller.`
            )
          );
        } else if (startStatus.level === "warn") {
          issues.push(
            issue(
              "warn",
              `Run ${run.runName} may visibly start dimmer`,
              `${pct(fadeAtTapeStartPct)} light loss before the tape starts.`
            )
          );
        }

        if (runStatus.level === "fail") {
          issues.push(
            issue(
              "fail",
              `Run ${run.runName} may look uneven`,
              `${pct(visibleRunFadePct)} brightness difference from start to end.`
            )
          );
        } else if (runStatus.level === "warn") {
          issues.push(
            issue(
              "warn",
              `Run ${run.runName} may look uneven`,
              `${pct(visibleRunFadePct)} brightness difference from start to end.`
            )
          );
        }

        return {
          ...run,
          runDistance: nearDistance,
          leadDropV,
          fadeAtTapeStartPct,
          fadeAtTapeEndPct,
          visibleRunFadePct,
          startStatus,
          runStatus,
          lengthLimit
        };
      });

      const worstStartFade = Math.max(0, ...runResults.map((run) => run.fadeAtTapeStartPct));
      const worstRunFade = Math.max(0, ...runResults.map((run) => run.visibleRunFadePct));

      return {
        ...controller,
        controllerDropV,
        tapeSplitDropV,
        tapeStatus,
        runResults,
        worstStartFade,
        worstRunFade
      };
    });

    const activeControllers = controllers.filter((controller) => controller.enabled).length;
    const totalTapeLength = controllers.reduce((sum, controller) => sum + controller.totalTapeLength, 0);
    const wireSummary = summarizeWireLengths(inputState, controllers);
    const hasFailures = issues.some((item) => item.level === "fail");
    const hasWarnings = issues.some((item) => item.level === "warn");
    const overall = hasFailures ? "Not recommended" : hasWarnings ? "Review install" : activeControllers ? "Looks good" : "Ready";
    const level = hasFailures ? "fail" : hasWarnings ? "warn" : activeControllers ? "ok" : "neutral";

    if (!issues.length) {
      issues.push(issue("neutral", "No tape entered yet", "Turn on a controller and add tape lengths."));
    }

    return {
      level,
      overall,
      powerW,
      totalCurrent,
      totalTapeLength,
      totalWireLength: wireSummary.totalLength,
      totalWireLengthText: wireSummary.text,
      wireLengths: wireSummary.summary,
      activeControllers,
      sharedPowerDropV,
      controllers,
      issues
    };
  }

  function emptyRunResult(run) {
    return {
      ...run,
      leadDropV: 0,
      fadeAtTapeStartPct: 0,
      fadeAtTapeEndPct: 0,
      visibleRunFadePct: 0,
      startStatus: { label: "0%", level: "neutral" },
      runStatus: { label: "0%", level: "neutral" }
    };
  }

  function optionMarkup(options, selected) {
    return options
      .map((option) => {
        const value = typeof option === "object" ? option.id : option;
        const label = typeof option === "object" ? `${option.label} (${option.detail})` : `${option} AWG`;
        return `<option value="${value}" ${String(value) === String(selected) ? "selected" : ""}>${label}</option>`;
      })
      .join("");
  }

  function runCountOptions(selected) {
    return Array.from({ length: MAX_RUNS }, (_, index) => index + 1)
      .map((count) => `<option value="${count}" ${count === selected ? "selected" : ""}>${count}</option>`)
      .join("");
  }

  function pill(item) {
    return `<span class="pill ${item.level}">${item.label}</span>`;
  }

  function resultChip(label, value, status) {
    if (status) {
      return `<div class="result-chip"><span class="result-label">${label}</span>${pill(status)}<span>${value}</span></div>`;
    }
    return `<div class="result-chip"><strong>${value}</strong><span>${label}</span></div>`;
  }

  function levelRank(level) {
    return { neutral: 0, ok: 1, warn: 2, fail: 3 }[level] || 0;
  }

  function worstLevel(levels) {
    return levels.reduce((worst, level) => (levelRank(level) > levelRank(worst) ? level : worst), "neutral");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function runVisualLevel(run) {
    return worstLevel([run.startStatus.level, run.runStatus.level]);
  }

  function controllerVisualLevel(controller) {
    return worstLevel([
      controller.tapeStatus.level,
      ...controller.runResults.map((run) => runVisualLevel(run))
    ]);
  }

  function svgLine(x1, y1, x2, y2, level = "neutral") {
    return `<line class="preview-wire ${level}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
  }

  function svgBox(x, y, width, height, title, sub, level = "neutral") {
    return `
      <g class="preview-box ${level}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8"></rect>
        <text x="${x + width / 2}" y="${y + 23}" class="preview-title" text-anchor="middle">${escapeHtml(title)}</text>
        <text x="${x + width / 2}" y="${y + 43}" class="preview-sub" text-anchor="middle">${escapeHtml(sub)}</text>
      </g>
    `;
  }

  function renderSystemPreview(result) {
    const activeControllers = result.controllers.filter((controller) => controller.enabled);
    if (!activeControllers.length) {
      els.systemPreview.innerHTML = `<div class="preview-empty">Turn on a controller and add tape runs to see the system layout.</div>`;
      return;
    }

    const mobileStack = `
      <div class="preview-stack">
        <div class="preview-stack-node neutral">
          <span>Power Box</span>
          <strong>LU-PH3</strong>
        </div>
        ${activeControllers
          .map((controller) => {
            const controllerLevel = controllerVisualLevel(controller);
            const runs = controller.runResults.filter((run) => run.tapeLength > 0);
            return `
              <div class="preview-stack-controller">
                <div class="preview-stack-node ${controllerLevel}">
                  <span>Controller ${controller.controllerIndex + 1}</span>
                  <strong>${ft(controller.totalTapeLength)} tape</strong>
                </div>
                <div class="preview-stack-runs">
                  ${
                    runs.length
                      ? runs
                          .map((run) => {
                            const runLevel = runVisualLevel(run);
                            return `
                              <div class="preview-stack-run ${runLevel}">
                                <span>Run ${run.runName}</span>
                                <strong>${ft(run.tapeLength)}</strong>
                                ${run.feedBothEnds ? "<em>fed both ends</em>" : ""}
                              </div>
                            `;
                          })
                          .join("")
                      : `<div class="preview-stack-run neutral"><span>No runs</span><strong>Add tape</strong></div>`
                  }
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    const width = 980;
    const runGap = 66;
    const maxPreviewRuns = 12;
    const layouts = [];
    let cursorY = 34;
    activeControllers.forEach((controller) => {
      const runCount = Math.max(1, controller.runResults.filter((run) => run.tapeLength > 0).length);
      const blockHeight = Math.max(112, 86 + (Math.min(runCount, maxPreviewRuns) - 1) * runGap);
      layouts.push({ controller, y: cursorY + blockHeight / 2 - 32, blockHeight });
      cursorY += blockHeight + 32;
    });
    const height = Math.max(220, cursorY + 28);
    const powerX = 38;
    const powerY = Math.max(44, height / 2 - 32);
    const controllerX = 310;
    const splitX = 194;
    const runStartX = 565;
    const pieces = [
      svgBox(powerX, powerY, 116, 64, "Power Box", "LU-PH3", result.level === "fail" ? "fail" : "neutral")
    ];

    if (state.powerMode === "shared") {
      pieces.push(svgLine(powerX + 116, powerY + 32, splitX, powerY + 32, result.level));
      pieces.push(svgBox(splitX, powerY, 92, 64, "Split", "Power", result.level === "fail" ? "fail" : "neutral"));
    }

    layouts.forEach(({ controller, y: controllerY }) => {
      const controllerLevel = controllerVisualLevel(controller);
      const sourceX = state.powerMode === "shared" ? splitX + 92 : powerX + 116;
      const sourceY = state.powerMode === "shared" ? powerY + 32 : powerY + 32;
      pieces.push(svgLine(sourceX, sourceY, controllerX, controllerY + 32, controllerLevel));
      pieces.push(svgBox(controllerX, controllerY, 126, 64, `Controller ${controller.controllerIndex + 1}`, `${ft(controller.totalTapeLength)} tape`, controllerLevel));

      const runs = controller.runResults.filter((run) => run.tapeLength > 0).slice(0, maxPreviewRuns);
      if (!runs.length) {
        pieces.push(svgLine(controllerX + 126, controllerY + 32, runStartX, controllerY + 32, "neutral"));
        pieces.push(svgBox(runStartX, controllerY, 120, 64, "No runs", "Add tape", "neutral"));
        return;
      }

      const localHeight = (runs.length - 1) * runGap;
      runs.forEach((run, runIndex) => {
        const runY = controllerY + 32 - localHeight / 2 + runIndex * runGap;
        const runLevel = runVisualLevel(run);
        pieces.push(svgLine(controllerX + 126, controllerY + 32, runStartX, runY, runLevel));
        pieces.push(svgBox(runStartX, runY - 25, 122, 50, `Run ${run.runName}`, `${ft(run.tapeLength)}`, runLevel));
        const barX = runStartX + 150;
        const barWidth = Math.min(170, Math.max(54, 42 + run.tapeLength * 3));
        pieces.push(`<line class="preview-tape ${runLevel}" x1="${barX}" y1="${runY}" x2="${barX + barWidth}" y2="${runY}"></line>`);
        if (run.feedBothEnds) {
          pieces.push(`<text class="preview-note" x="${barX + barWidth / 2}" y="${runY - 13}" text-anchor="middle">fed both ends</text>`);
          pieces.push(`<circle class="preview-end ${runLevel}" cx="${barX}" cy="${runY}" r="5"></circle>`);
          pieces.push(`<circle class="preview-end ${runLevel}" cx="${barX + barWidth}" cy="${runY}" r="5"></circle>`);
        }
      });
    });

    els.systemPreview.innerHTML = `
      <svg class="preview-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Dynamic system wiring preview">
        ${pieces.join("")}
      </svg>
      ${mobileStack}
    `;
  }

  function systemMapNode(x, y, width, height, title, sub, level, jump, className = "") {
    return `
      <g class="system-map-node ${level} ${className}" data-jump="${escapeHtml(jump)}" role="button" tabindex="0">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8"></rect>
        <text x="${x + width / 2}" y="${y + 25}" class="system-map-title" text-anchor="middle">${escapeHtml(title)}</text>
        <text x="${x + width / 2}" y="${y + 47}" class="system-map-sub" text-anchor="middle">${escapeHtml(sub)}</text>
      </g>
    `;
  }

  function systemMapWire(x1, y1, x2, y2, label, level, jump) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const labelOffset = Math.abs(y2 - y1) > 38 ? -12 : -9;
    return `
      <g class="system-map-wire-link ${level}" data-jump="${escapeHtml(jump)}" role="button" tabindex="0">
        <line class="system-map-wire-hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>
        <line class="system-map-wire ${level}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>
        <text class="system-map-wire-label" x="${midX}" y="${midY + labelOffset}" text-anchor="middle">${escapeHtml(label)}</text>
      </g>
    `;
  }

  function systemMapTape(x, y, run, level, jump) {
    const tapeWidth = Math.min(178, Math.max(48, 36 + run.tapeLength * 3.2));
    const bothEnds = run.feedBothEnds
      ? `
        <circle class="system-map-tape-end ${level}" cx="${x}" cy="${y}" r="5"></circle>
        <circle class="system-map-tape-end ${level}" cx="${x + tapeWidth}" cy="${y}" r="5"></circle>
        <text class="system-map-note" x="${x + tapeWidth / 2}" y="${y - 13}" text-anchor="middle">fed both ends</text>
      `
      : "";

    return `
      <g class="system-map-tape-link ${level}" data-jump="${escapeHtml(jump)}" role="button" tabindex="0">
        <line class="system-map-tape-hit" x1="${x}" y1="${y}" x2="${x + tapeWidth}" y2="${y}"></line>
        <line class="system-map-tape ${level}" x1="${x}" y1="${y}" x2="${x + tapeWidth}" y2="${y}"></line>
        ${bothEnds}
      </g>
    `;
  }

  function wireTag(distance, wireSize) {
    return `${ft(distance)} / ${wireSize} AWG`;
  }

  function controllerJump(controller) {
    return `#controller-${controller.controllerIndex + 1}`;
  }

  function controllerPowerJump(controller) {
    return `#controller-${controller.controllerIndex + 1}-power`;
  }

  function tapeSplitJump(controller) {
    return `#controller-${controller.controllerIndex + 1}-tape-split`;
  }

  function runJump(controller, run) {
    return `#controller-${controller.controllerIndex + 1}-run-${run.runName}`;
  }

  function renderSystemMapSvg(result, activeControllers) {
    const complexMap =
      state.powerMode === "shared" ||
      activeControllers.length > 1 ||
      activeControllers.some((controller) => controller.tapeMode === "shared" || controller.runCount > 1);
    const width = complexMap ? 1400 : 1040;
    const runGap = 88;
    const controllerGap = 42;
    const layouts = [];
    let cursorY = 36;

    activeControllers.forEach((controller) => {
      const runs = controller.runResults.slice(0, controller.runCount);
      const blockHeight = Math.max(120, runs.length * runGap);
      layouts.push({
        controller,
        runs,
        blockHeight,
        midY: cursorY + blockHeight / 2
      });
      cursorY += blockHeight + controllerGap;
    });

    const height = Math.max(250, cursorY + 16);
    const powerX = 42;
    const powerY = height / 2 - 32;
    const powerSplitX = complexMap ? 300 : 210;
    const controllerX = complexMap ? 570 : 410;
    const tapeSplitX = complexMap ? 850 : 610;
    const runX = complexMap ? 1120 : 690;
    const tapeX = complexMap ? 1300 : 840;
    const pieces = [
      systemMapNode(powerX, powerY, 118, 64, "Power Box", "LU-PH3", result.level === "fail" ? "fail" : "neutral", "#powerFeedCard")
    ];

    if (state.powerMode === "shared") {
      pieces.push(
        systemMapWire(
          powerX + 118,
          powerY + 32,
          powerSplitX,
          powerY + 32,
          wireTag(state.sharedPower.distance, state.sharedPower.wireSize),
          result.level,
          "#sharedPowerFields"
        )
      );
      pieces.push(systemMapNode(powerSplitX, powerY, 96, 64, "Power Split", "to controllers", result.level, "#sharedPowerFields"));
    }

    layouts.forEach(({ controller, runs, midY }) => {
      const controllerLevel = controllerVisualLevel(controller);
      const controllerY = midY - 32;
      const sourceX = state.powerMode === "shared" ? powerSplitX + 96 : powerX + 118;
      const sourceY = powerY + 32;
      const powerLabel =
        state.powerMode === "shared"
          ? wireTag(controller.distanceSplitToController, controller.wireSizeSplitToController)
          : wireTag(controller.distancePowerToController, controller.wireSizePowerToController);

      pieces.push(systemMapWire(sourceX, sourceY, controllerX, controllerY + 32, powerLabel, controllerLevel, controllerPowerJump(controller)));
      pieces.push(
        systemMapNode(
          controllerX,
          controllerY,
          128,
          64,
          `Controller ${controller.controllerIndex + 1}`,
          `${ft(controller.totalTapeLength)} tape`,
          controllerLevel,
          controllerJump(controller)
        )
      );

      const runSourceX = controller.tapeMode === "shared" ? tapeSplitX + 96 : controllerX + 128;
      const runSourceY = controller.tapeMode === "shared" ? controllerY + 32 : controllerY + 32;

      if (controller.tapeMode === "shared") {
        const splitLevel = worstLevel(runs.map((run) => runVisualLevel(run)));
        pieces.push(
          systemMapWire(
            controllerX + 128,
            controllerY + 32,
            tapeSplitX,
            controllerY + 32,
            wireTag(controller.distanceControllerToTapeSplit, controller.wireSizeControllerToTapeSplit),
            splitLevel,
            tapeSplitJump(controller)
          )
        );
        pieces.push(systemMapNode(tapeSplitX, controllerY, 96, 64, "Tape Split", "to runs", splitLevel, tapeSplitJump(controller)));
      }

      const firstRunY = midY - ((runs.length - 1) * runGap) / 2;
      runs.forEach((run, runIndex) => {
        const runY = firstRunY + runIndex * runGap;
        const runLevel = runVisualLevel(run);
        const jump = runJump(controller, run);
        const wireSize = run.wireSizeToTapeStart;
        const runSub = run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "no tape";

        pieces.push(systemMapWire(runSourceX, runSourceY, runX, runY, wireTag(run.runDistance, wireSize), runLevel, jump));
        pieces.push(systemMapNode(runX, runY - 30, 112, 60, `Run ${run.runName}`, runSub, runLevel, jump, "run"));
        pieces.push(systemMapTape(tapeX, runY, run, runLevel, jump));
      });
    });

    return `
      <div class="system-map-track" style="--map-width: ${width}px;">
        <svg class="system-map-svg ${complexMap ? "complex" : "simple"}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Live system wiring map">
          ${pieces.join("")}
        </svg>
      </div>
    `;
  }

  function mapStackItem(title, sub, level, jump, className = "") {
    return `
      <button type="button" class="map-stack-item ${level} ${className}" data-jump="${escapeHtml(jump)}">
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(sub)}</strong>
      </button>
    `;
  }

  function mapStackWire(label, level, jump) {
    return `
      <button type="button" class="map-stack-wire ${level}" data-jump="${escapeHtml(jump)}">
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }

  function renderSystemMapStack(result, activeControllers) {
    const pieces = [
      mapStackItem("Power Box", "LU-PH3", result.level === "fail" ? "fail" : "neutral", "#powerFeedCard")
    ];

    if (state.powerMode === "shared") {
      pieces.push(mapStackWire(wireTag(state.sharedPower.distance, state.sharedPower.wireSize), result.level, "#sharedPowerFields"));
      pieces.push(mapStackItem("Power Split", "to controllers", result.level, "#sharedPowerFields"));
    }

    activeControllers.forEach((controller) => {
      const controllerLevel = controllerVisualLevel(controller);
      const powerLabel =
        state.powerMode === "shared"
          ? wireTag(controller.distanceSplitToController, controller.wireSizeSplitToController)
          : wireTag(controller.distancePowerToController, controller.wireSizePowerToController);

      pieces.push(mapStackWire(powerLabel, controllerLevel, controllerPowerJump(controller)));
      pieces.push(
        mapStackItem(
          `Controller ${controller.controllerIndex + 1}`,
          `${ft(controller.totalTapeLength)} tape`,
          controllerLevel,
          controllerJump(controller)
        )
      );

      if (controller.tapeMode === "shared") {
        const splitLevel = worstLevel(controller.runResults.map((run) => runVisualLevel(run)));
        pieces.push(
          mapStackWire(
            wireTag(controller.distanceControllerToTapeSplit, controller.wireSizeControllerToTapeSplit),
            splitLevel,
            tapeSplitJump(controller)
          )
        );
        pieces.push(mapStackItem("Tape Split", "to runs", splitLevel, tapeSplitJump(controller)));
      }

      controller.runResults.slice(0, controller.runCount).forEach((run) => {
        const runLevel = runVisualLevel(run);
        const sub = run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "no tape";
        pieces.push(mapStackWire(wireTag(run.runDistance, run.wireSizeToTapeStart), runLevel, runJump(controller, run)));
        pieces.push(mapStackItem(`Run ${run.runName}`, sub, runLevel, runJump(controller, run), run.feedBothEnds ? "both-ends" : ""));
      });
    });

    return `<div class="system-map-stack">${pieces.join("")}</div>`;
  }

  function renderSystemMap(result) {
    const activeControllers = result.controllers.filter((controller) => controller.enabled);

    if (!activeControllers.length) {
      els.systemMap.innerHTML = `
        <div class="system-map-empty">
          <strong>No controllers selected</strong>
          <span>Turn on a controller to build the map.</span>
        </div>
      `;
      queueMapPanUpdate();
      return;
    }

    els.systemMap.innerHTML = `
      ${renderSystemMapSvg(result, activeControllers)}
      ${renderSystemMapStack(result, activeControllers)}
    `;
    queueMapPanUpdate();
  }

  function renderSharedPowerFields() {
    if (state.powerMode !== "shared") {
      els.sharedPowerFields.innerHTML = "";
      return;
    }

    els.sharedPowerFields.innerHTML = `
      <div class="wire-map">
        <div class="map-node">
          <span>Power box</span>
          <strong>LU-PH3</strong>
        </div>
        <label class="map-field">
          <span>Shared distance before the controller split</span>
          <div class="input-with-unit">
            <input data-path="sharedPower.distance" type="number" min="0" max="500" step="0.1" value="${state.sharedPower.distance}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Wire size before the split</span>
          <select data-path="sharedPower.wireSize">${optionMarkup(wireSizes, state.sharedPower.wireSize)}</select>
        </label>
        <div class="map-node">
          <span>Split</span>
          <strong>To controllers</strong>
        </div>
      </div>
    `;
  }

  function renderControllerPowerMap(controller) {
    const index = controller.controllerIndex;
    if (state.powerMode === "shared") {
      return `
        <div id="controller-${index + 1}-power" class="wire-map">
          <div class="map-node">
            <span>Split</span>
            <strong>Power feed</strong>
          </div>
          <label class="map-field">
            <span>Distance from split to controller</span>
            <div class="input-with-unit">
              <input data-path="controllers.${index}.distanceSplitToController" type="number" min="0" max="500" step="0.1" value="${controller.distanceSplitToController}">
              <span>ft</span>
            </div>
          </label>
          <label class="map-field">
            <span>Wire size to controller</span>
            <select data-path="controllers.${index}.wireSizeSplitToController">${optionMarkup(wireSizes, controller.wireSizeSplitToController)}</select>
          </label>
          <div class="map-node">
            <span>Controller</span>
            <strong>${index + 1}</strong>
          </div>
        </div>
      `;
    }

    return `
      <div id="controller-${index + 1}-power" class="wire-map">
        <div class="map-node">
          <span>Power box</span>
          <strong>LU-PH3</strong>
        </div>
        <label class="map-field">
          <span>Distance from power box to controller</span>
          <div class="input-with-unit">
            <input data-path="controllers.${index}.distancePowerToController" type="number" min="0" max="500" step="0.1" value="${controller.distancePowerToController}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Wire size to controller</span>
          <select data-path="controllers.${index}.wireSizePowerToController">${optionMarkup(wireSizes, controller.wireSizePowerToController)}</select>
        </label>
        <div class="map-node">
          <span>Controller</span>
          <strong>${index + 1}</strong>
        </div>
      </div>
    `;
  }

  function renderTapeSplitFields(controller) {
    const index = controller.controllerIndex;
    if (controller.tapeMode !== "shared") return "";

    return `
      <div id="controller-${index + 1}-tape-split" class="wire-map">
        <div class="map-node">
          <span>Controller</span>
          <strong>${index + 1}</strong>
        </div>
        <label class="map-field">
          <span>Shared distance before tape runs split</span>
          <div class="input-with-unit">
            <input data-path="controllers.${index}.distanceControllerToTapeSplit" type="number" min="0" max="500" step="0.1" value="${controller.distanceControllerToTapeSplit}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Wire size before tape split</span>
          <select data-path="controllers.${index}.wireSizeControllerToTapeSplit">${optionMarkup(wireSizes, controller.wireSizeControllerToTapeSplit)}</select>
        </label>
        <div class="map-node">
          <span>Split</span>
          <strong>To tape runs</strong>
        </div>
      </div>
    `;
  }

  function renderRun(controller, run, runIndex, result) {
    const controllerIndex = controller.controllerIndex;
    const fromNode = controller.tapeMode === "shared" ? "Tape split" : `Controller ${controllerIndex + 1}`;
    const distanceLabel =
      controller.tapeMode === "shared" ? "Distance from tape split to tape start" : "Distance from controller to tape start";
    const distancePath =
      controller.tapeMode === "shared" ? "distanceSplitToTapeStart" : "distanceControllerToTapeStart";
    const farEndFields = run.feedBothEnds
      ? `
        <label class="map-field">
          <span>Distance to far end of tape</span>
          <div class="input-with-unit">
            <input data-path="controllers.${controllerIndex}.runs.${runIndex}.farEndDistance" type="number" min="0" max="500" step="0.1" value="${run.farEndDistance}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Wire size to far end</span>
          <select data-path="controllers.${controllerIndex}.runs.${runIndex}.farEndWireSize">${optionMarkup(
            wireSizes,
            run.farEndWireSize
          )}</select>
        </label>
      `
      : "";
    const modeText = run.feedBothEnds
      ? `Modeled as two ${ft(run.tapeLength / 2)} feeds from opposite ends.`
      : `One-end feed limit: ${ft(FULL_REEL_FT)}.`;

    return `
      <section id="controller-${controllerIndex + 1}-run-${run.runName}" class="run-card">
        <div class="run-card-top">
          <div>
            <p class="section-kicker">Run ${run.runName}</p>
            <h3>Run ${run.runName}</h3>
          </div>
          <label class="switch compact">
            <input data-path="controllers.${controllerIndex}.runs.${runIndex}.feedBothEnds" type="checkbox" ${
      run.feedBothEnds ? "checked" : ""
    }>
            <span>Feed this tape from both ends</span>
          </label>
        </div>
        <div class="wire-map run">
          <div class="map-node">
            <span>${fromNode}</span>
            <strong>To Run ${run.runName}</strong>
          </div>
          <label class="map-field">
            <span>${distanceLabel}</span>
            <div class="input-with-unit">
              <input data-path="controllers.${controllerIndex}.runs.${runIndex}.${distancePath}" type="number" min="0" max="500" step="0.1" value="${run[distancePath]}">
              <span>ft</span>
            </div>
          </label>
          <label class="map-field">
            <span>Wire size to tape start</span>
            <select data-path="controllers.${controllerIndex}.runs.${runIndex}.wireSizeToTapeStart">${optionMarkup(
      wireSizes,
      run.wireSizeToTapeStart
    )}</select>
          </label>
          <label class="map-field">
            <span>Tape length</span>
            <div class="input-with-unit">
              <input data-path="controllers.${controllerIndex}.runs.${runIndex}.tapeLength" type="number" min="0" max="500" step="0.1" value="${run.tapeLength}">
              <span>ft</span>
            </div>
          </label>
          ${farEndFields}
          ${resultChip("Start of Tape", `${pct(result.fadeAtTapeStartPct)} light loss before tape starts`, result.startStatus)}
          ${resultChip("Start to End of Tape", `${pct(result.visibleRunFadePct)} difference from start to end`, result.runStatus)}
        </div>
        <p class="run-note">${modeText}</p>
      </section>
    `;
  }

  function renderController(controller) {
    const index = controller.controllerIndex;
    const statusText = controller.enabled ? `${ft(controller.totalTapeLength)} / ${ft(controller.tape.maxControllerFt)}` : "Disabled";
    const isCollapsed = collapsedControllers.has(index);
    const body = controller.enabled
      ? `
        <div id="controller-${index + 1}-body" class="controller-body">
          <div class="controller-settings">
            <label>
              <span>Tape style</span>
              <select data-path="controllers.${index}.tapeType">${optionMarkup(tapeTypes, controller.tapeType)}</select>
            </label>
            <label>
              <span>How many tape runs from this controller?</span>
              <select data-path="controllers.${index}.runCount">${runCountOptions(controller.runCount)}</select>
            </label>
            ${resultChip("Power used by this controller", watts(24 * controller.inputCurrent))}
          </div>

          ${renderControllerPowerMap(controller)}

          <div class="advanced-card">
            <div class="advanced-top">
              <div class="advanced-title">
                <strong>Do these tape runs share wire before they split?</strong>
                <span>Choose direct wiring unless multiple runs share wire before separating.</span>
              </div>
              <div class="segmented" role="radiogroup" aria-label="Tape wiring type">
                <label>
                  <input data-path="controllers.${index}.tapeMode" type="radio" name="tapeMode${index}" value="direct" ${
        controller.tapeMode === "direct" ? "checked" : ""
      }>
                  <span>No, direct to each run</span>
                </label>
                <label>
                  <input data-path="controllers.${index}.tapeMode" type="radio" name="tapeMode${index}" value="shared" ${
        controller.tapeMode === "shared" ? "checked" : ""
      }>
                  <span>Yes, shared wire then split</span>
                </label>
              </div>
            </div>
            ${renderTapeSplitFields(controller)}
          </div>

          <div class="run-list">
            ${controller.runs.map((run, runIndex) => renderRun(controller, run, runIndex, controller.runResults[runIndex])).join("")}
          </div>

          <div class="extra-row">
            <label class="map-field">
              <span>Other short tape on this controller</span>
              <div class="input-with-unit">
                <input data-path="controllers.${index}.extraShortTapeLength" type="number" min="0" max="500" step="0.1" value="${controller.extraShortTapeLength}">
                <span>ft</span>
              </div>
            </label>
            ${resultChip("Total tape", ft(controller.totalTapeLength))}
            ${resultChip("Worst start light loss", pct(controller.worstStartFade))}
            ${resultChip("Worst start-to-end difference", pct(controller.worstRunFade))}
          </div>
        </div>
      `
      : "";

    return `
      <details id="controller-${index + 1}" class="controller-card collapsible-card" data-controller-details="${index}" ${
      isCollapsed ? "" : "open"
    }>
        <summary class="controller-top controller-summary">
          <label class="switch" onclick="event.stopPropagation()">
            <input data-path="controllers.${index}.enabled" type="checkbox" ${controller.enabled ? "checked" : ""}>
            <span>Use controller ${index + 1}</span>
          </label>
          <div class="controller-title">
            <strong>${controller.tape.label}</strong>
            <span>${controller.tape.detail} - ${amps(controller.totalTapeCurrent)} tape, ${amps(controller.inputCurrent)} total</span>
          </div>
          <div class="controller-actions">
            <div class="controller-status">${pill(controller.tapeStatus)} <span class="muted">${statusText}</span></div>
          </div>
          <span class="summary-action" aria-hidden="true"></span>
        </summary>
        ${body}
      </details>
    `;
  }

  function renderStatusStrip(result) {
    const urgentIssue = result.issues.find((item) => item.level === "fail") || result.issues.find((item) => item.level === "warn");
    const headline = urgentIssue ? urgentIssue.title : result.totalTapeLength > 0 ? `${ft(result.totalTapeLength)} tape` : "Live answer";
    els.statusStrip.innerHTML = `
      <div class="status-main">
        ${pill({ label: result.overall, level: result.level })}
        <strong>${headline}</strong>
      </div>
      <div class="status-mini">
        <span>Power</span>
        <strong>${watts(result.powerW)}</strong>
      </div>
      <div class="status-mini">
        <span>Tape</span>
        <strong>${ft(result.totalTapeLength)}</strong>
      </div>
      <div class="status-mini">
        <span>Issues</span>
        <strong>${result.issues.filter((item) => item.level !== "ok" && item.level !== "neutral").length}</strong>
      </div>
    `;
  }

  function renderPresetButtons() {
    [
      [els.simpleExample, "simple"],
      [els.workbookExample, "advanced"],
      [els.clearAll, "blank"]
    ].forEach(([button, preset]) => {
      const isActive = activePreset === preset;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderLiveResults(result) {
    renderStatusStrip(result);
    renderSystemMap(result);

    els.overallStatus.textContent = result.overall;
    els.overallPill.outerHTML = `<span id="overallPill" class="pill ${result.level}">${result.overall}</span>`;
    els.overallPill = document.querySelector("#overallPill");

    els.summaryMetrics.innerHTML = [
      ["Power box load", watts(result.powerW)],
      ["Total current", amps(result.totalCurrent)],
      ["Total tape", ft(result.totalTapeLength)],
      ["Total wire length", result.totalWireLengthText],
      ["Controllers in use", result.activeControllers],
      ["Shared power wire drop", `${fmt(result.sharedPowerDropV, 2)} V`]
    ]
      .map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`)
      .join("");

    els.issueList.innerHTML = `<div class="issue-list">${result.issues
      .map((item) => `<div class="issue ${item.level}"><strong>${item.title}</strong><span>${item.detail}</span></div>`)
      .join("")}</div>`;
  }

  function refreshLiveResults() {
    normalizeState(state);
    renderLiveResults(evaluate(state));
    renderPresetButtons();
  }

  function render() {
    normalizeState(state);
    const result = evaluate(state);

    els.projectName.value = state.projectName;
    document.querySelectorAll("input[name='powerMode']").forEach((input) => {
      input.checked = input.value === state.powerMode;
    });

    renderSharedPowerFields();
    renderLiveResults(result);
    renderPresetButtons();

    els.controllers.innerHTML = result.controllers.map((controller) => renderController(controller)).join("");
  }

  function setPath(path, value) {
    const parts = path.split(".");
    let target = state;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const key = /^\d+$/.test(parts[index]) ? Number(parts[index]) : parts[index];
      target = target[key];
    }
    target[parts[parts.length - 1]] = value;
  }

  function renderKeepingScroll() {
    const x = window.scrollX;
    const y = window.scrollY;
    render();
    window.scrollTo(x, y);
  }

  function updateFromEvent(event) {
    const target = event.target;

    if (target === els.projectName) {
      state.projectName = target.value;
      return;
    }

    if (target.name === "powerMode") {
      activePreset = "custom";
      state.powerMode = target.value;
      renderKeepingScroll();
      return;
    }

    const path = target.dataset.path;
    if (!path) return;

    let value;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.type === "radio") {
      value = target.value;
    } else if (target.tagName === "SELECT") {
      value = /^\d+$/.test(target.value) ? Number(target.value) : target.value;
    } else {
      value = number(target.value);
    }

    setPath(path, value);
    activePreset = "custom";
    if (path.endsWith(".feedBothEnds") && value === true) {
      const match = path.match(/^controllers\.(\d+)\.runs\.(\d+)\./);
      if (match) {
        const controller = state.controllers[Number(match[1])];
        const run = controller.runs[Number(match[2])];
        if (!number(run.farEndDistance)) {
          run.farEndDistance = controller.tapeMode === "shared" ? run.distanceSplitToTapeStart : run.distanceControllerToTapeStart;
        }
        if (!run.farEndWireSize) {
          run.farEndWireSize = run.wireSizeToTapeStart;
        }
      }
    }
    normalizeState(state);
    if (event.type === "input" && target.type === "number") {
      refreshLiveResults();
      return;
    }

    renderKeepingScroll();
  }

  function highlightTarget(target) {
    target.classList.remove("jump-highlight");
    window.requestAnimationFrame(() => {
      target.classList.add("jump-highlight");
    });
  }

  function handleSystemMapJump(event) {
    if (suppressNextMapJump) {
      event.preventDefault();
      suppressNextMapJump = false;
      return;
    }

    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;

    const trigger = event.target.closest("[data-jump]");
    if (!trigger || !els.systemMap.contains(trigger)) return;

    const target = document.querySelector(trigger.dataset.jump);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    highlightTarget(target);
  }

  function queueMapPanUpdate() {
    window.requestAnimationFrame(() => {
      updateMapPanControls();
      window.setTimeout(updateMapPanControls, 80);
    });
  }

  function updateMapPanControls() {
    const hasMap = Boolean(els.systemMap.querySelector(".system-map-track"));
    const isSmallScreen = window.matchMedia("(max-width: 720px)").matches;
    const canScroll = els.systemMap.scrollWidth - els.systemMap.clientWidth > 48;
    const canPan = hasMap && isSmallScreen;
    const atStart = els.systemMap.scrollLeft <= 1;
    const atEnd = canScroll && els.systemMap.scrollLeft + els.systemMap.clientWidth >= els.systemMap.scrollWidth - 1;

    [els.panMapLeft, els.panMapRight].forEach((button) => {
      button.hidden = !canPan;
    });

    els.panMapLeft.disabled = !canPan || atStart;
    els.panMapRight.disabled = !canPan || atEnd;
  }

  function panSystemMap(direction) {
    const distance = Math.max(220, els.systemMap.clientWidth * 0.72);
    const before = els.systemMap.scrollLeft;
    const maxScroll = Math.max(0, els.systemMap.scrollWidth - els.systemMap.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, before + direction * distance));
    els.systemMap.scrollTo({
      left: target,
      behavior: "smooth"
    });
    window.setTimeout(() => {
      if (Math.abs(els.systemMap.scrollLeft - before) < 2 && target !== before) {
        els.systemMap.scrollLeft = target;
      }
      updateMapPanControls();
    }, 220);
  }

  function handleSystemMapPointerDown(event) {
    if (event.pointerType === "touch") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    beginSystemMapPan(event.pointerId, event.clientX, event.clientY);

    if (mapPan) {
      els.systemMap.setPointerCapture?.(event.pointerId);
    }
  }

  function beginSystemMapPan(id, clientX, clientY) {
    if (els.systemMap.scrollWidth <= els.systemMap.clientWidth) return;

    mapPan = {
      id,
      startX: clientX,
      startY: clientY,
      scrollLeft: els.systemMap.scrollLeft,
      moved: false
    };
  }

  function moveSystemMapPan(id, clientX, clientY, event) {
    if (!mapPan || id !== mapPan.id) return;

    const deltaX = clientX - mapPan.startX;
    const deltaY = clientY - mapPan.startY;
    if (Math.abs(deltaX) <= 4 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    mapPan.moved = true;
    els.systemMap.classList.add("is-dragging");
    els.systemMap.scrollLeft = mapPan.scrollLeft - deltaX;
    event.preventDefault();
  }

  function endSystemMapPan(id) {
    if (!mapPan || id !== mapPan.id) return false;

    if (mapPan.moved) {
      suppressNextMapJump = true;
      window.setTimeout(() => {
        suppressNextMapJump = false;
      }, 120);
    }

    els.systemMap.classList.remove("is-dragging");
    mapPan = null;
    return true;
  }

  function handleSystemMapPointerMove(event) {
    moveSystemMapPan(event.pointerId, event.clientX, event.clientY, event);
  }

  function handleSystemMapPointerEnd(event) {
    const ended = endSystemMapPan(event.pointerId);
    if (ended) {
      els.systemMap.releasePointerCapture?.(event.pointerId);
    }
  }

  function handleSystemMapTouchStart(event) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    beginSystemMapPan("touch", touch.clientX, touch.clientY);
  }

  function handleSystemMapTouchMove(event) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    moveSystemMapPan("touch", touch.clientX, touch.clientY, event);
  }

  function handleSystemMapTouchEnd() {
    endSystemMapPan("touch");
  }

  function handleControllerDetailsToggle(event) {
    const details = event.target.closest?.("[data-controller-details]");
    if (!details) return;

    const index = Number(details.dataset.controllerDetails);
    if (details.open) {
      collapsedControllers.delete(index);
    } else {
      collapsedControllers.add(index);
    }
  }

  function blankProject() {
    const blank = clone(simpleExample);
    blank.projectName = "";
    blank.powerMode = "separate";
    blank.sharedPower.distance = 0;
    blank.controllers.forEach((controller) => {
      controller.enabled = false;
      controller.runCount = 1;
      controller.distancePowerToController = 0;
      controller.distanceSplitToController = 0;
      controller.distanceControllerToTapeSplit = 0;
      controller.extraShortTapeLength = 0;
      controller.tapeMode = "direct";
      controller.runs = [blankRun()];
    });
    return blank;
  }

  document.addEventListener("input", updateFromEvent);
  document.addEventListener("change", updateFromEvent);
  document.addEventListener("toggle", handleControllerDetailsToggle, true);
  window.addEventListener("resize", updateMapPanControls);
  els.systemMap.addEventListener("scroll", updateMapPanControls);
  els.systemMap.addEventListener("pointerdown", handleSystemMapPointerDown);
  els.systemMap.addEventListener("pointermove", handleSystemMapPointerMove);
  els.systemMap.addEventListener("pointerup", handleSystemMapPointerEnd);
  els.systemMap.addEventListener("pointercancel", handleSystemMapPointerEnd);
  els.systemMap.addEventListener("click", handleSystemMapJump);
  els.systemMap.addEventListener("keydown", handleSystemMapJump);
  els.panMapLeft.addEventListener("click", () => panSystemMap(-1));
  els.panMapRight.addEventListener("click", () => panSystemMap(1));
  els.simpleExample.addEventListener("click", () => {
    activePreset = "simple";
    collapsedControllers.clear();
    state = clone(simpleExample);
    render();
  });
  els.workbookExample.addEventListener("click", () => {
    activePreset = "advanced";
    collapsedControllers.clear();
    state = clone(workbookExample);
    render();
  });
  els.clearAll.addEventListener("click", () => {
    activePreset = "blank";
    collapsedControllers.clear();
    state = blankProject();
    render();
  });

  window.LutronInstallerTapeCheckV4 = {
    evaluate,
    simpleExample,
    workbookExample,
    tapeTypes,
    awgOhmsPerFt
  };

  render();
})();
