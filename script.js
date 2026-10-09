const scrollTrack = document.getElementById('scroll-track');
const finalImageOverlay = document.getElementById('finalImageOverlay');
const finalCongratsOverlay = document.getElementById('finalCongratsOverlay');
const autoScrollToggle = document.getElementById('autoScrollToggle');
const musicToggle = document.getElementById('musicToggle');
const musicPrev = document.getElementById('musicPrev');
const musicNext = document.getElementById('musicNext');
const musicTitle = document.getElementById('musicTitle');
const musicTime = document.getElementById('musicTime');
const musicAudio = document.getElementById('musicAudio');
const themeToggle = document.getElementById('themeToggle');
const themeMenu = document.getElementById('themeMenu');
const themeMenuClose = document.getElementById('themeMenuClose');
const themeHalloweenBtn = document.getElementById('themeHalloween');
const themeHalloweenV2Btn = document.getElementById('themeHalloweenV2');
const themeOldBtn = document.getElementById('themeOld');
const themeModal = document.getElementById('themeModal');
const themeModalClose = document.getElementById('themeModalClose');
const themeCardHalloween = document.getElementById('themeCardHalloween');
const themeCardOld = document.getElementById('themeCardOld');
const themeCardHalloweenV2 = document.getElementById('themeCardHalloweenV2');

const MUSIC_HALLOWEEN = [
  {
    title: 'Spooky Scary Skeletons',
    file: 'https://cdn.imageurlgenerator.com/uploads/32b30f35-141d-4196-8b12-f351c5ba481e.mp3',
    fallbackFile: 'spooky_scary_skeletons.mp3',
    localFallbackFile: 'music/spooky_scary_skeletons.mp3',
    duration: '3:10'
  }
];

const MUSIC_HALLOWEEN_V2 = [
  {
    title: 'The Monster Mash',
    file: 'https://cdn.imageurlgenerator.com/uploads/ab358bb2-2fc0-472d-903d-67d6d0769483.mp3',
    fallbackFile: 'the_monster_mash.mp3',
    localFallbackFile: 'music/the_monster_mash.mp3',
    duration: '2:30'
  },
  {
    title: 'Thriller',
    file: 'https://cdn.imageurlgenerator.com/uploads/138cea03-91bc-46ad-9e98-7dfe13387f2a.mp3',
    fallbackFile: 'thriller.mp3',
    localFallbackFile: 'music/thriller.mp3',
    duration: '5:58'
  }
];



const MUSIC_CLASSIC = [
  {
    title: 'Running The Show',
    file: 'https://cdn.imageurlgenerator.com/uploads/03d9b98e-0c57-487a-9c1a-8a9da3ad9efe.mp3',
    fallbackFile: 'Running_the_show.mp3',
    localFallbackFile: 'music/DIGITAL_CIRCUS_-_The_One_Who_s_Running_the_Show_Official_Music_Video.mp3',
    duration: '3:02'
  },
  {
    title: 'Your New Home',
    file: 'https://cdn.imageurlgenerator.com/uploads/65ab3fa4-2ea5-42fc-8fc6-9e4f9b1f4a4c.mp3',
    fallbackFile: 'your_new_home.mp3',
    localFallbackFile: 'music/Your_New_Home.mp3',
    duration: '3:00'
  },
  {
    title: 'Theme from The Amazing Digital Circus',
    file: 'https://cdn.imageurlgenerator.com/uploads/625871fb-dd28-4a31-9e7d-0b4aab1e70bb.mp3',
    fallbackFile: 'Main_theme.mp3',
    localFallbackFile: 'music/The_Amazing_Digital_Circus_-_Main_Theme.mp3',
    duration: '2:47'
  }
];

// start with halloween theme
let musicTracks = MUSIC_HALLOWEEN.slice();

let currentTrackIndex = 0;
let musicIsPlaying = false;
const musicVolumeLevel = 1;
const musicGainBoost = 4;
let musicContext = null;
let musicGainNode = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function updateMusicButtonState() {
  if (!musicToggle) return;
  musicToggle.textContent = musicIsPlaying ? '॥' : '▶';
  musicToggle.setAttribute('aria-label', musicIsPlaying ? 'Pause music' : 'Play music');
  musicToggle.classList.toggle('active', musicIsPlaying);
  musicToggle.setAttribute('aria-pressed', String(musicIsPlaying));
}

