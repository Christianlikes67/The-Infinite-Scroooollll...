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

const musicTracks = [
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

renderTrackInfo();
updateMusicButtonState();
loadTrack(0, false);

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
