// Application State
let lessons = [];
let vocabulary = [];
let currentLesson = null;
let currentMode = null; // 'listening' or 'vocabulary'
let isLooping = false;
let sectionRepeatStart = null;
let sectionRepeatEnd = null;
let isSectionRepeatActive = false;

// Flashcard State
let currentCards = [];
let currentCardIndex = 0;
let isFlipped = false;

// Speech Synthesis
let synth = window.speechSynthesis;
let voices = [];

// Load voices
function loadVoices() {
    voices = synth.getVoices();
    const britishVoice = voices.find(voice => 
        voice.lang === 'en-GB' || voice.lang.startsWith('en-GB')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    return britishVoice;
}

if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
}

// Text-to-Speech Function
function speak(text, rate = 1.0) {
    if (synth.speaking) {
        synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = loadVoices();
    if (voice) {
        utterance.voice = voice;
    }
    utterance.lang = 'en-GB';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    synth.speak(utterance);
}

// DOM Elements - Mode Selection
const modeSelector = document.getElementById('modeSelector');
const listeningModeBtn = document.getElementById('listeningModeBtn');
const vocabModeBtn = document.getElementById('vocabModeBtn');
const backToModeBtn = document.getElementById('backToModeBtn');
const backToModeFromVocabBtn = document.getElementById('backToModeFromVocabBtn');

// DOM Elements - Listening Mode
const lessonList = document.getElementById('lessonList');
const playerSection = document.getElementById('playerSection');
const lessonSelector = document.getElementById('lessonSelector');
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

// DOM Elements - Section Repeat
const setStartBtn = document.getElementById('setStartBtn');
const setEndBtn = document.getElementById('setEndBtn');
const repeatSectionBtn = document.getElementById('repeatSectionBtn');
const clearSectionBtn = document.getElementById('clearSectionBtn');
const sectionInfo = document.getElementById('sectionInfo');

// DOM Elements - Flashcard Mode
const vocabLessonSelector = document.getElementById('vocabLessonSelector');
const vocabLessonList = document.getElementById('vocabLessonList');
const flashcardSection = document.getElementById('flashcardSection');
const flashcard = document.getElementById('flashcard');
const flashcardFront = document.getElementById('flashcardFront');
const flashcardBack = document.getElementById('flashcardBack');
const cardTerm = document.getElementById('cardTerm');
const cardDefinition = document.getElementById('cardDefinition');
const cardExample = document.getElementById('cardExample');
const cardCounter = document.getElementById('cardCounter');
const flashcardLessonTitle = document.getElementById('flashcardLessonTitle');
const prevCardBtn = document.getElementById('prevCardBtn');
const nextCardBtn = document.getElementById('nextCardBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const termAudioBtn = document.getElementById('termAudioBtn');
const definitionAudioBtn = document.getElementById('definitionAudioBtn');
const exampleAudioBtn = document.getElementById('exampleAudioBtn');
const backToVocabListBtn = document.getElementById('backToVocabListBtn');

// Initialize App
async function init() {
    try {
        // Load both JSON files
        const [lessonsResponse, vocabResponse] = await Promise.all([
            fetch('content/lessons.json'),
            fetch('content/vocabulary.json')
        ]);
        
        const lessonsData = await lessonsResponse.json();
        const vocabData = await vocabResponse.json();
        
        lessons = lessonsData.lessons;
        vocabulary = vocabData.vocabulary;
        
        loadVoices();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading lessons. Please refresh the page.');
    }
}

// Get vocabulary for a specific lesson
function getVocabularyForLesson(lessonId) {
    return vocabulary.filter(vocab => vocab.lessonId === lessonId);
}

// Setup Event Listeners
function setupEventListeners() {
    // Mode Selection
    listeningModeBtn.addEventListener('click', () => {
        currentMode = 'listening';
        modeSelector.style.display = 'none';
        lessonSelector.style.display = 'block';
        renderLessonList();
    });
    
    vocabModeBtn.addEventListener('click', () => {
        currentMode = 'vocabulary';
        modeSelector.style.display = 'none';
        vocabLessonSelector.style.display = 'block';
        renderVocabLessonList();
    });
    
    backToModeBtn.addEventListener('click', backToModeSelection);
    backToModeFromVocabBtn.addEventListener('click', backToModeSelection);
    
    // Listening Mode Controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    replayBtn.addEventListener('click', () => {
        audioElement.currentTime = 0;
        audioElement.play();
        updatePlayPauseButton(true);
    });
    loopBtn.addEventListener('click', toggleLoop);
    backBtn.addEventListener('click', () => {
        audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
    });
    forwardBtn.addEventListener('click', () => {
        audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 5);
    });
    speedSelect.addEventListener('change', (e) => {
        audioElement.playbackRate = parseFloat(e.target.value);
    });
    progressBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * audioElement.duration;
        audioElement.currentTime = time;
    });
    
    setStartBtn.addEventListener('click', setRepeatStart);
    setEndBtn.addEventListener('click', setRepeatEnd);
    repeatSectionBtn.addEventListener('click', toggleSectionRepeat);
    clearSectionBtn.addEventListener('click', clearSection);
    
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audioElement.duration);
    });
    audioElement.addEventListener('ended', handleAudioEnded);
    
    backToListBtn.addEventListener('click', () => {
        audioElement.pause();
        audioElement.currentTime = 0;
        playerSection.style.display = 'none';
        lessonSelector.style.display = 'block';
    });
    
    // Flashcard Controls
    flashcard.addEventListener('click', flipCard);
    prevCardBtn.addEventListener('click', showPreviousCard);
    nextCardBtn.addEventListener('click', showNextCard);
    shuffleBtn.addEventListener('click', shuffleCards);
    termAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(cardTerm.textContent, 0.9);
    });
    definitionAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(cardDefinition.textContent, 0.9);
    });
    exampleAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(cardExample.textContent, 0.9);
    });
    backToVocabListBtn.addEventListener('click', () => {
        flashcardSection.style.display = 'none';
        vocabLessonSelector.style.display = 'block';
    });
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Back to Mode Selection
function backToModeSelection() {
    lessonSelector.style.display = 'none';
    vocabLessonSelector.style.display = 'none';
    playerSection.style.display = 'none';
    flashcardSection.style.display = 'none';
    modeSelector.style.display = 'block';
    currentMode = null;
}