function renderTrackInfo() {
  const track = musicTracks[currentTrackIndex];
  if (musicTitle) musicTitle.textContent = track.title;
  if (musicTime) musicTime.textContent = track.duration;
}

function ensureMusicGain() {
  if (!musicAudio || musicContext) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  musicContext = new AudioCtx();
  const source = musicContext.createMediaElementSource(musicAudio);
  musicGainNode = musicContext.createGain();
  musicGainNode.gain.value = musicGainBoost;
  source.connect(musicGainNode);
  musicGainNode.connect(musicContext.destination);
}

function getTrackSources(track) {
  const filename = (track.file || '').split('/').pop();
  const rootFilename = track.fallbackFile || filename;
  const localFilename = track.localFallbackFile || track.fallbackFile || filename;
  return Array.from(new Set([
    track.file,
    rootFilename,
    localFilename,
    `./${filename}`,
    `./${rootFilename}`,
    `./${localFilename}`
  ].filter(Boolean)));
}

function loadTrack(index, autoplay = false) {
  currentTrackIndex = (index + musicTracks.length) % musicTracks.length;
  const track = musicTracks[currentTrackIndex];
  renderTrackInfo();

  if (!musicAudio) return;

  const sources = getTrackSources(track);
  let attemptIndex = 0;

  const tryNextSource = () => {
    if (attemptIndex >= sources.length) {
      musicAudio.onerror = null;
      return;
    }

    const source = sources[attemptIndex++];
    if (musicAudio.getAttribute('src') !== source) {
      musicAudio.src = source;
      musicAudio.load();
    }

    musicAudio.onerror = () => {
      tryNextSource();
    };
  };

  if (!musicAudio.getAttribute('src') || !sources.includes(musicAudio.getAttribute('src'))) {
    tryNextSource();
  }

  musicAudio.volume = musicVolumeLevel;
  musicAudio.muted = false;
  if (musicGainNode) musicGainNode.gain.value = musicGainBoost;

  if (autoplay) {
    ensureMusicGain();
    if (musicContext && musicContext.state === 'suspended') {
      musicContext.resume();
    }
    musicAudio.play().catch(() => {
      musicIsPlaying = false;
      updateMusicButtonState();
    });
    musicIsPlaying = true;
    updateMusicButtonState();
  } else {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    musicIsPlaying = false;
    updateMusicButtonState();
  }
}

function updateTrackTimer() {
  if (!musicAudio || !musicTime) return;
  musicTime.textContent = formatTime(musicAudio.currentTime || 0);
}

if (musicAudio) {
  musicAudio.preload = 'auto';
  musicAudio.crossOrigin = 'anonymous';
  musicAudio.volume = musicVolumeLevel;
  musicAudio.muted = false;
  musicAudio.defaultMuted = false;

  musicAudio.addEventListener('loadedmetadata', () => {
    musicTime.textContent = formatTime(musicAudio.duration || 0);
  });

  musicAudio.addEventListener('timeupdate', updateTrackTimer);

  musicAudio.addEventListener('ended', () => {
    loadTrack(currentTrackIndex + 1, true);
  });
}

if (musicToggle) {
  musicToggle.addEventListener('click', () => {
    if (!musicAudio) return;
    ensureMusicGain();

    if (musicAudio.paused) {
      musicAudio.volume = musicVolumeLevel;
      musicAudio.muted = false;
      if (musicGainNode) musicGainNode.gain.value = musicGainBoost;
      if (musicContext && musicContext.state === 'suspended') {
        musicContext.resume();
      }
      musicAudio.play().catch(() => {
        musicIsPlaying = false;
        updateMusicButtonState();
      });
      musicIsPlaying = true;
      updateMusicButtonState();
    } else {
      musicAudio.pause();
      musicIsPlaying = false;
      updateMusicButtonState();
    }
  });
}

if (musicPrev) {
  musicPrev.addEventListener('click', () => loadTrack(currentTrackIndex - 1, musicIsPlaying));
}

if (musicNext) {
  musicNext.addEventListener('click', () => loadTrack(currentTrackIndex + 1, musicIsPlaying));
}

