(() => {
  const FULL_REEL_FT = 16.4;
  const DUAL_END_MAX_FT = FULL_REEL_FT * 2;
  const POWER_LIMIT_W = 96;
  const GOOD_LIGHT_LOSS_PCT = 25;
  const MAX_LIGHT_LOSS_PCT = 40;
  const HELP_RECOMMENDED_TOTAL_WIRE_DISTANCE = `Recommended total wire distance from the power supply to the tape light, with the controller located somewhere along that path. Staying at or below this distance keeps calculated light loss under ${GOOD_LIGHT_LOSS_PCT}%. Enter the actual power-to-controller and controller-to-tape distances below for a more accurate check.`;
  const HELP_MAX_TOTAL_WIRE_DISTANCE = `Maximum total wire distance from the power supply to the tape light, with the controller located somewhere along that path. This reaches ${MAX_LIGHT_LOSS_PCT}% calculated light loss, so shorter is strongly recommended. Enter the actual wire distances below to confirm the final layout.`;
  const CONTROLLER_STANDBY_A = 0.01132;
  const RUN_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const MAX_RUNS = 12;
  const MAX_LIGHTING_RUNS = 36;
  const MAX_ZONES = 12;
  const MAX_CONTROLLERS = 12;
  const MAX_CONTROLLERS_PER_POWER_SUPPLY = 3;
  const DEFAULT_WIRE_SIZE = 16;
  const PROJECT_FILE_TYPE = "lutron-tape-light-installer-check";
  const PROJECT_FILE_VERSION = 1;
  const THEME_STORAGE_KEY = "trace-theme";
  const DISCLAIMER_STORAGE_KEY = "trace-disclaimer-accepted-v1";

  const tapeTypes = [
    {
      id: "lumaris-rgb-tw",
      label: "Lumaris RGB + Tunable White",
      detail: "1800K-4000K / RGB",
      wattsPerFt: 2.9,
      droopPerVolt: 0.17,
      currentFullReel: 1.472,
      calculatedResistance: 0.75927109974424556,
      maxInterfaceFt: 32.8,
      dualEndRecommendedOverFt: FULL_REEL_FT,
      maxContinuousRunFt: DUAL_END_MAX_FT
    },
    {
      id: "lumaris-tw",
      label: "Lumaris Tunable White",
      detail: "1800K-4000K",
      wattsPerFt: 1.9,
      droopPerVolt: 0.308,
      currentFullReel: 1.1967,
      calculatedResistance: 0.39,
      maxInterfaceFt: 49.2,
      dualEndRecommendedOverFt: FULL_REEL_FT,
      maxContinuousRunFt: DUAL_END_MAX_FT
    },
    {
      id: "rania-long",
      label: "Rania Long Run",
      detail: "1800K-5500K",
      wattsPerFt: 2.6,
      droopPerVolt: 0.1912,
      currentFullReel: 1.715,
      calculatedResistance: 0.46,
      maxInterfaceFt: 32.8,
      dualEndRecommendedOverFt: FULL_REEL_FT,
      maxContinuousRunFt: DUAL_END_MAX_FT
    },
    {
      id: "rania-high",
      label: "Rania High Output",
      detail: "1800K-5500K",
      wattsPerFt: 4.6,
      droopPerVolt: 0.2,
      currentFullReel: 3.02,
      calculatedResistance: 0.57,
      maxInterfaceFt: 16.4,
      dualEndRecommendedOverFt: 11,
      maxContinuousRunFt: FULL_REEL_FT
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
    tapeType: "lumaris-rgb-tw",
    powerMode: "separate",
    zoneCount: 1,
    sharedPower: {
      distance: 0,
      distanceAuto: true,
      wireSize: DEFAULT_WIRE_SIZE
    },
    tapeRuns: [
      {
        ...blankRun(),
        zoneIndex: 0,
        zoneIndexAuto: true,
        controllerIndex: 0,
        controllerIndexAuto: true,
        tapeLength: 12,
        distanceControllerToTapeStart: 8,
        distanceControllerToTapeStartAuto: true
      }
    ],
    controllers: [
      {
        ...blankController(),
        distancePowerToController: 20,
        distancePowerToControllerAuto: true,
        wireSizePowerToController: DEFAULT_WIRE_SIZE
      },
      blankController(),
      blankController()
    ]
  };

  const workbookExample = {
    projectName: "",
    tapeType: "lumaris-rgb-tw",
    powerMode: "shared",
    zoneCount: 1,
    sharedPower: {
      distance: 5,
      distanceAuto: true,
      wireSize: DEFAULT_WIRE_SIZE
    },
    tapeRuns: [
      {
        ...blankRun(),
        zoneIndex: 0,
        zoneIndexAuto: true,
        controllerIndex: 0,
        controllerIndexAuto: true,
        customName: "Tape Run 1",
        distanceSplitToTapeStart: 32,
        distanceSplitToTapeStartAuto: true,
        tapeLength: 22
      },
      {
        ...blankRun(),
        zoneIndex: 0,
        zoneIndexAuto: true,
        controllerIndex: 0,
        controllerIndexAuto: true,
        customName: "Tape Run 2",
        distanceSplitToTapeStart: 12,
        distanceSplitToTapeStartAuto: true,
        tapeLength: 10
      }
    ],
    controllers: [
      {
        ...blankController(),
        distanceSplitToController: 15,
        distanceSplitToControllerAuto: true,
        wireSizeSplitToController: DEFAULT_WIRE_SIZE,
        tapeMode: "shared",
        distanceControllerToTapeSplit: 2,
        distanceControllerToTapeSplitAuto: true,
        wireSizeControllerToTapeSplit: DEFAULT_WIRE_SIZE
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
    tapeTypeSelect: document.querySelector("#tapeTypeSelect"),
    runCountInput: document.querySelector("#runCountInput"),
    zoneCountInput: document.querySelector("#zoneCountInput"),
    tapeRuns: document.querySelector("#tapeRuns"),
    addTapeRun: document.querySelector("#addTapeRun"),
    suggestedSystem: document.querySelector("#suggestedSystem"),
    powerFeedCard: document.querySelector("#powerFeedCard"),
    sharedPowerFields: document.querySelector("#sharedPowerFields"),
    controllers: document.querySelector("#controllers"),
    saveProject: document.querySelector("#saveProject"),
    openProject: document.querySelector("#openProject"),
    projectFile: document.querySelector("#projectFile"),
    viewDisclaimer: document.querySelector("#viewDisclaimer"),
    disclaimerModal: document.querySelector("#disclaimerModal"),
    acceptDisclaimer: document.querySelector("#acceptDisclaimer"),
    darkModeToggle: document.querySelector("#darkModeToggle"),
    simpleExample: document.querySelector("#simpleExample"),
    workbookExample: document.querySelector("#workbookExample"),
    clearAll: document.querySelector("#clearAll"),
    systemMap: document.querySelector("#systemMap"),
    panMapLeft: document.querySelector("#panMapLeft"),
    panMapRight: document.querySelector("#panMapRight"),
    overallStatus: document.querySelector("#overallStatus"),
    overallPill: document.querySelector("#overallPill"),
    mobileOverallStatus: document.querySelector("#mobileOverallStatus"),
    mobileOverallPill: document.querySelector("#mobileOverallPill"),
    summaryMetrics: document.querySelector("#summaryMetrics"),
    mobileSummaryMetrics: document.querySelector("#mobileSummaryMetrics"),
    issueList: document.querySelector("#issueList"),
    mobileIssueList: document.querySelector("#mobileIssueList"),
    statusStrip: document.querySelector("#statusStrip")
  };

  function storedTheme() {
    try {
      const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return theme === "dark" || theme === "light" ? theme : "";
    } catch (error) {
      return "";
    }
  }

  function preferredTheme() {
    const savedTheme = storedTheme();
    if (savedTheme) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme, persist = false) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    els.darkModeToggle.checked = nextTheme === "dark";
    els.darkModeToggle.setAttribute("aria-label", nextTheme === "dark" ? "Turn off dark mode" : "Turn on dark mode");

    if (!persist) return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {}
  }

  function handleThemeToggle() {
    applyTheme(els.darkModeToggle.checked ? "dark" : "light", true);
  }

  function hasAcceptedDisclaimer() {
    try {
      return window.localStorage.getItem(DISCLAIMER_STORAGE_KEY) === "accepted";
    } catch (error) {
      return false;
    }
  }

  function showDisclaimer(force = false) {
    if (!els.disclaimerModal || (!force && hasAcceptedDisclaimer())) return;
    els.disclaimerModal.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => els.acceptDisclaimer?.focus());
  }

  function hideDisclaimer(accepted = false) {
    if (accepted) {
      try {
        window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, "accepted");
      } catch (error) {}
    }

    if (!els.disclaimerModal) return;
    els.disclaimerModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function acceptDisclaimer() {
    hideDisclaimer(true);
  }

  function blankRun() {
    return {
      customName: "",
      zoneIndex: 0,
      zoneIndexAuto: true,
      controllerIndex: 0,
      controllerIndexAuto: true,
      distanceControllerToTapeStart: 0,
      distanceControllerToTapeStartAuto: true,
      distanceSplitToTapeStart: 0,
      distanceSplitToTapeStartAuto: true,
      wireSizeToTapeStart: DEFAULT_WIRE_SIZE,
      tapeLength: 0,
      feedBothEnds: false,
      farEndDistance: 0,
      farEndDistanceAuto: true,
      farEndWireSize: DEFAULT_WIRE_SIZE
    };
  }

  function blankController() {
    return {
      enabled: false,
      tapeType: "lumaris-rgb-tw",
      runCount: 1,
      powerSupplyIndex: 0,
      powerSupplyIndexAuto: true,
      distancePowerToController: 0,
      distancePowerToControllerAuto: true,
      wireSizePowerToController: DEFAULT_WIRE_SIZE,
      distanceSplitToController: 0,
      distanceSplitToControllerAuto: true,
      wireSizeSplitToController: DEFAULT_WIRE_SIZE,
      tapeMode: "direct",
      distanceControllerToTapeSplit: 0,
      distanceControllerToTapeSplitAuto: true,
      wireSizeControllerToTapeSplit: DEFAULT_WIRE_SIZE,
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

  function clampLightingRunCount(value) {
    return Math.min(MAX_LIGHTING_RUNS, Math.max(1, Math.round(number(value) || 1)));
  }

  function clampZoneCount(value, runCount = MAX_ZONES) {
    return Math.min(MAX_ZONES, Math.max(1, Math.min(Math.max(1, runCount), Math.round(number(value) || 1))));
  }

  function suggestedZoneIndex(runIndex, runCount, zoneCount) {
    const safeRunCount = Math.max(1, Math.round(number(runCount) || 1));
    const safeZoneCount = clampZoneCount(zoneCount, safeRunCount);
    if (safeZoneCount <= 1) return 0;
    if (safeZoneCount >= safeRunCount) return Math.min(safeZoneCount - 1, runIndex);
    return Math.min(safeZoneCount - 1, Math.floor((runIndex * safeZoneCount) / safeRunCount));
  }

  function normalizeState(targetState) {
    targetState.tapeType = tapeTypeById[targetState.tapeType] ? targetState.tapeType : tapeTypes[0].id;
    const hasTopLevelTapeRuns = Array.isArray(targetState.tapeRuns);
    targetState.tapeRuns = hasTopLevelTapeRuns ? targetState.tapeRuns : [];
    const sourceSharedPower =
      targetState.sharedPower && typeof targetState.sharedPower === "object" ? targetState.sharedPower : {};
    targetState.sharedPower = {
      distance: 0,
      distanceAuto:
        typeof sourceSharedPower.distanceAuto === "boolean"
          ? sourceSharedPower.distanceAuto
          : number(sourceSharedPower.distance) <= 0,
      wireSize: DEFAULT_WIRE_SIZE,
      ...sourceSharedPower
    };
    targetState.controllers = Array.isArray(targetState.controllers) ? targetState.controllers : [];
    while (targetState.controllers.length < MAX_CONTROLLERS) {
      targetState.controllers.push(blankController());
    }
    targetState.controllers = targetState.controllers.slice(0, MAX_CONTROLLERS).map((controller) => {
      const source = controller && typeof controller === "object" ? controller : {};
      return {
        ...blankController(),
        ...source,
        powerSupplyIndex: Math.min(MAX_CONTROLLERS - 1, Math.max(0, Math.round(number(source.powerSupplyIndex ?? 0)))),
        powerSupplyIndexAuto:
          typeof source.powerSupplyIndexAuto === "boolean"
            ? source.powerSupplyIndexAuto
            : number(source.powerSupplyIndex) <= 0,
        distancePowerToControllerAuto:
          typeof source.distancePowerToControllerAuto === "boolean"
            ? source.distancePowerToControllerAuto
            : number(source.distancePowerToController) <= 0,
        distanceSplitToControllerAuto:
          typeof source.distanceSplitToControllerAuto === "boolean"
            ? source.distanceSplitToControllerAuto
            : number(source.distanceSplitToController) <= 0,
        distanceControllerToTapeSplitAuto:
          typeof source.distanceControllerToTapeSplitAuto === "boolean"
            ? source.distanceControllerToTapeSplitAuto
            : number(source.distanceControllerToTapeSplit) <= 0
      };
    });

    if (!hasTopLevelTapeRuns) {
      targetState.tapeRuns = [];
      targetState.controllers.forEach((controller, controllerIndex) => {
        const runs = Array.isArray(controller.runs) ? controller.runs.slice(0, clampRunCount(controller.runCount)) : [];
        runs.forEach((run) => {
          if (number(run.tapeLength) <= 0 && !String(run.customName || "").trim()) return;
          targetState.tapeRuns.push({
            ...blankRun(),
            ...run,
            controllerIndex
          });
        });
      });
    }

    if (!targetState.tapeRuns.length) {
      targetState.tapeRuns.push(blankRun());
    }

    targetState.zoneCount = clampZoneCount(targetState.zoneCount, targetState.tapeRuns.length);

    targetState.tapeRuns = targetState.tapeRuns.map((run, index) => {
      const source = run && typeof run === "object" ? run : {};
      const zoneIndexAuto =
        typeof source.zoneIndexAuto === "boolean"
          ? source.zoneIndexAuto
          : number(source.zoneIndex) <= 0;
      const zoneIndex = Math.min(
        targetState.zoneCount - 1,
        Math.max(
          0,
          Math.round(
            zoneIndexAuto
              ? suggestedZoneIndex(index, targetState.tapeRuns.length, targetState.zoneCount)
              : number(source.zoneIndex ?? 0)
          )
        )
      );
      return {
        ...blankRun(),
        ...source,
        zoneIndex,
        zoneIndexAuto,
        controllerIndex: Math.min(MAX_CONTROLLERS - 1, Math.max(0, Math.round(number(source.controllerIndex ?? 0)))),
        controllerIndexAuto:
          typeof source.controllerIndexAuto === "boolean"
            ? source.controllerIndexAuto
            : number(source.controllerIndex) <= 0,
        tapeLength: Math.max(0, number(source.tapeLength)),
        distanceControllerToTapeStartAuto:
          typeof source.distanceControllerToTapeStartAuto === "boolean"
            ? source.distanceControllerToTapeStartAuto
            : number(source.distanceControllerToTapeStart) <= 0,
        distanceSplitToTapeStartAuto:
          typeof source.distanceSplitToTapeStartAuto === "boolean"
            ? source.distanceSplitToTapeStartAuto
            : number(source.distanceSplitToTapeStart) <= 0,
        wireSizeToTapeStart: Number(source.wireSizeToTapeStart || DEFAULT_WIRE_SIZE),
        farEndDistanceAuto:
          typeof source.farEndDistanceAuto === "boolean" ? source.farEndDistanceAuto : number(source.farEndDistance) <= 0,
        farEndWireSize: Number(source.farEndWireSize || source.wireSizeToTapeStart || DEFAULT_WIRE_SIZE),
        defaultRunName: `Tape Run ${index + 1}`
      };
    });

    targetState.controllers.forEach((controller) => {
      controller.enabled = false;
      controller.tapeType = targetState.tapeType;
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
    if (percent < GOOD_LIGHT_LOSS_PCT) return { label: "Within recommended range", level: "ok" };
    if (percent <= MAX_LIGHT_LOSS_PCT) return { label: "May be visible", level: "warn" };
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

  function zoneLabel(index) {
    return `Controller ${index + 1}`;
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

  function summarizeInterfaceTapeLimits(controllers) {
    const limitsBySupply = new Map();

    controllers.forEach((controller) => {
      if (!controller.enabled || controller.totalTapeLength <= 0) return;

      const interfaceIndex = Math.min(
        MAX_CONTROLLERS - 1,
        Math.max(0, Math.round(number(controller.powerSupplyIndex ?? 0)))
      );
      let current = limitsBySupply.get(interfaceIndex);

      if (!current) {
        current = {
          interfaceIndex,
          tape: controller.tape,
          totalTapeLength: 0,
          powerW: 0,
          controllerIndexes: [],
          controllerNumbers: []
        };
        limitsBySupply.set(interfaceIndex, current);
      }

      current.totalTapeLength += controller.totalTapeLength;
      current.powerW += controller.tapePowerW;
      current.controllerIndexes.push(controller.controllerIndex);
      current.controllerNumbers.push(controller.controllerIndex + 1);
    });

    return Array.from(limitsBySupply.values())
      .sort((a, b) => a.interfaceIndex - b.interfaceIndex)
      .map((item) => ({
        ...item,
        limitFt: item.tape.maxInterfaceFt,
        overLimit: item.totalTapeLength > item.tape.maxInterfaceFt || item.powerW > POWER_LIMIT_W,
        tapeOverLimit: item.totalTapeLength > item.tape.maxInterfaceFt,
        powerOverLimit: item.powerW > POWER_LIMIT_W
      }));
  }

  function interfaceTapeLimitText(limits) {
    if (!limits.length) return "0 ft";

    return limits
      .map((item) => `Power Supply ${item.interfaceIndex + 1}: ${item.tape.label}: ${ft(item.totalTapeLength)} / ${ft(item.limitFt)}`)
      .join("; ");
  }

  function recommendationIssue(level, title, detail) {
    return issue(level, title, detail);
  }

  function distanceForSuggestedRun(tape, controllerCurrent, run) {
    if (run.tapeLength <= 0) {
      return {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        status: { label: "No tape", level: "neutral" }
      };
    }

    const branchCurrent = run.feedBothEnds ? run.tapeCurrent / 2 : run.tapeCurrent;
    const powerDropPerFt = ohmsForWire(DEFAULT_WIRE_SIZE) * controllerCurrent;
    const tapeDropPerFt = ohmsForWire(DEFAULT_WIRE_SIZE) * branchCurrent;
    const fadePctPerFt = Math.max(powerDropPerFt, tapeDropPerFt) * tape.droopPerVolt * 100;

    if (fadePctPerFt <= 0) {
      return {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        status: { label: "No tape", level: "neutral" }
      };
    }

    return {
      goodTotalPathFt: GOOD_LIGHT_LOSS_PCT / fadePctPerFt,
      maxTotalPathFt: MAX_LIGHT_LOSS_PCT / fadePctPerFt,
      status: { label: "Good", level: "ok" }
    };
  }

  function buildRecommendation(inputState) {
    normalizeState(inputState);
    const tape = tapeTypeById[inputState.tapeType] || tapeTypes[0];
    const zoneCount = clampZoneCount(inputState.zoneCount, inputState.tapeRuns.length);
    const normalizedRuns = inputState.tapeRuns
      .map((run, index) => {
        const tapeLength = Math.max(0, number(run.tapeLength));
        const defaultRunName = `Tape Run ${index + 1}`;
        const runName = String(run.customName || "").trim() || defaultRunName;
        const zoneIndex = Math.min(zoneCount - 1, Math.max(0, Math.round(number(run.zoneIndex ?? 0))));
        const needsDualFeed = tapeLength > tape.dualEndRecommendedOverFt;
        const tooLong = tapeLength > tape.maxContinuousRunFt;

        return {
          ...run,
          recommendationIndex: index,
          globalRunIndex: index,
          defaultRunName,
          runLetter: RUN_NAMES[index] || String(index + 1),
          zoneIndex,
          zoneName: zoneLabel(zoneIndex),
          runName,
          tapeLength,
          feedBothEnds: needsDualFeed && !tooLong ? true : Boolean(run.feedBothEnds),
          tapeCurrent: currentForTapeLength(tapeLength, tape),
          needsDualFeed,
          tooLong
        };
      })
      .filter((run) => run.tapeLength > 0 || run.recommendationIndex === 0);

    const activeRuns = normalizedRuns.filter((run) => run.tapeLength > 0);
    const issues = [];
    const recommendationNotes = [];
    const plannedControllers = [];

    const runsByZone = Array.from({ length: zoneCount }, (_, index) => ({
      zoneIndex: index,
      zoneName: zoneLabel(index),
      runs: []
    }));

    activeRuns.forEach((run) => {
      runsByZone[run.zoneIndex]?.runs.push(run);
    });

    function controllerWouldExceed(controller, run) {
      const nextTapeLength = controller.totalTapeLength + run.tapeLength;
      const nextPowerW = controller.tapePowerW + run.tapeLength * tape.wattsPerFt;
      if (controller.runs.length >= MAX_RUNS) return "run count";
      if (nextTapeLength > tape.maxInterfaceFt) return `${ft(tape.maxInterfaceFt)} tape limit`;
      if (nextPowerW > POWER_LIMIT_W) return `${watts(POWER_LIMIT_W)} power limit`;
      return "";
    }

    function finishController(controller) {
      controller.totalTapeCurrent = controller.runs.reduce((sum, run) => sum + run.tapeCurrent, 0);
      controller.tapePowerW = controller.runs.reduce((sum, run) => sum + run.tapeLength * tape.wattsPerFt, 0);
      controller.inputCurrent = controller.runs.length ? controller.totalTapeCurrent + CONTROLLER_STANDBY_A : 0;
      controller.runs = controller.runs.map((run) => ({
        ...run,
        controllerIndex: controller.globalIndex,
        controllerLabel: `Controller ${controller.globalIndex + 1}`,
        zoneIndex: controller.zoneIndex,
        zoneName: controller.zoneName
      }));
      return controller;
    }

    runsByZone.forEach((zone) => {
      if (!zone.runs.length) return;

      let controller = null;

      function startController(splitRun = null, reason = "") {
        const previousControllerNumber = controller ? controller.globalIndex + 1 : plannedControllers.length;
        controller = {
          index: 0,
          globalIndex: plannedControllers.length,
          zoneIndex: zone.zoneIndex,
          zoneName: zone.zoneName,
          runs: [],
          totalTapeLength: 0,
          tapePowerW: 0,
          totalTapeCurrent: 0,
          inputCurrent: 0,
          splitReason: reason
        };
        plannedControllers.push(controller);

        if (splitRun && reason) {
          recommendationNotes.push(
            recommendationIssue(
              "warn",
              `${splitRun.runName} cannot stay on Controller ${previousControllerNumber}`,
              `Adding this run to Controller ${previousControllerNumber} would exceed the ${reason}. The diagram moves it to Controller ${
                controller.globalIndex + 1
              } so the plan stays within spec.`
            )
          );
        }
      }

      zone.runs.forEach((run) => {
        if (!controller) startController();

        const splitReason = controller.runs.length ? controllerWouldExceed(controller, run) : "";
        if (splitReason) {
          startController(run, splitReason);
        }

        controller.runs.push(run);
        controller.totalTapeLength += run.tapeLength;
        controller.tapePowerW += run.tapeLength * tape.wattsPerFt;
      });
    });

    plannedControllers.forEach(finishController);

    const powerSupplies = [];
    let currentSupply = null;

    function startSupply() {
      currentSupply = {
        index: powerSupplies.length,
        totalTapeLength: 0,
        powerW: 0,
        runs: [],
        controllers: []
      };
      powerSupplies.push(currentSupply);
    }

    plannedControllers.forEach((controller) => {
      if (!currentSupply) startSupply();

      const wouldExceedControllerCount = currentSupply.controllers.length >= MAX_CONTROLLERS_PER_POWER_SUPPLY;
      const wouldExceedTape = currentSupply.totalTapeLength + controller.totalTapeLength > tape.maxInterfaceFt;
      const wouldExceedPower = currentSupply.powerW + controller.tapePowerW > POWER_LIMIT_W;
      if (currentSupply.controllers.length && (wouldExceedControllerCount || wouldExceedTape || wouldExceedPower)) {
        startSupply();
      }

      controller.index = currentSupply.controllers.length;
      controller.powerSupplyIndex = currentSupply.index;
      currentSupply.controllers.push(controller);
      currentSupply.runs.push(...controller.runs);
      currentSupply.totalTapeLength += controller.totalTapeLength;
      currentSupply.powerW += controller.tapePowerW;
    });

    if (!powerSupplies.length) startSupply();

    powerSupplies.forEach((supply) => {
      supply.totalCurrent = supply.controllers.reduce((sum, controller) => sum + controller.inputCurrent, 0);
      supply.controllers.forEach((controller) => {
        controller.runs = controller.runs.map((run) => {
          const guidance = distanceForSuggestedRun(tape, controller.inputCurrent, run);
          const specLevel = run.tooLong ? "fail" : run.needsDualFeed ? "warn" : "ok";
          const level = run.tooLong ? "fail" : "ok";
          return {
            ...run,
            distanceGuidance: guidance,
            specStatus: {
              level: specLevel,
              label: run.tooLong ? "Too long" : run.needsDualFeed ? "Dual feed suggested" : "In range"
            },
            runOverallStatus: {
              level,
              label: level === "fail" ? "Fix" : run.needsDualFeed ? "Dual feed" : "Good"
            }
          };
        });
      });
    });

    activeRuns.forEach((run) => {
      if (run.tooLong) {
        const detail =
          tape.id === "rania-high"
            ? `${ft(run.tapeLength)} entered. Rania High Output allows ${ft(tape.maxContinuousRunFt)} total per power interface.`
            : `${ft(run.tapeLength)} entered. Split this into separate parallel runs because one continuous run should stay at or under ${ft(
                tape.maxContinuousRunFt
              )}.`;
        issues.push(recommendationIssue("fail", `${run.runName} is too long as one continuous run`, detail));
      } else if (run.needsDualFeed) {
        issues.push(
          recommendationIssue(
            "warn",
            `${run.runName} should be fed from both ends`,
            `${ft(run.tapeLength)} entered. The suggested diagram marks this run as dual-fed.`
          )
        );
      }
    });

    const powerSupplyCount = powerSupplies.length;
    const controllerCount = powerSupplies.reduce((sum, supply) => sum + supply.controllers.length, 0);
    const totalTapeLength = activeRuns.reduce((sum, run) => sum + run.tapeLength, 0);
    const totalPowerW = powerSupplies.reduce((sum, supply) => sum + supply.powerW, 0);
    const oneSupplyEstimatedW = activeRuns.reduce((sum, run) => sum + run.tapeLength * tape.wattsPerFt, 0);
    const explanation = {
      runLengthText: activeRuns.length ? activeRuns.map((run) => `${ft(run.tapeLength)} ${run.runName}`).join(" + ") : "No runs",
      totalTapeText: `${ft(totalTapeLength)} total tape`,
      maxTapePerPowerSupplyText: `${ft(tape.maxInterfaceFt)} max per 96 W power supply`,
      oneSupplyLoadText: `${watts(oneSupplyEstimatedW)} estimated load if all runs used one power supply`,
      powerLimitText: `${watts(POWER_LIMIT_W)} max per power supply`,
      controllerAssignmentText: activeRuns.length
        ? runsByZone
            .filter((zone) => zone.runs.length)
            .map((zone) => `${zone.zoneName}: ${zone.runs.map((run) => run.runName).join(", ")}`)
            .join("; ")
        : "No zones",
      needsMultipleSuppliesByTape: totalTapeLength > tape.maxInterfaceFt,
      needsMultipleSuppliesByPower: oneSupplyEstimatedW > POWER_LIMIT_W,
      groupingText: powerSupplies
        .map(
          (supply) =>
            `Power Supply ${supply.index + 1}: ${supply.controllers
              .flatMap((controller) => controller.runs.map((run) => `${run.runName} (${ft(run.tapeLength)})`))
              .join(", ")} = ${ft(supply.totalTapeLength)}`
        )
        .join("; ")
    };

    if (activeRuns.length) {
      issues.unshift(
        recommendationIssue(
          "ok",
          `Suggested system: ${powerSupplyCount} power ${powerSupplyCount === 1 ? "supply" : "supplies"} and ${controllerCount} ${
            controllerCount === 1 ? "controller" : "controllers"
          }`,
          `${ft(totalTapeLength)} total tape using ${tape.label}.`
        )
      );
    } else {
      issues.push(recommendationIssue("neutral", "No tape entered yet", "Enter tape lengths to build a suggested system."));
    }

    const allIssues = [...issues, ...recommendationNotes];
    const level = allIssues.some((item) => item.level === "fail")
      ? "fail"
      : allIssues.some((item) => item.level === "warn")
        ? "warn"
        : activeRuns.length
          ? "ok"
          : "neutral";

    return {
      tape,
      zoneCount,
      level,
      overall: level === "fail" ? "Needs changes" : level === "warn" ? "Review plan" : activeRuns.length ? "Looks good" : "Ready",
      powerSupplies,
      powerSupplyCount,
      controllerCount,
      totalTapeLength,
      totalPowerW,
      activeRunCount: activeRuns.length,
      explanation,
      issues: allIssues
    };
  }

  function controllerPowerDistance(inputState, controller) {
    if (inputState.powerMode === "shared") {
      return Math.max(0, number(inputState.sharedPower.distance)) + Math.max(0, number(controller.distanceSplitToController));
    }

    return Math.max(0, number(controller.distancePowerToController));
  }

  function runTapeDistance(controller, run) {
    const nearDistance = runDistance(controller, run);
    return controller.tapeMode === "shared"
      ? Math.max(0, number(controller.distanceControllerToTapeSplit)) + nearDistance
      : nearDistance;
  }

  function plannedRunPathDistance(inputState, controller, run) {
    const powerDistance = controllerPowerDistance(inputState, controller);
    const nearPath = powerDistance + runTapeDistance(controller, run);

    if (!run.feedBothEnds) return nearPath;

    const farEndDistance = Math.max(0, number(run.farEndDistance || runDistance(controller, run)));
    const farTapeDistance =
      controller.tapeMode === "shared"
        ? Math.max(0, number(controller.distanceControllerToTapeSplit)) + farEndDistance
        : farEndDistance;
    return Math.max(nearPath, powerDistance + farTapeDistance);
  }

  function runDistanceGuidance(inputState, controller, run, totalCurrent) {
    if (run.tapeLength <= 0 || controller.inputCurrent <= 0) {
      return {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        plannedTotalPathFt: 0,
        status: { label: "No tape", level: "neutral" }
      };
    }

    const coefficients = [];

    if (inputState.powerMode === "shared") {
      coefficients.push(ohmsForWire(inputState.sharedPower.wireSize) * totalCurrent);
      coefficients.push(ohmsForWire(controller.wireSizeSplitToController) * controller.inputCurrent);
    } else {
      coefficients.push(ohmsForWire(controller.wireSizePowerToController) * controller.inputCurrent);
    }

    if (controller.tapeMode === "shared") {
      coefficients.push(ohmsForWire(controller.wireSizeControllerToTapeSplit) * controller.totalTapeCurrent);
    }

    const branchCurrent = run.feedBothEnds ? run.tapeCurrent / 2 : run.tapeCurrent;
    coefficients.push(ohmsForWire(run.wireSizeToTapeStart) * branchCurrent);

    if (run.feedBothEnds) {
      coefficients.push(ohmsForWire(run.farEndWireSize || run.wireSizeToTapeStart) * branchCurrent);
    }

    const fadePctPerFt = Math.max(...coefficients, 0) * controller.tape.droopPerVolt * 100;
    const plannedTotalPathFt = plannedRunPathDistance(inputState, controller, run);
    const goodTotalPathFt = fadePctPerFt > 0 ? GOOD_LIGHT_LOSS_PCT / fadePctPerFt : 0;
    const maxTotalPathFt = fadePctPerFt > 0 ? MAX_LIGHT_LOSS_PCT / fadePctPerFt : 0;
    const plannedFadePct = fadePctPerFt * plannedTotalPathFt;

    return {
      goodTotalPathFt,
      maxTotalPathFt,
      plannedTotalPathFt,
      plannedFadePct,
      status: startFadeBucket(plannedFadePct, run.tapeLength > 0)
    };
  }

  function roundDistance(value) {
    return Math.max(0, Math.round(number(value) * 10) / 10);
  }

  function setAutoDistance(target, valueKey, autoKey, value) {
    if (!target || target[autoKey] === false) return false;
    const nextValue = roundDistance(value);
    if (Math.abs(number(target[valueKey]) - nextValue) < 0.05) return false;
    target[valueKey] = nextValue;
    return true;
  }

  function applyRecommendedControllerDefaults(inputState, recommendation) {
    let changed = false;
    const recommendedRuns = recommendation.powerSupplies.flatMap((supply) =>
      supply.controllers.flatMap((controller) => controller.runs)
    );
    const recommendedControllers = recommendation.powerSupplies.flatMap((supply) =>
      supply.controllers.map((controller) => ({
        ...controller,
        powerSupplyIndex: supply.index
      }))
    );

    recommendedRuns.forEach((run) => {
      const stateRun = inputState.tapeRuns[run.globalRunIndex];
      if (!stateRun || stateRun.controllerIndexAuto === false) return;

      const nextControllerIndex = Math.min(MAX_CONTROLLERS - 1, Math.max(0, Math.round(number(run.controllerIndex))));
      if (stateRun.controllerIndex !== nextControllerIndex) {
        stateRun.controllerIndex = nextControllerIndex;
        changed = true;
      }
    });

    recommendedControllers.forEach((controller) => {
      const stateController = inputState.controllers[controller.globalIndex];
      if (!stateController || stateController.powerSupplyIndexAuto === false) return;

      const nextPowerSupplyIndex = Math.min(
        MAX_CONTROLLERS - 1,
        Math.max(0, Math.round(number(controller.powerSupplyIndex)))
      );
      if (stateController.powerSupplyIndex !== nextPowerSupplyIndex) {
        stateController.powerSupplyIndex = nextPowerSupplyIndex;
        changed = true;
      }
    });

    return changed;
  }

  function applyRecommendedDistanceDefaults(inputState, result) {
    const activeControllers = result.controllers.filter((controller) => controller.enabled);
    const activeRuns = result.tapeRunResults.filter((run) => run.tapeLength > 0 && run.distanceGuidance.goodTotalPathFt > 0);
    if (!activeRuns.length) return false;

    let changed = false;
    const globalRecommendedDistance = Math.min(...activeRuns.map((run) => run.distanceGuidance.goodTotalPathFt));
    const maxSegmentCount = Math.max(
      2,
      ...activeControllers.map((controller) => {
        const powerSegments = inputState.powerMode === "shared" ? 2 : 1;
        const tapeSegments = controller.tapeMode === "shared" ? 2 : 1;
        return powerSegments + tapeSegments;
      })
    );

    if (inputState.powerMode === "shared") {
      changed =
        setAutoDistance(inputState.sharedPower, "distance", "distanceAuto", globalRecommendedDistance / maxSegmentCount) || changed;
    }

    activeControllers.forEach((controller) => {
      const controllerState = inputState.controllers[controller.controllerIndex];
      const controllerRuns = controller.runResults.filter(
        (run) => run.tapeLength > 0 && run.distanceGuidance.goodTotalPathFt > 0
      );
      if (!controllerState || !controllerRuns.length) return;

      const controllerRecommendedDistance = Math.min(...controllerRuns.map((run) => run.distanceGuidance.goodTotalPathFt));
      const powerSegments = inputState.powerMode === "shared" ? 2 : 1;
      const tapeSegments = controller.tapeMode === "shared" ? 2 : 1;
      const segmentDistance = controllerRecommendedDistance / (powerSegments + tapeSegments);

      if (inputState.powerMode === "shared") {
        changed =
          setAutoDistance(controllerState, "distanceSplitToController", "distanceSplitToControllerAuto", segmentDistance) ||
          changed;
      } else {
        changed =
          setAutoDistance(controllerState, "distancePowerToController", "distancePowerToControllerAuto", segmentDistance) ||
          changed;
      }

      if (controller.tapeMode === "shared") {
        changed =
          setAutoDistance(controllerState, "distanceControllerToTapeSplit", "distanceControllerToTapeSplitAuto", segmentDistance) ||
          changed;
      }

      controllerRuns.forEach((run) => {
        const stateRun = inputState.tapeRuns[run.globalRunIndex];
        if (!stateRun) return;

        if (controller.tapeMode === "shared") {
          changed =
            setAutoDistance(stateRun, "distanceSplitToTapeStart", "distanceSplitToTapeStartAuto", segmentDistance) ||
            changed;
        } else {
          changed =
            setAutoDistance(stateRun, "distanceControllerToTapeStart", "distanceControllerToTapeStartAuto", segmentDistance) ||
            changed;
        }

        if (run.feedBothEnds) {
          changed = setAutoDistance(stateRun, "farEndDistance", "farEndDistanceAuto", segmentDistance) || changed;
        }
      });
    });

    return changed;
  }

  function evaluate(inputState) {
    normalizeState(inputState);
    const issues = [];
    const selectedTape = tapeTypeById[inputState.tapeType] || tapeTypes[0];
    const runsByController = Array.from({ length: MAX_CONTROLLERS }, () => []);
    const preparedTapeRuns = inputState.tapeRuns.map((run, globalRunIndex) => {
      const controllerIndex = Math.min(MAX_CONTROLLERS - 1, Math.max(0, Math.round(number(run.controllerIndex))));
      const zoneIndex = Math.min(inputState.zoneCount - 1, Math.max(0, Math.round(number(run.zoneIndex ?? 0))));
      const defaultRunName = run.defaultRunName || `Tape Run ${globalRunIndex + 1}`;
      const customName = typeof run.customName === "string" ? run.customName : "";
      const tapeLength = Math.max(0, number(run.tapeLength));

      return {
        ...run,
        controllerIndex,
        zoneIndex,
        zoneName: zoneLabel(zoneIndex),
        globalRunIndex,
        customName,
        defaultRunName,
        runLetter: RUN_NAMES[globalRunIndex] || String(globalRunIndex + 1),
        runName: customName.trim() || defaultRunName,
        tapeLength,
        tapeCurrent: currentForTapeLength(tapeLength, selectedTape)
      };
    });

    preparedTapeRuns.forEach((run) => {
      runsByController[run.controllerIndex].push(run);
    });

    const preparedControllers = inputState.controllers.map((controller, controllerIndex) => {
      const tape = selectedTape;
      const activeRuns = runsByController[controllerIndex].slice(0, MAX_RUNS);
      const runs = activeRuns.map((run, runIndex) => {
        const tapeLength = Math.max(0, number(run.tapeLength));
        const runLetter = RUN_NAMES[runIndex] || String(runIndex + 1);
        const defaultRunName = run.defaultRunName || `Tape Run ${run.globalRunIndex + 1}`;
        const customName = typeof run.customName === "string" ? run.customName : "";
        return {
          ...run,
          customName,
          runLetter,
          defaultRunName,
          runName: customName.trim() || defaultRunName,
          tapeLength,
          tapeCurrent: currentForTapeLength(tapeLength, tape)
        };
      });
      const extraShortTapeLength = Math.max(0, number(controller.extraShortTapeLength));
      const totalTapeLength = runs.reduce((sum, run) => sum + run.tapeLength, 0) + extraShortTapeLength;
      const enabled = totalTapeLength > 0;
      const extraCurrent = enabled ? currentForTapeLength(extraShortTapeLength, tape) : 0;
      const totalTapeCurrent = runs.reduce((sum, run) => sum + run.tapeCurrent, 0) + extraCurrent;
      const inputCurrent = enabled ? totalTapeCurrent + CONTROLLER_STANDBY_A : 0;
      const tapePowerW = runs.reduce((sum, run) => sum + run.tapeLength * tape.wattsPerFt, 0) + extraShortTapeLength * tape.wattsPerFt;
      const zoneIndexes = Array.from(new Set(runs.filter((run) => run.tapeLength > 0).map((run) => run.zoneIndex))).sort((a, b) => a - b);
      const zoneNames = zoneIndexes.map(zoneLabel);

      return {
        ...controller,
        enabled,
        controllerIndex,
        tape,
        tapeType: tape.id,
        runs,
        zoneIndexes,
        zoneNames,
        zoneLabel: zoneNames.length === 1 ? zoneNames[0] : zoneNames.length ? "Mixed zones" : "No zone",
        assignedRunCount: activeRuns.length,
        extraShortTapeLength,
        extraCurrent,
        tapePowerW,
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

    const interfaceTapeLimits = summarizeInterfaceTapeLimits(preparedControllers);
    const interfaceLimitByControllerIndex = new Map();
    interfaceTapeLimits.forEach((limit) => {
      limit.controllerIndexes.forEach((controllerIndex) => {
        interfaceLimitByControllerIndex.set(controllerIndex, limit);
      });
    });

    interfaceTapeLimits.forEach((limit) => {
      if (!limit.overLimit) return;

      const limitDetails = [
        limit.tapeOverLimit ? `${ft(limit.totalTapeLength)} total tape; ${limit.tape.label} allows ${ft(limit.limitFt)} per 96 W power interface.` : "",
        limit.powerOverLimit ? `${watts(limit.powerW)} load; each power interface must stay under ${watts(POWER_LIMIT_W)}.` : ""
      ]
        .filter(Boolean)
        .join(" ");

      issues.push(
        issue(
          "fail",
          `Power Supply ${limit.interfaceIndex + 1} exceeds a power interface limit`,
          `Controllers ${limit.controllerNumbers.join(", ")}: ${limitDetails}`
        )
      );
    });

    preparedControllers.forEach((controller) => {
      if (!controller.enabled || controller.totalTapeLength <= controller.tape.maxInterfaceFt) return;

      issues.push(
        issue(
          "fail",
          `Controller ${controller.controllerIndex + 1} has too much tape`,
          `${ft(controller.totalTapeLength)} assigned. ${controller.tape.label} allows ${ft(
            controller.tape.maxInterfaceFt
          )} per controller / 96 W power interface.`
        )
      );
    });

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

      const interfaceLimit = interfaceLimitByControllerIndex.get(controller.controllerIndex);
      const controllerOverTapeLimit = controller.totalTapeLength > controller.tape.maxInterfaceFt;
      const tapeStatus =
        controller.totalTapeLength <= 0
          ? { label: "No tape", level: "neutral" }
          : interfaceLimit?.overLimit || controllerOverTapeLimit
            ? { label: "Too much tape", level: "fail" }
            : { label: "In range", level: "ok" };

      const runResults = controller.runs.map((run) => {
        const hasTape = run.tapeLength > 0;
        const baseDropV = tapeSplitDropV;
        const nearDistance = runDistance(controller, run);
        const nearWireSize = run.wireSizeToTapeStart;
        const dualEndRecommendedOverFt = controller.tape.dualEndRecommendedOverFt || FULL_REEL_FT;
        const maxContinuousRunFt = controller.tape.maxContinuousRunFt || DUAL_END_MAX_FT;
        let specStatus = hasTape ? { label: "In range", level: "ok" } : { label: "No tape", level: "neutral" };

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

        if (run.tapeLength > maxContinuousRunFt) {
          specStatus = { label: "Too long", level: "fail" };
          const detail =
            controller.tape.id === "rania-high"
              ? `${ft(run.tapeLength)} entered. Rania High Output allows ${ft(
                  maxContinuousRunFt
                )} total per power interface; reduce the tape length or use another properly specified power interface.`
              : `${ft(run.tapeLength)} entered. ${controller.tape.label} should be split into separate parallel runs when a single run is over ${ft(
                  maxContinuousRunFt
                )}.`;
          issues.push(
            issue(
              "fail",
              `${run.runName} is too long as one continuous tape`,
              detail
            )
          );
        } else if (run.tapeLength > dualEndRecommendedOverFt && !run.feedBothEnds) {
          specStatus = { label: "Dual feed recommended", level: "warn" };
          const detail =
            controller.tape.id === "rania-high"
              ? `${ft(run.tapeLength)} entered. Rania High Output should be fed from both ends when a run is over ${ft(
                  dualEndRecommendedOverFt
                )}.`
              : `${ft(run.tapeLength)} entered. Feed both ends or split this into parallel runs when a run is over ${ft(
                  dualEndRecommendedOverFt
                )}.`;
          issues.push(
            issue(
              "warn",
              `${run.runName} should be fed from both ends`,
              detail
            )
          );
        } else if (run.tapeLength > dualEndRecommendedOverFt && run.feedBothEnds) {
          specStatus = { label: "Dual feed ok", level: "ok" };
        }

        if (startStatus.level === "fail") {
          issues.push(
            issue(
              "fail",
              `${run.runName} may start too dim`,
              `${pct(fadeAtTapeStartPct)} light loss before the tape starts. Shorten wire, use larger wire, or move the controller.`
            )
          );
        } else if (startStatus.level === "warn") {
          issues.push(
            issue(
              "warn",
              `${run.runName} may visibly start dimmer`,
              `${pct(fadeAtTapeStartPct)} light loss before the tape starts.`
            )
          );
        }

        if (runStatus.level === "fail") {
          issues.push(
            issue(
              "fail",
              `${run.runName} may look uneven`,
              `${pct(visibleRunFadePct)} brightness difference from start to end.`
            )
          );
        } else if (runStatus.level === "warn") {
          issues.push(
            issue(
              "warn",
              `${run.runName} may look uneven`,
              `${pct(visibleRunFadePct)} brightness difference from start to end.`
            )
          );
        }

        const distanceGuidance = runDistanceGuidance(inputState, controller, run, totalCurrent);
        const runOverallLevel = worstLevel([startStatus.level, runStatus.level, specStatus.level]);
        const runOverallStatus = {
          level: runOverallLevel,
          label: { neutral: "No tape", ok: "Good", warn: "Review", fail: "Fix" }[runOverallLevel] || "Review"
        };

        return {
          ...run,
          runDistance: nearDistance,
          leadDropV,
          fadeAtTapeStartPct,
          fadeAtTapeEndPct,
          visibleRunFadePct,
          startStatus,
          runStatus,
          specStatus,
          runOverallStatus,
          distanceGuidance,
          lengthLimit: run.feedBothEnds ? maxContinuousRunFt : dualEndRecommendedOverFt,
          dualEndRecommendedOverFt,
          maxContinuousRunFt
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

    const tapeRunResults = controllers
      .flatMap((controller) =>
        controller.runResults.map((run) => ({
          ...run,
          controllerIndex: controller.controllerIndex,
          controllerLabel: `Controller ${controller.controllerIndex + 1}`,
          zoneName: run.zoneName || zoneLabel(run.zoneIndex || 0)
        }))
      )
      .sort((a, b) => a.globalRunIndex - b.globalRunIndex);
    const activeControllers = controllers.filter((controller) => controller.enabled).length;
    const activeZones = new Set(tapeRunResults.filter((run) => run.tapeLength > 0).map((run) => run.zoneIndex)).size;
    const totalTapeLength = controllers.reduce((sum, controller) => sum + controller.totalTapeLength, 0);
    const wireSummary = summarizeWireLengths(inputState, controllers);
    const hasFailures = issues.some((item) => item.level === "fail");
    const hasWarnings = issues.some((item) => item.level === "warn");
    const overall = hasFailures ? "Not recommended" : hasWarnings ? "Review install" : activeControllers ? "Looks good" : "Ready";
    const level = hasFailures ? "fail" : hasWarnings ? "warn" : activeControllers ? "ok" : "neutral";

    if (!issues.length && totalTapeLength <= 0) {
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
      interfaceTapeLimits,
      interfaceTapeLimitText: interfaceTapeLimitText(interfaceTapeLimits),
      activeControllers,
      activeZones,
      sharedPowerDropV,
      controllers,
      tapeRunResults,
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

  function controllerOptions(selected) {
    return Array.from({ length: MAX_CONTROLLERS }, (_, index) => index)
      .map(
        (index) =>
          `<option value="${index}" ${Number(selected) === index ? "selected" : ""}>Controller ${index + 1}</option>`
      )
      .join("");
  }

  function zoneOptions(selected, count) {
    const safeCount = clampZoneCount(count, Math.max(1, state.tapeRuns.length));
    return Array.from({ length: safeCount }, (_, index) => index)
      .map((index) => `<option value="${index}" ${Number(selected) === index ? "selected" : ""}>${zoneLabel(index)}</option>`)
      .join("");
  }

  function powerSupplyOptions(selected, count) {
    const safeCount = Math.min(
      MAX_CONTROLLERS,
      Math.max(1, Math.round(number(count) || 1), Math.round(number(selected) || 0) + 1)
    );
    return Array.from({ length: safeCount }, (_, index) => index)
      .map(
        (index) =>
          `<option value="${index}" ${Number(selected) === index ? "selected" : ""}>Power Supply ${index + 1}</option>`
      )
      .join("");
  }

  function pill(item) {
    return `<span class="pill ${item.level}">${item.label}</span>`;
  }

  function wireDistanceHelpForLabel(label) {
    if (label === "Recommended Total Wire Distance") {
      return HELP_RECOMMENDED_TOTAL_WIRE_DISTANCE;
    }
    if (label === "Max Total Wire Distance") {
      return HELP_MAX_TOTAL_WIRE_DISTANCE;
    }
    return "";
  }

  function helpTooltip(text) {
    const safeText = escapeHtml(text);
    return `
      <span class="tooltip-wrap">
        <button type="button" class="info-dot" aria-label="${safeText}" title="${safeText}">i</button>
        <span class="tooltip-bubble" role="tooltip">${safeText}</span>
      </span>
    `;
  }

  function labelWithHelp(label) {
    const helpText = wireDistanceHelpForLabel(label);
    if (!helpText) {
      return escapeHtml(label);
    }
    return `<span class="label-with-help">${escapeHtml(label)}${helpTooltip(helpText)}</span>`;
  }

  function resultChip(label, value, status) {
    if (status) {
      return `<div class="result-chip"><span class="result-label">${labelWithHelp(label)}</span>${pill(status)}<span>${value}</span></div>`;
    }
    return `<div class="result-chip"><strong>${value}</strong><span>${labelWithHelp(label)}</span></div>`;
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

  function shortMapLabel(value, maxLength = 18) {
    const text = String(value || "");
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  function runVisualLevel(run) {
    if (run.runOverallStatus?.level) return run.runOverallStatus.level;
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
                                <span>${escapeHtml(run.runName)}</span>
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
        pieces.push(svgBox(runStartX, runY - 25, 122, 50, shortMapLabel(run.runName), `${ft(run.tapeLength)}`, runLevel));
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
    const tapeWidth = 104;
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
    return `#fine-controller-${controller.controllerIndex + 1}-run-${(run.globalRunIndex ?? 0) + 1}`;
  }

  function controllerMapPowerLabel(controllerIndex, result) {
    const controller = result.controllers[controllerIndex];
    if (!controller) return `${DEFAULT_WIRE_SIZE} AWG`;

    if (state.powerMode === "shared") {
      const totalDistance = number(state.sharedPower.distance) + number(controller.distanceSplitToController);
      return `${ft(totalDistance)} / mixed AWG`;
    }

    return wireTag(controller.distancePowerToController, controller.wireSizePowerToController);
  }

  function assignedPowerSupplyGroups(result, recommendation) {
    const activeControllers = result.controllers.filter((controller) => controller.enabled);
    const highestAssignedIndex = activeControllers.reduce(
      (highest, controller) => Math.max(highest, Math.round(number(controller.powerSupplyIndex ?? 0))),
      0
    );
    const count = Math.min(
      MAX_CONTROLLERS,
      Math.max(1, recommendation.powerSupplyCount || 1, highestAssignedIndex + 1)
    );
    const groups = Array.from({ length: count }, (_, index) => ({
      index,
      totalTapeLength: 0,
      powerW: 0,
      runs: [],
      controllers: []
    }));

    activeControllers.forEach((controller) => {
      const supplyIndex = Math.min(count - 1, Math.max(0, Math.round(number(controller.powerSupplyIndex ?? 0))));
      const runs = controller.runResults.filter((run) => run.tapeLength > 0);
      groups[supplyIndex].controllers.push({
        globalIndex: controller.controllerIndex,
        powerSupplyIndex: supplyIndex,
        totalTapeLength: controller.totalTapeLength,
        tapePowerW: controller.tapePowerW,
        runs
      });
      groups[supplyIndex].runs.push(...runs);
      groups[supplyIndex].totalTapeLength += controller.totalTapeLength;
      groups[supplyIndex].powerW += controller.tapePowerW;
    });

    return groups.filter((group) => group.controllers.length);
  }

  function renderRecommendedSystemMap(recommendation, result) {
    const mapSupplies = assignedPowerSupplyGroups(result, recommendation);

    if (!mapSupplies.length) {
      els.systemMap.innerHTML = `
        <div class="system-map-empty">
          <strong>No tape lengths entered</strong>
          <span>Enter the lighting runs above to build a suggested diagram.</span>
        </div>
      `;
      queueMapPanUpdate();
      return;
    }

    const actualRunByIndex = new Map(result.tapeRunResults.map((run) => [run.globalRunIndex, run]));
    const usesPowerSplit = state.powerMode === "shared";
    const powerX = 42;
    const powerSplitX = 230;
    const powerSplitWidth = 104;
    const controllerX = usesPowerSplit ? 430 : 340;
    const tapeSplitX = usesPowerSplit ? 650 : 560;
    const runX = usesPowerSplit ? 830 : 740;
    const tapeX = usesPowerSplit ? 992 : 902;
    const laneGap = 156;
    const runGap = 78;
    const pieces = [];
    const interfaceLimitBySupply = new Map((result.interfaceTapeLimits || []).map((limit) => [limit.interfaceIndex, limit]));
    let cursorY = 58;

    mapSupplies.forEach((supply) => {
      const runCount = Math.max(1, supply.runs.length);
      const blockHeight = Math.max(112, runCount * runGap);
      const powerY = cursorY + blockHeight / 2 - 32;
      const supplyLimit = interfaceLimitBySupply.get(supply.index);
      const powerLevel = supplyLimit?.overLimit || supply.powerW > POWER_LIMIT_W ? "fail" : "ok";
      const firstController = supply.controllers[0];
      const supplyJump = firstController ? controllerPowerJump({ controllerIndex: firstController.globalIndex }) : "#powerFeedCard";

      pieces.push(
        systemMapNode(
          powerX,
          powerY,
          126,
          64,
          `Power Supply ${supply.index + 1}`,
          `${watts(supply.powerW)} load`,
          powerLevel,
          supplyJump
        )
      );

      if (usesPowerSplit) {
        pieces.push(
          systemMapWire(
            powerX + 126,
            powerY + 32,
            powerSplitX,
            powerY + 32,
            wireTag(state.sharedPower.distance, state.sharedPower.wireSize),
            powerLevel,
            "#sharedPowerFields"
          )
        );
        pieces.push(
          systemMapNode(
            powerSplitX,
            powerY,
            powerSplitWidth,
            64,
            "Power Split",
            "to controllers",
            powerLevel,
            "#sharedPowerFields"
          )
        );
      }

      let localCursor = cursorY;
      supply.controllers.forEach((controller) => {
        const actualController = result.controllers[controller.globalIndex];
        const controllerRuns = controller.runs.length ? controller.runs : [];
        const controllerHeight = Math.max(84, controllerRuns.length * runGap);
        const controllerY = localCursor + controllerHeight / 2 - 32;
        const controllerLevel = actualController ? controllerVisualLevel(actualController) : worstLevel(controllerRuns.map((run) => run.runOverallStatus.level));
        const usesTapeSplit = actualController?.tapeMode === "shared";
        const controllerTarget = actualController ? controllerJump(actualController) : "#advancedDetails";
        const controllerPowerTarget = actualController ? controllerPowerJump(actualController) : "#advancedDetails";
        const powerSourceX = usesPowerSplit ? powerSplitX + powerSplitWidth : powerX + 126;
        const powerLabel =
          usesPowerSplit && actualController
            ? wireTag(actualController.distanceSplitToController, actualController.wireSizeSplitToController)
            : controllerMapPowerLabel(controller.globalIndex, result);

        pieces.push(
          systemMapWire(
            powerSourceX,
            powerY + 32,
            controllerX,
            controllerY + 32,
            powerLabel,
            controllerLevel,
            controllerPowerTarget
          )
        );
        pieces.push(
          systemMapNode(
            controllerX,
            controllerY,
            128,
            64,
            `Controller ${controller.globalIndex + 1}`,
            `${ft(controller.totalTapeLength)} tape`,
            controllerLevel,
            controllerTarget
          )
        );

        const runSourceX = usesTapeSplit ? tapeSplitX + 96 : controllerX + 128;
        const runSourceY = controllerY + 32;

        if (usesTapeSplit) {
          const splitLevel = actualController
            ? worstLevel(actualController.runResults.map((run) => runVisualLevel(run)))
            : controllerLevel;
          pieces.push(
            systemMapWire(
              controllerX + 128,
              controllerY + 32,
              tapeSplitX,
              controllerY + 32,
              wireTag(actualController.distanceControllerToTapeSplit, actualController.wireSizeControllerToTapeSplit),
              splitLevel,
              tapeSplitJump(actualController)
            )
          );
          pieces.push(systemMapNode(tapeSplitX, controllerY, 96, 64, "Tape Split", "to runs", splitLevel, tapeSplitJump(actualController)));
        }

        const firstRunY = localCursor + controllerHeight / 2 - ((controllerRuns.length - 1) * runGap) / 2;
        controllerRuns.forEach((run, runIndex) => {
          const actualRun = actualRunByIndex.get(run.globalRunIndex) || run;
          const runY = firstRunY + runIndex * runGap;
          const runLevel = actualRun.runOverallStatus?.level || run.runOverallStatus.level;
          const runTarget = actualController ? runJump(actualController, actualRun) : "#advancedDetails";
          pieces.push(
            systemMapWire(
              runSourceX,
              runSourceY,
              runX,
              runY,
              wireTag(actualRun.runDistance || actualRun.distanceControllerToTapeStart || actualRun.distanceSplitToTapeStart, actualRun.wireSizeToTapeStart),
              runLevel,
              runTarget
            )
          );
          pieces.push(
            systemMapNode(
              runX,
              runY - 30,
              118,
              60,
              shortMapLabel(actualRun.runName),
              `${ft(actualRun.tapeLength)} tape`,
              runLevel,
              runTarget,
              "run"
            )
          );
          pieces.push(systemMapTape(tapeX, runY, actualRun, runLevel, runTarget));
        });

        localCursor += controllerHeight + 18;
      });

      cursorY += blockHeight + laneGap;
    });

    const height = Math.max(240, cursorY - laneGap + 58);
    const width = usesPowerSplit ? 1180 : 1080;

    els.systemMap.innerHTML = `
      <div class="system-map-track" style="--map-width: ${width}px;">
        <svg class="system-map-svg complex" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Suggested system wiring map">
          ${pieces.join("")}
        </svg>
      </div>
    `;
    queueMapPanUpdate();
  }

  function renderSuggestedSystem(recommendation, result) {
    const dualFeedRuns = result.tapeRunResults.filter((run) => run.tapeLength > 0 && run.feedBothEnds);
    const materialsHtml = `
      <section class="materials-summary" aria-label="Suggested materials summary">
        <h3>Suggested Materials Summary</h3>
        <div class="materials-grid">
          ${resultChip("Tape light", ft(recommendation.totalTapeLength))}
          ${resultChip("Controllers", recommendation.controllerCount || 0)}
          ${resultChip("Power supplies", recommendation.powerSupplyCount || 0)}
          ${resultChip("Low-voltage wire", result.totalWireLengthText)}
        </div>
        <p>
          Based on ${escapeHtml(recommendation.tape.label)} with ${recommendation.controllerCount || 0} ${
      recommendation.controllerCount === 1 ? "controller/zone" : "controllers/zones"
    }. ${
      dualFeedRuns.length
        ? `Dual-feed runs: ${escapeHtml(dualFeedRuns.map((run) => run.runName).join(", "))}.`
        : "No dual-feed runs currently selected."
    }
        </p>
      </section>
    `;
    const cards = `
      <div class="suggestion-cards">
        ${resultChip("Power supplies", recommendation.powerSupplyCount || 0)}
        ${resultChip("Controllers", recommendation.controllerCount || 0)}
        ${resultChip("Total tape", ft(recommendation.totalTapeLength))}
        ${resultChip("Tape product", recommendation.tape.label)}
      </div>
    `;

    const supplyHtml = recommendation.powerSupplies
      .map(
        (supply) => `
          <section class="suggestion-group">
            <h3>Power Supply ${supply.index + 1}</h3>
            <p>${ft(supply.totalTapeLength)} tape - ${watts(supply.powerW)} estimated load</p>
            <div class="suggested-controller-list">
              ${supply.controllers
                .map(
                  (controller) => `
                    <div class="suggested-controller">
                      <strong>Controller ${controller.globalIndex + 1}</strong>
                      <span>${controller.runs.map((run) => escapeHtml(run.runName)).join(", ")}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          </section>
        `
      )
      .join("");

    const explanationHtml = recommendation.activeRunCount
      ? `
        <details class="recommendation-explain" open>
          <summary>Why this recommendation?</summary>
          <div class="explain-grid">
            <div>
              <span>Controller / zone assignment</span>
              <strong>${escapeHtml(recommendation.explanation.controllerAssignmentText)}</strong>
            </div>
            <div>
              <span>Runs entered</span>
              <strong>${escapeHtml(recommendation.explanation.runLengthText)}</strong>
            </div>
            <div>
              <span>Total tape</span>
              <strong>${escapeHtml(recommendation.explanation.totalTapeText)}</strong>
            </div>
            <div>
              <span>Selected tape limit</span>
              <strong>${escapeHtml(recommendation.explanation.maxTapePerPowerSupplyText)}</strong>
            </div>
            <div>
              <span>One-supply load check</span>
              <strong>${escapeHtml(recommendation.explanation.oneSupplyLoadText)} / ${escapeHtml(
                recommendation.explanation.powerLimitText
              )}</strong>
            </div>
          </div>
          <p>
            ${
              recommendation.explanation.needsMultipleSuppliesByTape || recommendation.explanation.needsMultipleSuppliesByPower
                ? "The tool adds another power supply because the entered runs exceed the selected tape product's per-supply tape limit, the 96 W power limit, or both."
                : "The entered runs fit within one power supply for both tape length and estimated power load."
            }
          </p>
          <p><strong>Suggested grouping:</strong> ${escapeHtml(recommendation.explanation.groupingText)}</p>
        </details>
      `
      : "";

    const runHtml = recommendation.powerSupplies
      .flatMap((supply) => supply.controllers.flatMap((controller) => controller.runs))
      .map(
        (run) => `
          <div class="suggested-run-row ${run.runOverallStatus.level}">
            <div>
              <strong>${escapeHtml(run.runName)}</strong>
              <span>${ft(run.tapeLength)} - ${run.controllerLabel}</span>
            </div>
            <div>
              <div class="suggested-row-label">${labelWithHelp("Recommended Total Wire Distance")}</div>
              <strong>${ft(run.distanceGuidance.goodTotalPathFt)} <small>${GOOD_LIGHT_LOSS_PCT}% loss</small></strong>
            </div>
            <div>
              <div class="suggested-row-label">${labelWithHelp("Max Total Wire Distance")}</div>
              <strong>${ft(run.distanceGuidance.maxTotalPathFt)} <small>${MAX_LIGHT_LOSS_PCT}% loss</small></strong>
            </div>
            ${pill(run.runOverallStatus)}
          </div>
        `
      )
      .join("");

    els.suggestedSystem.innerHTML = `
      ${cards}
      ${materialsHtml}
      ${explanationHtml}
      <div class="suggestion-layout">${supplyHtml}</div>
      <div class="suggested-run-table">${runHtml}</div>
    `;
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
    const runWidth = 112;
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
        pieces.push(systemMapNode(runX, runY - 30, 112, 60, shortMapLabel(run.runName), runSub, runLevel, jump, "run"));
        pieces.push(systemMapTape(runX + runWidth, runY, run, runLevel, jump));
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
        pieces.push(mapStackItem(run.runName, sub, runLevel, runJump(controller, run), run.feedBothEnds ? "both-ends" : ""));
      });
    });

    return `<div class="system-map-stack">${pieces.join("")}</div>`;
  }

  function renderSystemMap(result) {
    const activeControllers = result.controllers.filter((controller) => controller.enabled);

    if (!activeControllers.length) {
      els.systemMap.innerHTML = `
        <div class="system-map-empty">
          <strong>No tape lengths entered</strong>
          <span>Add tape length and assign it to a controller to build the map.</span>
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
      : `Feed both ends when this tape run is over ${ft(controller.tape.dualEndRecommendedOverFt || FULL_REEL_FT)}.`;

    return `
      <section id="controller-${controllerIndex + 1}-run-${run.runLetter}" class="run-card">
        <div class="run-card-top">
          <div class="run-title-block">
            <p class="section-kicker">${escapeHtml(run.defaultRunName)}</p>
            <h3>${escapeHtml(run.runName)}</h3>
            <label class="run-name-field">
              <span>Run name (optional)</span>
              <input data-path="controllers.${controllerIndex}.runs.${runIndex}.customName" type="text" maxlength="64" value="${escapeHtml(
      run.customName
    )}" placeholder="Under Cabinet">
            </label>
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
            <strong>To ${escapeHtml(run.runName)}</strong>
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

  function renderTapeRunCard(run, result) {
    const controller = result.controllers[run.controllerIndex];
    const basePath = `tapeRuns.${run.globalRunIndex}`;
    const distancePath =
      controller.tapeMode === "shared" ? "distanceSplitToTapeStart" : "distanceControllerToTapeStart";
    const distanceLabel =
      controller.tapeMode === "shared" ? "Distance from tape split to tape start" : "Distance from controller to tape start";
    const dualSuggestion =
      run.tapeLength > run.dualEndRecommendedOverFt && !run.feedBothEnds
        ? `<span class="field-callout warn">Suggested by spec for this length</span>`
        : "";
    const farEndDistanceLabel =
      controller.tapeMode === "shared" ? "Distance from tape split to far end" : "Distance from controller to far end";
    const farEndFields = run.feedBothEnds
      ? `
        <label class="map-field">
          <span>${farEndDistanceLabel}</span>
          <div class="input-with-unit">
            <input data-path="${basePath}.farEndDistance" type="number" min="0" max="500" step="0.1" value="${run.farEndDistance}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Wire size to far end</span>
          <select data-path="${basePath}.farEndWireSize">${optionMarkup(wireSizes, run.farEndWireSize)}</select>
        </label>
      `
      : "";
    const summaryParts = [run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "Add tape length"];

    return `
      <details id="controller-${run.controllerIndex + 1}-run-${run.runLetter}" class="run-card installer-run-card" open>
        <summary class="installer-run-summary">
          <span class="summary-title">
            <span class="section-kicker">${escapeHtml(run.defaultRunName)}</span>
            <span class="summary-heading">${escapeHtml(run.runName)}</span>
            <span class="run-summary-line">${summaryParts.map(escapeHtml).join(" · ")}</span>
          </span>
          ${pill(run.runOverallStatus)}
          <span class="summary-action" aria-hidden="true"></span>
        </summary>

        <div class="installer-run-body">
          <div class="controller-settings">
            <label>
              <span>Run name</span>
              <input data-path="${basePath}.customName" type="text" maxlength="64" value="${escapeHtml(
      run.customName
    )}" placeholder="${escapeHtml(run.defaultRunName)}">
            </label>
            <label>
              <span>Tape length</span>
              <div class="input-with-unit">
                <input data-path="${basePath}.tapeLength" type="number" min="0" max="500" step="0.1" value="${run.tapeLength}">
                <span>ft</span>
              </div>
            </label>
            <label>
              <span>Controller / zone</span>
              <select data-path="${basePath}.zoneIndex">${zoneOptions(run.zoneIndex, state.zoneCount)}</select>
              <small class="field-help">Each controller is one independently controlled zone.</small>
            </label>
            <button type="button" class="secondary compact-button" data-run-action="remove" data-run-index="${run.globalRunIndex}">
              <span>Remove run</span>
            </button>
          </div>

          <div class="distance-guide">
            ${resultChip("Recommended Total Wire Distance", `${ft(run.distanceGuidance.goodTotalPathFt)} at ${GOOD_LIGHT_LOSS_PCT}% loss`, {
              label: "Recommended",
              level: "ok"
            })}
            ${resultChip("Max Total Wire Distance", `${ft(run.distanceGuidance.maxTotalPathFt)} at ${MAX_LIGHT_LOSS_PCT}% loss`, {
              label: "Max",
              level: "warn"
            })}
            ${resultChip("Planned longest path", ft(run.distanceGuidance.plannedTotalPathFt), run.startStatus)}
          </div>

          <label class="checkbox-line">
            <input data-path="${basePath}.feedBothEnds" type="checkbox" ${run.feedBothEnds ? "checked" : ""}>
            <span>Feed this tape from both ends</span>
          </label>
          ${dualSuggestion}

          <div class="wire-map run installer-distance-map">
            <div class="map-node">
              <span>${controller.tapeMode === "shared" ? "Tape split" : `Controller ${run.controllerIndex + 1}`}</span>
              <strong>To tape</strong>
            </div>
            <label class="map-field">
              <span>${distanceLabel}</span>
              <div class="input-with-unit">
                <input data-path="${basePath}.${distancePath}" type="number" min="0" max="500" step="0.1" value="${run[distancePath]}">
                <span>ft</span>
              </div>
            </label>
            <label class="map-field">
              <span>Wire size to tape</span>
              <select data-path="${basePath}.wireSizeToTapeStart">${optionMarkup(wireSizes, run.wireSizeToTapeStart)}</select>
            </label>
            ${farEndFields}
          </div>

          <div class="distance-guide">
            ${resultChip("Start of Tape", `${pct(run.fadeAtTapeStartPct)} light loss before tape starts`, run.startStatus)}
            ${resultChip("Start to End of Tape", `${pct(run.visibleRunFadePct)} difference from start to end`, run.runStatus)}
            ${resultChip("Spec wiring", run.specStatus.label, run.specStatus)}
          </div>
        </div>
      </details>
    `;
  }

  function renderTapeRuns(result) {
    els.tapeRuns.innerHTML = result.tapeRunResults.map((run) => renderTapeRunCard(run, result)).join("");
  }

  function renderControllerRunFineTune(controller) {
    const runs = controller.runResults.filter((run) => run.tapeLength > 0);
    if (!runs.length) {
      return `
        <div class="fine-tune-runs empty">
          <strong>Tape wire distances</strong>
          <span>Assign tape runs above to fine-tune controller-to-tape distances here.</span>
        </div>
      `;
    }

    const runCards = runs
      .map((run) => {
        const basePath = `tapeRuns.${run.globalRunIndex}`;
        const distancePath =
          controller.tapeMode === "shared" ? "distanceSplitToTapeStart" : "distanceControllerToTapeStart";
        const distanceLabel =
          controller.tapeMode === "shared" ? "Distance from tape split to tape" : "Distance from controller to tape";
        const dualSuggestion =
          run.tapeLength > run.dualEndRecommendedOverFt && !run.feedBothEnds
            ? `<span class="field-callout warn">Suggested by spec for this length</span>`
            : "";
        const farEndDistanceLabel =
          controller.tapeMode === "shared" ? "Distance from tape split to far end" : "Distance from controller to far end";
        const farEndFields = run.feedBothEnds
          ? `
            <label class="map-field">
              <span>${farEndDistanceLabel}</span>
              <div class="input-with-unit">
                <input data-path="${basePath}.farEndDistance" type="number" min="0" max="500" step="0.1" value="${run.farEndDistance}">
                <span>ft</span>
              </div>
            </label>
            <label class="map-field">
              <span>Wire size to far end</span>
              <select data-path="${basePath}.farEndWireSize">${optionMarkup(wireSizes, run.farEndWireSize)}</select>
            </label>
          `
          : "";

        return `
          <section id="fine-controller-${controller.controllerIndex + 1}-run-${run.globalRunIndex + 1}" class="fine-tune-run">
            <div class="fine-tune-run-top">
              <div>
                <strong>${escapeHtml(run.runName)}</strong>
                <span>${ft(run.tapeLength)} tape</span>
              </div>
              ${pill(run.runOverallStatus)}
            </div>
            <div class="dual-feed-row">
              <label class="checkbox-line">
                <input data-path="${basePath}.feedBothEnds" type="checkbox" ${run.feedBothEnds ? "checked" : ""}>
                <span>Feed this tape from both ends</span>
              </label>
              ${dualSuggestion}
            </div>
            <div class="wire-map run installer-distance-map">
              <div class="map-node">
                <span>${controller.tapeMode === "shared" ? "Tape split" : `Controller ${controller.controllerIndex + 1}`}</span>
                <strong>To tape</strong>
              </div>
              <label class="map-field">
                <span>${distanceLabel}</span>
                <div class="input-with-unit">
                  <input data-path="${basePath}.${distancePath}" type="number" min="0" max="500" step="0.1" value="${run[distancePath]}">
                  <span>ft</span>
                </div>
              </label>
              <label class="map-field">
                <span>Wire size to tape</span>
                <select data-path="${basePath}.wireSizeToTapeStart">${optionMarkup(wireSizes, run.wireSizeToTapeStart)}</select>
              </label>
              ${farEndFields}
            </div>
            <div class="distance-guide">
              ${resultChip("Recommended Total Wire Distance", `${ft(run.distanceGuidance.goodTotalPathFt)} at ${GOOD_LIGHT_LOSS_PCT}% loss`, {
                label: "Recommended",
                level: "ok"
              })}
              ${resultChip("Max Total Wire Distance", `${ft(run.distanceGuidance.maxTotalPathFt)} at ${MAX_LIGHT_LOSS_PCT}% loss`, {
                label: "Max",
                level: "warn"
              })}
              ${resultChip("Planned longest path", `${ft(run.distanceGuidance.plannedTotalPathFt)} at ${pct(run.distanceGuidance.plannedFadePct || 0)} loss`, run.startStatus)}
            </div>
          </section>
        `;
      })
      .join("");

    return `
      <div class="fine-tune-runs">
        <div class="fine-tune-heading">
          <strong>Tape wire distances</strong>
          <span>These start by splitting the recommended total wire distance. Override them if the job layout needs different distances.</span>
        </div>
        ${runCards}
      </div>
    `;
  }

  function renderControllerPlacement(controller, recommendation) {
    const index = controller.controllerIndex;
    const isCollapsed = collapsedControllers.has(index);
    const assignedCount = controller.assignedRunCount || controller.runResults.length;
    const shouldOpen = !isCollapsed && assignedCount > 0;
    const assignedText = `${assignedCount} ${assignedCount === 1 ? "run" : "runs"} assigned`;
    const statusText = controller.enabled ? `${ft(controller.totalTapeLength)} tape` : assignedText;
    const showPowerAssignment = (recommendation.powerSupplyCount || 1) > 1;
    const powerAssignmentField = showPowerAssignment
      ? `
        <label>
          <span>Powered by</span>
          <select data-path="controllers.${index}.powerSupplyIndex">${powerSupplyOptions(
            controller.powerSupplyIndex,
            recommendation.powerSupplyCount
          )}</select>
          <small class="field-help">Choose which 96 W power supply feeds this controller.</small>
        </label>
      `
      : "";

    return `
      <details id="controller-${index + 1}" class="controller-card collapsible-card" data-controller-details="${index}" ${
      shouldOpen ? "open" : ""
    }>
        <summary class="controller-top controller-summary">
          <div class="controller-title">
            <strong>Controller ${index + 1}</strong>
            <span>${assignedText} - ${amps(controller.totalTapeCurrent)} tape, ${amps(controller.inputCurrent)} total</span>
          </div>
          <div class="controller-actions">
            <div class="controller-status">${pill(controller.tapeStatus)} <span class="muted">${statusText}</span></div>
          </div>
          <span class="summary-action" aria-hidden="true"></span>
        </summary>

        <div id="controller-${index + 1}-body" class="controller-body">
          <div class="controller-settings">
            ${resultChip("Tape on this controller", ft(controller.totalTapeLength))}
            ${resultChip("Power used by this controller", watts(controller.tapePowerW))}
            ${powerAssignmentField}
          </div>

          ${renderControllerPowerMap(controller)}

          <div class="advanced-card installer-advanced visible-wiring-choice">
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

          ${renderControllerRunFineTune(controller)}
        </div>
      </details>
    `;
  }

  function renderController(controller) {
    const index = controller.controllerIndex;
    const statusText = controller.enabled ? `${ft(controller.totalTapeLength)} tape` : "Disabled";
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
            ${resultChip("Power used by this controller", watts(controller.tapePowerW))}
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
              <span>Extra short tape on this controller, load only</span>
              <div class="input-with-unit">
                <input data-path="controllers.${index}.extraShortTapeLength" type="number" min="0" max="500" step="0.1" value="${controller.extraShortTapeLength}">
                <span>ft</span>
              </div>
              <small class="field-help">Use for short nearby tape runs you do not need to voltage-drop check. This adds load, but does not check brightness drop on those pieces.</small>
            </label>
            ${resultChip("Total tape", ft(controller.totalTapeLength))}
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
      if (!button) return;
      const isActive = activePreset === preset;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function wireDistanceGuidanceHtml(result) {
    const runs = result.tapeRunResults.filter((run) => run.tapeLength > 0);

    if (!runs.length) return "Add tape runs to see distance guidance.";

    return runs
      .map(
        (run) => `
          <span>
            <strong>${escapeHtml(run.runName)}</strong>
            Recommended ${ft(run.distanceGuidance.goodTotalPathFt)} (${GOOD_LIGHT_LOSS_PCT}% loss), max ${ft(
          run.distanceGuidance.maxTotalPathFt
        )} (${MAX_LIGHT_LOSS_PCT}% loss), planned ${ft(run.distanceGuidance.plannedTotalPathFt)}
          </span>
        `
      )
      .join("");
  }

  function totalWireHtml(result) {
    if (!result.totalWireLength) return `<strong>0 ft</strong><div class="metric-detail-list">Add distances to spec wire.</div>`;

    const details = result.wireLengths
      .map(
        (item) => `
          <span><strong>${item.wireSize} AWG</strong>${ft(item.length)}</span>
        `
      )
      .join("");

    return `<strong>${ft(result.totalWireLength)}</strong><div class="metric-detail-list">${details}</div>`;
  }

  function isPowerSupplySizingIssue(item) {
    return (
      item.title === "Power box load is okay" ||
      item.title === "Power box is overloaded" ||
      item.title.includes("exceeds the power interface tape limit")
    );
  }

  function buildLivePlan(result, recommendation) {
    const seen = new Set();
    const issues = [];

    [...recommendation.issues, ...result.issues.filter((item) => !isPowerSupplySizingIssue(item))].forEach((item) => {
      const key = `${item.level}|${item.title}|${item.detail}`;
      if (seen.has(key)) return;
      seen.add(key);
      issues.push(item);
    });
    issues.sort((a, b) => levelRank(b.level) - levelRank(a.level));

    const level = issues.some((item) => item.level === "fail")
      ? "fail"
      : issues.some((item) => item.level === "warn")
        ? "warn"
        : recommendation.activeRunCount
          ? "ok"
          : "neutral";

    return {
      ...result,
      level,
      overall: level === "fail" ? "Not recommended" : level === "warn" ? "Review plan" : recommendation.activeRunCount ? "Looks good" : "Ready",
      powerW: recommendation.totalPowerW,
      totalTapeLength: recommendation.totalTapeLength,
      activeControllers: recommendation.controllerCount,
      issues
    };
  }

  function renderLiveResults(result, recommendation = buildRecommendation(state)) {
    const liveResult = buildLivePlan(result, recommendation);

    renderStatusStrip(liveResult);
    renderRecommendedSystemMap(recommendation, result);
    renderSuggestedSystem(recommendation, result);

    els.overallStatus.textContent = liveResult.overall;
    els.overallPill.textContent = liveResult.overall;
    els.overallPill.className = `pill ${liveResult.level}`;
    els.mobileOverallStatus.textContent = liveResult.overall;
    els.mobileOverallPill.textContent =
      { ok: "Good", warn: "Review", fail: "Fix", neutral: "Ready" }[liveResult.level] || liveResult.overall;
    els.mobileOverallPill.className = `pill ${liveResult.level}`;

    const metricsHtml = [
      ["Tape product", recommendation.tape.label],
      ["Suggested power supplies", recommendation.powerSupplyCount],
      ["Power supplies in use", result.interfaceTapeLimits.length || recommendation.powerSupplyCount],
      ["Suggested controllers", recommendation.controllerCount],
      ["Total tape", ft(liveResult.totalTapeLength)],
      ["Estimated total load", watts(liveResult.powerW)],
      ["Default wire size", `${DEFAULT_WIRE_SIZE} AWG`]
    ]
      .map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`)
      .join("");
    const totalWireLengthHtml = `
      <div class="metric-row metric-row-stack">
        <span>Max total wire being spec'd</span>
        ${totalWireHtml(result)}
      </div>
    `;
    const wireGuidanceHtml = `
      <div class="metric-row metric-row-stack">
        <span>Wire distance guidance</span>
        <div class="metric-detail-list">${wireDistanceGuidanceHtml(result)}</div>
      </div>
    `;

    const issuesHtml = `<div class="issue-list">${liveResult.issues
      .map(
        (item) =>
          `<div class="issue ${item.level}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(
            item.detail
          )}</span></div>`
      )
      .join("")}</div>`;

    els.summaryMetrics.innerHTML = metricsHtml + totalWireLengthHtml + wireGuidanceHtml;
    els.mobileSummaryMetrics.innerHTML = metricsHtml + totalWireLengthHtml + wireGuidanceHtml;
    els.issueList.innerHTML = issuesHtml;
    els.mobileIssueList.innerHTML = issuesHtml;
  }

  function currentRenderData() {
    normalizeState(state);
    const recommendation = buildRecommendation(state);
    if (recommendation.controllerCount <= 1 && state.powerMode === "shared") {
      state.powerMode = "separate";
    }
    if (recommendation.powerSupplyCount <= 1) {
      state.controllers.forEach((controller) => {
        controller.powerSupplyIndex = 0;
        controller.powerSupplyIndexAuto = true;
      });
    }
    const assignmentChanged = applyRecommendedControllerDefaults(state, recommendation);
    let result = evaluate(state);
    const distanceChanged = applyRecommendedDistanceDefaults(state, result);
    if (assignmentChanged || distanceChanged) {
      result = evaluate(state);
    }

    return { result, recommendation };
  }

  function refreshLiveResults() {
    const { result, recommendation } = currentRenderData();
    renderLiveResults(result, recommendation);
    renderPresetButtons();
  }

  function render() {
    const { result, recommendation } = currentRenderData();

    els.projectName.value = state.projectName;
    els.tapeTypeSelect.innerHTML = optionMarkup(tapeTypes, state.tapeType);
    els.runCountInput.value = state.tapeRuns.length;
    els.zoneCountInput.value = state.zoneCount;
    document.querySelectorAll("input[name='powerMode']").forEach((input) => {
      input.checked = input.value === state.powerMode;
    });
    if (els.powerFeedCard) {
      els.powerFeedCard.hidden = recommendation.controllerCount <= 1;
    }

    renderSharedPowerFields();
    renderLiveResults(result, recommendation);
    renderTapeRuns(result);
    renderPresetButtons();

    const visibleControllers = result.controllers.filter(
      (controller) => controller.enabled || controller.controllerIndex < Math.max(1, recommendation.controllerCount)
    );
    els.controllers.innerHTML = visibleControllers.map((controller) => renderControllerPlacement(controller, recommendation)).join("");
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

  function markManualOverride(path) {
    let match = path.match(/^sharedPower\.distance$/);
    if (match) {
      state.sharedPower.distanceAuto = false;
      return;
    }

    match = path.match(/^controllers\.(\d+)\.(powerSupplyIndex|distancePowerToController|distanceSplitToController|distanceControllerToTapeSplit)$/);
    if (match) {
      const controller = state.controllers[Number(match[1])];
      if (controller) {
        controller[`${match[2]}Auto`] = false;
      }
      return;
    }

    match = path.match(/^tapeRuns\.(\d+)\.zoneIndex$/);
    if (match) {
      const run = state.tapeRuns[Number(match[1])];
      if (run) {
        run.zoneIndexAuto = false;
        run.controllerIndexAuto = true;
      }
      return;
    }

    match = path.match(/^tapeRuns\.(\d+)\.(controllerIndex|distanceControllerToTapeStart|distanceSplitToTapeStart|farEndDistance)$/);
    if (match) {
      const run = state.tapeRuns[Number(match[1])];
      if (run) {
        run[`${match[2]}Auto`] = false;
      }
    }
  }

  function renderKeepingScroll() {
    const x = window.scrollX;
    const y = window.scrollY;
    render();
    window.scrollTo(x, y);
  }

  function addTapeRun() {
    state.tapeRuns.push({
      ...blankRun(),
      controllerIndex: Math.min(MAX_CONTROLLERS - 1, state.tapeRuns.length ? number(state.tapeRuns[state.tapeRuns.length - 1].controllerIndex) : 0)
    });
    activePreset = "custom";
    renderKeepingScroll();
  }

  function setTapeRunCount(count) {
    const nextCount = clampLightingRunCount(count);
    while (state.tapeRuns.length < nextCount) {
      state.tapeRuns.push(blankRun());
    }
    if (state.tapeRuns.length > nextCount) {
      state.tapeRuns = state.tapeRuns.slice(0, nextCount);
    }
    state.zoneCount = clampZoneCount(state.zoneCount, state.tapeRuns.length);
    state.tapeRuns.forEach((run, index) => {
      if (run.zoneIndexAuto !== false) {
        run.zoneIndex = suggestedZoneIndex(index, state.tapeRuns.length, state.zoneCount);
        run.controllerIndexAuto = true;
      }
    });
    activePreset = "custom";
    renderKeepingScroll();
  }

  function setZoneCount(count) {
    state.zoneCount = clampZoneCount(count, state.tapeRuns.length);
    state.tapeRuns.forEach((run, index) => {
      if (run.zoneIndexAuto !== false) {
        run.zoneIndex = suggestedZoneIndex(index, state.tapeRuns.length, state.zoneCount);
      } else {
        run.zoneIndex = Math.min(state.zoneCount - 1, Math.max(0, Math.round(number(run.zoneIndex))));
      }
      run.controllerIndexAuto = true;
    });
    activePreset = "custom";
    renderKeepingScroll();
  }

  function removeTapeRun(index) {
    if (state.tapeRuns.length <= 1) {
      state.tapeRuns[0] = blankRun();
    } else {
      state.tapeRuns.splice(index, 1);
    }
    activePreset = "custom";
    renderKeepingScroll();
  }

  function handleTapeRunActions(event) {
    const button = event.target.closest("[data-run-action]");
    if (!button) return;

    const index = Number(button.dataset.runIndex);
    if (button.dataset.runAction === "remove") {
      removeTapeRun(index);
    }
  }

  function updateFromEvent(event) {
    const target = event.target;

    if (target === els.projectName) {
      state.projectName = target.value;
      return;
    }

    if (target === els.tapeTypeSelect) {
      state.tapeType = target.value;
      activePreset = "custom";
      renderKeepingScroll();
      return;
    }

    if (target === els.runCountInput) {
      setTapeRunCount(target.value);
      return;
    }

    if (target === els.zoneCountInput) {
      setZoneCount(target.value);
      return;
    }

    if (target === els.darkModeToggle) return;

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
    } else if (target.type === "text") {
      value = target.value;
    } else {
      value = number(target.value);
    }

    setPath(path, value);
    markManualOverride(path);
    activePreset = "custom";
    if (path.endsWith(".feedBothEnds") && value === true) {
      const match = path.match(/^tapeRuns\.(\d+)\./);
      if (match) {
        const run = state.tapeRuns[Number(match[1])];
        const controller = state.controllers[Number(run.controllerIndex)] || blankController();
        if (!number(run.farEndDistance)) {
          run.farEndDistance = controller.tapeMode === "shared" ? run.distanceSplitToTapeStart : run.distanceControllerToTapeStart;
        }
        if (!run.farEndWireSize) {
          run.farEndWireSize = run.wireSizeToTapeStart;
        }
      }
    }
    normalizeState(state);
    if ((event.type === "input" || event.type === "change") && (target.type === "number" || target.type === "text")) {
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

  function openDetailsForTarget(target) {
    const details = [];
    let node = target;
    while (node) {
      if (node.tagName === "DETAILS") {
        details.push(node);
      }
      node = node.parentElement;
    }

    details.reverse().forEach((detail) => {
      detail.open = true;
      const controllerIndex = detail.dataset?.controllerDetails;
      if (controllerIndex !== undefined) {
        collapsedControllers.delete(Number(controllerIndex));
      }
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
    openDetailsForTarget(target);
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      highlightTarget(target);
    }, 40);
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
    blank.tapeType = tapeTypes[0].id;
    blank.powerMode = "separate";
    blank.zoneCount = 1;
    blank.sharedPower.distance = 0;
    blank.sharedPower.wireSize = DEFAULT_WIRE_SIZE;
    blank.tapeRuns = [blankRun()];
    blank.controllers.forEach((controller) => {
      controller.enabled = false;
      controller.runCount = 1;
      controller.powerSupplyIndex = 0;
      controller.powerSupplyIndexAuto = true;
      controller.distancePowerToController = 0;
      controller.distanceSplitToController = 0;
      controller.distanceControllerToTapeSplit = 0;
      controller.extraShortTapeLength = 0;
      controller.tapeMode = "direct";
      controller.wireSizePowerToController = DEFAULT_WIRE_SIZE;
      controller.wireSizeSplitToController = DEFAULT_WIRE_SIZE;
      controller.wireSizeControllerToTapeSplit = DEFAULT_WIRE_SIZE;
      controller.runs = [blankRun()];
    });
    return blank;
  }

  function slugifyFileName(value) {
    const cleaned = String(value || "tape-light-project")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    return cleaned || "tape-light-project";
  }

  function hydrateRun(run) {
    return {
      ...blankRun(),
      ...(run && typeof run === "object" ? run : {})
    };
  }

  function hydrateController(controller) {
    const source = controller && typeof controller === "object" ? controller : {};
    const hydrated = {
      ...blankController(),
      ...source
    };
    hydrated.runCount = clampRunCount(hydrated.runCount);
    hydrated.runs = Array.isArray(source.runs) ? source.runs.map(hydrateRun) : [blankRun()];
    while (hydrated.runs.length < hydrated.runCount) {
      hydrated.runs.push(blankRun());
    }
    return hydrated;
  }

  function hydrateProject(project) {
    if (!project || typeof project !== "object") {
      throw new Error("Project file is empty or invalid.");
    }

    const source = project.state && typeof project.state === "object" ? project.state : project;
    const base = clone(simpleExample);
    const sourceControllers = Array.isArray(source.controllers) ? source.controllers : [];

    return {
      ...base,
      ...source,
      tapeType: tapeTypeById[source.tapeType] ? source.tapeType : base.tapeType,
      sharedPower: {
        ...base.sharedPower,
        ...(source.sharedPower && typeof source.sharedPower === "object" ? source.sharedPower : {})
      },
      tapeRuns: Array.isArray(source.tapeRuns) ? source.tapeRuns.map(hydrateRun) : undefined,
      controllers: base.controllers.map((controller, index) => hydrateController(sourceControllers[index] || controller))
    };
  }

  function saveProjectFile() {
    normalizeState(state);
    const payload = {
      type: PROJECT_FILE_TYPE,
      version: PROJECT_FILE_VERSION,
      savedAt: new Date().toISOString(),
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyFileName(state.projectName)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function openProjectFile(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        state = hydrateProject(JSON.parse(reader.result));
        activePreset = "custom";
        collapsedControllers.clear();
        render();
      } catch (error) {
        window.alert("This project file could not be opened. Please choose a saved tape light project JSON file.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
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
  els.darkModeToggle.addEventListener("change", handleThemeToggle);
  els.addTapeRun?.addEventListener("click", addTapeRun);
  els.tapeRuns.addEventListener("click", handleTapeRunActions);
  els.saveProject.addEventListener("click", saveProjectFile);
  els.openProject.addEventListener("click", () => els.projectFile.click());
  els.projectFile.addEventListener("change", openProjectFile);
  els.viewDisclaimer?.addEventListener("click", () => showDisclaimer(true));
  els.acceptDisclaimer?.addEventListener("click", acceptDisclaimer);
  els.simpleExample?.addEventListener("click", () => {
    activePreset = "simple";
    collapsedControllers.clear();
    state = clone(simpleExample);
    render();
  });
  els.workbookExample?.addEventListener("click", () => {
    activePreset = "advanced";
    collapsedControllers.clear();
    state = clone(workbookExample);
    render();
  });
  els.clearAll?.addEventListener("click", () => {
    activePreset = "blank";
    collapsedControllers.clear();
    state = blankProject();
    render();
  });

  const publicApi = {
    evaluate,
    buildRecommendation,
    simpleExample,
    workbookExample,
    tapeTypes,
    awgOhmsPerFt
  };
  window.TRACETool = publicApi;
  window.LutronInstallerTapeCheckV4 = publicApi;

  applyTheme(preferredTheme());
  render();
  showDisclaimer();
})();