// Render Lesson List (Listening Mode)
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

// Render Vocabulary Lesson List (Flashcard Mode)
function renderVocabLessonList() {
    vocabLessonList.innerHTML = '';
    
    lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.onclick = () => loadVocabLesson(lesson.id);
        
        const vocabCount = getVocabularyForLesson(lesson.id).length;
        
        card.innerHTML = `
            <h3>${lesson.title}</h3>
            <div class="lesson-meta">
                <span class="lesson-badge level-${lesson.level}">${lesson.level}</span>
                <span class="lesson-badge">${vocabCount} terms</span>
            </div>
        `;
        
        vocabLessonList.appendChild(card);
    });
}

// Load Lesson (Listening Mode)
function loadLesson(lessonId) {
    currentLesson = lessons.find(l => l.id === lessonId);
    if (!currentLesson) return;
    
    isLooping = false;
    sectionRepeatStart = null;
    sectionRepeatEnd = null;
    isSectionRepeatActive = false;
    
    document.getElementById('lessonTitle').textContent = currentLesson.title;
    document.getElementById('lessonLevel').textContent = currentLesson.level;
    document.getElementById('lessonLevel').className = `lesson-badge level-${currentLesson.level}`;
    document.getElementById('lessonCategory').textContent = currentLesson.category;
    document.getElementById('transcriptText').textContent = currentLesson.text;
    
    // Load vocabulary for this lesson
    const lessonVocab = getVocabularyForLesson(lessonId);
    const vocabList = document.getElementById('vocabularyList');
    vocabList.innerHTML = '';
    
    lessonVocab.forEach(vocabItem => {
        const card = document.createElement('div');
        card.className = 'vocab-card';
        card.innerHTML = `
            <div class="vocab-term">${vocabItem.term}</div>
            <div class="vocab-definition">${vocabItem.definition}</div>
        `;
        vocabList.appendChild(card);
    });
    
    audioElement.src = `assets/audio/${currentLesson.audioFile}`;
    audioElement.load();
    
    lessonSelector.style.display = 'none';
    playerSection.style.display = 'block';
    
    playPauseBtn.innerHTML = '<span class="icon">▶</span> Play';
    loopBtn.innerHTML = '<span class="icon">🔁</span> Loop: Off';
    loopBtn.classList.remove('active');
    progressBar.value = 0;
    updateSectionInfo();
    
    window.scrollTo(0, 0);
}

