(() => {
  const FULL_REEL_FT = 16.4;
  const DUAL_END_MAX_FT = FULL_REEL_FT * 2;
  const POWER_LIMIT_W = 96;
  const GOOD_LIGHT_LOSS_PCT = 25;
  const MAX_LIGHT_LOSS_PCT = 40;
  const SHOW_REVIEW_SUMMARY_TAB = false;
  const HELP_MAX_POWER_WIRE_DISTANCE = "Reference power wire distance from the Lutron table for the selected tape load and wire gauge. Final Good / Review / Fix status is calculated from voltage drop across the actual power and control wire path.";
  const HELP_MAX_CONTROL_WIRE_DISTANCE = "Reference control wire path distance from the Lutron table. The tool checks voltage drop along the shared trunk, branches, jumpers, and back-feed paths instead of treating installed control wire as one simple total.";
  const HELP_FAR_END_DISTANCE = "This is the back feed wire distance from the controller to the far end of the led tape.";
  const CONTROLLER_STANDBY_A = 0.01132;
  const RUN_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const MAX_RUNS = 12;
  const MAX_LIGHTING_RUNS = 36;
  const MAX_ZONES = 12;
  const MAX_CONTROLLERS = 12;
  const MAX_CONTROLLERS_PER_POWER_SUPPLY = 3;
  const DEFAULT_POWER_WIRE_SIZE = 16;
  const DEFAULT_CONTROL_WIRE_SIZE = 22;
  const DEFAULT_WIRING_STYLE = "series";
  const POWER_WIRE_SIZES = [20, 16, 14, 12];
  const WIRING_STYLES = ["parallel", "series", "series-parallel"];
  const PROJECT_FILE_TYPE = "lutron-tape-light-installer-check";
  const PROJECT_FILE_VERSION = 1;
  const APP_VERSION = "wizard-steps-54";
  const GITHUB_ISSUE_URL = "https://github.com/bartbrueck/lutron-tape-light-tool/issues/new";
  const THEME_STORAGE_KEY = "trace-theme";
  const DISCLAIMER_STORAGE_KEY = "trace-disclaimer-accepted-v1";
  const DONE_CELEBRATION_STORAGE_KEY = "trace-done-celebration-count";
  const SYSTEM_MAP_DEFAULT_ZOOM = 0.85;
  const SYSTEM_MAP_MIN_ZOOM = 0.75;
  const SYSTEM_MAP_MAX_ZOOM = 2.5;
  const SYSTEM_MAP_ZOOM_STEP = 0.1;

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

  const cableSpecTables = {
    "lumaris-tw": [
      { min: 0, max: 4.1, power: { 20: 24, 16: 65, 14: 103, 12: 164 }, control: { 12: 684, 14: 430, 16: 270, 18: 169, 22: 67 } },
      { min: 4.2, max: 8.2, power: { 20: 12, 16: 33, 14: 52, 12: 83 }, control: { 12: 342, 14: 215, 16: 135, 18: 85, 22: 33 } },
      { min: 8.3, max: 12.3, power: { 20: 8, 16: 22, 14: 35, 12: 56 }, control: { 12: 228, 14: 143, 16: 90, 18: 56, 22: 22 } },
      { min: 12.4, max: 16.4, power: { 20: 6, 16: 16, 14: 26, 12: 42 }, control: { 12: 171, 14: 107, 16: 67, 18: 42, 22: 16 } },
      { min: 16.5, max: 20.5, power: { 20: 5, 16: 13, 14: 21, 12: 33 }, control: { 12: 273, 14: 172, 16: 108, 18: 68, 22: 26 } },
      { min: 20.6, max: 24.6, power: { 20: 4, 16: 11, 14: 17, 12: 28 }, control: { 12: 228, 14: 143, 16: 90, 18: 56, 22: 22 } },
      { min: 24.7, max: 28.7, power: { 20: 3, 16: 9, 14: 15, 12: 24 }, control: { 12: 195, 14: 122, 16: 77, 18: 48, 22: 19 } },
      { min: 28.8, max: 32.8, power: { 20: 3, 16: 8, 14: 13, 12: 21 }, control: { 12: 171, 14: 107, 16: 67, 18: 42, 22: 16 } },
      { min: 32.9, max: 36.9, power: { 20: 2, 16: 7, 14: 11, 12: 18 }, control: { 12: 230, 14: 144, 16: 91, 18: 57, 22: 22 } },
      { min: 37.0, max: 41.0, power: { 20: 2, 16: 6, 14: 10, 12: 17 }, control: { 12: 205, 14: 128, 16: 81, 18: 50, 22: 20 } },
      { min: 41.1, max: 45.1, power: { 20: 2, 16: 6, 14: 9, 12: 15 }, control: { 12: 187, 14: 118, 16: 74, 18: 46, 22: 18 } },
      { min: 45.2, max: 49.2, power: { 20: 2, 16: 5, 14: 8, 12: 14 }, control: { 12: 171, 14: 107, 16: 67, 18: 42, 22: 16 } }
    ],
    "lumaris-rgb-tw": [
      { min: 0, max: 4.1, power: { 20: 36, 16: 96, 14: 153, 12: 244 }, control: { 12: 1004, 14: 633, 16: 397, 18: 251, 22: 99 } },
      { min: 4.2, max: 8.2, power: { 20: 18, 16: 48, 14: 77, 12: 123 }, control: { 12: 504, 14: 317, 16: 199, 18: 125, 22: 49 } },
      { min: 8.3, max: 12.3, power: { 20: 12, 16: 32, 14: 52, 12: 83 }, control: { 12: 335, 14: 211, 16: 132, 18: 83, 22: 33 } },
      { min: 12.4, max: 16.4, power: { 20: 9, 16: 24, 14: 39, 12: 62 }, control: { 12: 252, 14: 158, 16: 99, 18: 62, 22: 24 } },
      { min: 16.5, max: 20.5, power: { 20: 5, 16: 13, 14: 21, 12: 33 }, control: { 12: 273, 14: 172, 16: 108, 18: 68, 22: 26 } },
      { min: 20.6, max: 24.6, power: { 20: 4, 16: 11, 14: 17, 12: 28 }, control: { 12: 228, 14: 143, 16: 90, 18: 56, 22: 22 } },
      { min: 24.7, max: 28.7, power: { 20: 3, 16: 9, 14: 15, 12: 24 }, control: { 12: 195, 14: 122, 16: 77, 18: 48, 22: 19 } },
      { min: 28.8, max: 32.8, power: { 20: 3, 16: 8, 14: 13, 12: 21 }, control: { 12: 171, 14: 107, 16: 67, 18: 42, 22: 16 } }
    ],
    "rania-high": [
      { min: 0, max: 4, power: { 20: 15, 16: 40, 14: 64, 12: 102 }, control: { 12: 417, 14: 262, 16: 165, 18: 103, 22: 41 } },
      { min: 4.1, max: 8, power: { 20: 7, 16: 20, 14: 32, 12: 51 }, control: { 12: 209, 14: 131, 16: 82, 18: 52, 22: 20 } },
      { min: 8.1, max: 11, power: { 20: 10, 16: 28, 14: 44, 12: 70 }, control: { 12: 287, 14: 180, 16: 113, 18: 71, 22: 28 } },
      { min: 11.1, max: 16.4, power: { 20: 7, 16: 18, 14: 29, 12: 47 }, control: { 12: 385, 14: 242, 16: 152, 18: 95, 22: 37 } }
    ],
    "rania-long": [
      { min: 0, max: 8, power: { 20: 14, 16: 38, 14: 61, 12: 97 }, control: { 12: 393, 14: 247, 16: 155, 18: 97, 22: 38 } },
      { min: 8.1, max: 16.4, power: { 20: 7, 16: 18, 14: 29, 12: 47 }, control: { 12: 385, 14: 242, 16: 152, 18: 95, 22: 37 } },
      { min: 16.5, max: 24, power: { 20: 4, 16: 12, 14: 20, 12: 32 }, control: { 12: 263, 14: 165, 16: 104, 18: 65, 22: 25 } },
      { min: 24.1, max: 32.8, power: { 20: 3, 16: 9, 14: 15, 12: 23 }, control: { 12: 193, 14: 121, 16: 76, 18: 48, 22: 19 } }
    ]
  };

  const simpleExample = {
    projectName: "",
    tapeType: "lumaris-rgb-tw",
    powerMode: "separate",
    zoneCount: 1,
    sharedPower: {
      distance: 0,
      distanceAuto: true,
      wireSize: DEFAULT_POWER_WIRE_SIZE
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
        wireSizePowerToController: DEFAULT_POWER_WIRE_SIZE
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
      wireSize: DEFAULT_POWER_WIRE_SIZE
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
        wireSizeSplitToController: DEFAULT_POWER_WIRE_SIZE,
        tapeMode: "shared",
        distanceControllerToTapeSplit: 2,
        distanceControllerToTapeSplitAuto: true,
        wireSizeControllerToTapeSplit: DEFAULT_CONTROL_WIRE_SIZE
      },
      blankController(),
      blankController()
    ]
  };

  let state = blankProject();
  let activePreset = "blank";
  const collapsedControllers = new Set();
  let mapPan = null;
  let systemMapZoom = SYSTEM_MAP_DEFAULT_ZOOM;
  let suppressNextMapJump = false;
  let activeWizardStep = 1;
  let activeReviewTab = "diagram";
  let activeFineTuneStepId = null;
  let currentFineTuneSteps = [];
  let currentLiveLevel = "neutral";

  const els = {
    projectName: document.querySelector("#projectName"),
    tapeTypeSelect: document.querySelector("#tapeTypeSelect"),
    runCountInput: document.querySelector("#runCountInput"),
    zoneCountInput: document.querySelector("#zoneCountInput"),
    tapeRuns: document.querySelector("#tapeRuns"),
    addTapeRun: document.querySelector("#addTapeRun"),
    suggestedSystem: document.querySelector("#suggestedSystem"),
    advancedDetails: document.querySelector("#advancedDetails"),
    powerFeedCard: document.querySelector("#powerFeedCard"),
    powerFeedGuideNav: document.querySelector("#powerFeedGuideNav"),
    sharedPowerFields: document.querySelector("#sharedPowerFields"),
    controllers: document.querySelector("#controllers"),
    saveProject: document.querySelector("#saveProject"),
    openProject: document.querySelector("#openProject"),
    projectFile: document.querySelector("#projectFile"),
    viewDisclaimer: document.querySelector("#viewDisclaimer"),
    disclaimerModal: document.querySelector("#disclaimerModal"),
    acceptDisclaimer: document.querySelector("#acceptDisclaimer"),
    imageViewerModal: document.querySelector("#imageViewerModal"),
    imageViewerImage: document.querySelector("#imageViewerImage"),
    imageViewerTitle: document.querySelector("#imageViewerTitle"),
    closeImageViewer: document.querySelector("#closeImageViewer"),
    darkModeToggle: document.querySelector("#darkModeToggle"),
    simpleExample: document.querySelector("#simpleExample"),
    workbookExample: document.querySelector("#workbookExample"),
    clearAll: document.querySelector("#clearAll"),
    systemMap: document.querySelector("#systemMap"),
    panMapLeft: document.querySelector("#panMapLeft"),
    panMapRight: document.querySelector("#panMapRight"),
    zoomMapOut: document.querySelector("#zoomMapOut"),
    resetMapZoom: document.querySelector("#resetMapZoom"),
    zoomMapIn: document.querySelector("#zoomMapIn"),
    mapZoomLabel: document.querySelector("#mapZoomLabel"),
    overallStatus: document.querySelector("#overallStatus"),
    overallPill: document.querySelector("#overallPill"),
    mobileOverallStatus: document.querySelector("#mobileOverallStatus"),
    mobileOverallPill: document.querySelector("#mobileOverallPill"),
    summaryMetrics: document.querySelector("#summaryMetrics"),
    mobileSummaryMetrics: document.querySelector("#mobileSummaryMetrics"),
    issueList: document.querySelector("#issueList"),
    mobileIssueList: document.querySelector("#mobileIssueList"),
    issueSection: document.querySelector("#issueTitle")?.closest(".issue-section"),
    mobileIssueSection: document.querySelector("#mobileIssueTitle")?.closest(".issue-section"),
    livePanels: Array.from(document.querySelectorAll(".results-panel, .mobile-results-panel")),
    issueReportLinks: Array.from(document.querySelectorAll("[data-report-issue]")),
    statusStrip: document.querySelector("#statusStrip"),
    wizardSteps: Array.from(document.querySelectorAll(".wizard-step")),
    stepNextButtons: Array.from(document.querySelectorAll(".step-next")),
    reviewTabButtons: Array.from(document.querySelectorAll("[data-review-tab]")),
    reviewTabPanels: Array.from(document.querySelectorAll("[data-review-panel]")),
    postWizardPanels: Array.from(document.querySelectorAll(".post-wizard-panel"))
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

  function isWizardStepComplete(step) {
    const tapeRuns = Array.isArray(state.tapeRuns) ? state.tapeRuns : [];
    if (step === 1) {
      return Boolean(tapeTypeById[state.tapeType]);
    }
    if (step === 2) {
      return clampLightingRunCount(tapeRuns.length) >= 1 && clampZoneCount(state.zoneCount, tapeRuns.length) >= 1;
    }
    if (step === 3) {
      return tapeRuns.some((run) => number(run.tapeLength) > 0);
    }
    if (step === 4) {
      return isWizardStepComplete(3);
    }
    return false;
  }

  function availableWizardStep() {
    if (!isWizardStepComplete(1)) return 1;
    if (!isWizardStepComplete(2)) return 2;
    if (!isWizardStepComplete(3)) return 3;
    return 4;
  }

  function updateWizardSteps() {
    const maxStep = availableWizardStep();
    activeWizardStep = Math.min(Math.max(1, activeWizardStep), maxStep);

    els.wizardSteps.forEach((stepElement) => {
      const step = Number(stepElement.dataset.step);
      const isUnlocked = step <= maxStep;
      const isOpen = isUnlocked && step <= activeWizardStep;
      const isComplete = isWizardStepComplete(step);
      const stateLabel = stepElement.querySelector(".step-state");
      const nextButton = stepElement.querySelector(".step-next");

      stepElement.classList.toggle("is-locked", !isUnlocked);
      stepElement.classList.toggle("is-collapsed", !isOpen);
      stepElement.classList.toggle("is-complete", isComplete);
      stepElement.setAttribute("aria-disabled", isUnlocked ? "false" : "true");

      if (stateLabel) {
        stateLabel.textContent = !isUnlocked ? "Locked" : !isOpen ? "Ready" : isComplete ? "Complete" : "In progress";
      }
      if (nextButton) {
        nextButton.disabled = !isComplete;
      }
    });

    const showPostWizard = activeWizardStep >= 4 && isWizardStepComplete(3);
    els.postWizardPanels.forEach((panel) => {
      panel.hidden = !showPostWizard;
    });

    if (activeWizardStep >= 4 && activeReviewTab === "diagram") {
      queueMapPanUpdate();
    }
  }

  function setReviewTab(tabName) {
    const nextTab = SHOW_REVIEW_SUMMARY_TAB && tabName === "summary" ? "summary" : "diagram";
    activeReviewTab = nextTab;

    els.reviewTabButtons.forEach((button) => {
      const isAvailable = SHOW_REVIEW_SUMMARY_TAB || button.dataset.reviewTab !== "summary";
      const isActive = button.dataset.reviewTab === nextTab;
      button.hidden = !isAvailable;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isAvailable && isActive ? 0 : -1;
    });

    els.reviewTabPanels.forEach((panel) => {
      const isAvailable = SHOW_REVIEW_SUMMARY_TAB || panel.dataset.reviewPanel !== "summary";
      const isActive = isAvailable && panel.dataset.reviewPanel === nextTab;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });

    if (nextTab === "diagram") {
      queueMapPanUpdate();
    }
  }

  function handleReviewTabClick(event) {
    const button = event.target.closest("[data-review-tab]");
    if (!button) return;
    setReviewTab(button.dataset.reviewTab);
  }

  function handleWizardNext(event) {
    const button = event.target.closest(".step-next");
    if (!button) return;

    const currentStep = Number(button.closest(".wizard-step")?.dataset.step || 1);
    const requestedStep = Number(button.dataset.nextStep || currentStep + 1);
    if (!isWizardStepComplete(currentStep)) return;

    activeWizardStep = Math.min(requestedStep, availableWizardStep());
    updateWizardSteps();

    const nextStep = els.wizardSteps.find((stepElement) => Number(stepElement.dataset.step) === activeWizardStep);
    nextStep?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function moveFineTuneTo(stepId) {
    if (!stepId) return;
    activeFineTuneStepId = stepId;
    renderKeepingScroll();
    window.setTimeout(() => scrollToFineTuneStep(stepId), 60);
  }

  function startFineTuneFlow() {
    const { result, recommendation } = currentRenderData();
    syncFineTuneSteps(result, recommendation);
    if (!currentFineTuneSteps.length) return;

    if (els.advancedDetails) {
      els.advancedDetails.hidden = false;
      els.advancedDetails.open = true;
    }
    moveFineTuneTo(currentFineTuneSteps[0].id);
  }

  function finishFineTuneFlow() {
    activeFineTuneStepId = null;
    renderKeepingScroll();
    window.setTimeout(() => {
      setReviewTab("diagram");
      const target = document.querySelector("#reviewDiagramPanel");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      queueMapPanUpdate();
    }, 60);
  }

  function launchDoneConfetti(button) {
    const rect = button.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = ["#1b7dd2", "#0f9f6e", "#34c759", "#f7c948", "#ff6b6b", "#7a9cff", "#ffffff"];
    const count = reducedMotion ? 22 : 88;
    const spread = Math.min(window.innerWidth || 900, 1100);
    const lift = Math.min(window.innerHeight || 700, 760);

    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement("span");
      const x = (Math.random() - 0.5) * spread;
      const y = -(80 + Math.random() * lift);
      const drop = 90 + Math.random() * 260;
      const rotation = (Math.random() * 900 - 450).toFixed(1);
      const finalRotation = (Number(rotation) * 1.3).toFixed(1);

      piece.className = "confetti-piece";
      piece.style.left = `${originX}px`;
      piece.style.top = `${originY}px`;
      piece.style.setProperty("--confetti-x", `${x.toFixed(1)}px`);
      piece.style.setProperty("--confetti-y", `${y.toFixed(1)}px`);
      piece.style.setProperty("--confetti-drop", `${drop.toFixed(1)}px`);
      piece.style.setProperty("--confetti-rotate", `${rotation}deg`);
      piece.style.setProperty("--confetti-final-rotate", `${finalRotation}deg`);
      piece.style.setProperty("--confetti-color", colors[index % colors.length]);
      piece.style.animationDelay = `${Math.random() * 90}ms`;
      document.body.append(piece);

      window.setTimeout(() => piece.remove(), reducedMotion ? 900 : 1500);
    }
  }

  function nextDoneCelebrationCount() {
    const fallback = Number(document.documentElement.dataset.doneCelebrationCount || 0) + 1;

    try {
      const savedCount = Number(window.localStorage.getItem(DONE_CELEBRATION_STORAGE_KEY) || 0);
      const nextCount = Number.isFinite(savedCount) ? savedCount + 1 : 1;
      window.localStorage.setItem(DONE_CELEBRATION_STORAGE_KEY, String(nextCount));
      document.documentElement.dataset.doneCelebrationCount = String(nextCount);
      return nextCount;
    } catch (error) {
      document.documentElement.dataset.doneCelebrationCount = String(fallback);
      return fallback;
    }
  }

  function launchDoneUnicorns(button) {
    const rect = button.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reducedMotion ? 5 : 13;
    const horizontalSpread = Math.min(window.innerWidth || 900, 980);
    const verticalSpread = Math.min(window.innerHeight || 700, 460);

    for (let index = 0; index < count; index += 1) {
      const unicorn = document.createElement("span");
      const direction = index % 2 === 0 ? 1 : -1;
      const x = direction * (140 + Math.random() * horizontalSpread * 0.75);
      const y = (Math.random() - 0.5) * verticalSpread;
      const hop = -(40 + Math.random() * 150);
      const size = 28 + Math.random() * 16;
      const tilt = direction * (10 + Math.random() * 18);

      unicorn.className = "unicorn-piece";
      unicorn.textContent = "🦄";
      unicorn.style.left = `${originX}px`;
      unicorn.style.top = `${originY}px`;
      unicorn.style.fontSize = `${size.toFixed(1)}px`;
      unicorn.style.setProperty("--unicorn-x", `${x.toFixed(1)}px`);
      unicorn.style.setProperty("--unicorn-y", `${y.toFixed(1)}px`);
      unicorn.style.setProperty("--unicorn-half-x", `${(x * 0.52).toFixed(1)}px`);
      unicorn.style.setProperty("--unicorn-half-y", `${(y * 0.52).toFixed(1)}px`);
      unicorn.style.setProperty("--unicorn-hop", `${hop.toFixed(1)}px`);
      unicorn.style.setProperty("--unicorn-tilt", `${tilt.toFixed(1)}deg`);
      unicorn.style.setProperty("--unicorn-final-tilt", `${(tilt * -0.35).toFixed(1)}deg`);
      unicorn.style.animationDelay = `${index * (reducedMotion ? 45 : 70)}ms`;
      document.body.append(unicorn);

      window.setTimeout(() => unicorn.remove(), reducedMotion ? 1150 : 2100);
    }
  }

  function launchDoneCelebration(button) {
    const count = nextDoneCelebrationCount();
    if (count % 5 === 0) {
      launchDoneUnicorns(button);
      return;
    }

    launchDoneConfetti(button);
  }

  function handleFineTuneAction(event) {
    const button = event.target.closest("[data-fine-tune-action]");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const action = button.dataset.fineTuneAction;
    if (action === "start") {
      startFineTuneFlow();
      return;
    }

    if (action === "finish") {
      finishFineTuneFlow();
      return;
    }

    if (action === "done") {
      const { result, recommendation } = currentRenderData();
      const liveResult = buildLivePlan(result, recommendation);
      currentLiveLevel = liveResult.level;
      if (currentLiveLevel !== "ok") {
        refreshLiveResults();
        return;
      }
      launchDoneCelebration(button);
      return;
    }

    if (!currentFineTuneSteps.length) {
      const { result, recommendation } = currentRenderData();
      syncFineTuneSteps(result, recommendation);
    }

    const currentIndex = fineTuneStepIndex();
    if (currentIndex < 0) {
      startFineTuneFlow();
      return;
    }

    if (action === "previous") {
      const previousStep = currentFineTuneSteps[currentIndex - 1];
      if (previousStep) {
        moveFineTuneTo(previousStep.id);
      }
      return;
    }

    if (action === "next") {
      const nextStep = currentFineTuneSteps[currentIndex + 1];
      if (nextStep) {
        moveFineTuneTo(nextStep.id);
      } else {
        finishFineTuneFlow();
      }
    }
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

  function showImageViewer(trigger) {
    if (!els.imageViewerModal || !els.imageViewerImage) return;

    const imageSrc = trigger.dataset.zoomImage || trigger.currentSrc || trigger.src;
    els.imageViewerImage.src = imageSrc;
    els.imageViewerImage.alt = trigger.alt || trigger.dataset.zoomTitle || "Wiring diagram";
    if (els.imageViewerTitle) {
      els.imageViewerTitle.textContent = trigger.dataset.zoomTitle || "Wiring diagram";
    }

    els.imageViewerModal.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => els.closeImageViewer?.focus());
  }

  function hideImageViewer() {
    if (!els.imageViewerModal) return;
    els.imageViewerModal.hidden = true;
    if (!els.disclaimerModal || els.disclaimerModal.hidden) {
      document.body.classList.remove("modal-open");
    }
  }

  function handleImageViewerTrigger(event) {
    const trigger = event.target.closest("[data-zoom-image]");
    if (!trigger) return;
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    event.stopPropagation();
    showImageViewer(trigger);
  }

  function handleImageViewerBackdrop(event) {
    if (event.target === els.imageViewerModal) {
      hideImageViewer();
    }
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
      distancePreviousToTapeStart: 0,
      distancePreviousToTapeStartAuto: true,
      seriesBranchIndex: 0,
      seriesBranchIndexAuto: true,
      seriesPosition: 0,
      seriesPositionAuto: true,
      wireSizeToTapeStart: DEFAULT_CONTROL_WIRE_SIZE,
      tapeLength: 0,
      feedBothEnds: false,
      farEndDistance: 0,
      farEndDistanceAuto: true,
      farEndWireSize: DEFAULT_CONTROL_WIRE_SIZE
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
      wireSizePowerToController: DEFAULT_POWER_WIRE_SIZE,
      distanceSplitToController: 0,
      distanceSplitToControllerAuto: true,
      wireSizeSplitToController: DEFAULT_POWER_WIRE_SIZE,
      wiringStyle: DEFAULT_WIRING_STYLE,
      tapeMode: "direct",
      distanceControllerToTapeSplit: 0,
      distanceControllerToTapeSplitAuto: true,
      wireSizeControllerToTapeSplit: DEFAULT_CONTROL_WIRE_SIZE,
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

  function normalizePowerWireSize(value) {
    const requested = Number(value);
    if (POWER_WIRE_SIZES.includes(requested)) return requested;
    return DEFAULT_POWER_WIRE_SIZE;
  }

  function normalizeControlWireSize(value) {
    return DEFAULT_CONTROL_WIRE_SIZE;
  }

  function normalizeWiringStyle(value) {
    return WIRING_STYLES.includes(value) ? value : DEFAULT_WIRING_STYLE;
  }

  function controllerWiringStyle(controller) {
    return normalizeWiringStyle(controller?.wiringStyle);
  }

  function controllerUsesTapeSplit(controller) {
    const style = controllerWiringStyle(controller);
    return style === "series-parallel" || (style === "parallel" && controller?.tapeMode === "shared");
  }

  function isSeriesWiring(controller) {
    const style = controllerWiringStyle(controller);
    return style === "series" || style === "series-parallel";
  }

  function supportsSeriesParallel(controller) {
    return activeRunCountForController(controller) >= 3;
  }

  function controlCableConductorCount(tapeOrId = state.tapeType) {
    const tapeId = typeof tapeOrId === "string" ? tapeOrId : tapeOrId?.id;
    if (tapeId === "lumaris-rgb-tw") return 6;
    if (tapeId === "lumaris-tw") return 3;
    return 4;
  }

  function controlCableLabel(tapeOrId = state.tapeType, wireSize = DEFAULT_CONTROL_WIRE_SIZE) {
    return `${controlCableConductorCount(tapeOrId)}-conductor ${normalizeControlWireSize(wireSize)} AWG control wire`;
  }

  function controlCableShortLabel(tapeOrId = state.tapeType, wireSize = DEFAULT_CONTROL_WIRE_SIZE) {
    return `${controlCableConductorCount(tapeOrId)}C / ${normalizeControlWireSize(wireSize)} AWG`;
  }

  function cableSpecRow(tapeOrId, tapeLengthFt) {
    const tapeId = typeof tapeOrId === "string" ? tapeOrId : tapeOrId?.id;
    const rows = cableSpecTables[tapeId] || [];
    const length = Math.max(0, number(tapeLengthFt));
    return rows.find((row) => length >= row.min && length <= row.max) || rows[rows.length - 1] || null;
  }

  function powerCableLimitForGauge(row, wireSize) {
    if (!row) return 0;
    const normalizedWireSize = normalizePowerWireSize(wireSize);
    if (row.power[normalizedWireSize]) return row.power[normalizedWireSize];
    return row.power[16] || 0;
  }

  function powerCableLimitFt(tapeOrId, tapeLengthFt, wireSize) {
    return powerCableLimitForGauge(cableSpecRow(tapeOrId, tapeLengthFt), wireSize);
  }

  function controlCableLimitFt(tapeOrId, tapeLengthFt, wireSize = DEFAULT_CONTROL_WIRE_SIZE) {
    const row = cableSpecRow(tapeOrId, tapeLengthFt);
    return row?.control?.[DEFAULT_CONTROL_WIRE_SIZE] || 0;
  }

  function cableDistanceStatus(distanceFt, limitFt, hasTape) {
    if (!hasTape) return { label: "No tape", level: "neutral" };
    if (!limitFt) return { label: "Review spec", level: "warn" };
    const distance = Math.max(0, number(distanceFt));
    if (distance > limitFt) return { label: "Over spec", level: "fail" };
    return { label: "In range", level: "ok" };
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
      wireSize: DEFAULT_POWER_WIRE_SIZE,
      ...sourceSharedPower
    };
    targetState.sharedPower.wireSize = normalizePowerWireSize(targetState.sharedPower.wireSize);
    targetState.controllers = Array.isArray(targetState.controllers) ? targetState.controllers : [];
    while (targetState.controllers.length < MAX_CONTROLLERS) {
      targetState.controllers.push(blankController());
    }
    targetState.controllers = targetState.controllers.slice(0, MAX_CONTROLLERS).map((controller) => {
      const source = controller && typeof controller === "object" ? controller : {};
      const normalizedController = {
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
      normalizedController.wireSizePowerToController = normalizePowerWireSize(normalizedController.wireSizePowerToController);
      normalizedController.wireSizeSplitToController = normalizePowerWireSize(normalizedController.wireSizeSplitToController);
      normalizedController.wireSizeControllerToTapeSplit = normalizeControlWireSize(normalizedController.wireSizeControllerToTapeSplit);
      normalizedController.wiringStyle = normalizeWiringStyle(normalizedController.wiringStyle);
      normalizedController.tapeMode = normalizedController.tapeMode === "shared" ? "shared" : "direct";
      return normalizedController;
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
        distancePreviousToTapeStart: Math.max(0, number(source.distancePreviousToTapeStart)),
        distancePreviousToTapeStartAuto:
          typeof source.distancePreviousToTapeStartAuto === "boolean"
            ? source.distancePreviousToTapeStartAuto
            : number(source.distancePreviousToTapeStart) <= 0,
        seriesBranchIndex: Math.min(MAX_RUNS - 1, Math.max(0, Math.round(number(source.seriesBranchIndex ?? 0)))),
        seriesBranchIndexAuto:
          typeof source.seriesBranchIndexAuto === "boolean" ? source.seriesBranchIndexAuto : true,
        seriesPosition: Math.min(MAX_RUNS - 1, Math.max(0, Math.round(number(source.seriesPosition ?? index)))),
        seriesPositionAuto:
          typeof source.seriesPositionAuto === "boolean" ? source.seriesPositionAuto : true,
        wireSizeToTapeStart: normalizeControlWireSize(source.wireSizeToTapeStart),
        farEndDistanceAuto:
          typeof source.farEndDistanceAuto === "boolean" ? source.farEndDistanceAuto : number(source.farEndDistance) <= 0,
        farEndWireSize: normalizeControlWireSize(source.farEndWireSize || source.wireSizeToTapeStart),
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

  function seriesBranchKey(controller, run) {
    return controllerWiringStyle(controller) === "series-parallel"
      ? Math.min(MAX_RUNS - 1, Math.max(0, Math.round(number(run.seriesBranchIndex ?? 0))))
      : 0;
  }

  function orderedSeriesGroups(controller) {
    const runs = (controller.runResults || controller.runs || []).filter((run) => number(run.tapeLength) > 0);
    const groups = new Map();
    runs.forEach((run) => {
      const key = seriesBranchKey(controller, run);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(run);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([branchIndex, branchRuns]) => ({
        branchIndex,
        runs: branchRuns.sort(
          (a, b) =>
            Math.round(number(a.seriesPosition ?? a.globalRunIndex ?? 0)) -
              Math.round(number(b.seriesPosition ?? b.globalRunIndex ?? 0)) ||
            Math.round(number(a.globalRunIndex ?? 0)) - Math.round(number(b.globalRunIndex ?? 0))
        )
      }));
  }

  function orderedSeriesBranch(controller, run) {
    const key = seriesBranchKey(controller, run);
    return orderedSeriesGroups(controller).find((group) => group.branchIndex === key)?.runs || [run];
  }

  function seriesRunIndex(controller, run) {
    const branchRuns = orderedSeriesBranch(controller, run);
    const runIndex = branchRuns.findIndex((item) => item.globalRunIndex === run.globalRunIndex);
    return runIndex >= 0 ? runIndex : 0;
  }

  function runDistance(controller, run) {
    const style = controllerWiringStyle(controller);
    if (style === "series") {
      return seriesRunIndex(controller, run) === 0
        ? Math.max(0, number(run.distanceControllerToTapeStart))
        : Math.max(0, number(run.distancePreviousToTapeStart));
    }
    if (style === "series-parallel") {
      return seriesRunIndex(controller, run) === 0
        ? Math.max(0, number(run.distanceSplitToTapeStart))
        : Math.max(0, number(run.distancePreviousToTapeStart));
    }
    return controller.tapeMode === "shared"
      ? Math.max(0, number(run.distanceSplitToTapeStart))
      : Math.max(0, number(run.distanceControllerToTapeStart));
  }

  function effectiveRunCurrent(run) {
    const current = Math.max(0, number(run.tapeCurrent));
    return run.feedBothEnds ? current / 2 : current;
  }

  function controlSegmentCurrent(controller, run) {
    const style = controllerWiringStyle(controller);
    if (style !== "series" && style !== "series-parallel") {
      return effectiveRunCurrent(run);
    }

    const branchRuns = orderedSeriesBranch(controller, run);
    const runIndex = seriesRunIndex(controller, run);
    return branchRuns
      .slice(runIndex)
      .reduce((sum, downstreamRun) => sum + effectiveRunCurrent(downstreamRun), 0);
  }

  function seriesBranchTapeLength(controller, run) {
    if (!isSeriesWiring(controller)) return Math.max(0, number(run.tapeLength));
    return orderedSeriesBranch(controller, run).reduce((sum, branchRun) => sum + Math.max(0, number(branchRun.tapeLength)), 0);
  }

  function seriesBranchHasDualFeed(controller, run) {
    if (!isSeriesWiring(controller)) return Boolean(run.feedBothEnds);
    const branchRuns = orderedSeriesBranch(controller, run);
    const lastRun = branchRuns[branchRuns.length - 1];
    return Boolean(lastRun?.feedBothEnds);
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

  function addControlWireLength(summary, tape, wireSize, distanceFt) {
    const length = Math.max(0, number(distanceFt));
    if (length <= 0) return;

    const label = controlCableLabel(tape, wireSize);
    const existing = summary.find((item) => item.label === label);
    if (existing) {
      existing.length += length;
      return;
    }

    summary.push({
      label,
      length
    });
  }

  function wireLengthText(summary) {
    const parts = summary
      .filter((item) => item.length > 0)
      .map((item) => `${ft(item.length)} of ${item.label || `${item.wireSize} AWG`}`);

    if (!parts.length) return "0 ft";
    if (parts.length === 1) return parts[0];
    return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  }

  function summarizeWireLengths(inputState, controllers) {
    const powerSummary = [];
    const controlSummary = [];
    const activeControllers = controllers.filter((controller) => controller.enabled);

    if (inputState.powerMode === "shared" && activeControllers.length) {
      addWireLength(powerSummary, inputState.sharedPower.wireSize, inputState.sharedPower.distance);
    }

    activeControllers.forEach((controller) => {
      if (inputState.powerMode === "shared") {
        addWireLength(powerSummary, controller.wireSizeSplitToController, controller.distanceSplitToController);
      } else {
        addWireLength(powerSummary, controller.wireSizePowerToController, controller.distancePowerToController);
      }

      const activeTapeRuns = controller.runs.filter((run) => run.tapeLength > 0);
      if (controllerUsesTapeSplit(controller) && activeTapeRuns.length) {
        addControlWireLength(
          controlSummary,
          controller.tape,
          controller.wireSizeControllerToTapeSplit,
          controller.distanceControllerToTapeSplit
        );
      }

      activeTapeRuns.forEach((run) => {
        const nearDistance = runDistance(controller, run);
        addControlWireLength(controlSummary, controller.tape, run.wireSizeToTapeStart, nearDistance);

        if (run.feedBothEnds) {
          addControlWireLength(controlSummary, controller.tape, run.farEndWireSize || run.wireSizeToTapeStart, run.farEndDistance || nearDistance);
        }
      });
    });

    const summary = [...powerSummary, ...controlSummary];

    return {
      summary,
      powerSummary,
      controlSummary,
      totalLength: summary.reduce((sum, item) => sum + item.length, 0),
      totalPowerLength: powerSummary.reduce((sum, item) => sum + item.length, 0),
      totalControlLength: controlSummary.reduce((sum, item) => sum + item.length, 0),
      text: wireLengthText(summary),
      powerText: wireLengthText(powerSummary),
      controlText: wireLengthText(controlSummary)
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
          controllerCount: 0,
          controllerIndexes: [],
          controllerNumbers: []
        };
        limitsBySupply.set(interfaceIndex, current);
      }

      current.totalTapeLength += controller.totalTapeLength;
      current.powerW += controller.tapePowerW;
      current.controllerCount += 1;
      current.controllerIndexes.push(controller.controllerIndex);
      current.controllerNumbers.push(controller.controllerIndex + 1);
    });

    return Array.from(limitsBySupply.values())
      .sort((a, b) => a.interfaceIndex - b.interfaceIndex)
      .map((item) => ({
        ...item,
        limitFt: item.tape.maxInterfaceFt,
        overLimit:
          item.totalTapeLength > item.tape.maxInterfaceFt ||
          item.powerW > POWER_LIMIT_W ||
          item.controllerCount > MAX_CONTROLLERS_PER_POWER_SUPPLY,
        tapeOverLimit: item.totalTapeLength > item.tape.maxInterfaceFt,
        powerOverLimit: item.powerW > POWER_LIMIT_W,
        controllerOverLimit: item.controllerCount > MAX_CONTROLLERS_PER_POWER_SUPPLY
      }));
  }

  function activeRunCountForController(controller) {
    if (!controller) return 0;
    if (Array.isArray(controller.runResults)) {
      return controller.runResults.filter((run) => number(run.tapeLength) > 0).length;
    }
    if (Array.isArray(controller.runs)) {
      return controller.runs.filter((run) => number(run.tapeLength) > 0).length;
    }
    return 0;
  }

  function powerFeedControllerCount(inputState, recommendation, result = null) {
    const assignedControllerCount = inputState.tapeRuns.reduce((maxIndex, run) => {
      if (number(run.tapeLength) <= 0) return maxIndex;
      return Math.max(maxIndex, Math.round(number(run.controllerIndex ?? run.zoneIndex ?? 0)) + 1);
    }, 0);
    const evaluatedControllerCount = result
      ? result.controllers.filter((controller) => controller.enabled || activeRunCountForController(controller) > 0).length
      : 0;

    return Math.max(
      1,
      clampZoneCount(inputState.zoneCount, inputState.tapeRuns.length),
      recommendation.controllerCount || 0,
      assignedControllerCount,
      evaluatedControllerCount
    );
  }

  function fineTuneControllers(result, recommendation) {
    const controllerCount = powerFeedControllerCount(state, recommendation, result);
    return result.controllers.filter((controller) => controller.enabled || controller.controllerIndex < controllerCount);
  }

  function buildFineTuneSteps(result, recommendation) {
    const controllers = fineTuneControllers(result, recommendation);
    const steps = [];

    if (controllers.length > 1) {
      steps.push({
        id: "power-feed",
        type: "power-feed",
        target: "#powerFeedCard",
        shortLabel: "Power feed",
        title: "Power Feed"
      });
    }

    controllers.forEach((controller) => {
      steps.push({
        id: `controller-power-${controller.controllerIndex}`,
        type: "controller-power",
        controllerIndex: controller.controllerIndex,
        target: controllerPowerJump(controller),
        shortLabel: `Controller ${controller.controllerIndex + 1} power distance`,
        title: `Controller ${controller.controllerIndex + 1} Power Distance`
      });
    });

    controllers
      .filter((controller) => activeRunCountForController(controller) >= 2)
      .forEach((controller) => {
        steps.push({
          id: `tape-split-${controller.controllerIndex}`,
          type: "tape-split",
          controllerIndex: controller.controllerIndex,
          target: `#controller-${controller.controllerIndex + 1}-tape-wiring`,
          shortLabel: `Controller ${controller.controllerIndex + 1} tape split`,
          title: `Controller ${controller.controllerIndex + 1} Tape Split`
        });
      });

    controllers.forEach((controller) => {
      controller.runResults
        .filter((run) => number(run.tapeLength) > 0)
        .forEach((run) => {
          steps.push({
            id: `tape-run-${run.globalRunIndex}`,
            type: "tape-run",
            controllerIndex: controller.controllerIndex,
            runIndex: run.globalRunIndex,
            target: runJump(controller, run),
            shortLabel: run.runName,
            title: `${run.runName} Tape Distance`
          });
        });
    });

    return steps;
  }

  function syncFineTuneSteps(result, recommendation) {
    currentFineTuneSteps = buildFineTuneSteps(result, recommendation);
    if (!currentFineTuneSteps.length) {
      activeFineTuneStepId = null;
    } else if (activeFineTuneStepId && !currentFineTuneSteps.some((step) => step.id === activeFineTuneStepId)) {
      activeFineTuneStepId = currentFineTuneSteps[0].id;
    }

    els.advancedDetails?.classList.toggle("is-guided-fine-tune", Boolean(activeFineTuneStepId));
  }

  function fineTuneStepIndex(stepId = activeFineTuneStepId) {
    return currentFineTuneSteps.findIndex((step) => step.id === stepId);
  }

  function fineTuneStepForSelector(selector) {
    return currentFineTuneSteps.find((step) => step.target === selector);
  }

  function activeFineTuneStep() {
    return currentFineTuneSteps.find((step) => step.id === activeFineTuneStepId) || null;
  }

  function guideStepClass(stepId) {
    if (!activeFineTuneStepId) return "";
    return stepId === activeFineTuneStepId ? "is-guide-active" : "is-guide-collapsed";
  }

  function guideStepNavMarkup(stepId) {
    if (!activeFineTuneStepId) return "";

    const index = fineTuneStepIndex(stepId);
    if (index < 0) return "";

    const previousStep = currentFineTuneSteps[index - 1];
    const nextStep = currentFineTuneSteps[index + 1];
    const nextLabel = nextStep ? `Next: ${escapeHtml(nextStep.shortLabel)}` : "Back to Diagram";
    const nextButton = nextStep ? `<button type="button" data-fine-tune-action="next">${nextLabel}</button>` : "";
    const doneButton =
      !nextStep && currentLiveLevel === "ok"
        ? `<button type="button" class="done-button" data-fine-tune-action="done">Done</button>`
        : "";

    return `
      <div class="guide-step-actions">
        <span class="guide-step-progress">Fine-tune ${index + 1} of ${currentFineTuneSteps.length}</span>
        <div class="guide-step-buttons">
          ${
            previousStep
              ? `<button type="button" class="secondary" data-fine-tune-action="previous">Previous</button>`
              : `<button type="button" class="secondary" data-fine-tune-action="finish">Back to Diagram</button>`
          }
          ${nextButton}
          ${doneButton}
        </div>
      </div>
    `;
  }

  function renderPowerFeedGuideNav() {
    if (!els.powerFeedGuideNav) return;
    els.powerFeedGuideNav.innerHTML = currentFineTuneSteps.some((step) => step.id === "power-feed")
      ? guideStepNavMarkup("power-feed")
      : "";
  }

  function scrollToFineTuneStep(stepId) {
    const step = currentFineTuneSteps.find((item) => item.id === stepId);
    const target = step ? document.querySelector(step.target) : els.advancedDetails;
    if (!target) return;

    openDetailsForTarget(target);
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      highlightTarget(target);
      const focusTarget = target.matches("input, select, textarea, button")
        ? target
        : target.querySelector("input, select, textarea, button");
      focusTarget?.focus({ preventScroll: true });
    }, 40);
  }

  function applySingleRunTapeModeDefaults(inputState, result) {
    let changed = false;
    result.controllers.forEach((controller) => {
      const activeRunCount = activeRunCountForController(controller);
      const controllerState = inputState.controllers[controller.controllerIndex];

      if (activeRunCount >= 2) {
        if (activeRunCount < 3 && controllerState?.wiringStyle === "series-parallel") {
          controllerState.wiringStyle = DEFAULT_WIRING_STYLE;
          changed = true;
        }
        return;
      }

      if (controllerState && controllerState.tapeMode !== "direct") {
        controllerState.tapeMode = "direct";
        changed = true;
      }
      if (controllerState && controllerState.wiringStyle !== DEFAULT_WIRING_STYLE) {
        controllerState.wiringStyle = DEFAULT_WIRING_STYLE;
        changed = true;
      }
    });
    return changed;
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

  function distanceForSuggestedRun(tape, controllerCurrent, run, controllerTapeLength = run.tapeLength) {
    if (run.tapeLength <= 0) {
      return {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        plannedPowerCableFt: 0,
        plannedControlCableFt: 0,
        powerSpecLimitFt: 0,
        controlSpecLimitFt: 0,
        powerWireSize: DEFAULT_POWER_WIRE_SIZE,
        controlWireSize: DEFAULT_CONTROL_WIRE_SIZE,
        status: { label: "No tape", level: "neutral" }
      };
    }

    const branchCurrent = run.feedBothEnds ? run.tapeCurrent / 2 : run.tapeCurrent;
    const powerDropPerFt = ohmsForWire(DEFAULT_POWER_WIRE_SIZE) * controllerCurrent;
    const tapeDropPerFt = ohmsForWire(DEFAULT_CONTROL_WIRE_SIZE) * branchCurrent;
    const fadePctPerFt = Math.max(powerDropPerFt, tapeDropPerFt) * tape.droopPerVolt * 100;
    const powerSpecLimitFt = powerCableLimitFt(tape, controllerTapeLength, DEFAULT_POWER_WIRE_SIZE);
    const controlSpecLimitFt = controlCableLimitFt(tape, controllerTapeLength || run.tapeLength, DEFAULT_CONTROL_WIRE_SIZE);

    if (fadePctPerFt <= 0) {
      return {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        plannedPowerCableFt: 0,
        plannedControlCableFt: 0,
        powerSpecLimitFt,
        controlSpecLimitFt,
        powerWireSize: DEFAULT_POWER_WIRE_SIZE,
        controlWireSize: DEFAULT_CONTROL_WIRE_SIZE,
        status: { label: "No tape", level: "neutral" }
      };
    }

    return {
      goodTotalPathFt: GOOD_LIGHT_LOSS_PCT / fadePctPerFt,
      maxTotalPathFt: MAX_LIGHT_LOSS_PCT / fadePctPerFt,
      plannedPowerCableFt: 0,
      plannedControlCableFt: 0,
      powerSpecLimitFt,
      controlSpecLimitFt,
      powerWireSize: DEFAULT_POWER_WIRE_SIZE,
      controlWireSize: DEFAULT_CONTROL_WIRE_SIZE,
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
        const feedBothEnds = Boolean(run.feedBothEnds);

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
          feedBothEnds,
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
          const guidance = distanceForSuggestedRun(tape, controller.inputCurrent, run, controller.totalTapeLength);
          const dualFeedMissing = run.needsDualFeed && !run.feedBothEnds;
          const specLevel = run.tooLong ? "fail" : dualFeedMissing ? "warn" : "ok";
          const level = run.tooLong ? "fail" : dualFeedMissing ? "warn" : "ok";
          return {
            ...run,
            distanceGuidance: guidance,
            specStatus: {
              level: specLevel,
              label: run.tooLong ? "Too long" : dualFeedMissing ? "Dual feed suggested" : run.needsDualFeed ? "Dual feed ok" : "In range"
            },
            runOverallStatus: {
              level,
              label: level === "fail" ? "Fix" : level === "warn" ? "Dual feed" : "Good"
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
        : "No controllers",
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

  function seriesPathToRun(controller, run) {
    const branchRuns = orderedSeriesBranch(controller, run);
    const runIndex = seriesRunIndex(controller, run);
    return branchRuns.slice(0, runIndex + 1).reduce((sum, branchRun) => sum + runDistance(controller, branchRun), 0);
  }

  function runTapeDistance(controller, run) {
    const style = controllerWiringStyle(controller);
    if (style === "series") return seriesPathToRun(controller, run);
    if (style === "series-parallel") {
      return Math.max(0, number(controller.distanceControllerToTapeSplit)) + seriesPathToRun(controller, run);
    }

    const nearDistance = runDistance(controller, run);
    return controller.tapeMode === "shared"
      ? Math.max(0, number(controller.distanceControllerToTapeSplit)) + nearDistance
      : nearDistance;
  }

  function farEndControlDistance(controller, run) {
    const farEndDistance = Math.max(0, number(run.farEndDistance || runDistance(controller, run)));
    if (controllerWiringStyle(controller) === "series-parallel") {
      return Math.max(0, number(controller.distanceControllerToTapeSplit)) + farEndDistance;
    }
    return controller.tapeMode === "shared"
      ? Math.max(0, number(controller.distanceControllerToTapeSplit)) + farEndDistance
      : farEndDistance;
  }

  function runControlCableDistance(controller, run) {
    const nearPath = runTapeDistance(controller, run);
    if (!run.feedBothEnds) return nearPath;
    return nearPath + farEndControlDistance(controller, run);
  }

  function controllerControlCableDistance(controller) {
    const style = controllerWiringStyle(controller);
    if (style === "series" || style === "series-parallel") {
      const groups = orderedSeriesGroups(controller);
      const sharedSplitDistance =
        style === "series-parallel" && groups.length
          ? Math.max(0, number(controller.distanceControllerToTapeSplit))
          : 0;
      const branchDistance = groups.reduce(
        (sum, group) => sum + group.runs.reduce((branchSum, run) => branchSum + runDistance(controller, run), 0),
        0
      );
      const farEndDistance = groups.reduce(
        (sum, group) =>
          sum +
          group.runs.reduce((branchSum, run) => {
            if (!run.feedBothEnds) return branchSum;
            return branchSum + Math.max(0, number(run.farEndDistance || runDistance(controller, run)));
          }, 0),
        0
      );
      return sharedSplitDistance + branchDistance + farEndDistance;
    }

    const activeRuns = controller.runs.filter((run) => run.tapeLength > 0);
    const sharedDistance =
      controller.tapeMode === "shared" && activeRuns.length
        ? Math.max(0, number(controller.distanceControllerToTapeSplit))
        : 0;
    const branchDistance = activeRuns.reduce((sum, run) => {
      const nearDistance = runDistance(controller, run);
      const farDistance = run.feedBothEnds ? Math.max(0, number(run.farEndDistance || nearDistance)) : 0;
      return sum + nearDistance + farDistance;
    }, 0);

    return sharedDistance + branchDistance;
  }

  function controllerControlWireSize(controller) {
    return DEFAULT_CONTROL_WIRE_SIZE;
  }

  function controllerPowerWireSize(inputState, controller) {
    if (inputState.powerMode !== "shared") return normalizePowerWireSize(controller.wireSizePowerToController);
    return Math.max(
      normalizePowerWireSize(inputState.sharedPower.wireSize),
      normalizePowerWireSize(controller.wireSizeSplitToController)
    );
  }

  function controlDropBeforeRun(controller, run, controllerDropV) {
    const style = controllerWiringStyle(controller);
    if (style !== "series" && style !== "series-parallel") {
      return style === "parallel" && controller.tapeMode === "shared"
        ? controllerDropV +
            ohmsForWire(controller.wireSizeControllerToTapeSplit) *
              Math.max(0, number(controller.distanceControllerToTapeSplit)) *
              controller.totalTapeCurrent
        : controllerDropV;
    }

    let dropV = controllerDropV;
    const branchRuns = orderedSeriesBranch(controller, run);
    const runIndex = seriesRunIndex(controller, run);

    if (style === "series-parallel") {
      dropV +=
        ohmsForWire(controller.wireSizeControllerToTapeSplit) *
        Math.max(0, number(controller.distanceControllerToTapeSplit)) *
        controller.totalTapeCurrent;
    }

    branchRuns.slice(0, runIndex).forEach((branchRun, segmentIndex) => {
      const downstreamCurrent = branchRuns
        .slice(segmentIndex)
        .reduce((sum, downstreamRun) => sum + effectiveRunCurrent(downstreamRun), 0);
      dropV += ohmsForWire(branchRun.wireSizeToTapeStart) * runDistance(controller, branchRun) * downstreamCurrent;
    });

    return dropV;
  }

  function plannedRunPathDistance(inputState, controller, run) {
    const powerDistance = controllerPowerDistance(inputState, controller);
    const nearPath = powerDistance + runTapeDistance(controller, run);

    if (!run.feedBothEnds) return nearPath;

    return Math.max(nearPath, powerDistance + farEndControlDistance(controller, run));
  }

  function runDistanceGuidance(inputState, controller, run, totalCurrent) {
    if (run.tapeLength <= 0 || controller.inputCurrent <= 0) {
      return {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        plannedTotalPathFt: 0,
        plannedPowerCableFt: 0,
        plannedControlCableFt: 0,
        plannedControlPathFt: 0,
        powerSpecLimitFt: 0,
        controlSpecLimitFt: 0,
        powerWireSize: DEFAULT_POWER_WIRE_SIZE,
        controlWireSize: DEFAULT_CONTROL_WIRE_SIZE,
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

    if (controllerUsesTapeSplit(controller)) {
      coefficients.push(ohmsForWire(controller.wireSizeControllerToTapeSplit) * controller.totalTapeCurrent);
    }

    const branchCurrent = controlSegmentCurrent(controller, run);
    coefficients.push(ohmsForWire(run.wireSizeToTapeStart) * branchCurrent);

    if (run.feedBothEnds) {
      coefficients.push(
        ohmsForWire(run.farEndWireSize || run.wireSizeToTapeStart) * Math.max(0, number(run.tapeCurrent)) / 2
      );
    }

    const fadePctPerFt = Math.max(...coefficients, 0) * controller.tape.droopPerVolt * 100;
    const plannedTotalPathFt = plannedRunPathDistance(inputState, controller, run);
    const plannedPowerCableFt = controllerPowerDistance(inputState, controller);
    const plannedControlCableFt = controllerControlCableDistance(controller);
    const plannedControlPathFt = run.feedBothEnds
      ? Math.max(runTapeDistance(controller, run), farEndControlDistance(controller, run))
      : runTapeDistance(controller, run);
    const powerWireSize = controllerPowerWireSize(inputState, controller);
    const controlWireSize = controllerControlWireSize(controller);
    const powerSpecLimitFt = powerCableLimitFt(controller.tape, controller.totalTapeLength || run.tapeLength, powerWireSize);
    const controlSpecLimitFt = controlCableLimitFt(controller.tape, controller.totalTapeLength || run.tapeLength, controlWireSize);
    const goodTotalPathFt = fadePctPerFt > 0 ? GOOD_LIGHT_LOSS_PCT / fadePctPerFt : 0;
    const maxTotalPathFt = fadePctPerFt > 0 ? MAX_LIGHT_LOSS_PCT / fadePctPerFt : 0;
    const plannedFadePct = fadePctPerFt * plannedTotalPathFt;

    return {
      goodTotalPathFt,
      maxTotalPathFt,
      plannedTotalPathFt,
      plannedPowerCableFt,
      plannedControlCableFt,
      plannedControlPathFt,
      powerSpecLimitFt,
      controlSpecLimitFt,
      powerWireSize,
      controlWireSize,
      plannedFadePct,
      status: startFadeBucket(plannedFadePct, run.tapeLength > 0)
    };
  }

  function roundDistance(value) {
    return Math.max(0, Math.round(number(value) * 10) / 10);
  }

  function floorDistance(value) {
    return Math.max(0, Math.floor((number(value) + 0.0000001) * 10) / 10);
  }

  function setAutoDistance(target, valueKey, autoKey, value, options = {}) {
    if (!target || target[autoKey] === false) return false;
    const nextValue = options.rounding === "floor" ? floorDistance(value) : roundDistance(value);
    if (Math.abs(number(target[valueKey]) - nextValue) < 0.05) return false;
    target[valueKey] = nextValue;
    return true;
  }

  function applyRecommendedControllerDefaults(inputState, recommendation) {
    let changed = false;
    const requiredControllerCount = clampZoneCount(recommendation.controllerCount || 1, inputState.tapeRuns.length);
    if (inputState.zoneCount < requiredControllerCount) {
      inputState.zoneCount = requiredControllerCount;
      changed = true;
    }

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
      if (!stateRun) return;
      const assignmentIsAuto = stateRun.controllerIndexAuto !== false && stateRun.zoneIndexAuto !== false;
      if (!assignmentIsAuto) return;

      const nextControllerIndex = Math.min(MAX_CONTROLLERS - 1, Math.max(0, Math.round(number(run.controllerIndex))));
      if (stateRun.controllerIndex !== nextControllerIndex) {
        stateRun.controllerIndex = nextControllerIndex;
        changed = true;
      }
      if (stateRun.zoneIndex !== nextControllerIndex) {
        stateRun.zoneIndex = nextControllerIndex;
        changed = true;
      }
      stateRun.controllerIndexAuto = true;
      stateRun.zoneIndexAuto = true;
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

  function applySeriesPositionDefaults(inputState) {
    let changed = false;

    inputState.controllers.forEach((controller, controllerIndex) => {
      if (!isSeriesWiring(controller)) return;

      const runs = inputState.tapeRuns
        .map((run, globalRunIndex) => ({ run, globalRunIndex }))
        .filter(({ run }) => Math.round(number(run.controllerIndex ?? run.zoneIndex ?? 0)) === controllerIndex && number(run.tapeLength) > 0);

      if (!runs.length) return;

      const wiringStyle = controllerWiringStyle(controller);
      const orderedRuns = runs.sort((a, b) => a.globalRunIndex - b.globalRunIndex);

      if (wiringStyle === "series-parallel") {
        orderedRuns.forEach(({ run }, runIndex) => {
          if (run.seriesBranchIndexAuto === false) return;
          const nextBranchIndex = Math.floor(runIndex / 2);
          if (run.seriesBranchIndex !== nextBranchIndex) {
            run.seriesBranchIndex = nextBranchIndex;
            changed = true;
          }
        });
      } else {
        orderedRuns.forEach(({ run }) => {
          if (run.seriesBranchIndexAuto === false) return;
          if (run.seriesBranchIndex !== 0) {
            run.seriesBranchIndex = 0;
            changed = true;
          }
        });
      }

      const groups = new Map();
      orderedRuns.forEach((item) => {
        const branchIndex = wiringStyle === "series-parallel"
          ? Math.min(MAX_RUNS - 1, Math.max(0, Math.round(number(item.run.seriesBranchIndex ?? 0))))
          : 0;
        if (!groups.has(branchIndex)) groups.set(branchIndex, []);
        groups.get(branchIndex).push(item);
      });

      groups.forEach((groupRuns) => {
        groupRuns
          .sort((a, b) => a.globalRunIndex - b.globalRunIndex)
          .forEach(({ run }, position) => {
            if (run.seriesPositionAuto === false) return;
            if (run.seriesPosition !== position) {
              run.seriesPosition = position;
              changed = true;
            }
          });
      });
    });

    return changed;
  }

  function applyRecommendedDistanceDefaults(inputState, result) {
    const activeControllers = result.controllers.filter((controller) => controller.enabled);
    const activeRuns = result.tapeRunResults.filter((run) => run.tapeLength > 0);
    if (!activeRuns.length) return false;
    const autoTargets = [];
    const addTarget = (target, valueKey, autoKey, path, coefficient) => {
      const safeCoefficient = Math.max(0, number(coefficient));
      if (!target || target[autoKey] === false || safeCoefficient <= 0) return;
      autoTargets.push({ target, valueKey, autoKey, path, coefficient: safeCoefficient });
    };

    if (inputState.powerMode === "shared") {
      addTarget(
        inputState.sharedPower,
        "distance",
        "distanceAuto",
        "sharedPower.distance",
        ohmsForWire(inputState.sharedPower.wireSize) * result.totalCurrent
      );
    }

    activeControllers.forEach((controller) => {
      const controllerIndex = controller.controllerIndex;
      const controllerState = inputState.controllers[controllerIndex];
      const controllerRuns = controller.runResults.filter((run) => run.tapeLength > 0);
      if (!controllerState || !controllerRuns.length) return;

      if (inputState.powerMode === "shared") {
        addTarget(
          controllerState,
          "distanceSplitToController",
          "distanceSplitToControllerAuto",
          `controllers.${controllerIndex}.distanceSplitToController`,
          ohmsForWire(controller.wireSizeSplitToController) * controller.inputCurrent
        );
      } else {
        addTarget(
          controllerState,
          "distancePowerToController",
          "distancePowerToControllerAuto",
          `controllers.${controllerIndex}.distancePowerToController`,
          ohmsForWire(controller.wireSizePowerToController) * controller.inputCurrent
        );
      }

      if (controllerUsesTapeSplit(controller)) {
        addTarget(
          controllerState,
          "distanceControllerToTapeSplit",
          "distanceControllerToTapeSplitAuto",
          `controllers.${controllerIndex}.distanceControllerToTapeSplit`,
          ohmsForWire(controller.wireSizeControllerToTapeSplit) * controller.totalTapeCurrent
        );
      }

      const wiringStyle = controllerWiringStyle(controller);
      controllerRuns.forEach((run) => {
        const stateRun = inputState.tapeRuns[run.globalRunIndex];
        if (!stateRun) return;

        let valueKey = "distanceControllerToTapeStart";
        let autoKey = "distanceControllerToTapeStartAuto";
        if (wiringStyle === "series" && seriesRunIndex(controller, run) > 0) {
          valueKey = "distancePreviousToTapeStart";
          autoKey = "distancePreviousToTapeStartAuto";
        } else if (wiringStyle === "series-parallel") {
          if (seriesRunIndex(controller, run) > 0) {
            valueKey = "distancePreviousToTapeStart";
            autoKey = "distancePreviousToTapeStartAuto";
          } else {
            valueKey = "distanceSplitToTapeStart";
            autoKey = "distanceSplitToTapeStartAuto";
          }
        } else if (wiringStyle === "parallel" && controller.tapeMode === "shared") {
          valueKey = "distanceSplitToTapeStart";
          autoKey = "distanceSplitToTapeStartAuto";
        }

        addTarget(
          stateRun,
          valueKey,
          autoKey,
          `tapeRuns.${run.globalRunIndex}.${valueKey}`,
          ohmsForWire(run.wireSizeToTapeStart) * controlSegmentCurrent(controller, run)
        );

        if (run.feedBothEnds) {
          addTarget(
            stateRun,
            "farEndDistance",
            "farEndDistanceAuto",
            `tapeRuns.${run.globalRunIndex}.farEndDistance`,
            ohmsForWire(run.farEndWireSize || run.wireSizeToTapeStart) * Math.max(0, number(run.tapeCurrent)) / 2
          );
        }
      });
    });

    if (!autoTargets.length) return false;

    const writePath = (root, path, value) => {
      const parts = path.split(".");
      let target = root;
      for (let index = 0; index < parts.length - 1; index += 1) {
        const key = /^\d+$/.test(parts[index]) ? Number(parts[index]) : parts[index];
        target = target[key];
      }
      target[parts[parts.length - 1]] = value;
    };
    const distanceForScale = (target, scale) =>
      floorDistance(Math.min(500, scale / Math.max(target.coefficient, 0.0000001)));
    const resultForScale = (scale) => {
      const candidate = clone(inputState);
      autoTargets.forEach((target) => writePath(candidate, target.path, distanceForScale(target, scale)));
      return evaluate(candidate);
    };
    const worstStartLoss = (candidateResult) =>
      Math.max(
        0,
        ...candidateResult.tapeRunResults
          .filter((run) => run.tapeLength > 0)
          .map((run) => Math.max(0, number(run.fadeAtTapeStartPct)))
      );

    const targetLossPct = GOOD_LIGHT_LOSS_PCT - 0.1;
    let lowScale = 0;
    let highScale = 64;
    if (worstStartLoss(resultForScale(0)) < targetLossPct) {
      for (let iteration = 0; iteration < 22; iteration += 1) {
        const midScale = (lowScale + highScale) / 2;
        if (worstStartLoss(resultForScale(midScale)) < targetLossPct) {
          lowScale = midScale;
        } else {
          highScale = midScale;
        }
      }
    }

    let changed = false;
    autoTargets.forEach((target) => {
      changed =
        setAutoDistance(
          target.target,
          target.valueKey,
          target.autoKey,
          distanceForScale(target, lowScale),
          { rounding: "floor" }
        ) || changed;
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
      const seriesBranchIndex = Math.min(MAX_RUNS - 1, Math.max(0, Math.round(number(run.seriesBranchIndex ?? 0))));
      const seriesPosition = Math.min(MAX_RUNS - 1, Math.max(0, Math.round(number(run.seriesPosition ?? globalRunIndex))));

      return {
        ...run,
        controllerIndex,
        zoneIndex,
        seriesBranchIndex,
        seriesPosition,
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
        zoneLabel: zoneNames.length === 1 ? zoneNames[0] : zoneNames.length ? "Mixed controllers" : "No controller",
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
        limit.controllerOverLimit
          ? `${limit.controllerCount} controllers assigned; each 96 W power interface can feed up to ${MAX_CONTROLLERS_PER_POWER_SUPPLY} controllers.`
          : "",
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
        controllerUsesTapeSplit(controller)
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
      const powerCableDistanceFt = controllerPowerDistance(inputState, controller);
      const powerCableWireSize = controllerPowerWireSize(inputState, controller);
      const powerCableLimitValueFt = powerCableLimitFt(controller.tape, controller.totalTapeLength, powerCableWireSize);
      const powerCableTableStatus = cableDistanceStatus(powerCableDistanceFt, powerCableLimitValueFt, controller.totalTapeLength > 0);
      const controlCableDistanceFt = controllerControlCableDistance(controller);
      const controlCableWireSize = controllerControlWireSize(controller);
      const controlCableLimitValueFt = controlCableLimitFt(controller.tape, controller.totalTapeLength, controlCableWireSize);
      const controlCableTableStatus = cableDistanceStatus(controlCableDistanceFt, controlCableLimitValueFt, controller.totalTapeLength > 0);

      const runResults = controller.runs.map((run) => {
        const hasTape = run.tapeLength > 0;
        const baseDropV = controlDropBeforeRun(controller, run, controllerDropV);
        const nearDistance = runDistance(controller, run);
        const nearWireSize = run.wireSizeToTapeStart;
        const dualEndRecommendedOverFt = controller.tape.dualEndRecommendedOverFt || FULL_REEL_FT;
        const maxContinuousRunFt = controller.tape.maxContinuousRunFt || DUAL_END_MAX_FT;
        const seriesLayout = isSeriesWiring(controller);
        const branchRunsForSpec = seriesLayout ? orderedSeriesBranch(controller, run) : [run];
        const specCheckLengthFt = seriesLayout ? seriesBranchTapeLength(controller, run) : run.tapeLength;
        const specCheckName = seriesLayout ? "series branch" : "tape run";
        const specHasDualFeed = seriesLayout ? seriesBranchHasDualFeed(controller, run) : run.feedBothEnds;
        const dualFeedSuggested = hasTape && specCheckLengthFt > dualEndRecommendedOverFt && !specHasDualFeed;
        const reportSpecIssue = !seriesLayout || seriesRunIndex(controller, run) === 0;
        const showDualFeedCallout = dualFeedSuggested && (!seriesLayout || seriesRunIndex(controller, run) === branchRunsForSpec.length - 1);
        let specStatus = hasTape ? { label: "In range", level: "ok" } : { label: "No tape", level: "neutral" };

        let fadeAtTapeStartPct = 0;
        let fadeAtTapeEndPct = 0;
        let visibleRunFadePct = 0;
        let leadDropV = 0;

        if (hasTape && run.feedBothEnds) {
          const halfLength = run.tapeLength / 2;
          const halfCurrent = currentForTapeLength(halfLength, controller.tape);
          const nearSegmentCurrent = controlSegmentCurrent(controller, run);
          const farDistance = Math.max(0, number(run.farEndDistance || nearDistance));
          const farWireSize = run.farEndWireSize || nearWireSize;
          const nearFeedPct =
            (baseDropV + ohmsForWire(nearWireSize) * nearDistance * nearSegmentCurrent) * controller.tape.droopPerVolt * 100;
          const farFeedPct =
            (baseDropV + ohmsForWire(farWireSize) * farDistance * halfCurrent) * controller.tape.droopPerVolt * 100;
          const nearInternalPct = internalFadeForSegment(halfLength, halfCurrent, controller.tape);
          const farInternalPct = internalFadeForSegment(halfLength, halfCurrent, controller.tape);
          fadeAtTapeStartPct = Math.max(nearFeedPct, farFeedPct);
          visibleRunFadePct = Math.max(nearInternalPct, farInternalPct, Math.abs(nearFeedPct - farFeedPct));
          fadeAtTapeEndPct = fadeAtTapeStartPct + visibleRunFadePct;
          leadDropV = Math.max(
            baseDropV + ohmsForWire(nearWireSize) * nearDistance * nearSegmentCurrent,
            baseDropV + ohmsForWire(farWireSize) * farDistance * halfCurrent
          );
        } else if (hasTape) {
          leadDropV = baseDropV + ohmsForWire(nearWireSize) * nearDistance * controlSegmentCurrent(controller, run);
          fadeAtTapeStartPct = leadDropV * controller.tape.droopPerVolt * 100;
          visibleRunFadePct = internalFadeForSegment(run.tapeLength, run.tapeCurrent, controller.tape);
          fadeAtTapeEndPct = fadeAtTapeStartPct + visibleRunFadePct;
        }

        const startStatus = startFadeBucket(fadeAtTapeStartPct, hasTape);
        const runStatus = fadeBucket(visibleRunFadePct);

        if (specCheckLengthFt > maxContinuousRunFt) {
          specStatus = { label: "Too long", level: "fail" };
          const detail =
            controller.tape.id === "rania-high"
              ? `${ft(specCheckLengthFt)} in this ${specCheckName}. Rania High Output allows ${ft(
                  maxContinuousRunFt
                )} total per power interface; reduce the tape length or use another properly specified power interface.`
              : seriesLayout
                ? `${ft(specCheckLengthFt)} in this ${specCheckName}. This controller is set to Series, so these tape runs are being checked as one continuous path. If they are separate tape runs, change this controller to Parallel or Series-Parallel; any individual run over ${ft(
                    dualEndRecommendedOverFt
                  )} still needs dual-ended wiring.`
                : `${ft(specCheckLengthFt)} in this ${specCheckName}. ${controller.tape.label} allows up to ${ft(
                    maxContinuousRunFt
                  )} on one dual-ended run. Split longer tape into separate parallel runs.`;
          if (reportSpecIssue) {
            issues.push(
              issue(
                "fail",
                `${seriesLayout ? "Series branch" : run.runName} is too long`,
                detail
              )
            );
          }
        } else if (dualFeedSuggested) {
          specStatus = { label: "Dual feed recommended", level: "warn" };
          const detail =
            controller.tape.id === "rania-high"
              ? `${ft(specCheckLengthFt)} in this ${specCheckName}. Rania High Output should be fed from both ends when a run is over ${ft(
                  dualEndRecommendedOverFt
                )}.`
              : `${ft(specCheckLengthFt)} in this ${specCheckName}. Feed the far end or split this into parallel runs when a series path is over ${ft(
                  dualEndRecommendedOverFt
                )}.`;
          if (reportSpecIssue) {
            issues.push(
              issue(
                "warn",
                `${seriesLayout ? "Series branch" : run.runName} needs dual feed or split`,
                detail
              )
            );
          }
        } else if (hasTape && specCheckLengthFt > dualEndRecommendedOverFt && specHasDualFeed) {
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
        const runControlCableStatus = hasTape ? startStatus : { label: "No tape", level: "neutral" };

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
          controlCableStatus: runControlCableStatus,
          powerCableStatus: startStatus,
          runOverallStatus,
          distanceGuidance,
          lengthLimit: specHasDualFeed ? maxContinuousRunFt : dualEndRecommendedOverFt,
          dualEndRecommendedOverFt,
          maxContinuousRunFt,
          specCheckLengthFt,
          specCheckName,
          dualFeedSuggested,
          showDualFeedCallout
        };
      });

      const worstStartFade = Math.max(0, ...runResults.map((run) => run.fadeAtTapeStartPct));
      const worstRunFade = Math.max(0, ...runResults.map((run) => run.visibleRunFadePct));
      const voltageDropStatus = startFadeBucket(worstStartFade, controller.totalTapeLength > 0);

      return {
        ...controller,
        controllerDropV,
        tapeSplitDropV,
        powerCableDistanceFt,
        powerCableWireSize,
        powerCableLimitFt: powerCableLimitValueFt,
        powerCableStatus: voltageDropStatus,
        powerCableTableStatus,
        controlCableDistanceFt,
        controlCableWireSize,
        controlCableLimitFt: controlCableLimitValueFt,
        controlCableStatus: voltageDropStatus,
        controlCableTableStatus,
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
      totalPowerWireLength: wireSummary.totalPowerLength,
      powerWireLengthText: wireSummary.powerText,
      powerWireLengths: wireSummary.powerSummary,
      totalControlWireLength: wireSummary.totalControlLength,
      controlWireLengthText: wireSummary.controlText,
      controlWireLengths: wireSummary.controlSummary,
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
    const safeItem = item || { label: "Ready", level: "neutral" };
    return `<span class="pill ${safeItem.level}">${safeItem.label}</span>`;
  }

  function wireDistanceHelpForLabel(label) {
    if (label === "Max power wire distance" || label === "Power table reference") {
      return HELP_MAX_POWER_WIRE_DISTANCE;
    }
    if (label === "Max control wire distance" || label === "Max total control wire" || label === "Control path reference") {
      return HELP_MAX_CONTROL_WIRE_DISTANCE;
    }
    if (label === "Calculated path check") {
      return "Calculated from the actual power wire and control wire path using Lutron-style voltage-drop math. Under 25% light loss is considered within the recommended range.";
    }
    if (label === "Distance from controller to far end" || label === "Distance from tape split to far end") {
      return HELP_FAR_END_DISTANCE;
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

  function fieldInstruction(text, tone = "") {
    const toneClass = tone ? ` ${escapeHtml(tone)}` : "";
    return `<p class="field-instruction${toneClass}">${escapeHtml(text)}</p>`;
  }

  function resultChip(label, value, status) {
    if (status) {
      return `<div class="result-chip"><span class="result-label">${labelWithHelp(label)}</span>${pill(status)}<span>${value}</span></div>`;
    }
    return `<div class="result-chip"><strong>${value}</strong><span>${labelWithHelp(label)}</span></div>`;
  }

  function dualFeedThumbnail() {
    return `<img class="dual-feed-thumb" src="assets/dual-ended-feed.png" alt="Dual-ended feed wiring example" loading="lazy" draggable="false" data-zoom-image="assets/dual-ended-feed.png" data-zoom-title="Dual-ended feed" role="button" tabindex="0">`;
  }

  function jumpPill(item, target, ariaLabel) {
    const safeItem = item || { label: "Review", level: "warn" };
    return `<a class="pill ${safeItem.level} jump-pill" href="${escapeHtml(target)}" data-jump="${escapeHtml(
      target
    )}" aria-label="${escapeHtml(ariaLabel)}">${escapeHtml(safeItem.label)}</a>`;
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
      controller.powerCableStatus?.level,
      controller.controlCableStatus?.level,
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

  function systemMapLossGauge(x, y, width, lossPct) {
    const loss = Math.max(0, number(lossPct));
    const scaleMax = 50;
    const markerX = x + width * (Math.min(scaleMax, loss) / scaleMax);
    const greenWidth = width * 0.5;
    const yellowWidth = width * 0.3;
    const redWidth = width - greenWidth - yellowWidth;
    const label = `${pct(loss)} loss`;

    return `
      <g class="system-map-loss-gauge">
        <title>Estimated light loss at the beginning of the tape: ${escapeHtml(pct(loss))}</title>
        <rect class="system-map-loss-track" x="${x}" y="${y}" width="${width}" height="7" rx="3.5"></rect>
        <rect class="system-map-loss-zone ok" x="${x}" y="${y}" width="${greenWidth}" height="7" rx="3.5"></rect>
        <rect class="system-map-loss-zone warn" x="${x + greenWidth}" y="${y}" width="${yellowWidth}" height="7"></rect>
        <rect class="system-map-loss-zone fail" x="${x + greenWidth + yellowWidth}" y="${y}" width="${redWidth}" height="7" rx="3.5"></rect>
        <line class="system-map-loss-marker" x1="${markerX}" y1="${y - 3}" x2="${markerX}" y2="${y + 10}"></line>
        <circle class="system-map-loss-marker-dot" cx="${markerX}" cy="${y + 3.5}" r="3.5"></circle>
        <text class="system-map-loss-label" x="${x + width / 2}" y="${y + 18}" text-anchor="middle">${escapeHtml(label)}</text>
      </g>
    `;
  }

  function systemMapRunNode(x, centerY, width, run, level, jump) {
    const nodeHeight = 76;
    return `
      ${systemMapNode(
        x,
        centerY - nodeHeight / 2,
        width,
        nodeHeight,
        shortMapLabel(run.runName),
        `${ft(run.tapeLength)} tape`,
        level,
        jump,
        "run"
      )}
      ${systemMapLossGauge(x + 14, centerY + 18, width - 28, run.fadeAtTapeStartPct)}
    `;
  }

  function systemMapWire(x1, y1, x2, y2, label, level, jump) {
    const sameRow = Math.abs(y2 - y1) < 1;
    const sameColumn = Math.abs(x2 - x1) < 1;
    const bendX = Math.round((x1 + x2) / 2);
    const pathD = sameRow
      ? `M ${x1} ${y1} H ${x2}`
      : sameColumn
        ? `M ${x1} ${y1} V ${y2}`
        : `M ${x1} ${y1} H ${bendX} V ${y2} H ${x2}`;
    const labelX = sameColumn ? x1 + 34 : sameRow ? (x1 + x2) / 2 : (bendX + x2) / 2;
    const labelY = sameColumn ? (y1 + y2) / 2 - 8 : y2 - 9;
    return systemMapWirePath(pathD, labelX, labelY, label, level, jump, [
      [x1, y1],
      [x2, y2]
    ]);
  }

  function systemMapPort(x, y, level) {
    return `<circle class="system-map-port ${level}" cx="${x}" cy="${y}" r="6"></circle>`;
  }

  function systemMapWirePath(pathD, labelX, labelY, label, level, jump, ports = []) {
    return `
      <g class="system-map-wire-link ${level}" data-jump="${escapeHtml(jump)}" role="button" tabindex="0">
        <path class="system-map-wire-hit" d="${pathD}"></path>
        <path class="system-map-wire ${level}" d="${pathD}"></path>
        <text class="system-map-wire-label" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeHtml(label)}</text>
        ${ports.map(([x, y]) => systemMapPort(x, y, level)).join("")}
      </g>
    `;
  }

  function systemMapReturnWire(x1, y1, x2, y2, label, level, jump) {
    const midY = (y1 + y2) / 2;
    const turnX = x1 + 48;
    const approachX = x2 - 52;
    const pathD = [
      `M ${x1} ${y1}`,
      `H ${turnX}`,
      `V ${midY}`,
      `H ${approachX}`,
      `V ${y2}`,
      `H ${x2}`
    ].join(" ");
    return systemMapWirePath(pathD, (turnX + approachX) / 2, midY - 8, label, level, jump, [
      [x1, y1],
      [x2, y2]
    ]);
  }

  function powerWireTag(distance, wireSize) {
    return `${ft(distance)} / ${normalizePowerWireSize(wireSize)} AWG power`;
  }

  function controlWireTag(distance, tape, wireSize = DEFAULT_CONTROL_WIRE_SIZE) {
    return ft(distance);
  }

  function controlWireTypeField(tape, wireSize = DEFAULT_CONTROL_WIRE_SIZE, path = "") {
    const value = normalizeControlWireSize(wireSize);
    return `
      <div class="map-field static-field">
        <span>Control wire type</span>
        <strong>${escapeHtml(controlCableLabel(tape, value))}</strong>
      </div>
    `;
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
    if (!controller) return `${DEFAULT_POWER_WIRE_SIZE} AWG power`;

    if (state.powerMode === "shared") {
      const totalDistance = number(state.sharedPower.distance) + number(controller.distanceSplitToController);
      return `${ft(totalDistance)} / mixed AWG`;
    }

    return powerWireTag(controller.distancePowerToController, controller.wireSizePowerToController);
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
    const chainStep = 238;
    const laneGap = 156;
    const runGap = 96;
    const seriesRowGap = 108;
    const seriesGroupGap = 18;
    const maxSeriesColumns = Math.max(
      1,
      ...result.controllers
        .filter((controller) => controller.enabled && isSeriesWiring(controller))
        .flatMap((controller) => orderedSeriesGroups(controller).map((group) => Math.min(2, group.runs.length)))
    );
    const seriesRowsForGroup = (group) => Math.max(1, Math.ceil((group.runs?.length || 1) / 2));
    const seriesHeightForGroups = (groups) =>
      groups.length
        ? groups.reduce((sum, group) => sum + seriesRowsForGroup(group) * seriesRowGap, 0) +
          Math.max(0, groups.length - 1) * seriesGroupGap
        : runGap;
    const controllerMapHeight = (controller) => {
      const actualController = result.controllers[controller.globalIndex];
      if (actualController && isSeriesWiring(actualController)) {
        return Math.max(100, seriesHeightForGroups(orderedSeriesGroups(actualController)));
      }
      return Math.max(100, Math.max(1, controller.runs.length) * runGap);
    };
    const pieces = [];
    const interfaceLimitBySupply = new Map((result.interfaceTapeLimits || []).map((limit) => [limit.interfaceIndex, limit]));
    let cursorY = 58;

    mapSupplies.forEach((supply) => {
      const controllerHeights = supply.controllers.map((controller) => controllerMapHeight(controller));
      const blockHeight = Math.max(
        112,
        controllerHeights.reduce((sum, heightValue) => sum + heightValue, 0) +
          Math.max(0, controllerHeights.length - 1) * 18
      );
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
            powerWireTag(state.sharedPower.distance, state.sharedPower.wireSize),
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
      supply.controllers.forEach((controller, controllerPosition) => {
        const actualController = result.controllers[controller.globalIndex];
        const controllerRuns = controller.runs.length ? controller.runs : [];
        const wiringStyle = actualController ? controllerWiringStyle(actualController) : "parallel";
        const seriesGroups = actualController && isSeriesWiring(actualController) ? orderedSeriesGroups(actualController) : [];
        const isSeriesController = actualController && isSeriesWiring(actualController);
        const controllerHeight = controllerHeights[controllerPosition] || 84;
        const firstSeriesRunY = localCursor + seriesRowGap / 2;
        const controllerY = isSeriesController ? firstSeriesRunY - 32 : localCursor + controllerHeight / 2 - 32;
        const controllerLevel = actualController ? controllerVisualLevel(actualController) : worstLevel(controllerRuns.map((run) => run.runOverallStatus.level));
        const usesTapeSplit = actualController ? controllerUsesTapeSplit(actualController) : false;
        const controllerTarget = actualController ? controllerJump(actualController) : "#advancedDetails";
        const controllerPowerTarget = actualController ? controllerPowerJump(actualController) : "#advancedDetails";
        const powerSourceX = usesPowerSplit ? powerSplitX + powerSplitWidth : powerX + 126;
        const powerLabel =
          usesPowerSplit && actualController
            ? powerWireTag(actualController.distanceSplitToController, actualController.wireSizeSplitToController)
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
              controlWireTag(
                actualController.distanceControllerToTapeSplit,
                actualController.tape,
                actualController.wireSizeControllerToTapeSplit
              ),
              splitLevel,
              tapeSplitJump(actualController)
            )
          );
          pieces.push(
            systemMapNode(
              tapeSplitX,
              controllerY,
              96,
              64,
              wiringStyle === "series-parallel" ? "Branch Point" : "Tape Split",
              wiringStyle === "series-parallel" ? "to branches" : "to runs",
              splitLevel,
              tapeSplitJump(actualController)
            )
          );
        }

        if (actualController && isSeriesWiring(actualController)) {
          let branchStartY = controllerY + 32;
          seriesGroups.forEach((group, groupIndex) => {
            let previousEndX = wiringStyle === "series-parallel" ? tapeSplitX + 96 : controllerX + 128;
            let previousEndY = wiringStyle === "series-parallel" ? controllerY + 32 : controllerY + 32;

            group.runs.forEach((seriesRun, seriesIndex) => {
              const actualRun = actualRunByIndex.get(seriesRun.globalRunIndex) || seriesRun;
              const runLevel = actualRun.runOverallStatus?.level || seriesRun.runOverallStatus.level;
              const runTarget = runJump(actualController, actualRun);
              const rowIndex = Math.floor(seriesIndex / 2);
              const columnIndex = seriesIndex % 2;
              const runY = branchStartY + rowIndex * seriesRowGap;
              const nodeX = runX + columnIndex * chainStep;
              const tapeStartX = nodeX + 118;
              const label =
                seriesIndex === 0
                  ? controlWireTag(actualRun.runDistance, actualController.tape, actualRun.wireSizeToTapeStart)
                  : controlWireTag(actualRun.runDistance, actualController.tape, actualRun.wireSizeToTapeStart);

              if (seriesIndex > 0 && columnIndex === 0) {
                pieces.push(systemMapReturnWire(previousEndX, previousEndY, nodeX, runY, label, runLevel, runTarget));
              } else {
                pieces.push(systemMapWire(previousEndX, previousEndY, nodeX, runY, label, runLevel, runTarget));
              }
              pieces.push(systemMapRunNode(nodeX, runY, 118, actualRun, runLevel, runTarget));
              previousEndX = tapeStartX;
              previousEndY = runY;
            });

            branchStartY += seriesRowsForGroup(group) * seriesRowGap + seriesGroupGap;
          });
        } else {
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
                controlWireTag(
                  actualRun.runDistance || actualRun.distanceControllerToTapeStart || actualRun.distanceSplitToTapeStart,
                  actualController?.tape || state.tapeType,
                  actualRun.wireSizeToTapeStart
                ),
                runLevel,
                runTarget
              )
            );
            pieces.push(systemMapRunNode(runX, runY, 118, actualRun, runLevel, runTarget));
          });
        }

        localCursor += controllerHeight + 18;
      });

      cursorY += blockHeight + laneGap;
    });

    const height = Math.max(240, cursorY - laneGap + 58);
    const width = (usesPowerSplit ? 1180 : 1080) + Math.max(0, maxSeriesColumns - 1) * chainStep;

    els.systemMap.innerHTML = `
      <div class="system-map-track" style="--map-width: ${width}px;">
        <svg class="system-map-svg complex" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Suggested system wiring map">
          ${pieces.join("")}
        </svg>
      </div>
    `;
    applySystemMapZoom();
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
          ${resultChip("Power wire", result.powerWireLengthText || "Enter power distances")}
          ${resultChip("Control wire", result.controlWireLengthText || controlCableLabel(recommendation.tape))}
        </div>
        <p>
          Based on ${escapeHtml(recommendation.tape.label)} with ${recommendation.controllerCount || 0} ${
      recommendation.controllerCount === 1 ? "controller" : "controllers"
    }. Power wire is the 2-conductor run from the power interface to the controller. Control wire runs from the controller to the tape; conductor count is based on the tape product and control wire is fixed at 22 AWG. ${
      dualFeedRuns.length
        ? `Dual-feed runs: ${escapeHtml(dualFeedRuns.map((run) => run.runName).join(", "))}.`
        : "No dual-feed runs currently selected."
    }
        </p>
      </section>
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

    const actualRunByIndex = new Map(result.tapeRunResults.map((run) => [run.globalRunIndex, run]));
    const runHtml = recommendation.powerSupplies
      .flatMap((supply) => supply.controllers.flatMap((controller) => controller.runs))
      .map((run) => {
        const actualRun = actualRunByIndex.get(run.globalRunIndex) || run;
        const guidance = actualRun.distanceGuidance || run.distanceGuidance;
        const target = runJump({ controllerIndex: actualRun.controllerIndex }, actualRun);
        const statusSource = actualRun.runOverallStatus || run.runOverallStatus;
        const statusPill =
          run.needsDualFeed && !actualRun.feedBothEnds
            ? jumpPill(statusSource, target, `Jump to ${actualRun.runName} dual-feed settings`)
            : pill(statusSource);

        return `
          <div class="suggested-run-row ${statusSource.level}">
            <div>
              <strong>${escapeHtml(run.runName)}</strong>
              <span>${ft(run.tapeLength)} - ${run.controllerLabel}</span>
            </div>
            <div>
              <div class="suggested-row-label">${labelWithHelp("Power table reference")}</div>
              <strong>${ft(guidance.powerSpecLimitFt)} <small>${guidance.powerWireSize} AWG</small></strong>
            </div>
            <div>
              <div class="suggested-row-label">${labelWithHelp("Control path reference")}</div>
              <strong>${ft(guidance.controlSpecLimitFt)} <small>${controlCableShortLabel(
          recommendation.tape,
          guidance.controlWireSize
        )}</small></strong>
            </div>
            ${statusPill}
          </div>
        `;
      })
      .join("");

    els.suggestedSystem.innerHTML = `
      ${materialsHtml}
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
          powerWireTag(state.sharedPower.distance, state.sharedPower.wireSize),
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
          ? powerWireTag(controller.distanceSplitToController, controller.wireSizeSplitToController)
          : powerWireTag(controller.distancePowerToController, controller.wireSizePowerToController);

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
            controlWireTag(controller.distanceControllerToTapeSplit, controller.tape, controller.wireSizeControllerToTapeSplit),
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
        const runSub = run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "no tape";

        pieces.push(
          systemMapWire(
            runSourceX,
            runSourceY,
            runX,
            runY,
            controlWireTag(run.runDistance, controller.tape, run.wireSizeToTapeStart),
            runLevel,
            jump
          )
        );
        pieces.push(systemMapNode(runX, runY - 30, 112, 60, shortMapLabel(run.runName), runSub, runLevel, jump, "run"));
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
      pieces.push(mapStackWire(powerWireTag(state.sharedPower.distance, state.sharedPower.wireSize), result.level, "#sharedPowerFields"));
      pieces.push(mapStackItem("Power Split", "to controllers", result.level, "#sharedPowerFields"));
    }

    activeControllers.forEach((controller) => {
      const controllerLevel = controllerVisualLevel(controller);
      const powerLabel =
        state.powerMode === "shared"
          ? powerWireTag(controller.distanceSplitToController, controller.wireSizeSplitToController)
          : powerWireTag(controller.distancePowerToController, controller.wireSizePowerToController);

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
            controlWireTag(controller.distanceControllerToTapeSplit, controller.tape, controller.wireSizeControllerToTapeSplit),
            splitLevel,
            tapeSplitJump(controller)
          )
        );
        pieces.push(mapStackItem("Tape Split", "to runs", splitLevel, tapeSplitJump(controller)));
      }

      controller.runResults.slice(0, controller.runCount).forEach((run) => {
        const runLevel = runVisualLevel(run);
        const sub = run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "no tape";
        pieces.push(mapStackWire(controlWireTag(run.runDistance, controller.tape, run.wireSizeToTapeStart), runLevel, runJump(controller, run)));
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
    applySystemMapZoom();
    queueMapPanUpdate();
  }

  function renderSharedPowerFields() {
    if (state.powerMode !== "shared") {
      els.sharedPowerFields.innerHTML = "";
      return;
    }

    els.sharedPowerFields.innerHTML = `
      <div class="wire-map">
        ${fieldInstruction("Enter the actual shared power wire distance and choose the power wire gauge used before it splits to the controllers.", "primary")}
        <div class="map-node">
          <span>Power box</span>
          <strong>LU-PH3</strong>
        </div>
        <label class="map-field">
          <span>Shared distance before the controller split</span>
          <div class="input-with-unit">
            <input class="distance-input" data-path="sharedPower.distance" type="number" min="0" max="500" step="0.1" value="${state.sharedPower.distance}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Power wire size before the split</span>
          <select data-path="sharedPower.wireSize">${optionMarkup(POWER_WIRE_SIZES, state.sharedPower.wireSize)}</select>
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
    const stepId = `controller-power-${index}`;
    const stepClass = guideStepClass(stepId);
    if (state.powerMode === "shared") {
      return `
        <div id="controller-${index + 1}-power" class="wire-map guide-step ${stepClass}" data-guide-step-id="${stepId}">
          ${fieldInstruction("Enter the actual power wire distance from the power split to this controller, then choose the power wire gauge.", "primary")}
          <div class="map-node">
            <span>Split</span>
            <strong>Power feed</strong>
          </div>
          <label class="map-field">
            <span>Distance from split to controller</span>
            <div class="input-with-unit">
              <input class="distance-input" data-path="controllers.${index}.distanceSplitToController" type="number" min="0" max="500" step="0.1" value="${controller.distanceSplitToController}">
              <span>ft</span>
            </div>
          </label>
          <label class="map-field">
            <span>Power wire size to controller</span>
            <select data-path="controllers.${index}.wireSizeSplitToController">${optionMarkup(POWER_WIRE_SIZES, controller.wireSizeSplitToController)}</select>
          </label>
          <div class="map-node">
            <span>Controller</span>
            <strong>${index + 1}</strong>
          </div>
          ${guideStepNavMarkup(stepId)}
        </div>
      `;
    }

    return `
      <div id="controller-${index + 1}-power" class="wire-map guide-step ${stepClass}" data-guide-step-id="${stepId}">
        ${fieldInstruction("Enter the actual power wire distance from the power box to this controller, then choose the power wire gauge.", "primary")}
        <div class="map-node">
          <span>Power box</span>
          <strong>LU-PH3</strong>
        </div>
        <label class="map-field">
          <span>Distance from power box to controller</span>
          <div class="input-with-unit">
            <input class="distance-input" data-path="controllers.${index}.distancePowerToController" type="number" min="0" max="500" step="0.1" value="${controller.distancePowerToController}">
            <span>ft</span>
          </div>
        </label>
        <label class="map-field">
          <span>Power wire size to controller</span>
          <select data-path="controllers.${index}.wireSizePowerToController">${optionMarkup(POWER_WIRE_SIZES, controller.wireSizePowerToController)}</select>
        </label>
        <div class="map-node">
          <span>Controller</span>
          <strong>${index + 1}</strong>
        </div>
        ${guideStepNavMarkup(stepId)}
      </div>
    `;
  }

  function renderTapeSplitFields(controller) {
    const index = controller.controllerIndex;
    if (!controllerUsesTapeSplit(controller)) return "";

    const style = controllerWiringStyle(controller);
    const instruction =
      style === "series-parallel"
        ? `Enter the shared control wire distance from the controller to the branch point. This uses ${controlCableConductorCount(
            controller.tape
          )}-conductor 22 AWG control wire.`
        : `Enter the shared control wire distance before the tape runs split. This uses ${controlCableConductorCount(
            controller.tape
          )}-conductor 22 AWG control wire.`;

    return `
      <div id="controller-${index + 1}-tape-split" class="wire-map">
        ${fieldInstruction(instruction)}
        <div class="map-node">
          <span>Controller</span>
          <strong>${index + 1}</strong>
        </div>
        <label class="map-field">
          <span>${style === "series-parallel" ? "Distance from controller to branch point" : "Shared distance before tape runs split"}</span>
          <div class="input-with-unit">
            <input class="distance-input" data-path="controllers.${index}.distanceControllerToTapeSplit" type="number" min="0" max="500" step="0.1" value="${controller.distanceControllerToTapeSplit}">
            <span>ft</span>
          </div>
        </label>
        ${controlWireTypeField(
          controller.tape,
          controller.wireSizeControllerToTapeSplit,
          `controllers.${index}.wireSizeControllerToTapeSplit`
        )}
        <div class="map-node">
          <span>${style === "series-parallel" ? "Branch point" : "Split"}</span>
          <strong>${style === "series-parallel" ? "To branches" : "To tape runs"}</strong>
        </div>
      </div>
    `;
  }

  function runDistanceFieldConfig(controller, run) {
    const style = controllerWiringStyle(controller);
    const position = seriesRunIndex(controller, run);

    if (style === "series") {
      return position === 0
        ? {
            fromNode: `Controller ${controller.controllerIndex + 1}`,
            distanceLabel: "Distance from controller to first tape",
            distancePath: "distanceControllerToTapeStart",
            farEndDistanceLabel: "Distance from controller to far end"
          }
        : {
            fromNode: "Previous tape",
            distanceLabel: "Wire distance from previous tape to this tape",
            distancePath: "distancePreviousToTapeStart",
            farEndDistanceLabel: "Distance from controller to far end"
          };
    }

    if (style === "series-parallel") {
      return position === 0
        ? {
            fromNode: "Branch point",
            distanceLabel: "Distance from branch point to first tape",
            distancePath: "distanceSplitToTapeStart",
            farEndDistanceLabel: "Distance from branch point to far end"
          }
        : {
            fromNode: "Previous tape",
            distanceLabel: "Wire distance from previous tape to this tape",
            distancePath: "distancePreviousToTapeStart",
            farEndDistanceLabel: "Distance from branch point to far end"
          };
    }

    return controller.tapeMode === "shared"
      ? {
          fromNode: "Tape split",
          distanceLabel: "Distance from tape split to tape start",
          distancePath: "distanceSplitToTapeStart",
          farEndDistanceLabel: "Distance from tape split to far end"
        }
      : {
          fromNode: `Controller ${controller.controllerIndex + 1}`,
          distanceLabel: "Distance from controller to tape start",
          distancePath: "distanceControllerToTapeStart",
          farEndDistanceLabel: "Distance from controller to far end"
        };
  }

  function seriesRunSetupFields(controller, run, basePath, runCount) {
    const style = controllerWiringStyle(controller);
    if (!isSeriesWiring(controller)) return "";

    const branchField =
      style === "series-parallel"
        ? `
          <label>
            <span>Branch</span>
            <select data-path="${basePath}.seriesBranchIndex">${seriesBranchOptions(run.seriesBranchIndex, runCount)}</select>
          </label>
        `
        : "";

    return `
      <div class="series-run-setup">
        ${branchField}
        <label>
          <span>Order in ${style === "series-parallel" ? "branch" : "chain"}</span>
          <select data-path="${basePath}.seriesPosition">${seriesPositionOptions(run.seriesPosition, runCount)}</select>
        </label>
      </div>
    `;
  }

  function renderRun(controller, run, runIndex, result) {
    const controllerIndex = controller.controllerIndex;
    const distanceConfig = runDistanceFieldConfig(controller, run);
    const specCheckLengthFt = Math.max(0, number(result?.specCheckLengthFt ?? run.specCheckLengthFt ?? run.tapeLength));
    const specCheckName = result?.specCheckName || run.specCheckName || (isSeriesWiring(controller) ? "series branch" : "tape run");
    const farEndFields = run.feedBothEnds
      ? `
        <div class="far-end-fields">
          <label class="map-field">
            <span>${labelWithHelp(distanceConfig.farEndDistanceLabel)}</span>
            <div class="input-with-unit">
              <input class="distance-input" data-path="controllers.${controllerIndex}.runs.${runIndex}.farEndDistance" type="number" min="0" max="500" step="0.1" value="${run.farEndDistance}">
              <span>ft</span>
            </div>
          </label>
          ${controlWireTypeField(
            controller.tape,
            run.farEndWireSize || run.wireSizeToTapeStart,
            `controllers.${controllerIndex}.runs.${runIndex}.farEndWireSize`
          )}
        </div>
      `
      : "";
    const modeText = run.feedBothEnds
      ? `Modeled as two ${ft(run.tapeLength / 2)} feeds from opposite ends.`
      : `Feed both ends when this ${specCheckName} is over ${ft(controller.tape.dualEndRecommendedOverFt || FULL_REEL_FT)}. Current ${specCheckName}: ${ft(specCheckLengthFt)}.`;

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
          <label class="switch compact dual-feed-check">
            <input data-path="controllers.${controllerIndex}.runs.${runIndex}.feedBothEnds" type="checkbox" ${
      run.feedBothEnds ? "checked" : ""
    }>
            <span>Feed this tape from both ends</span>
            ${dualFeedThumbnail()}
          </label>
        </div>
        <div class="wire-map run">
          ${fieldInstruction(
            `Enter the actual control wire distance to this tape run. This uses ${controlCableConductorCount(
              controller.tape
            )}-conductor 22 AWG control wire.`
          )}
          <div class="map-node">
            <span>${distanceConfig.fromNode}</span>
            <strong>To ${escapeHtml(run.runName)}</strong>
          </div>
          <label class="map-field">
            <span>${distanceConfig.distanceLabel}</span>
            <div class="input-with-unit">
              <input class="distance-input" data-path="controllers.${controllerIndex}.runs.${runIndex}.${distanceConfig.distancePath}" type="number" min="0" max="500" step="0.1" value="${run[distanceConfig.distancePath]}">
              <span>ft</span>
            </div>
          </label>
          ${controlWireTypeField(
            controller.tape,
            run.wireSizeToTapeStart,
            `controllers.${controllerIndex}.runs.${runIndex}.wireSizeToTapeStart`
          )}
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
    const sourceRun = run && typeof run === "object" ? run : {};
    const safeGlobalRunIndex = Math.max(0, Math.round(number(sourceRun.globalRunIndex ?? 0)));
    const safeDefaultRunName = sourceRun.defaultRunName || `Tape Run ${safeGlobalRunIndex + 1}`;
    const safeControllerIndex = Math.min(
      MAX_CONTROLLERS - 1,
      Math.max(0, Math.round(number(sourceRun.controllerIndex ?? 0)))
    );
    const controller = result.controllers[safeControllerIndex] || result.controllers[0] || {
      tapeMode: "direct",
      tape: tapeTypeById[state.tapeType] || tapeTypes[0]
    };
    run = {
      ...blankRun(),
      ...sourceRun,
      controllerIndex: safeControllerIndex,
      globalRunIndex: safeGlobalRunIndex,
      defaultRunName: safeDefaultRunName,
      runName: sourceRun.runName || String(sourceRun.customName || "").trim() || safeDefaultRunName,
      runLetter: sourceRun.runLetter || RUN_NAMES[safeGlobalRunIndex] || String(safeGlobalRunIndex + 1),
      tapeLength: Math.max(0, number(sourceRun.tapeLength)),
      zoneIndex: Math.min(state.zoneCount - 1, Math.max(0, Math.round(number(sourceRun.zoneIndex ?? 0)))),
      fadeAtTapeStartPct: Math.max(0, number(sourceRun.fadeAtTapeStartPct)),
      visibleRunFadePct: Math.max(0, number(sourceRun.visibleRunFadePct)),
      startStatus: sourceRun.startStatus || { label: "No tape", level: "neutral" },
      runStatus: sourceRun.runStatus || { label: "No tape", level: "neutral" },
      specStatus: sourceRun.specStatus || { label: "No tape", level: "neutral" },
      controlCableStatus: sourceRun.controlCableStatus || { label: "Control", level: "neutral" },
      runOverallStatus: sourceRun.runOverallStatus || { label: "Ready", level: "neutral" },
      specCheckLengthFt: Math.max(0, number(sourceRun.specCheckLengthFt ?? sourceRun.tapeLength)),
      specCheckName: sourceRun.specCheckName || "tape run",
      dualFeedSuggested: Boolean(sourceRun.dualFeedSuggested),
      showDualFeedCallout: Boolean(sourceRun.showDualFeedCallout),
      distanceGuidance: sourceRun.distanceGuidance || {
        goodTotalPathFt: 0,
        maxTotalPathFt: 0,
        plannedTotalPathFt: 0,
        plannedPowerCableFt: 0,
        plannedControlCableFt: 0,
        plannedControlPathFt: 0,
        powerSpecLimitFt: 0,
        controlSpecLimitFt: 0,
        powerWireSize: DEFAULT_POWER_WIRE_SIZE,
        controlWireSize: DEFAULT_CONTROL_WIRE_SIZE
      }
    };
    const basePath = `tapeRuns.${run.globalRunIndex}`;
    const distanceConfig = runDistanceFieldConfig(controller, run);
    const distanceGuidance = run.distanceGuidance;
    const dualSuggestion =
      run.showDualFeedCallout
        ? `<span class="field-callout warn">Suggested by spec for this ${escapeHtml(run.specCheckName)} (${ft(run.specCheckLengthFt)})</span>`
        : "";
    const farEndFields = run.feedBothEnds
      ? `
        <div class="far-end-fields">
          <label class="map-field">
            <span>${labelWithHelp(distanceConfig.farEndDistanceLabel)}</span>
            <div class="input-with-unit">
              <input class="distance-input" data-path="${basePath}.farEndDistance" type="number" min="0" max="500" step="0.1" value="${run.farEndDistance}">
              <span>ft</span>
            </div>
          </label>
          ${controlWireTypeField(controller.tape, run.farEndWireSize || run.wireSizeToTapeStart, `${basePath}.farEndWireSize`)}
        </div>
      `
      : "";
    const summaryParts = [run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "Add tape length"];

    return `
      <details id="controller-${run.controllerIndex + 1}-run-${run.runLetter}" class="run-card installer-run-card" data-tape-run-index="${run.globalRunIndex}" open>
        <summary class="installer-run-summary">
          <span class="summary-title">
            <span class="section-kicker">${escapeHtml(run.defaultRunName)}</span>
            <span class="summary-heading">${escapeHtml(run.runName)}</span>
            <span class="run-summary-line">${summaryParts.map(escapeHtml).join(" · ")}</span>
          </span>
          <span class="run-status-slot">${pill(run.runOverallStatus)}</span>
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
              <span>Controller</span>
              <select data-path="${basePath}.zoneIndex">${zoneOptions(run.zoneIndex, state.zoneCount)}</select>
            </label>
            ${seriesRunSetupFields(controller, run, basePath, controller.runResults?.length || state.tapeRuns.length)}
            <button type="button" class="secondary compact-button" data-run-action="remove" data-run-index="${run.globalRunIndex}">
              <span>Remove run</span>
            </button>
          </div>

          <div class="distance-guide">
            ${resultChip("Power table reference", `${ft(distanceGuidance.powerSpecLimitFt)} using ${distanceGuidance.powerWireSize} AWG`)}
            ${resultChip("Calculated path check", `${pct(run.fadeAtTapeStartPct)} light loss at tape start`, run.startStatus)}
          </div>

          <label class="checkbox-line dual-feed-check">
            <input data-path="${basePath}.feedBothEnds" type="checkbox" ${run.feedBothEnds ? "checked" : ""}>
            <span>Feed this tape from both ends</span>
            ${dualFeedThumbnail()}
          </label>
          ${dualSuggestion}

          <div class="wire-map run installer-distance-map">
            ${fieldInstruction(
              `Enter the actual control wire distance to this tape run. This uses ${controlCableConductorCount(
                controller.tape
              )}-conductor 22 AWG control wire.`
            )}
            <div class="map-node">
              <span>${distanceConfig.fromNode}</span>
              <strong>To tape</strong>
            </div>
            <label class="map-field">
              <span>${distanceConfig.distanceLabel}</span>
              <div class="input-with-unit">
                <input class="distance-input" data-path="${basePath}.${distanceConfig.distancePath}" type="number" min="0" max="500" step="0.1" value="${run[distanceConfig.distancePath]}">
                <span>ft</span>
              </div>
            </label>
            ${controlWireTypeField(controller.tape, run.wireSizeToTapeStart, `${basePath}.wireSizeToTapeStart`)}
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

  function updateTapeRunCardSummaries(result) {
    result.tapeRunResults.forEach((run) => {
      const card = els.tapeRuns.querySelector(`[data-tape-run-index="${run.globalRunIndex}"]`);
      if (!card) return;

      const defaultName = card.querySelector("summary .section-kicker");
      const runName = card.querySelector("summary .summary-heading");
      const summaryLine = card.querySelector("summary .run-summary-line");
      const statusSlot = card.querySelector("summary .run-status-slot");

      card.id = `controller-${run.controllerIndex + 1}-run-${run.runLetter}`;
      if (defaultName) defaultName.textContent = run.defaultRunName;
      if (runName) runName.textContent = run.runName;
      if (summaryLine) summaryLine.textContent = run.tapeLength > 0 ? `${ft(run.tapeLength)} tape` : "Add tape length";
      if (statusSlot) statusSlot.innerHTML = pill(run.runOverallStatus);
    });
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
        const stepId = `tape-run-${run.globalRunIndex}`;
        const distanceConfig = runDistanceFieldConfig(controller, run);
        const dualSuggestion =
          run.showDualFeedCallout
            ? `<span class="field-callout warn">Suggested by spec for this ${escapeHtml(run.specCheckName)} (${ft(run.specCheckLengthFt)})</span>`
            : "";
        const farEndFields = run.feedBothEnds
          ? `
            <div class="far-end-fields">
              <label class="map-field">
                <span>${labelWithHelp(distanceConfig.farEndDistanceLabel)}</span>
                <div class="input-with-unit">
                  <input class="distance-input" data-path="${basePath}.farEndDistance" type="number" min="0" max="500" step="0.1" value="${run.farEndDistance}">
                  <span>ft</span>
                </div>
              </label>
          ${controlWireTypeField(controller.tape, run.farEndWireSize || run.wireSizeToTapeStart, `${basePath}.farEndWireSize`)}
            </div>
          `
          : "";

        return `
          <section id="fine-controller-${controller.controllerIndex + 1}-run-${run.globalRunIndex + 1}" class="fine-tune-run guide-step ${guideStepClass(
            stepId
          )}" data-guide-step-id="${stepId}">
            <div class="fine-tune-run-top">
              <div>
                <strong>${escapeHtml(run.runName)}</strong>
                <span>${ft(run.tapeLength)} tape</span>
              </div>
              ${pill(run.runOverallStatus)}
            </div>
            <div class="dual-feed-row">
              <label class="checkbox-line dual-feed-check">
                <input data-path="${basePath}.feedBothEnds" type="checkbox" ${run.feedBothEnds ? "checked" : ""}>
                <span>Feed this tape from both ends</span>
                ${dualFeedThumbnail()}
              </label>
              ${dualSuggestion}
            </div>
            ${seriesRunSetupFields(controller, run, basePath, runs.length)}
            <div class="wire-map run installer-distance-map">
              ${fieldInstruction(
                `Enter the actual control wire distance to this tape run. This uses ${controlCableConductorCount(
                  controller.tape
                )}-conductor 22 AWG control wire.`
              )}
              <div class="map-node">
                <span>${distanceConfig.fromNode}</span>
                <strong>To tape</strong>
              </div>
              <label class="map-field">
                <span>${distanceConfig.distanceLabel}</span>
                <div class="input-with-unit">
                  <input class="distance-input" data-path="${basePath}.${distanceConfig.distancePath}" type="number" min="0" max="500" step="0.1" value="${run[distanceConfig.distancePath]}">
                  <span>ft</span>
                </div>
              </label>
              ${controlWireTypeField(controller.tape, run.wireSizeToTapeStart, `${basePath}.wireSizeToTapeStart`)}
              ${farEndFields}
            </div>
            <div class="distance-guide">
              ${resultChip("Power table reference", `${ft(run.distanceGuidance.powerSpecLimitFt)} using ${run.distanceGuidance.powerWireSize} AWG`)}
              ${resultChip("Calculated path check", `${pct(run.fadeAtTapeStartPct)} light loss at tape start`, run.startStatus)}
            </div>
            ${guideStepNavMarkup(stepId)}
          </section>
        `;
      })
      .join("");
    const activeStep = activeFineTuneStep();
    const hideFineTuneRuns =
      Boolean(activeStep) && !(activeStep.type === "tape-run" && activeStep.controllerIndex === controller.controllerIndex);

    return `
      <div class="fine-tune-runs guide-step-group ${hideFineTuneRuns ? "is-guide-collapsed" : ""}">
        <div class="fine-tune-heading">
          <strong>Control wire distances</strong>
          <span>Enter the actual shared trunks, branches, jumpers, and back-feed distances. The tool checks voltage drop along each path; installed control wire total is shown for ordering.</span>
        </div>
        ${runCards}
      </div>
    `;
  }

  function wiringStyleOptionsMarkup(controller, index) {
    const style = controllerWiringStyle(controller);
    const seriesParallelCard = supportsSeriesParallel(controller)
      ? `
        <label class="wiring-style-choice">
          <input data-path="controllers.${index}.wiringStyle" type="radio" name="wiringStyle${index}" value="series-parallel" ${
            style === "series-parallel" ? "checked" : ""
          }>
          <span class="control-choice-copy">
            <strong>Series-Parallel</strong>
            <span>The controller splits into branches, and at least one branch is chained end-to-end.</span>
          </span>
          <img
            class="wiring-style-image"
            src="assets/series-parallel.png"
            alt="Series-parallel tape runs from one wireless controller"
            data-zoom-image="assets/series-parallel.png"
            data-zoom-title="Series-Parallel tape runs"
            role="button"
            tabindex="0"
          >
        </label>
      `
      : "";
    return `
      <div class="segmented wiring-style-options" role="radiogroup" aria-label="Tape install style">
        <label class="wiring-style-choice">
          <input data-path="controllers.${index}.wiringStyle" type="radio" name="wiringStyle${index}" value="series" ${
      style === "series" ? "checked" : ""
    }>
          <span class="control-choice-copy">
            <strong>Series (end to end)</strong>
            <span>One tape run feeds the next with wire jumpers between runs.</span>
          </span>
          <img
            class="wiring-style-image"
            src="assets/series.png"
            alt="Series end-to-end tape runs from one wireless controller"
            data-zoom-image="assets/series.png"
            data-zoom-title="Series end-to-end tape runs"
            role="button"
            tabindex="0"
          >
        </label>
        <label class="wiring-style-choice">
          <input data-path="controllers.${index}.wiringStyle" type="radio" name="wiringStyle${index}" value="parallel" ${
      style === "parallel" ? "checked" : ""
    }>
          <span class="control-choice-copy">
            <strong>Parallel</strong>
            <span>Each tape run starts from the controller or from a split.</span>
          </span>
          <img
            class="wiring-style-image"
            src="assets/parallel.png"
            alt="Parallel tape runs from one wireless controller"
            data-zoom-image="assets/parallel.png"
            data-zoom-title="Parallel tape runs"
            role="button"
            tabindex="0"
          >
        </label>
        ${seriesParallelCard}
      </div>
    `;
  }

  function parallelTapeModeOptionsMarkup(controller, index) {
    return `
      <div class="control-subchoice">
        <strong>For parallel wiring, do these tape runs share wire before they split?</strong>
        <span>Choose separate unless multiple runs share the same control wire before branching.</span>
      </div>
      <div class="segmented control-wire-options" role="radiogroup" aria-label="Parallel tape wiring type">
        <label class="control-wire-choice">
          <input data-path="controllers.${index}.tapeMode" type="radio" name="tapeMode${index}" value="direct" ${
      controller.tapeMode === "direct" ? "checked" : ""
    }>
          <span class="control-choice-copy">
            <strong>No, separate wire to each tape run</strong>
            <span>Each tape run gets its own control wire from the controller.</span>
          </span>
          <img
            class="control-choice-image"
            src="assets/separate-control.png"
            alt="Separate control wires from wireless controller to each LED tape run"
            data-zoom-image="assets/separate-control.png"
            data-zoom-title="Separate wire to each tape run"
            role="button"
            tabindex="0"
          >
        </label>
        <label class="control-wire-choice">
          <input data-path="controllers.${index}.tapeMode" type="radio" name="tapeMode${index}" value="shared" ${
      controller.tapeMode === "shared" ? "checked" : ""
    }>
          <span class="control-choice-copy">
            <strong>Yes, shared wire then split</strong>
            <span>One trunk wire leaves the controller, then branches to the tape runs.</span>
          </span>
          <img
            class="control-choice-image"
            src="assets/shared-control.png"
            alt="Shared control trunk wire that branches to LED tape runs"
            data-zoom-image="assets/shared-control.png"
            data-zoom-title="Shared wire, then split"
            role="button"
            tabindex="0"
          >
        </label>
      </div>
    `;
  }

  function seriesBranchOptions(selected, runCount) {
    const count = Math.max(2, Math.min(MAX_RUNS, runCount || 2));
    return Array.from({ length: count }, (_, index) => {
      const selectedAttr = index === Math.round(number(selected)) ? " selected" : "";
      return `<option value="${index}"${selectedAttr}>Branch ${index + 1}</option>`;
    }).join("");
  }

  function seriesPositionOptions(selected, runCount) {
    const count = Math.max(2, Math.min(MAX_RUNS, runCount || 2));
    return Array.from({ length: count }, (_, index) => {
      const selectedAttr = index === Math.round(number(selected)) ? " selected" : "";
      const suffix = index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th";
      return `<option value="${index}"${selectedAttr}>${index + 1}${suffix}</option>`;
    }).join("");
  }

  function renderControllerPlacement(controller, recommendation) {
    const index = controller.controllerIndex;
    const isCollapsed = collapsedControllers.has(index);
    const assignedCount = controller.assignedRunCount || controller.runResults.length;
    const guidedStep = activeFineTuneStep();
    const isGuidedController = !guidedStep || guidedStep.controllerIndex === index;
    const shouldOpen = !isCollapsed && isGuidedController && (assignedCount > 0 || guidedStep?.controllerIndex === index);
    const assignedText = `${assignedCount} ${assignedCount === 1 ? "run" : "runs"} assigned`;
    const statusText = controller.enabled ? `${ft(controller.totalTapeLength)} tape` : assignedText;
    const showPowerAssignment = (recommendation.powerSupplyCount || 1) > 1;
    const showTapeSplitQuestion = activeRunCountForController(controller) >= 2;
    const tapeSplitStepId = `tape-split-${index}`;
    const powerAssignmentField = showPowerAssignment
      ? `
        <label>
          <span>Powered by</span>
          <select data-path="controllers.${index}.powerSupplyIndex">${powerSupplyOptions(
            controller.powerSupplyIndex,
            recommendation.powerSupplyCount
          )}</select>
          <small class="field-help">Choose which 96 W power supply feeds this controller. Max ${MAX_CONTROLLERS_PER_POWER_SUPPLY} controllers per power supply.</small>
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
            <span>${assignedText}</span>
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

          ${
            showTapeSplitQuestion
              ? `
          <div id="controller-${index + 1}-tape-wiring" class="advanced-card installer-advanced visible-wiring-choice guide-step ${guideStepClass(
              tapeSplitStepId
            )}" data-guide-step-id="${tapeSplitStepId}">
            <div class="advanced-top">
              <div class="advanced-title">
                <strong>How are these tape runs installed from this controller?</strong>
                <span>This setting only applies to Controller ${index + 1}; each controller can use a different layout.</span>
              </div>
              ${wiringStyleOptionsMarkup(controller, index)}
            </div>
            ${controllerWiringStyle(controller) === "parallel" ? parallelTapeModeOptionsMarkup(controller, index) : ""}
            ${controllerUsesTapeSplit(controller) ? renderTapeSplitFields(controller) : ""}
            ${guideStepNavMarkup(tapeSplitStepId)}
          </div>
          `
              : ""
          }

          ${renderControllerRunFineTune(controller)}
        </div>
      </details>
    `;
  }

  function renderController(controller) {
    const index = controller.controllerIndex;
    const statusText = controller.enabled ? `${ft(controller.totalTapeLength)} tape` : "Disabled";
    const isCollapsed = collapsedControllers.has(index);
    const showTapeSplitQuestion = activeRunCountForController(controller) >= 2;
    const tapeSplitStepId = `tape-split-${index}`;
    const guidedStep = activeFineTuneStep();
    const isGuidedController = !guidedStep || guidedStep.controllerIndex === index;
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

          ${
            showTapeSplitQuestion
              ? `
          <div id="controller-${index + 1}-tape-wiring" class="advanced-card visible-wiring-choice guide-step ${guideStepClass(
              tapeSplitStepId
            )}" data-guide-step-id="${tapeSplitStepId}">
            <div class="advanced-top">
              <div class="advanced-title">
                <strong>How are these tape runs installed from this controller?</strong>
                <span>This setting only applies to Controller ${index + 1}; each controller can use a different layout.</span>
              </div>
              ${wiringStyleOptionsMarkup(controller, index)}
            </div>
            ${controllerWiringStyle(controller) === "parallel" ? parallelTapeModeOptionsMarkup(controller, index) : ""}
            ${controllerUsesTapeSplit(controller) ? renderTapeSplitFields(controller) : ""}
            ${guideStepNavMarkup(tapeSplitStepId)}
          </div>
          `
              : ""
          }

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
      !isCollapsed && isGuidedController ? "open" : ""
    }>
        <summary class="controller-top controller-summary">
          <label class="switch" onclick="event.stopPropagation()">
            <input data-path="controllers.${index}.enabled" type="checkbox" ${controller.enabled ? "checked" : ""}>
            <span>Use controller ${index + 1}</span>
          </label>
          <div class="controller-title">
            <strong>${controller.tape.label}</strong>
            <span>${controller.tape.detail}</span>
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
    if (!els.statusStrip) return;

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
    const controllers = result.controllers.filter((controller) => controller.enabled && controller.totalTapeLength > 0);

    if (!controllers.length) return "Add tape runs to see distance guidance.";

    return controllers
      .map((controller) => {
        const activeRuns = controller.runResults.filter((run) => run.tapeLength > 0);
        const longestControlPath = Math.max(
          0,
          ...activeRuns.map((run) => number(run.distanceGuidance?.plannedControlPathFt))
        );
        const worstStartFade = Math.max(0, ...activeRuns.map((run) => number(run.fadeAtTapeStartPct)));
        return `
          <span>
            <strong>Controller ${controller.controllerIndex + 1}</strong>
            Power path: ${ft(controller.powerCableDistanceFt)} installed.
            Control: ${ft(controller.controlCableDistanceFt)} installed, ${ft(longestControlPath)} longest checked path.
            Worst start loss: ${pct(worstStartFade)}.
          </span>
        `;
      })
      .join("");
  }

  function wireSummaryHtml(totalLength, lengths, emptyText) {
    if (!totalLength) return `<strong>0 ft</strong><div class="metric-detail-list">${escapeHtml(emptyText)}</div>`;

    const details = lengths
      .map(
        (item) => `
          <span><strong>${escapeHtml(item.label || `${item.wireSize} AWG`)}</strong>${ft(item.length)}</span>
        `
      )
      .join("");

    return `<strong>${ft(totalLength)}</strong><div class="metric-detail-list">${details}</div>`;
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

  function issueReportUrl(liveResult, recommendation, result) {
    const activeIssues = liveResult.issues.filter((item) => item.level === "warn" || item.level === "fail");
    const runLines = result.tapeRunResults
      .filter((run) => run.tapeLength > 0)
      .map(
        (run) =>
          `- ${run.defaultRunName}: ${run.runName}; ${ft(run.tapeLength)}; Controller ${run.controllerIndex + 1}; ${run.feedBothEnds ? "dual-ended" : "single-ended"}; ${pct(run.fadeAtTapeStartPct)} start loss; ${run.runOverallStatus?.label || "No status"}`
      );
    const controllerLines = result.controllers
      .filter((controller) => controller.enabled)
      .map(
        (controller) =>
          `- Controller ${controller.controllerIndex + 1}: Power Supply ${Math.round(number(controller.powerSupplyIndex || 0)) + 1}; ${controllerWiringStyle(controller)}; ${ft(controller.totalTapeLength)} tape; ${watts(controller.tapePowerW)}; ${ft(controller.powerCableDistanceFt)} power wire`
      );
    const supplyLines = result.interfaceTapeLimits.map(
      (supply) =>
        `- Power Supply ${supply.interfaceIndex + 1}: Controllers ${supply.controllerNumbers.join(", ") || "none"}; ${ft(supply.totalTapeLength)} tape; ${watts(supply.powerW)}`
    );
    const issueLines = activeIssues.map((item) => `- [${item.level.toUpperCase()}] ${item.title}: ${item.detail}`);

    let body = [
      "## What happened?",
      "Please describe the issue here.",
      "",
      "## Expected result",
      "Please describe what you expected the tool to show.",
      "",
      "## Tool snapshot",
      `- App version: ${APP_VERSION}`,
      `- Project name: ${state.projectName || "(blank)"}`,
      `- Product: ${recommendation.tape.label}`,
      `- Overall result: ${liveResult.overall}`,
      `- Total tape: ${ft(liveResult.totalTapeLength)}`,
      `- Estimated load: ${watts(liveResult.powerW)}`,
      `- Power feed mode: ${state.powerMode}`,
      `- Suggested power supplies: ${recommendation.powerSupplyCount}`,
      `- Suggested controllers: ${recommendation.controllerCount}`,
      "",
      "## Current warnings / fixes",
      issueLines.length ? issueLines.join("\n") : "- None",
      "",
      "## Tape runs",
      runLines.length ? runLines.join("\n") : "- No tape runs entered",
      "",
      "## Controllers",
      controllerLines.length ? controllerLines.join("\n") : "- No controllers in use",
      "",
      "## Power supplies",
      supplyLines.length ? supplyLines.join("\n") : "- No power supplies in use",
      "",
      "## Browser",
      `- URL: ${window.location.href}`,
      `- Viewport: ${window.innerWidth || 0} x ${window.innerHeight || 0}`,
      `- User agent: ${window.navigator.userAgent || "unknown"}`,
      "",
      "Optional: attach a saved project JSON file if the issue is hard to reproduce."
    ].join("\n");

    if (body.length > 6000) {
      body = `${body.slice(0, 5900)}\n\n[Report truncated by the tool. Please attach a saved project JSON file if needed.]`;
    }

    const titleContext = recommendation.activeRunCount
      ? `${recommendation.tape.label}, ${ft(liveResult.totalTapeLength)}`
      : "new issue";
    const params = new URLSearchParams({
      title: `TRACE Tool bug: ${titleContext}`,
      body
    });
    return `${GITHUB_ISSUE_URL}?${params.toString()}`;
  }

  function updateIssueReportLinks(liveResult, recommendation, result) {
    const href = issueReportUrl(liveResult, recommendation, result);
    els.issueReportLinks.forEach((link) => {
      link.href = href;
      link.setAttribute("aria-label", `Report an issue on GitHub for ${liveResult.overall}`);
    });
  }

  function renderLiveResults(result, recommendation = buildRecommendation(state)) {
    const liveResult = buildLivePlan(result, recommendation);
    currentLiveLevel = liveResult.level;
    setLiveAnswerPanelLevel(liveResult.level);

    renderStatusStrip(liveResult);
    renderRecommendedSystemMap(recommendation, result);
    renderSuggestedSystem(recommendation, result);
    updateIssueReportLinks(liveResult, recommendation, result);

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
      ["Default power wire", `${DEFAULT_POWER_WIRE_SIZE} AWG`],
      ["Default control wire", controlCableLabel(recommendation.tape, DEFAULT_CONTROL_WIRE_SIZE)]
    ]
      .map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`)
      .join("");
    const wireLengthHtml = `
      <div class="metric-row metric-row-stack">
        <span>Power wire being spec'd</span>
        ${wireSummaryHtml(result.totalPowerWireLength, result.powerWireLengths, "Add power distances to spec power wire.")}
      </div>
      <div class="metric-row metric-row-stack">
        <span>Control wire being spec'd</span>
        ${wireSummaryHtml(result.totalControlWireLength, result.controlWireLengths, "Add control distances to spec control wire.")}
      </div>
    `;
    const wireGuidanceHtml = `
      <div class="metric-row metric-row-stack">
        <span>Power and control distance guidance</span>
        <div class="metric-detail-list">${wireDistanceGuidanceHtml(result)}</div>
      </div>
    `;

    const fixIssues = liveResult.issues.filter((item) => item.level === "warn" || item.level === "fail");
    const issuesHtml = `<div class="issue-list">${fixIssues
      .map(
        (item) =>
          `<div class="issue ${item.level}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(
            item.detail
          )}</span></div>`
      )
      .join("")}</div>`;

    els.summaryMetrics.innerHTML = metricsHtml + wireLengthHtml + wireGuidanceHtml;
    els.mobileSummaryMetrics.innerHTML = metricsHtml + wireLengthHtml + wireGuidanceHtml;
    els.issueList.innerHTML = issuesHtml;
    els.mobileIssueList.innerHTML = issuesHtml;
    const hasFixes = fixIssues.length > 0;
    if (els.issueSection) els.issueSection.hidden = !hasFixes;
    if (els.mobileIssueSection) els.mobileIssueSection.hidden = !hasFixes;
  }

  function setLiveAnswerPanelLevel(level) {
    const statusClass = {
      ok: "live-status-ok",
      warn: "live-status-warn",
      fail: "live-status-fail",
      neutral: "live-status-neutral"
    }[level] || "live-status-neutral";
    const statusClasses = ["live-status-ok", "live-status-warn", "live-status-fail", "live-status-neutral"];

    els.livePanels.forEach((panel) => {
      panel.classList.remove(...statusClasses);
      panel.classList.add(statusClass);
    });
  }

  function currentRenderData() {
    normalizeState(state);
    let recommendation = buildRecommendation(state);
    if (powerFeedControllerCount(state, recommendation) <= 1 && state.powerMode === "shared") {
      state.powerMode = "separate";
    }
    if (recommendation.powerSupplyCount <= 1) {
      state.controllers.forEach((controller) => {
        controller.powerSupplyIndex = 0;
        controller.powerSupplyIndexAuto = true;
      });
    }
    const assignmentChanged = applyRecommendedControllerDefaults(state, recommendation);
    if (assignmentChanged) {
      recommendation = buildRecommendation(state);
    }
    const seriesPositionChanged = applySeriesPositionDefaults(state);
    let result = evaluate(state);
    const tapeModeChanged = applySingleRunTapeModeDefaults(state, result);
    if (tapeModeChanged) {
      applySeriesPositionDefaults(state);
      result = evaluate(state);
    }
    const distanceChanged = applyRecommendedDistanceDefaults(state, result);
    if (assignmentChanged || seriesPositionChanged || tapeModeChanged || distanceChanged) {
      result = evaluate(state);
    }

    return { result, recommendation };
  }

  function refreshLiveResults() {
    const { result, recommendation } = currentRenderData();
    currentLiveLevel = buildLivePlan(result, recommendation).level;
    syncFineTuneSteps(result, recommendation);
    syncPowerFeedControls(result, recommendation);
    syncControllerAssignmentFields();
    renderLiveResults(result, recommendation);
    updateTapeRunCardSummaries(result);
    if (!els.controllers.contains(document.activeElement)) {
      renderControllerPlacements(result, recommendation);
    }
    updateWizardSteps();
    renderPresetButtons();
  }

  function syncControllerAssignmentFields() {
    if (els.zoneCountInput && document.activeElement !== els.zoneCountInput) {
      els.zoneCountInput.value = state.zoneCount;
    }

    state.tapeRuns.forEach((run, index) => {
      const select = els.tapeRuns.querySelector(`select[data-path="tapeRuns.${index}.zoneIndex"]`);
      if (!select || document.activeElement === select) return;

      const nextMarkup = zoneOptions(run.zoneIndex, state.zoneCount);
      if (select.innerHTML !== nextMarkup) {
        select.innerHTML = nextMarkup;
      }
      select.value = String(run.zoneIndex);
    });
  }

  function syncPowerFeedControls(result, recommendation) {
    const isPowerFeedNeeded = powerFeedControllerCount(state, recommendation, result) > 1;
    const hideForGuide = Boolean(activeFineTuneStepId && activeFineTuneStepId !== "power-feed");

    document.querySelectorAll("input[name='powerMode']").forEach((input) => {
      input.checked = input.value === state.powerMode;
    });
    if (els.powerFeedCard) {
      els.powerFeedCard.hidden = !isPowerFeedNeeded || hideForGuide;
      els.powerFeedCard.classList.toggle("is-guide-active", activeFineTuneStepId === "power-feed");
      els.powerFeedCard.classList.toggle("is-guide-collapsed", Boolean(activeFineTuneStepId && activeFineTuneStepId !== "power-feed"));
    }
    renderPowerFeedGuideNav();
  }

  function render() {
    const { result, recommendation } = currentRenderData();
    currentLiveLevel = buildLivePlan(result, recommendation).level;
    syncFineTuneSteps(result, recommendation);

    els.projectName.value = state.projectName;
    els.tapeTypeSelect.innerHTML = optionMarkup(tapeTypes, state.tapeType);
    els.runCountInput.value = state.tapeRuns.length;
    els.zoneCountInput.value = state.zoneCount;
    syncPowerFeedControls(result, recommendation);

    renderSharedPowerFields();
    renderLiveResults(result, recommendation);
    renderTapeRuns(result);
    updateWizardSteps();
    renderPresetButtons();
    renderControllerPlacements(result, recommendation);
  }

  function renderControllerPlacements(result, recommendation) {
    const visibleControllers = fineTuneControllers(result, recommendation);
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

  function isDistancePath(path) {
    return (
      path === "sharedPower.distance" ||
      /^controllers\.\d+\.(distancePowerToController|distanceSplitToController|distanceControllerToTapeSplit)$/.test(path) ||
      /^tapeRuns\.\d+\.(distanceControllerToTapeStart|distanceSplitToTapeStart|distancePreviousToTapeStart|farEndDistance)$/.test(path)
    );
  }

  function freezeRecommendedDistances(inputState = state) {
    const freezeIfSuggested = (target, valueKey, autoKey) => {
      if (target?.[autoKey] !== false && number(target?.[valueKey]) > 0) {
        target[autoKey] = false;
      }
    };

    freezeIfSuggested(inputState.sharedPower, "distance", "distanceAuto");
    inputState.controllers.forEach((controller) => {
      freezeIfSuggested(controller, "distancePowerToController", "distancePowerToControllerAuto");
      freezeIfSuggested(controller, "distanceSplitToController", "distanceSplitToControllerAuto");
      freezeIfSuggested(controller, "distanceControllerToTapeSplit", "distanceControllerToTapeSplitAuto");
    });
    inputState.tapeRuns.forEach((run) => {
      freezeIfSuggested(run, "distanceControllerToTapeStart", "distanceControllerToTapeStartAuto");
      freezeIfSuggested(run, "distanceSplitToTapeStart", "distanceSplitToTapeStartAuto");
      freezeIfSuggested(run, "distancePreviousToTapeStart", "distancePreviousToTapeStartAuto");
      freezeIfSuggested(run, "farEndDistance", "farEndDistanceAuto");
    });
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
        const controllerIndex = Math.min(MAX_CONTROLLERS - 1, Math.max(0, Math.round(number(run.zoneIndex))));
        run.zoneIndex = controllerIndex;
        run.controllerIndex = controllerIndex;
        run.zoneIndexAuto = false;
        run.controllerIndexAuto = false;
        run.seriesBranchIndexAuto = true;
        run.seriesPositionAuto = true;
      }
      return;
    }

    match = path.match(/^tapeRuns\.(\d+)\.seriesBranchIndex$/);
    if (match) {
      const run = state.tapeRuns[Number(match[1])];
      if (run) {
        run.seriesBranchIndexAuto = false;
        run.seriesPositionAuto = true;
      }
      return;
    }

    match = path.match(/^tapeRuns\.(\d+)\.seriesPosition$/);
    if (match) {
      const run = state.tapeRuns[Number(match[1])];
      if (run) {
        run.seriesPositionAuto = false;
      }
      return;
    }

    match = path.match(/^tapeRuns\.(\d+)\.(controllerIndex|distanceControllerToTapeStart|distanceSplitToTapeStart|distancePreviousToTapeStart|farEndDistance)$/);
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
        run.controllerIndex = run.zoneIndex;
        run.controllerIndexAuto = true;
        run.seriesBranchIndexAuto = true;
        run.seriesPositionAuto = true;
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
        run.controllerIndex = run.zoneIndex;
        run.controllerIndexAuto = true;
        run.seriesBranchIndexAuto = true;
        run.seriesPositionAuto = true;
      } else {
        run.zoneIndex = Math.min(state.zoneCount - 1, Math.max(0, Math.round(number(run.zoneIndex))));
        run.controllerIndex = run.zoneIndex;
        run.controllerIndexAuto = false;
        run.seriesBranchIndexAuto = true;
        run.seriesPositionAuto = true;
      }
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

    if (isDistancePath(path)) {
      freezeRecommendedDistances();
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
          const style = controllerWiringStyle(controller);
          run.farEndDistance =
            style === "series-parallel" || (style === "parallel" && controller.tapeMode === "shared")
              ? run.distanceSplitToTapeStart
              : style === "series" && number(run.distancePreviousToTapeStart)
                ? run.distancePreviousToTapeStart
                : run.distanceControllerToTapeStart;
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

  function jumpToTarget(trigger, event) {
    if (trigger.dataset.reviewTarget) {
      setReviewTab(trigger.dataset.reviewTarget);
    }

    const guideStep = fineTuneStepForSelector(trigger.dataset.jump);
    if (guideStep && activeFineTuneStepId !== guideStep.id) {
      event.preventDefault();
      activeFineTuneStepId = guideStep.id;
      renderKeepingScroll();
      window.setTimeout(() => scrollToFineTuneStep(guideStep.id), 60);
      return true;
    }

    const target = document.querySelector(trigger.dataset.jump);
    if (!target) return false;

    event.preventDefault();
    openDetailsForTarget(target);
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      highlightTarget(target);
      if (target.matches("input, select, textarea, button")) {
        target.focus({ preventScroll: true });
      }
    }, 40);
    return true;
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

    jumpToTarget(trigger, event);
  }

  function handlePageJump(event) {
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;

    const trigger = event.target.closest("[data-jump]");
    if (!trigger || els.systemMap.contains(trigger)) return;

    jumpToTarget(trigger, event);
  }

  function queueMapPanUpdate() {
    window.requestAnimationFrame(() => {
      updateMapPanControls();
      window.setTimeout(updateMapPanControls, 80);
    });
  }

  function clampSystemMapZoom(value) {
    return Math.min(SYSTEM_MAP_MAX_ZOOM, Math.max(SYSTEM_MAP_MIN_ZOOM, value));
  }

  function mapRenderedWidth() {
    const track = els.systemMap.querySelector(".system-map-track");
    return track?.getBoundingClientRect().width || els.systemMap.scrollWidth || 0;
  }

  function applySystemMapZoom() {
    els.systemMap.style.setProperty("--map-zoom", systemMapZoom.toFixed(2));
    const track = els.systemMap.querySelector(".system-map-track");
    if (track) {
      const mapWidth = Number.parseFloat(track.style.getPropertyValue("--map-width")) || 980;
      track.style.setProperty("--map-rendered-width", `${Math.round(mapWidth * systemMapZoom)}px`);
    }
    if (els.mapZoomLabel) {
      els.mapZoomLabel.textContent = `${Math.round(systemMapZoom * 100)}%`;
    }
  }

  function setSystemMapZoom(nextZoom, anchorClientX = null) {
    const track = els.systemMap.querySelector(".system-map-track");
    if (!track) return;

    const next = Math.round(clampSystemMapZoom(nextZoom) * 100) / 100;
    if (Math.abs(next - systemMapZoom) < 0.001) {
      updateMapPanControls();
      return;
    }

    const mapRect = els.systemMap.getBoundingClientRect();
    const anchorOffset =
      typeof anchorClientX === "number" ? anchorClientX - mapRect.left : els.systemMap.clientWidth / 2;
    const safeAnchorOffset = Math.max(0, Math.min(els.systemMap.clientWidth, anchorOffset));
    const previousWidth = mapRenderedWidth();
    const anchorRatio = previousWidth
      ? (els.systemMap.scrollLeft + safeAnchorOffset) / previousWidth
      : 0.5;

    systemMapZoom = next;
    applySystemMapZoom();

    window.requestAnimationFrame(() => {
      const nextWidth = mapRenderedWidth();
      const maxScroll = Math.max(0, els.systemMap.scrollWidth - els.systemMap.clientWidth);
      els.systemMap.scrollLeft = Math.max(0, Math.min(maxScroll, anchorRatio * nextWidth - safeAnchorOffset));
      updateMapPanControls();
    });
  }

  function handleSystemMapWheel(event) {
    if (!els.systemMap.querySelector(".system-map-track")) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    event.preventDefault();
    setSystemMapZoom(
      systemMapZoom + (event.deltaY < 0 ? SYSTEM_MAP_ZOOM_STEP : -SYSTEM_MAP_ZOOM_STEP),
      event.clientX
    );
  }

  function updateMapPanControls() {
    const hasMap = Boolean(els.systemMap.querySelector(".system-map-track"));
    const canScroll = els.systemMap.scrollWidth - els.systemMap.clientWidth > 48;
    const canPan = hasMap && canScroll;
    const atStart = els.systemMap.scrollLeft <= 1;
    const atEnd = canScroll && els.systemMap.scrollLeft + els.systemMap.clientWidth >= els.systemMap.scrollWidth - 1;

    [els.panMapLeft, els.panMapRight].forEach((button) => {
      button.hidden = !canPan;
    });

    els.panMapLeft.disabled = !canPan || atStart;
    els.panMapRight.disabled = !canPan || atEnd;

    [els.zoomMapOut, els.resetMapZoom, els.zoomMapIn].forEach((button) => {
      if (!button) return;
      button.hidden = !hasMap;
    });
    if (els.zoomMapOut) els.zoomMapOut.disabled = !hasMap || systemMapZoom <= SYSTEM_MAP_MIN_ZOOM + 0.001;
    if (els.zoomMapIn) els.zoomMapIn.disabled = !hasMap || systemMapZoom >= SYSTEM_MAP_MAX_ZOOM - 0.001;
    if (els.resetMapZoom) els.resetMapZoom.disabled = !hasMap || Math.abs(systemMapZoom - SYSTEM_MAP_DEFAULT_ZOOM) < 0.001;
    applySystemMapZoom();
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
  }

  function beginSystemMapPan(id, clientX, clientY) {
    if (els.systemMap.scrollWidth <= els.systemMap.clientWidth) return;

    mapPan = {
      id,
      startX: clientX,
      startY: clientY,
      scrollLeft: els.systemMap.scrollLeft,
      moved: false,
      captured: false
    };
  }

  function moveSystemMapPan(id, clientX, clientY, event) {
    if (!mapPan || id !== mapPan.id) return;

    const deltaX = clientX - mapPan.startX;
    const deltaY = clientY - mapPan.startY;
    if (Math.abs(deltaX) <= 4 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    mapPan.moved = true;
    if (!mapPan.captured) {
      els.systemMap.setPointerCapture?.(id);
      mapPan.captured = true;
    }
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
    const wasCaptured = mapPan?.captured;
    const ended = endSystemMapPan(event.pointerId);
    if (ended && wasCaptured) {
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

    if (details.open && activeFineTuneStepId) {
      const activeStep = activeFineTuneStep();
      if (activeStep?.controllerIndex !== index) {
        activeFineTuneStepId = null;
        renderKeepingScroll();
      }
    }
  }

  function blankProject() {
    const blank = clone(simpleExample);
    blank.projectName = "";
    blank.tapeType = tapeTypes[0].id;
    blank.powerMode = "separate";
    blank.zoneCount = 1;
    blank.sharedPower.distance = 0;
    blank.sharedPower.wireSize = DEFAULT_POWER_WIRE_SIZE;
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
      controller.wireSizePowerToController = DEFAULT_POWER_WIRE_SIZE;
      controller.wireSizeSplitToController = DEFAULT_POWER_WIRE_SIZE;
      controller.wireSizeControllerToTapeSplit = DEFAULT_CONTROL_WIRE_SIZE;
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

  async function saveProjectFile() {
    normalizeState(state);
    const payload = {
      type: PROJECT_FILE_TYPE,
      version: PROJECT_FILE_VERSION,
      savedAt: new Date().toISOString(),
      state
    };
    const fileName = `${slugifyFileName(state.projectName)}.json`;
    const fileText = JSON.stringify(payload, null, 2);
    const blob = new Blob([fileText], { type: "application/json" });

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "T.R.A.C.E. project file",
              accept: { "application/json": [".json"] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
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
        activeFineTuneStepId = null;
        activeWizardStep = availableWizardStep();
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
  document.addEventListener("click", handleFineTuneAction);
  document.addEventListener("click", handlePageJump);
  document.addEventListener("keydown", handlePageJump);
  window.addEventListener("resize", updateMapPanControls);
  els.systemMap.addEventListener("scroll", updateMapPanControls);
  els.systemMap.addEventListener("pointerdown", handleSystemMapPointerDown);
  els.systemMap.addEventListener("pointermove", handleSystemMapPointerMove);
  els.systemMap.addEventListener("pointerup", handleSystemMapPointerEnd);
  els.systemMap.addEventListener("pointercancel", handleSystemMapPointerEnd);
  els.systemMap.addEventListener("click", handleSystemMapJump);
  els.systemMap.addEventListener("keydown", handleSystemMapJump);
  els.systemMap.addEventListener("wheel", handleSystemMapWheel, { passive: false });
  els.panMapLeft.addEventListener("click", () => panSystemMap(-1));
  els.panMapRight.addEventListener("click", () => panSystemMap(1));
  els.zoomMapOut?.addEventListener("click", () => setSystemMapZoom(systemMapZoom - SYSTEM_MAP_ZOOM_STEP));
  els.resetMapZoom?.addEventListener("click", () => setSystemMapZoom(SYSTEM_MAP_DEFAULT_ZOOM));
  els.zoomMapIn?.addEventListener("click", () => setSystemMapZoom(systemMapZoom + SYSTEM_MAP_ZOOM_STEP));
  els.darkModeToggle.addEventListener("change", handleThemeToggle);
  els.addTapeRun?.addEventListener("click", addTapeRun);
  els.tapeRuns.addEventListener("click", handleTapeRunActions);
  els.reviewTabButtons.forEach((button) => button.addEventListener("click", handleReviewTabClick));
  document.querySelectorAll("[data-save-project]").forEach((button) => button.addEventListener("click", saveProjectFile));
  els.openProject.addEventListener("click", () => els.projectFile.click());
  els.projectFile.addEventListener("change", openProjectFile);
  els.viewDisclaimer?.addEventListener("click", () => showDisclaimer(true));
  els.acceptDisclaimer?.addEventListener("click", acceptDisclaimer);
  document.addEventListener("click", handleImageViewerTrigger);
  document.addEventListener("keydown", handleImageViewerTrigger);
  els.closeImageViewer?.addEventListener("click", hideImageViewer);
  els.imageViewerModal?.addEventListener("click", handleImageViewerBackdrop);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.imageViewerModal && !els.imageViewerModal.hidden) {
      hideImageViewer();
    }
  });
  els.stepNextButtons.forEach((button) => button.addEventListener("click", handleWizardNext));
  els.simpleExample?.addEventListener("click", () => {
    activePreset = "simple";
    collapsedControllers.clear();
    activeFineTuneStepId = null;
    state = clone(simpleExample);
    activeReviewTab = "diagram";
    activeWizardStep = availableWizardStep();
    render();
  });
  els.workbookExample?.addEventListener("click", () => {
    activePreset = "advanced";
    collapsedControllers.clear();
    activeFineTuneStepId = null;
    state = clone(workbookExample);
    activeReviewTab = "diagram";
    activeWizardStep = availableWizardStep();
    render();
  });
  els.clearAll?.addEventListener("click", () => {
    activePreset = "blank";
    collapsedControllers.clear();
    activeFineTuneStepId = null;
    state = blankProject();
    activeReviewTab = "diagram";
    activeWizardStep = 1;
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
  setReviewTab("diagram");
  render();
  showDisclaimer();
})();