// Theme menu interactions
function showThemeMenu() {
  // prefer modal if present
  if (themeModal) {
    themeModal.setAttribute('aria-hidden', 'false');
    themeModal.classList.add('visible');
    return;
  }
  if (!themeMenu) return;
  themeMenu.setAttribute('aria-hidden', 'false');
  themeMenu.classList.add('visible');
}

function hideThemeMenu() {
  if (themeModal) {
    themeModal.setAttribute('aria-hidden', 'true');
    themeModal.classList.remove('visible');
    return;
  }
  if (!themeMenu) return;
  themeMenu.setAttribute('aria-hidden', 'true');
  themeMenu.classList.remove('visible');
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isVisible = themeMenu && themeMenu.getAttribute('aria-hidden') === 'false';
    if (isVisible) hideThemeMenu(); else showThemeMenu();
  });
}

if (themeMenuClose) {
  themeMenuClose.addEventListener('click', hideThemeMenu);
}

function setTheme(themeName) {
  document.body.classList.remove('old-theme');
  document.body.classList.remove('halloween-theme');
  document.body.classList.remove('halloween-v2');

  if (themeName === 'old') {
    document.body.classList.add('old-theme');
    // apply classic music
    musicTracks = MUSIC_CLASSIC.slice();
  } else if (themeName === 'halloween-v2') {
    document.body.classList.add('halloween-v2');
    musicTracks = MUSIC_HALLOWEEN_V2.slice();
  } else {
    document.body.classList.add('halloween-theme');
    musicTracks = MUSIC_HALLOWEEN.slice();
  }

  // update theme menu buttons active state
  if (themeHalloweenBtn) themeHalloweenBtn.classList.toggle('active', themeName === 'halloween');
  if (themeHalloweenV2Btn) themeHalloweenV2Btn.classList.toggle('active', themeName === 'halloween-v2');
  if (themeOldBtn) themeOldBtn.classList.toggle('active', themeName === 'old');
  if (themeCardHalloween) themeCardHalloween.classList.toggle('active', themeName === 'halloween');
  if (themeCardHalloweenV2) themeCardHalloweenV2.classList.toggle('active', themeName === 'halloween-v2');
  if (themeCardOld) themeCardOld.classList.toggle('active', themeName === 'old');

  // persist selection
  try { localStorage.setItem('siteTheme', themeName); } catch (e) {}

  // reload music track list and reset to first track
  currentTrackIndex = 0;
  loadTrack(0, musicIsPlaying);
  hideThemeMenu();
}

if (themeHalloweenBtn) themeHalloweenBtn.addEventListener('click', () => setTheme('halloween'));
if (themeHalloweenV2Btn) themeHalloweenV2Btn.addEventListener('click', () => setTheme('halloween-v2'));
if (themeOldBtn) themeOldBtn.addEventListener('click', () => setTheme('old'));

// modal close handlers
if (themeModalClose) themeModalClose.addEventListener('click', hideThemeMenu);
if (themeModal) {
  themeModal.addEventListener('click', (e) => {
    if (e.target === themeModal) hideThemeMenu();
  });
}

if (themeCardHalloween) themeCardHalloween.addEventListener('click', () => setTheme('halloween'));
if (themeCardHalloweenV2) themeCardHalloweenV2.addEventListener('click', () => setTheme('halloween-v2'));
if (themeCardOld) themeCardOld.addEventListener('click', () => setTheme('old'));

renderTrackInfo();
updateMusicButtonState();
// initialize theme from storage (this will also load tracks)
const _savedTheme = (function(){ try { return localStorage.getItem('siteTheme'); } catch(e){ return null; } })() || 'halloween';
setTheme(_savedTheme);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('Service worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service worker failed to register:', err);
      });
  });
}


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
const maxVisibleRows = 12000;
const batchSize = 6;
const scrollBuffer = 1200;
// Performance tuning
const maxDomChildren = 600;
const phaseUpdateInterval = 500; 
let lastPhaseAt = 0;
const maxRuntimeMs = 10 * 60 * 1000;
const startTime = performance.now();
const baseAutoScrollSpeed = 1.1;
const speedToggle = document.getElementById('speedToggle');
const speedValue = speedToggle ? speedToggle.querySelector('.speed-value') : null;

