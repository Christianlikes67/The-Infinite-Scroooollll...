const scrollTrack = document.getElementById('scroll-track');
const phaseOverlay = document.getElementById('phaseOverlay');
const phaseText = document.getElementById('phaseText');
const pitOverlay = document.getElementById('pitOverlay');
const realmOverlay = document.getElementById('realmOverlay');
const finalImageOverlay = document.getElementById('finalImageOverlay');
const autoScrollToggle = document.getElementById('autoScrollToggle');

const milestoneMessages = [
  'Welcome to the infinite road. It does not bend.',
  'The horizon keeps receding, but never closes.',
  'The first signs of silence are already near.',
  'This path has been walked by many, and still it moves.',
  'You are still going.',
  'The road keeps changing beneath your feet.',
  'The dark is not empty. It is listening.'
];

const milestoneIndexes = [30, 110, 220, 390, 540];
const maxVisibleRows = 50000;
const batchSize = 24;
const scrollBuffer = 900;
const maxRuntimeMs = 10 * 60 * 1000;
const startTime = performance.now();
const baseAutoScrollSpeed = 1.1;
const speedToggle = document.getElementById('speedToggle');
const speedValue = speedToggle ? speedToggle.querySelector('.speed-value') : null;

let renderedCount = 0;
let pendingFrame = false;
let generationEnded = false;
let phaseMessageTimer = null;
let finalImageShown = false;
let lastPhase = 'normal';
let autoScrollEnabled = false;
let autoScrollInterval = null;
let autoScrollMultiplier = 1;

function stopAutoScroll() {
  autoScrollEnabled = false;
  updateAutoScrollButton();
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}

history.scrollRestoration = 'manual';
window.scrollTo({ top: 0, behavior: 'auto' });
scrollTrack.style.minHeight = '100vh';
stopAutoScroll();

function getScrollPhase() {
  const scrollY = Math.min(
    window.scrollY || document.documentElement.scrollTop || 0,
    Math.max(document.body.scrollHeight - window.innerHeight, 0)
  );
  const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
  const pitStart = maxScroll * 0.12;
  const pitEnd = maxScroll * 0.28;
  const blueStart = maxScroll * 0.56;
  const blueEnd = maxScroll * 0.76;
  const realmStart = maxScroll * 0.86;
  const endStart = maxScroll * 0.94;

  if (scrollY < pitStart) return 'normal';
  if (scrollY >= pitStart && scrollY < pitEnd) return 'pit';
  if (scrollY >= pitEnd && scrollY < blueStart) return 'red';
  if (scrollY >= blueStart && scrollY < blueEnd) return 'blue';
  if (scrollY >= blueEnd && scrollY < realmStart) return 'normal';
  if (scrollY >= realmStart && scrollY < endStart) return 'everything';
  if (scrollY >= endStart) return 'end';
  return 'normal';
}

function setPhaseMessage(message) {
  phaseText.textContent = message;
  phaseOverlay.classList.add('visible');
  clearTimeout(phaseMessageTimer);
  phaseMessageTimer = setTimeout(() => {
    phaseOverlay.classList.remove('visible');
  }, 2100);
}

function applyPhase(phase) {
  document.body.classList.remove('pit-mode', 'red-mode', 'depth-mode', 'everything-mode', 'end-mode');
  pitOverlay.classList.remove('visible');
  realmOverlay.classList.remove('visible');

  if (phase === 'pit') {
    document.body.classList.add('pit-mode');
    pitOverlay.classList.add('visible');
  } else if (phase === 'red') {
    document.body.classList.add('red-mode');
  } else if (phase === 'blue') {
    document.body.classList.add('depth-mode');
  } else if (phase === 'everything') {
    document.body.classList.add('everything-mode');
    realmOverlay.classList.add('visible');
  } else if (phase === 'end') {
    document.body.classList.add('end-mode');
  }
}

