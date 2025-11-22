// Application State
let lessons = [];
let currentLesson = null;

// DOM Elements
const lessonList = document.getElementById('lessonList');
const playerSection = document.getElementById('playerSection');
const lessonSelector = document.querySelector('.lesson-selector');
const audioElement = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const replayBtn = document.getElementById('replayBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const speedSelect = document.getElementById('speedSelect');
const backToListBtn = document.getElementById('backToListBtn');

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
    
    // Update UI
    document.getElementById('lessonTitle').textContent = currentLesson.title;
    document.getElementById('lessonLevel').textContent = currentLesson.level;
    document.getElementById('lessonLevel').className = `lesson-badge level-${currentLesson.level}`;
    document.getElementById('lessonCategory').textContent = currentLesson.category;
    document.getElementById('transcriptText').textContent = currentLesson.text;
    
    // Render Vocabulary
    const vocabList = document.getElementById('vocabularyList');
    vocabList.innerHTML = '';
    currentLesson.vocabulary.forEach(word => {
        const tag = document.createElement('span');
        tag.className = 'vocab-tag';
        tag.textContent = word;
        vocabList.appendChild(tag);
    });
    
    // Load Audio
    audioElement.src = `assets/audio/lesson${lessonId}.mp3`;
    audioElement.load();
    
    // Show Player, Hide List
    lessonSelector.style.display = 'none';
    playerSection.style.display = 'block';
    
    // Reset playback
    playPauseBtn.innerHTML = '<span class="icon">▶</span> Play';
    progressBar.value = 0;
    
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
    
    // Audio Events
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audioElement.duration);
    });
    audioElement.addEventListener('ended', () => {
        updatePlayPauseButton(false);
        progressBar.value = 0;
    });
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
    }
}

// Start App
init();