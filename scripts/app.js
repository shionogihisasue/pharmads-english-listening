// Application State
let lessons = [];
let currentLesson = null;
let isLooping = false;
let sectionRepeatStart = null;
let sectionRepeatEnd = null;
let isSectionRepeatActive = false;

// DOM Elements
const lessonList = document.getElementById('lessonList');
const playerSection = document.getElementById('playerSection');
const lessonSelector = document.querySelector('.lesson-selector');
const audioElement = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const replayBtn = document.getElementById('replayBtn');
const loopBtn = document.getElementById('loopBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const speedSelect = document.getElementById('speedSelect');
const backToListBtn = document.getElementById('backToListBtn');

// Section Repeat Elements
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const repeatSectionBtn = document.getElementById('repeatSectionBtn');
const clearSectionBtn = document.getElementById('clearSectionBtn');
const sectionInfo = document.getElementById('sectionInfo');

// Initialize App
async function init() {
    try {
        const response = await fetch('content/scripts.json');
        const data = await response.json();
        lessons = data.lessons;
        renderLessonList();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading lessons:', error);
        lessonList.innerHTML = '<p style="padding: 20px; text-align: center;">Error loading lessons. Please refresh the page.</p>';
    }
}

// Render Lesson List
function renderLessonList() {
    lessonList.innerHTML = '';
    
    lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.onclick = () => loadLesson(lesson.id);
        
        card.innerHTML = `
            <h3>${lesson.title}</h3>
            <div class="lesson-meta">
                <span class="lesson-badge level-${lesson.level}">${lesson.level}</span>
                <span class="lesson-badge">${lesson.category}</span>
            </div>
        `;
        
        lessonList.appendChild(card);
    });
}

// Load Specific Lesson
function loadLesson(lessonId) {
    currentLesson = lessons.find(l => l.id === lessonId);
    
    if (!currentLesson) return;
    
    // Reset states
    isLooping = false;
    sectionRepeatStart = null;
    sectionRepeatEnd = null;
    isSectionRepeatActive = false;
    
    // Update UI
    document.getElementById('lessonTitle').textContent = currentLesson.title;
    document.getElementById('lessonLevel').textContent = currentLesson.level;
    document.getElementById('lessonLevel').className = `lesson-badge level-${currentLesson.level}`;
    document.getElementById('lessonCategory').textContent = currentLesson.category;
    document.getElementById('transcriptText').textContent = currentLesson.text;
    
    // Render Vocabulary with Definitions
    const vocabList = document.getElementById('vocabularyList');
    vocabList.innerHTML = '';
    currentLesson.vocabulary.forEach(vocabItem => {
        const card = document.createElement('div');
        card.className = 'vocab-card';
        
        // Support both old format (string) and new format (object)
        if (typeof vocabItem === 'string') {
            card.innerHTML = `
                <div class="vocab-term">${vocabItem}</div>
            `;
        } else {
            card.innerHTML = `
                <div class="vocab-term">${vocabItem.term}</div>
                <div class="vocab-definition">${vocabItem.definition}</div>
            `;
        }
        
        vocabList.appendChild(card);
    });
    
    // Load Audio
    audioElement.src = `assets/audio/lesson${lessonId}.mp3`;
    audioElement.load();
    
    // Show Player, Hide List
    lessonSelector.style.display = 'none';
    playerSection.style.display = 'block';
    
    // Reset UI
    playPauseBtn.innerHTML = '<span class="icon">▶</span> Play';
    loopBtn.innerHTML = '<span class="icon">🔁</span> Loop: Off';
    loopBtn.classList.remove('active');
    progressBar.value = 0;
    updateSectionInfo();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Setup Event Listeners
function setupEventListeners() {
    // Play/Pause
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    // Replay
    replayBtn.addEventListener('click', () => {
        audioElement.currentTime = 0;
        audioElement.play();
        updatePlayPauseButton(true);
    });
    
    // Loop Toggle
    loopBtn.addEventListener('click', toggleLoop);
    
    // Skip Back/Forward
    backBtn.addEventListener('click', () => {
        audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
    });
    
    forwardBtn.addEventListener('click', () => {
        audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 5);
    });
    
    // Speed Control
    speedSelect.addEventListener('change', (e) => {
        audioElement.playbackRate = parseFloat(e.target.value);
    });
    
    // Progress Bar
    progressBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * audioElement.duration;
        audioElement.currentTime = time;
    });
    
    // Section Repeat Controls
    setStartBtn.addEventListener('click', setRepeatStart);
    setEndBtn.addEventListener('click', setRepeatEnd);
    repeatSectionBtn.addEventListener('click', toggleSectionRepeat);
    clearSectionBtn.addEventListener('click', clearSection);
    
    // Audio Events
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audioElement.duration);
    });
    audioElement.addEventListener('ended', handleAudioEnded);
    audioElement.addEventListener('error', (e) => {
        console.error('Audio loading error:', e);
        alert('Error loading audio file. Please check that the audio file exists.');
    });
    
    // Back to List
    backToListBtn.addEventListener('click', () => {
        audioElement.pause();
        audioElement.currentTime = 0;
        lessonSelector.style.display = 'block';
        playerSection.style.display = 'none';
        window.scrollTo(0, 0);
    });
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Toggle Play/Pause
function togglePlayPause() {
    if (audioElement.paused) {
        audioElement.play();
        updatePlayPauseButton(true);
    } else {
        audioElement.pause();
        updatePlayPauseButton(false);
    }
}

