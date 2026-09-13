const scrollTrack = document.getElementById('scroll-track');
const finalImageOverlay = document.getElementById('finalImageOverlay');
const finalCongratsOverlay = document.getElementById('finalCongratsOverlay');
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
let finalImageShown = false;
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

function updatePhaseState() {
  const elapsed = performance.now() - startTime;

  if (elapsed >= maxRuntimeMs) {
    generationEnded = true;
    finalImageOverlay.classList.remove('visible');
    return;
  }

  const scrollY = Math.min(
    window.scrollY || document.documentElement.scrollTop || 0,
    Math.max(document.body.scrollHeight - window.innerHeight, 0)
  );
  const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
  const endStart = maxScroll * 0.94;

  if (scrollY >= endStart) {
    if (!finalImageShown) {
      if (finalCongratsOverlay) {
        finalCongratsOverlay.classList.add('visible');
        finalCongratsOverlay.setAttribute('aria-hidden', 'false');
      }

      setTimeout(() => {
        if (finalCongratsOverlay) {
          finalCongratsOverlay.classList.remove('visible');
          finalCongratsOverlay.setAttribute('aria-hidden', 'true');
        }
        if (finalImageOverlay) {
          finalImageOverlay.classList.add('visible');
          finalImageOverlay.setAttribute('aria-hidden', 'false');
        }
        finalImageShown = true;
      }, 30000);
    }
    generationEnded = true;
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