// Load Vocabulary Lesson (Flashcard Mode)
function loadVocabLesson(lessonId) {
    currentLesson = lessons.find(l => l.id === lessonId);
    if (!currentLesson) return;
    
    // Get vocabulary for this lesson
    currentCards = getVocabularyForLesson(lessonId);
    currentCardIndex = 0;
    isFlipped = false;
    
    flashcardLessonTitle.textContent = currentLesson.title;
    
    vocabLessonSelector.style.display = 'none';
    flashcardSection.style.display = 'block';
    
    displayCard();
    window.scrollTo(0, 0);
}

// Display Current Flashcard
function displayCard() {
    if (currentCards.length === 0) return;
    
    const card = currentCards[currentCardIndex];
    
    cardTerm.textContent = card.term;
    cardDefinition.textContent = card.definition;
    cardExample.textContent = card.example;
    
    cardCounter.textContent = `${currentCardIndex + 1} / ${currentCards.length}`;
    
    // Reset to front
    isFlipped = false;
    flashcardFront.style.display = 'block';
    flashcardBack.style.display = 'none';
    flashcard.classList.remove('flipped');
    
    // Update button states
    prevCardBtn.disabled = currentCardIndex === 0;
    nextCardBtn.disabled = currentCardIndex === currentCards.length - 1;
}

// Flip Card
function flipCard() {
    isFlipped = !isFlipped;
    
    if (isFlipped) {
        flashcardFront.style.display = 'none';
        flashcardBack.style.display = 'block';
        flashcard.classList.add('flipped');
    } else {
        flashcardFront.style.display = 'block';
        flashcardBack.style.display = 'none';
        flashcard.classList.remove('flipped');
    }
}

// Show Previous Card
function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        displayCard();
    }
}

// Show Next Card
function showNextCard() {
    if (currentCardIndex < currentCards.length - 1) {
        currentCardIndex++;
        displayCard();
    }
}

// Shuffle Cards
function shuffleCards() {
    currentCards = currentCards.sort(() => Math.random() - 0.5);
    currentCardIndex = 0;
    displayCard();
}

// Listening Mode Functions
function togglePlayPause() {
    if (audioElement.paused) {
        audioElement.play();
        updatePlayPauseButton(true);
    } else {
        audioElement.pause();
        updatePlayPauseButton(false);
    }
}

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

function setRepeatStart() {
    sectionRepeatStart = audioElement.currentTime;
    updateSectionInfo();
    
    if (sectionRepeatStart !== null && sectionRepeatEnd !== null) {
        repeatSectionBtn.disabled = false;
        clearSectionBtn.disabled = false;
    }
}

function setRepeatEnd() {
    sectionRepeatEnd = audioElement.currentTime;
    
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

function clearSection() {
    sectionRepeatStart = null;
    sectionRepeatEnd = null;
    isSectionRepeatActive = false;
    repeatSectionBtn.disabled = true;
    clearSectionBtn.disabled = true;
    repeatSectionBtn.classList.remove('active');
    updateSectionInfo();
}

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

function handleTimeUpdate() {
    updateProgress();
    
    if (isSectionRepeatActive && sectionRepeatEnd !== null) {
        if (audioElement.currentTime >= sectionRepeatEnd) {
            audioElement.currentTime = sectionRepeatStart;
        }
    }
}

function handleAudioEnded() {
    if (!isLooping && !isSectionRepeatActive) {
        updatePlayPauseButton(false);
        progressBar.value = 0;
    }
}

function updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
        playPauseBtn.innerHTML = '<span class="icon">⏸</span> Pause';
    } else {
        playPauseBtn.innerHTML = '<span class="icon">▶</span> Play';
    }
}

function updateProgress() {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    progressBar.value = progress || 0;
    currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleKeyboardShortcuts(e) {
    if (currentMode === 'listening' && playerSection.style.display !== 'none') {
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
        }
    } else if (currentMode === 'vocabulary' && flashcardSection.style.display !== 'none') {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                flipCard();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                showPreviousCard();
                break;
            case 'ArrowRight':
                e.preventDefault();
                showNextCard();
                break;
        }
    }
}

// Start App
init();