// Toggle Loop
function toggleLoop() {
    isLooping = !isLooping;
    audioElement.loop = isLooping;
    
    if (isLooping) {
        loopBtn.innerHTML = '<span class="icon">🔁</span> Loop: On';
        loopBtn.classList.add('active');
    } else {
        loopBtn.innerHTML = '<span class="icon">🔁</span> Loop: Off';
        loopBtn.classList.remove('active');
    }
}

// Set Repeat Start Point
function setRepeatStart() {
    sectionRepeatStart = audioElement.currentTime;
    updateSectionInfo();
    
    if (sectionRepeatStart !== null && sectionRepeatEnd !== null) {
        repeatSectionBtn.disabled = false;
        clearSectionBtn.disabled = false;
    }
}

// Set Repeat End Point
function setRepeatEnd() {
    sectionRepeatEnd = audioElement.currentTime;
    
    // Ensure end is after start
    if (sectionRepeatStart !== null && sectionRepeatEnd < sectionRepeatStart) {
        alert('End time must be after start time!');
        sectionRepeatEnd = null;
        return;
    }
    
    updateSectionInfo();
    
    if (sectionRepeatStart !== null && sectionRepeatEnd !== null) {
        repeatSectionBtn.disabled = false;
        clearSectionBtn.disabled = false;
    }
}

// Toggle Section Repeat
function toggleSectionRepeat() {
    if (sectionRepeatStart === null || sectionRepeatEnd === null) return;
    
    isSectionRepeatActive = !isSectionRepeatActive;
    
    if (isSectionRepeatActive) {
        repeatSectionBtn.innerHTML = '<span class="icon">⏹</span> Stop Section';
        repeatSectionBtn.classList.add('active');
        audioElement.currentTime = sectionRepeatStart;
        audioElement.play();
        updatePlayPauseButton(true);
    } else {
        repeatSectionBtn.innerHTML = '<span class="icon">🔂</span> Repeat Section';
        repeatSectionBtn.classList.remove('active');
    }
}

// Clear Section Markers
function clearSection() {
    sectionRepeatStart = null;
    sectionRepeatEnd = null;
    isSectionRepeatActive = false;
    repeatSectionBtn.disabled = true;
    clearSectionBtn.disabled = true;
    repeatSectionBtn.classList.remove('active');
    updateSectionInfo();
}

// Update Section Info Display
function updateSectionInfo() {
    if (sectionRepeatStart === null && sectionRepeatEnd === null) {
        sectionInfo.innerHTML = '<p>No section selected. Play audio and click "Set Start" and "Set End" to mark a section.</p>';
        return;
    }
    
    let info = '<p><strong>Selected Section:</strong><br>';
    
    if (sectionRepeatStart !== null) {
        info += `Start: ${formatTime(sectionRepeatStart)}`;
    }
    
    if (sectionRepeatEnd !== null) {
        info += ` → End: ${formatTime(sectionRepeatEnd)}`;
        const duration = sectionRepeatEnd - sectionRepeatStart;
        info += ` (${formatTime(duration)})`;
    }
    
    info += '</p>';
    sectionInfo.innerHTML = info;
}

// Handle Time Update (for section repeat)
function handleTimeUpdate() {
    updateProgress();
    
    // Handle section repeat
    if (isSectionRepeatActive && sectionRepeatEnd !== null) {
        if (audioElement.currentTime >= sectionRepeatEnd) {
            audioElement.currentTime = sectionRepeatStart;
        }
    }
}

// Handle Audio Ended
function handleAudioEnded() {
    if (!isLooping && !isSectionRepeatActive) {
        updatePlayPauseButton(false);
        progressBar.value = 0;
    }
}

// Update Play/Pause Button
function updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
        playPauseBtn.innerHTML = '<span class="icon">⏸</span> Pause';
    } else {
        playPauseBtn.innerHTML = '<span class="icon">▶</span> Play';
    }
}

// Update Progress Bar
function updateProgress() {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    progressBar.value = progress || 0;
    currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
}

// Format Time (seconds to mm:ss)
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    if (playerSection.style.display === 'none') return;
    
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            audioElement.currentTime -= 5;
            break;
        case 'ArrowRight':
            e.preventDefault();
            audioElement.currentTime += 5;
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            audioElement.currentTime = 0;
            break;
        case 'l':
        case 'L':
            e.preventDefault();
            toggleLoop();
            break;
        case 's':
        case 'S':
            e.preventDefault();
            setRepeatStart();
            break;
        case 'e':
        case 'E':
            e.preventDefault();
            setRepeatEnd();
            break;
    }
}

// Start App
init();