let renderedCount = 0;
let generationEnded = false;
let finalImageShown = false;
let autoScrollEnabled = false;
let autoScrollInterval = null;
let autoScrollMultiplier = 1;
let scrollGenerationTimer = null;
let lastGenerationAt = 0;
let rafId = null;
let needsHandle = false;
let lastFrameTime = performance.now();

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

function buildLine(index, node) {
  const el = node || document.createElement('p');

  if (index >= 9000 && index <= 10050) {
    el.className = 'milestone';
    el.textContent = 'the silence is almost complete';
    return el;
  }

  if (milestoneIndexes.includes(index)) {
    const message = milestoneMessages[milestoneIndexes.indexOf(index) % milestoneMessages.length];
    el.className = 'milestone';
    el.textContent = message;
    return el;
  }

  el.className = '';
  el.textContent = 'scroll';
  return el;
}

function addRows() {
  if (generationEnded) return;

  const fragment = document.createDocumentFragment();
  const remainingCapacity = Math.max(0, maxVisibleRows - scrollTrack.children.length);
  const count = Math.min(batchSize, remainingCapacity);

  for (let i = 0; i < count; i++) {
    if (generationEnded) break;

    if (scrollTrack.children.length < maxDomChildren) {
      fragment.appendChild(buildLine(renderedCount));
    } else {
      // reuse oldest node by moving it to the end and updating it in-place
      const node = scrollTrack.firstElementChild;
      if (node) {
        scrollTrack.appendChild(node);
        buildLine(renderedCount, node);
      }
    }

    renderedCount += 1;
  }

  if (fragment.childNodes.length) scrollTrack.appendChild(fragment);
}

function scheduleRows() {
  if (generationEnded) return;

  const now = performance.now();
  if (now - lastGenerationAt < 140) return; 
  lastGenerationAt = now;

  const distanceFromBottom = scrollTrack.scrollHeight - (window.scrollY + window.innerHeight);
  if (distanceFromBottom < scrollBuffer) {
    addRows();
    pruneRows();
  }
}

function pruneRows() {
  try {
    // With reuse in place this should rarely trigger, but keep it as a safety
    while (scrollTrack.children.length > maxDomChildren) {
      scrollTrack.removeChild(scrollTrack.firstChild);
    }
  } catch (e) {}
}

function maybeUpdatePhaseState() {
  const now = performance.now();
  if (now - lastPhaseAt > phaseUpdateInterval) {
    lastPhaseAt = now;
    updatePhaseState();
  }
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
  // noop here; auto-scroll is handled via requestAnimationFrame loop
}

autoScrollToggle.addEventListener('click', () => {
  autoScrollEnabled = !autoScrollEnabled;
  updateAutoScrollButton();
  // reset timing so motion is smooth when toggled
  lastFrameTime = performance.now();
});

speedToggle.addEventListener('click', () => {
  autoScrollMultiplier = autoScrollMultiplier === 1 ? 2 : 1;
  updateSpeedButton();
});

function handleScrollGeneration() {
  if (generationEnded) return;
  maybeUpdatePhaseState();
  scheduleRows();
}

for (let i = 0; i < 60; i++) addRows();

window.addEventListener('scroll', () => { needsHandle = true; }, { passive: true });
window.addEventListener('resize', () => { needsHandle = true; }, { passive: true });

function autoScrollStep(deltaMs) {
  if (!autoScrollEnabled) return;
  const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 0);
  if (window.scrollY >= maxScroll) {
    stopAutoScroll();
    return;
  }

  // scale movement by frame time for consistency
  const basePerFrame = baseAutoScrollSpeed * (deltaMs / 16.67);
  window.scrollBy({ top: basePerFrame * autoScrollMultiplier, left: 0, behavior: 'auto' });
}

function mainLoop(now) {
  const delta = now - lastFrameTime;
  lastFrameTime = now;

  if (autoScrollEnabled) autoScrollStep(delta);
  if (needsHandle) {
    handleScrollGeneration();
    needsHandle = false;
  }

  rafId = requestAnimationFrame(mainLoop);
}

if (!rafId) rafId = requestAnimationFrame(mainLoop);

updateAutoScrollButton();
updateSpeedButton();
updatePhaseState();