function updatePhaseState() {
  const elapsed = performance.now() - startTime;

  if (elapsed >= maxRuntimeMs) {
    generationEnded = true;
    document.body.classList.remove('pit-mode', 'red-mode', 'depth-mode', 'everything-mode', 'end-mode');
    pitOverlay.classList.remove('visible');
    realmOverlay.classList.remove('visible');
    phaseOverlay.classList.remove('visible');
    finalImageOverlay.classList.remove('visible');
    return;
  }

  const nextPhase = getScrollPhase();
  applyPhase(nextPhase);

  if (nextPhase === 'end') {
    if (!finalImageShown) {
      finalImageShown = true;
      phaseOverlay.classList.remove('visible');
      phaseText.textContent = '';
      finalImageOverlay.classList.add('visible');
      finalImageOverlay.setAttribute('aria-hidden', 'false');
    }
    generationEnded = true;
    return;
  }

  if (lastPhase !== nextPhase) {
    if (lastPhase === 'normal' && nextPhase === 'pit') {
      setPhaseMessage('Entering the pit of redemption');
    } else if (lastPhase === 'pit' && nextPhase === 'normal') {
      setPhaseMessage('Leaving the pit of redemption');
    } else if (lastPhase === 'pit' && nextPhase === 'red') {
      setPhaseMessage('Leaving the pit of redemption');
    } else if (lastPhase === 'red' && nextPhase === 'blue') {
      setPhaseMessage('Entering the broken depths');
    } else if (lastPhase === 'blue' && nextPhase === 'red') {
      setPhaseMessage('Leaving the broken depths');
    } else if (lastPhase === 'red' && nextPhase === 'normal') {
      setPhaseMessage('Leaving the red zone');
    } else if (lastPhase === 'normal' && nextPhase === 'red') {
      setPhaseMessage('Entering the red zone');
    } else if (lastPhase === 'blue' && nextPhase === 'normal') {
      setPhaseMessage('Leaving the broken depths');
    } else if (lastPhase === 'normal' && nextPhase === 'blue') {
      setPhaseMessage('Entering the broken depths');
    } else if (lastPhase === 'normal' && nextPhase === 'everything') {
      setPhaseMessage('Entering the realm of everything');
    } else if (lastPhase === 'everything' && nextPhase === 'end') {
      setPhaseMessage('Congrats, for reaching the end!');
    }

    lastPhase = nextPhase;
  }
}

function buildLine(index) {
  const line = document.createElement('p');

  if (index >= 9000 && index <= 10050) {
    line.className = 'milestone';
    line.textContent = 'the silence is almost complete';
    return line;
  }

  if (milestoneIndexes.includes(index)) {
    const message = milestoneMessages[milestoneIndexes.indexOf(index) % milestoneMessages.length];
    line.className = 'milestone';
    line.textContent = message;
    return line;
  }

  line.textContent = 'scroll';
  return line;
}

function addRows() {
  if (generationEnded) return;

  const fragment = document.createDocumentFragment();
  const count = Math.min(batchSize, maxVisibleRows - scrollTrack.children.length);

  for (let i = 0; i < count; i++) {
    if (generationEnded) break;
    fragment.appendChild(buildLine(renderedCount));
    renderedCount += 1;
  }

  if (fragment.childNodes.length) {
    scrollTrack.appendChild(fragment);
  }
}

function scheduleRows() {
  if (generationEnded || pendingFrame) return;
  pendingFrame = true;

  requestAnimationFrame(() => {
    pendingFrame = false;

    if (generationEnded) return;

    const distanceFromBottom = scrollTrack.scrollHeight - (window.scrollY + window.innerHeight);
    if (distanceFromBottom < scrollBuffer) {
      addRows();
    }
  });
}

function updateAutoScrollButton() {
  autoScrollToggle.classList.toggle('active', autoScrollEnabled);
  autoScrollToggle.setAttribute('aria-pressed', String(autoScrollEnabled));
}

function updateSpeedButton() {
  const value = `${autoScrollMultiplier}x`;
  if (speedValue) {
    speedValue.textContent = value;
  }
  speedToggle.classList.toggle('active', autoScrollMultiplier === 2);
  speedToggle.setAttribute('aria-pressed', String(autoScrollMultiplier === 2));
}

function autoScrollLoop() {
  if (!autoScrollEnabled) return;

  const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 0);
  if (window.scrollY >= maxScroll) {
    stopAutoScroll();
    return;
  }

  window.scrollBy({ top: baseAutoScrollSpeed * autoScrollMultiplier, left: 0, behavior: 'auto' });
}

autoScrollToggle.addEventListener('click', () => {
  if (autoScrollEnabled) {
    stopAutoScroll();
    return;
  }

  autoScrollEnabled = true;
  updateAutoScrollButton();

  if (autoScrollInterval) clearInterval(autoScrollInterval);
  autoScrollInterval = setInterval(autoScrollLoop, 16);
});

speedToggle.addEventListener('click', () => {
  autoScrollMultiplier = autoScrollMultiplier === 1 ? 2 : 1;
  updateSpeedButton();
});

function tick() {
  if (generationEnded) return;

  updatePhaseState();

  const distanceFromBottom = scrollTrack.scrollHeight - (window.scrollY + window.innerHeight);
  if (distanceFromBottom < scrollBuffer || scrollTrack.children.length < 180 || renderedCount < 2000) {
    addRows();
  }

  requestAnimationFrame(tick);
}

for (let i = 0; i < 60; i++) {
  addRows();
}

window.addEventListener('scroll', () => {
  scheduleRows();
  updatePhaseState();
}, { passive: true });

window.addEventListener('resize', () => {
  scheduleRows();
  updatePhaseState();
}, { passive: true });

updateAutoScrollButton();
updateSpeedButton();
updatePhaseState();
requestAnimationFrame(tick);
