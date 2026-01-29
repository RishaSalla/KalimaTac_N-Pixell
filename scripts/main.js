"use strict";

import { getState, resetState, loadState, DEFAULT_STATE, BASE_CATEGORIES, ARABIC_LETTERS } from './state.js';

document.addEventListener("DOMContentLoaded", () => {
    
    // --- [1] تعريف العناصر الأساسية (DOM Elements) ---
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    
    const appContainer = $("#app-container");
    
    // عناصر الدخول (Login)
    const loginInputCode = $("#login-input-code");
    const loginBtnEnter = $("#login-btn-enter");
    const loginErrorMsg = $("#login-error-msg");

    // عناصر الإعدادات واللعبة
    const playerNameXInput = $("#player-name-x"); 
    const playerNameOInput = $("#player-name-o");
    
    const inputTeamXHome = $("#input-team-x-home");
    const inputTeamOHome = $("#input-team-o-home");
    const chipContainerXHome = $("#chip-container-x-home");
    const chipContainerOHome = $("#chip-container-o-home");

    const modeBtnTeamHome = $("#mode-team-home");
    const modeBtnIndividualHome = $("#mode-individual-home");
    
    const timerSelectHome = $("#settings-timer-home"); 
    const roundsSelectHome = $("#settings-rounds-home");
    
    const inputCatsHome = $("#input-cats-home");
    const chipContainerCatsHome = $("#chip-container-cats-home");

    const soundsToggleHome = $("#toggle-sounds-home");
    
    const startGameBtn = $("#start-game-btn"); 
    const resumeGameBtn = $("#resume-game-btn");
    const instructionsBtnHome = $("#open-instructions-home-btn"); 
    
    const roundInfo = $("#round-info");
    const scoreXDisplay = $("#game-scores .score-tag.score-x"); 
    const scoreODisplay = $("#game-scores .score-tag.score-o");
    
    const instructionsBtnGame = $("#open-instructions-game-btn");
    const restartRoundBtn = $("#restart-round-btn"); 
    const endMatchBtn = $("#end-match-btn"); 
    const newRoundBtn = $("#new-round-btn"); 
    
    const playerTagX = $("#player-tag-x");
    const playerTagO = $("#player-tag-o"); 
    const timerText = $("#timer-text"); 
    const timerHint = $("#timer-hint");
    const gameBoard = $("#game-board"); 
    const modalAnswer = $("#modal-answer"); 
    const answerLetter = $("#answer-letter");
    const answerCategory = $("#answer-category"); 
    const answerTimerBar = $("#answer-timer-bar");
    const answerTurnHint = $("#answer-turn-hint"); 
    const answerCorrectBtn = $("#answer-correct-btn");
    const answerWrongBtn = $("#answer-wrong-btn");
    const answerChallengeBtn = $("#answer-challenge-btn");
    
    const finalWinnerText = $("#final-winner-text");
    const finalWinsX = $("#final-wins-x");
    const finalWinsO = $("#final-wins-o");
    
    const newMatchBtn = $("#new-match-btn"); 
    const backToHomeBtn = $("#back-to-home-btn"); 
    const modalConfirmRestart = $("#modal-confirm-restart"); 
    const confirmRestartBtn = $("#confirm-restart-btn");
    const modalCloseBtns = $$(".modal-close-btn"); 
    
    const roundWinnerMessage = $("#round-winner-message");
    const playerXMemberDisplay = $("#player-x-member");
    const playerOMemberDisplay = $("#player-o-member");

    // --- [2] نظام التشفير والدخول (Login System) ---
    
    // دالة مساعدة لتحويل النص إلى SHA-256 Hash
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function handleLogin() {
        if (!loginInputCode) return;
        
        const code = loginInputCode.value.trim();
        if (!code) return;

        // إظهار حالة التحميل (اختياري)
        loginBtnEnter.textContent = "...";
        loginErrorMsg.style.display = 'none';

        try {
            // جلب ملف الإعدادات
            const response = await fetch('config.json?t=' + new Date().getTime()); // إضافة وقت لمنع الكاش
            if (!response.ok) throw new Error("Config not found");
            
            const config = await response.json();
            const hashedCode = await sha256(code);

            // التحقق من الكود
            if (config.valid_hashes.includes(hashedCode)) {
                // دخول ناجح
                localStorage.setItem("risha_access_token", hashedCode); // حفظ التوكن
                loadGameInterface(); // تحميل واجهة اللعبة
            } else {
                // كود خاطئ
                loginErrorMsg.style.display = 'block';
                loginErrorMsg.textContent = "الكود غير صحيح او انتهت صلاحيته";
                if (state.settings.sounds) sounds.fail();
            }
        } catch (error) {
            console.error("Login Error:", error);
            loginErrorMsg.style.display = 'block';
            loginErrorMsg.textContent = "خطأ في الاتصال، حاول مرة اخرى";
        } finally {
            loginBtnEnter.textContent = "دخول";
        }
    }

    // دالة لتحميل واجهة اللعبة الحقيقية بعد الدخول الناجح
    function loadGameInterface() {
        // إذا كان هناك حالة محفوظة، حملها، وإلا اذهب للرئيسية
        if (loadStateFromLocalStorage()) {
            const state = getState();
            if (resumeGameBtn) resumeGameBtn.style.display = "inline-flex";
            if (playerNameXInput) playerNameXInput.value = state.settings.playerNames.X;
            if (playerNameOInput) playerNameOInput.value = state.settings.playerNames.O;
            if (timerSelectHome) timerSelectHome.value = state.settings.secs;
            if (roundsSelectHome) roundsSelectHome.value = state.match.targetWins || 3;
            
            if (modeBtnTeamHome) modeBtnTeamHome.classList.toggle('active', state.settings.playMode === 'team');
            if (modeBtnIndividualHome) modeBtnIndividualHome.classList.toggle('active', state.settings.playMode === 'individual');

            updatePlayerInputLabels(state.settings.playMode);
            renderChips('X'); 
            renderChips('O'); 
            renderChipsCategories();
            
            // إذا كانت اللعبة نشطة، اذهب للعبة مباشرة
            if (state.roundState.gameActive || state.match.round > 1) {
                switchView("home"); // نبدأ بالرئيسية ليقرر المستخدم الاستئناف
            } else {
                switchView("home");
            }
        } else {
            if (modeBtnTeamHome) modeBtnTeamHome.classList.add('active'); 
            updatePlayerInputLabels(DEFAULT_STATE.settings.playMode);
            renderChipsCategories(); 
            switchView("home");
        }
        
        // تشغيل الأصوات
        updateSoundToggles();
        if (state.settings.sounds) sounds.click();
    }


    // --- [3] نظام الصوت (Audio Engine) ---
    let audioCtx;
    const sounds = { 
        click: () => {}, success: () => {}, fail: () => {}, 
        win: () => {}, draw: () => {}, timerTick: () => {} 
    };
    
    // تم تعريف state في النطاق العام لاستخدامه في الدوال
    const state = getState();

    function initAudio() {
        if (audioCtx || !state.settings.sounds) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sounds.click = () => playSound(200, 0.1, 0.05, "triangle");
            sounds.success = () => {
                playSound(523, 0.1, 0.08, "sine");
                playSound(659, 0.1, 0.08, "sine", 0.1);
            };
            sounds.fail = () => {
                playSound(200, 0.1, 0.1, "square");
                playSound(160, 0.1, 0.1, "square", 0.1);
            };
            sounds.win = () => {
                playSound(523, 0.1, 0.1);
                playSound(659, 0.1, 0.1, "sine", 0.1);
                playSound(784, 0.1, 0.1, "sine", 0.2);
                playSound(1046, 0.1, 0.2, "sine", 0.3);
            };
            sounds.draw = () => {
                playSound(440, 0.1, 0.1, "sawtooth");
                playSound(349, 0.1, 0.1, "sawtooth", 0.1);
                playSound(261, 0.1, 0.1, "sawtooth", 0.2);
            };
            sounds.timerTick = () => playSound(440, 0.2, 0.05, "square");

        } catch (e) {
            console.error("Web Audio API not supported.", e);
            state.settings.sounds = false; 
            updateSoundToggles();
        }
    }

    function playSound(freq, gain, duration, type = "sine", delay = 0) { 
        if (!audioCtx || !state.settings.sounds) return; 
        const oscillator = audioCtx.createOscillator(); 
        const gainNode = audioCtx.createGain(); 
        
        oscillator.type = type; 
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay); 
        
        gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + delay); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration); 
        
        oscillator.connect(gainNode); 
        gainNode.connect(audioCtx.destination); 
        
        oscillator.start(audioCtx.currentTime + delay); 
        oscillator.stop(audioCtx.currentTime + delay + duration);
    }

    // --- [4] إدارة شرائح الإدخال (Chips) ---
    function createChip(name, team) {
        const chip = document.createElement('span');
        chip.classList.add('chip');
        chip.textContent = name;
        
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('chip-remove');
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            const index = state.settings.teamMembers[team].indexOf(name);
            if (index > -1) {
                state.settings.teamMembers[team].splice(index, 1);
                renderChips('X'); 
                renderChips('O'); 
                saveStateToLocalStorage();
                if (state.settings.sounds) sounds.click();
            }
        };
        
        chip.appendChild(removeBtn);
        return chip;
    }

    function renderChips(team) {
        const container = (team === 'X' ? chipContainerXHome : chipContainerOHome);
        if (!container) return;
        
        const inputId = `input-team-${team.toLowerCase()}-home`;
        const inputEl = container.querySelector(`#${inputId}`);

        container.querySelectorAll('.chip').forEach(chip => chip.remove());
        
        state.settings.teamMembers[team].forEach(name => { 
            if (inputEl) {
                container.insertBefore(createChip(name, team), inputEl);
            }
        });
    }

    function handleChipInput(event, team, isButton = false) {
        const inputEl = event ? event.target : document.getElementById(`input-team-${team.toLowerCase()}-home`);
        
        if (isButton && !event) {
             const inputId = `input-team-${team.toLowerCase()}-home`;
             const button = document.getElementById(`add-chip-${team.toLowerCase()}-home`);
             if (button) {
                 const input = button.previousElementSibling.querySelector(`#${inputId}`);
                 if (input) inputEl = input;
             }
        }
        
        if (!inputEl) return; 
        const name = inputEl.value.trim();

        if (isButton || (event && (event.key === 'Enter' || event.type === 'blur'))) {
            if (event) event.preventDefault();
            
            if (name && state.settings.teamMembers[team].indexOf(name) === -1) {
                state.settings.teamMembers[team].push(name);
                inputEl.value = ''; 
                renderChips('X'); 
                renderChips('O'); 
                saveStateToLocalStorage();
                if (inputEl) inputEl.focus(); 
            } else if (name) {
                 inputEl.value = ''; 
            }
        }
    }

    // --- [5] إدارة شرائح الفئات ---
    function createChipCategory(name) {
        const chip = document.createElement('span');
        chip.classList.add('chip');
        chip.textContent = name;
        
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('chip-remove');
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            const index = state.settings.extraCats.indexOf(name);
            if (index > -1) {
                state.settings.extraCats.splice(index, 1);
                renderChipsCategories(); 
                saveStateToLocalStorage();
                if (state.settings.sounds) sounds.click();
            }
        };
        chip.appendChild(removeBtn);
        return chip;
    }

    function renderChipsCategories() {
        if (!chipContainerCatsHome) return;
        const inputEl = chipContainerCatsHome.querySelector('#input-cats-home');
        chipContainerCatsHome.querySelectorAll('.chip').forEach(chip => chip.remove());
        
        state.settings.extraCats.forEach(name => { 
            if (inputEl) {
                chipContainerCatsHome.insertBefore(createChipCategory(name), inputEl);
            }
        });
    }

    function handleChipInputCategories(isButton = false, event = null) {
        const inputEl = $("#input-cats-home");
        if (!inputEl) return;
        const name = inputEl.value.trim();

        if (isButton || (event && (event.key === 'Enter' || event.type === 'blur'))) {
            if (event) event.preventDefault();
            
            if (name && state.settings.extraCats.indexOf(name) === -1 && BASE_CATEGORIES.indexOf(name) === -1) {
                state.settings.extraCats.push(name);
                inputEl.value = '';
                renderChipsCategories();
                saveStateToLocalStorage();
                if (inputEl) inputEl.focus();
            } else if (name) {
                inputEl.value = ''; 
            }
        }
    }
    
    // --- [6] إدارة الواجهة ---
    function switchView(viewName) { 
        window.scrollTo(0, 0); 
        appContainer.setAttribute("data-view", viewName); 
    }

    function toggleModal(modalId) { 
        $$(".modal-overlay.visible").forEach(modal => modal.classList.remove("visible")); 
        if (modalId) { 
            const modal = $(`#${modalId}`); 
            if (modal) { 
                modal.classList.add("visible"); 
                if (modalId === 'modal-final-score') loadFinalScores(); 
            } 
        }
    }
    
    function loadFinalScores() { 
        if (finalWinnerText) finalWinnerText.textContent = "انهاء اللعبة"; 
        if (finalWinsX) finalWinsX.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X} فوز`; 
        if (finalWinsO) finalWinsO.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O} فوز`;
    }
    
    function updatePlayerInputLabels(mode) {
        const isTeam = mode === 'team';
        $$('.team-members-group').forEach(group => group.style.display = isTeam ? 'flex' : 'none');
        $$('.team-name-group').forEach(group => {
            const isX = group.querySelector('#player-name-x');
            const nameInput = isX ? playerNameXInput : playerNameOInput;
            const placeholderText = isX 
                ? (isTeam ? 'اسم فريق X' : 'اسم لاعب X') 
                : (isTeam ? 'اسم فريق O' : 'اسم لاعب O');
            if (nameInput) nameInput.placeholder = placeholderText;
        });
        renderChips('X'); 
        renderChips('O'); 
    }
    
    function togglePlayMode(specificMode = null) {
        initAudio(); 
        const teamBtn = document.getElementById('mode-team-home');
        const individualBtn = document.getElementById('mode-individual-home');
        
        const currentMode = state.settings.playMode;
        const newMode = specificMode || (currentMode === 'team' ? 'individual' : 'team');
        
        if (currentMode === newMode && specificMode !== null) return; 

        state.settings.playMode = newMode; 
        
        [teamBtn, individualBtn].forEach(btn => { if (btn) btn.classList.remove('active'); });
        if (newMode === 'team' && teamBtn) teamBtn.classList.add('active');
        if (newMode === 'individual' && individualBtn) individualBtn.classList.add('active');
        
        updatePlayerInputLabels(newMode); 
        saveStateToLocalStorage();
        if (state.settings.sounds) sounds.click();
    }
    
    function updateSoundToggles() { 
        const active = state.settings.sounds; 
        if (soundsToggleHome) {
            soundsToggleHome.setAttribute("data-active", active); 
        }
    }

    function toggleSounds() { 
        initAudio(); 
        state.settings.sounds = !state.settings.sounds; 
        updateSoundToggles(); 
        if (state.settings.sounds) { initAudio(); sounds.success(); } 
        saveStateToLocalStorage();
    }
    
    function updateScoreboard() { 
        const targetWins = state.match.targetWins || 3;
        if (roundInfo) roundInfo.textContent = `الجولة ${state.match.round} (الهدف: ${targetWins} فوز)`; 
        if (scoreXDisplay) scoreXDisplay.textContent = `${state.settings.playerNames.X}: ${state.match.totalScore.X}`; 
        if (scoreODisplay) scoreODisplay.textContent = `${state.settings.playerNames.O}: ${state.match.totalScore.O}`;
    }
    
    function updateTeamMemberDisplay() {
        const isTeam = state.settings.playMode === 'team';
        if (!isTeam) {
            if (playerXMemberDisplay) playerXMemberDisplay.textContent = "";
            if (playerOMemberDisplay) playerOMemberDisplay.textContent = "";
            return;
        }
        const memberX = state.settings.teamMembers.X[state.roundState.teamMemberIndex.X] || '';
        const memberO = state.settings.teamMembers.O[state.roundState.teamMemberIndex.O] || '';

        if (playerXMemberDisplay) playerXMemberDisplay.textContent = memberX ? `(${memberX})` : '';
        if (playerOMemberDisplay) playerOMemberDisplay.textContent = memberO ? `(${memberO})` : '';
    }

    function updatePlayerTags() { 
        if (playerTagX && playerTagX.querySelector('.player-name-text')) playerTagX.querySelector('.player-name-text').textContent = state.settings.playerNames.X; 
        if (playerTagO && playerTagO.querySelector('.player-name-text')) playerTagO.querySelector('.player-name-text').textContent = state.settings.playerNames.O; 
        updateTeamMemberDisplay();
    }

    function updateTurnUI() { 
        const currentPlayer = state.roundState.phase || state.roundState.starter; 
        const teamName = state.settings.playerNames[currentPlayer]; 
        
        let memberName = "";
        if (state.settings.playMode === 'team') {
            const members = state.settings.teamMembers[currentPlayer];
            if (members && members.length > 0) {
                const memberIndex = state.roundState.teamMemberIndex[currentPlayer];
                memberName = members[memberIndex] || '';
            }
        }

        if (timerText) timerText.textContent = memberName ? `دور ${teamName} (${memberName})` : `دور ${teamName}`;
        
        if (playerTagX) playerTagX.classList.toggle("active", currentPlayer === "X"); 
        if (playerTagO) playerTagO.classList.toggle("active", currentPlayer === "O"); 
        
        updateTeamMemberDisplay(); 
        renderBoardAvailability(currentPlayer);
    }
    
    function advanceTeamMember(player) {
        const members = state.settings.teamMembers[player];
        if (members && members.length > 0) {
            let currentIndex = state.roundState.teamMemberIndex[player];
            currentIndex = (currentIndex + 1) % members.length;
            state.roundState.teamMemberIndex[player] = currentIndex;
        } else {
            state.roundState.teamMemberIndex[player] = 0;
        }
    }

    // --- [7] منطق اللعبة (Game Logic) ---
    function getNewCombination(retries = 50) {
        if (!state.match.usedCombinations) state.match.usedCombinations = [];
        
        const allCats = [...BASE_CATEGORIES, ...state.settings.extraCats];
        if (allCats.length === 0) allCats.push("إنسان", "حيوان", "جماد"); 
        
        for (let i = 0; i < retries; i++) {
            const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
            let availableCats = [...new Set(allCats)];
            if (['ض', 'ظ'].includes(letter)) {
                availableCats = availableCats.filter(cat => cat !== 'نبات');
            }
            if (availableCats.length === 0) availableCats = ['إنسان', 'حيوان', 'جماد', 'بلاد'];
            
            const category = availableCats[Math.floor(Math.random() * availableCats.length)];
            const comboKey = `${letter}|${category}`;
            
            if (!state.match.usedCombinations.includes(comboKey)) {
                state.match.usedCombinations.push(comboKey); 
                return { letter, category };
            }
        }
        const letter = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
        const category = allCats[Math.floor(Math.random() * allCats.length)];
        return { letter, category };
    }

    function startNewMatch() { 
        initAudio(); 
        state.settings.secs = parseInt(timerSelectHome.value, 10); 
        state.match.targetWins = parseInt(roundsSelectHome.value, 10);
        state.match.totalRounds = 3; 
        
        const activeModeBtn = document.querySelector('#mode-selector-wrapper .mode-btn.active');
        state.settings.playMode = activeModeBtn ? activeModeBtn.getAttribute('data-mode') : 'team';
        
        const isTeam = state.settings.playMode === 'team';
        const defaultX = isTeam ? "فريق X" : "لاعب X";
        const defaultO = isTeam ? "فريق O" : "لاعب O";
        
        let nameX = playerNameXInput.value.trim() || defaultX; 
        let nameO = playerNameOInput.value.trim() || defaultO; 

        if (nameX === nameO) nameO = `${nameO} (2)`; 
        state.settings.playerNames.X = nameX; 
        state.settings.playerNames.O = nameO; 
        
        resetState(); 
        state.match.targetWins = parseInt(roundsSelectHome.value, 10); 

        if (timerHint) timerHint.textContent = `${state.settings.secs} ثوان`; 
        initNewRound(); 
        updatePlayerTags(); 
        switchView("game"); 
        sounds.click();
    }

    function initNewRound(isRestart = false) { 
        stopTimer(); 
        if (roundWinnerMessage) roundWinnerMessage.style.display = 'none'; 
        if (!isRestart) { state.roundState.starter = (state.match.round % 2 === 1) ? "X" : "O"; } 
        state.roundState.phase = null; 
        state.roundState.activeCell = null; 
        state.roundState.gameActive = true; 
        state.roundState.winInfo = null; 
        state.roundState.scores = { X: 0, O: 0 }; 
        
        if (!isRestart) {
            state.roundState.teamMemberIndex = { X: 0, O: 0 };
        }

        generateBoard(); 
        renderBoard(); 
        updateScoreboard(); 
        updateTurnUI(); 
        
        if (newRoundBtn) newRoundBtn.style.display = 'none'; 
        if (restartRoundBtn) restartRoundBtn.style.display = 'inline-flex'; 
        if (endMatchBtn) endMatchBtn.style.display = 'inline-flex'; 

        saveStateToLocalStorage();
    }
    
    function generateBoard() { 
        state.roundState.board = []; 
        for (let i = 0; i < 9; i++) { 
            const { letter, category } = getNewCombination(); 
            state.roundState.board.push({ 
                letter: letter, 
                category: category, 
                owner: null, 
                revealed: false, 
                tried: new Set() 
            }); 
        }
    }
    function renderBoardAvailability(currentPlayer) { 
        $$(".board-cell").forEach((cellEl, index) => { 
            const cell = state.roundState.board[index]; 
            if (cell.owner || cell.revealed) { 
                cellEl.classList.remove("available"); 
                cellEl.classList.add("unavailable"); 
            } else { 
                if (state.roundState.phase === null) { 
                    cellEl.classList.add("available"); 
                    cellEl.classList.remove("unavailable"); 
                } else { 
                    cellEl.classList.remove("available"); 
                    cellEl.classList.add("unavailable"); 
                } 
            } 
        });
    }
    
    function renderBoard() { 
        if (!gameBoard) return;
        gameBoard.innerHTML = ''; 
        
        state.roundState.board.forEach((cell, index) => { 
            const cellEl = document.createElement('div'); 
            cellEl.classList.add('board-cell'); 
            cellEl.dataset.index = index; 
            
            if (cell.owner) { 
                cellEl.classList.add('owned', `player-${cell.owner.toLowerCase()}`); 
            } else { 
                const letterEl = document.createElement('span'); 
                letterEl.classList.add('cell-letter'); 
                const categoryEl = document.createElement('span'); 
                categoryEl.classList.add('cell-category');
                
                letterEl.textContent = cell.letter; 
                categoryEl.textContent = cell.category; 
                
                if (cell.revealed) cellEl.classList.add('revealed'); 
                
                cellEl.appendChild(letterEl); 
                cellEl.appendChild(categoryEl); 
            } 
            
            cellEl.addEventListener('click', onCellClick); 
            gameBoard.appendChild(cellEl); 
        }); 
        
        if (state.roundState.winInfo) { 
            drawWinLine(state.roundState.winInfo.line); 
        } 
        
        renderBoardAvailability(state.roundState.phase || state.roundState.starter);
    }
    
    function onCellClick(e) { 
        if (!state.roundState.gameActive || state.roundState.phase !== null) { 
            if (state.settings.sounds) sounds.fail(); 
            return; 
        } 
        const cellIndex = parseInt(e.currentTarget.dataset.index, 10); 
        const cell = state.roundState.board[cellIndex]; 
        if (cell.owner) { 
            if (state.settings.sounds) sounds.fail(); 
            return; 
        } 
        if (state.settings.sounds) sounds.click(); 
        stopTimer(); 
        state.roundState.activeCell = cellIndex; 
        state.roundState.phase = state.roundState.starter; 
        cell.revealed = true; 
        cell.tried = new Set(); 
        renderBoard(); 
        updateTurnUI(); 
        
        if (answerLetter) answerLetter.textContent = cell.letter; 
        if (answerCategory) answerCategory.textContent = cell.category; 
        if (answerTurnHint) answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`; 
        
        if (answerTimerBar) answerTimerBar.style.opacity = "1";
        
        toggleModal("modal-answer"); 
        startAnswerTimer();
    }

    function handleChallenge() {
        stopTimer(); 
        if (answerTimerBar) answerTimerBar.style.opacity = "0.3"; 
        if (answerTurnHint) {
            answerTurnHint.textContent = "⏸️ الوقت متوقف مؤقتا (بحث/اعتراض)";
        }
        if (state.settings.sounds) sounds.click();
    }

    function handleAnswer(isCorrect) { 
        stopTimer(); 
        const cellIndex = state.roundState.activeCell;
        if (cellIndex === null || !state.roundState.board[cellIndex]?.revealed) return; 
        const cell = state.roundState.board[cellIndex];
        const currentPlayer = state.roundState.phase;
        let turnOver = false; 
        let closeModalNow = true;

        if (isCorrect) {
            if (state.settings.sounds) sounds.success();
            cell.owner = currentPlayer;
            cell.revealed = false;
            state.roundState.scores[currentPlayer]++; 
            
            if (state.settings.playMode === 'team') {
                 advanceTeamMember(currentPlayer);
            }
            
            state.roundState.starter = (currentPlayer === "X") ? "O" : "X";
            turnOver = true; 
            const winCheck = checkWinCondition();
            if (winCheck.isWin) { endRound(currentPlayer, winCheck.line); } 
            else if (checkDrawCondition()) { endRound(null); }
        } else {
            if (state.settings.sounds) sounds.fail();
            if (!cell.tried) cell.tried = new Set();
            cell.tried.add(currentPlayer);
            if (cell.tried.size === 1) {
                state.roundState.phase = (currentPlayer === "X") ? "O" : "X";
                cell.revealed = true; 
                updateTurnUI(); 
                if (answerTurnHint) answerTurnHint.textContent = `دور ${state.settings.playerNames[state.roundState.phase]}.`;
                closeModalNow = false; 
                if (answerTimerBar) answerTimerBar.style.opacity = "1";
                startAnswerTimer(); 
            } else {
                cell.revealed = false; 
                const oldComboKey = `${cell.letter}|${cell.category}`;
                if (state.match.usedCombinations) {
                    state.match.usedCombinations = state.match.usedCombinations.filter(c => c !== oldComboKey);
                }
                const { letter: newLetter, category: newCategory } = getNewCombination();
                cell.letter = newLetter;
                cell.category = newCategory;

                cell.tried.clear(); 
                if (state.settings.playMode === 'team') {
                     advanceTeamMember(state.roundState.starter);
                }
                state.roundState.starter = (currentPlayer === "X") ? "O" : "X";
                turnOver = true; 
            }
        }

        if(closeModalNow) { toggleModal(null); }
        if (turnOver) { state.roundState.activeCell = null; state.roundState.phase = null; }

        if (state.roundState.gameActive) { 
            renderBoard(); 
            updateTurnUI(); 
            updateScoreboard(); 
            if(turnOver) { saveStateToLocalStorage(); } 
        } else { 
            saveStateToLocalStorage(); 
        } 
    }

    function checkWinCondition() { 
        const board = state.roundState.board; 
        const winLines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ]; 
        for (const line of winLines) { 
            const [a, b, c] = line; 
            if (board[a].owner && board[a].owner === board[b].owner && board[a].owner === board[c].owner) return { isWin: true, line: line }; 
        } 
        return { isWin: false, line: null };
    }
    function checkDrawCondition() { 
        return state.roundState.board.every(cell => cell.owner); 
    }
    
    function endRound(winner, line = null) { 
        stopTimer(); 
        state.roundState.gameActive = false; 
        
        if (winner) { 
            state.match.totalScore[winner]++; 
            state.roundState.winInfo = { winner, line }; 
            if (roundWinnerMessage) {
                roundWinnerMessage.textContent = `الفائز بالجولة: ${state.settings.playerNames[winner]}! 🎉`; 
                roundWinnerMessage.style.color = (winner === 'X') ? 'var(--player-x-color)' : 'var(--player-o-color)';
                roundWinnerMessage.style.borderColor = (winner === 'X') ? 'var(--player-x-color)' : 'var(--player-o-color)';
                roundWinnerMessage.style.display = 'block';
            }

            renderBoard(); 
            setTimeout(() => { 
                drawWinLine(line);
                if (state.settings.sounds) sounds.win(); 
            }, 50); 
        } else { 
            if (state.settings.sounds) sounds.draw(); 
            if (roundWinnerMessage) {
                roundWinnerMessage.textContent = `تعادل! 🤝`;
                roundWinnerMessage.style.color = 'var(--text-color)';
                roundWinnerMessage.style.borderColor = 'var(--text-color)';
                roundWinnerMessage.style.display = 'block';
            }
        } 
        
        updateScoreboard(); 

        const targetWins = state.match.targetWins || 3;
        const matchWinner = (state.match.totalScore.X >= targetWins) ? 'X' : (state.match.totalScore.O >= targetWins) ? 'O' : null;

        if (matchWinner) {
            if (roundWinnerMessage) roundWinnerMessage.textContent = `🏆 الفائز بالمباراة: ${state.settings.playerNames[matchWinner]}! 🏆`;
            if (newRoundBtn) newRoundBtn.style.display = 'none';
            if (restartRoundBtn) restartRoundBtn.style.display = 'none';
            if (endMatchBtn) endMatchBtn.style.display = 'none';
            setTimeout(() => { toggleModal("modal-final-score"); }, 2500);
        } else {
            state.match.round++; 
            if (newRoundBtn) newRoundBtn.style.display = 'inline-flex'; 
            if (restartRoundBtn) restartRoundBtn.style.display = 'none'; 
            if (endMatchBtn) endMatchBtn.style.display = 'inline-flex'; 
        }
        
        saveStateToLocalStorage();
    }

    function drawWinLine(line) { 
        const cellElements = $$(".board-cell"); 
        if (!cellElements || cellElements.length === 0) return; 
        const startCell = cellElements[line[0]]; 
        const endCell = cellElements[line[2]]; 
        const lineEl = document.createElement('div'); 
        lineEl.classList.add('win-line'); 
        const startX = startCell.offsetLeft + startCell.offsetWidth / 2; 
        const startY = startCell.offsetTop + startCell.offsetHeight / 2; 
        const endX = endCell.offsetLeft + endCell.offsetWidth / 2; 
        const endY = endCell.offsetTop + endCell.offsetHeight / 2; 
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI); 
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)); 
        lineEl.style.width = `${length}px`; 
        lineEl.style.top = `${startY}px`; 
        lineEl.style.left = `${startX}px`; 
        lineEl.style.transform = `rotate(${angle}deg) translateY(-50%)`; 
        if (gameBoard) gameBoard.appendChild(lineEl);
    }
    
    function endMatchAndStartNew() { 
        toggleModal(null); 
        resetState(); 
        
        if (playerNameXInput) playerNameXInput.value = state.settings.playerNames.X;
        if (playerNameOInput) playerNameOInput.value = state.settings.playerNames.O;
        if (timerSelectHome) timerSelectHome.value = state.settings.secs;
        if (roundsSelectHome) roundsSelectHome.value = state.match.targetWins || 3;
        
        renderChipsCategories(); 
        updateSoundToggles(); 
        switchView("home"); 
        
        if (modeBtnTeamHome) modeBtnTeamHome.classList.toggle('active', state.settings.playMode === 'team');
        if (modeBtnIndividualHome) modeBtnIndividualHome.classList.toggle('active', state.settings.playMode === 'individual');

        updatePlayerInputLabels(state.settings.playMode);
        
        localStorage.removeItem("ticTacCategoriesGameState"); 
        if (resumeGameBtn) resumeGameBtn.style.display = "none";
    }
    
    function backToHomeWithSave() { 
        toggleModal(null); 
        switchView("home"); 
        if (resumeGameBtn) resumeGameBtn.style.display = "inline-flex";
    }

    // --- [8] المؤقت ---
    function startAnswerTimer() { 
        stopTimer(); 
        const duration = state.settings.secs * 1000; 
        state.timer.deadline = Date.now() + duration; 
        if (answerTimerBar) { 
            answerTimerBar.style.setProperty('--timer-duration', `${state.settings.secs}s`); 
            answerTimerBar.classList.remove("animating"); 
            void answerTimerBar.offsetWidth; 
            answerTimerBar.classList.add("animating"); 
        } 
        state.timer.intervalId = setInterval(() => { 
            const remaining = state.timer.deadline - Date.now(); 
            if (remaining <= 0) { 
                stopTimer(); 
                if (modalAnswer && modalAnswer.classList.contains("visible")) { 
                    if (state.settings.sounds) sounds.fail(); 
                    handleAnswer(false); 
                } 
            } else if (remaining <= 3000 && (remaining % 1000 < 100)) { 
                if (state.settings.sounds) sounds.timerTick(); 
            } 
        }, 100);
    }
    function stopTimer() { 
        if (state.timer.intervalId) { 
            clearInterval(state.timer.intervalId); 
            state.timer.intervalId = null; 
        } 
        if (answerTimerBar) answerTimerBar.classList.remove("animating");
    }
    
    // --- [9] الحفظ والاستئناف ---
    function saveStateToLocalStorage() { 
        const stateToSave = JSON.parse(JSON.stringify(state)); 
        stateToSave.timer = DEFAULT_STATE.timer; 
        stateToSave.roundState.activeCell = null; 
        stateToSave.roundState.phase = null; 
        stateToSave.roundState.teamMemberIndex = state.roundState.teamMemberIndex;

        if (state.match.usedCombinations) {
            stateToSave.match.usedCombinations = Array.from(state.match.usedCombinations);
        } else {
            stateToSave.match.usedCombinations = [];
        }
        stateToSave.roundState.board.forEach(cell => { 
            if (cell.tried instanceof Set) { cell.tried = Array.from(cell.tried); } 
            else { cell.tried = []; } 
        }); 
        localStorage.setItem("ticTacCategoriesGameState", JSON.stringify(stateToSave));
    }
    
    function loadStateFromLocalStorage() { 
        const savedState = localStorage.getItem("ticTacCategoriesGameState"); 
        if (savedState) { 
            try { 
                const loadedState = JSON.parse(savedState);
                const mergedState = JSON.parse(JSON.stringify(DEFAULT_STATE)); 
                
                mergedState.settings.playMode = loadedState.settings.playMode || DEFAULT_STATE.settings.playMode;
                mergedState.settings.teamMembers = loadedState.settings.teamMembers || DEFAULT_STATE.settings.teamMembers;
                
                Object.assign(mergedState.settings, loadedState.settings); 
                Object.assign(mergedState.match, loadedState.match); 
                Object.assign(mergedState.roundState, loadedState.roundState); 
                
                mergedState.match.usedCombinations = loadedState.match.usedCombinations || [];

                mergedState.roundState.board.forEach(cell => { cell.tried = new Set(cell.tried || []); }); 
                mergedState.roundState.teamMemberIndex = loadedState.roundState.teamMemberIndex || DEFAULT_STATE.roundState.teamMemberIndex; 
                
                if (!mergedState.match.totalScore) { mergedState.match.totalScore = { X: 0, O: 0 }; } 
                loadState(mergedState); 
                return true; 
            } catch (e) { 
                console.error("Failed to parse saved state:", e); 
                localStorage.removeItem("ticTacCategoriesGameState"); 
                return false; 
            } 
        } 
        return false;
    }

    // --- [10] تهيئة اللعبة (Initialization) ---
    function initializeGame() {
        // [تعديل] التحقق من التوكن أولاً
        const accessToken = localStorage.getItem("risha_access_token");
        
        if (!accessToken) {
            // لا يوجد توكن -> اعرض شاشة الدخول
            switchView("login");
        } else {
            // يوجد توكن -> حمل اللعبة
            loadGameInterface();
        }
    }

    // --- [11] ربط الأحداث ---
    function initEventListeners() { 
        if (loginBtnEnter) loginBtnEnter.addEventListener("click", handleLogin);
        if (loginInputCode) {
            loginInputCode.addEventListener("keypress", (e) => {
                if (e.key === "Enter") handleLogin();
            });
        }

        if (startGameBtn) startGameBtn.addEventListener("click", startNewMatch); 
        if (resumeGameBtn) resumeGameBtn.addEventListener("click", () => {
             // عند استئناف اللعبة، فقط قم بتحميل الواجهة
             loadGameInterface(); 
        });
        if (soundsToggleHome) soundsToggleHome.addEventListener("click", toggleSounds); 
        if (instructionsBtnHome) instructionsBtnHome.addEventListener("click", () => { initAudio(); if (state.settings.sounds) sounds.click(); toggleModal("modal-instructions"); }); 
        
        if (instructionsBtnGame) instructionsBtnGame.addEventListener("click", () => { initAudio(); if (state.settings.sounds) sounds.click(); toggleModal("modal-instructions"); }); 
        if (newRoundBtn) newRoundBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.click(); initNewRound(false); }); 
        if (restartRoundBtn) restartRoundBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.fail(); toggleModal("modal-confirm-restart"); }); 
        if (endMatchBtn) endMatchBtn.addEventListener("click", () => { if (state.settings.sounds) sounds.fail(); toggleModal("modal-final-score"); }); 
        if (answerCorrectBtn) answerCorrectBtn.addEventListener("click", () => handleAnswer(true)); 
        if (answerWrongBtn) answerWrongBtn.addEventListener("click", () => handleAnswer(false)); 
        if (answerChallengeBtn) answerChallengeBtn.addEventListener("click", handleChallenge);
        
        if (newMatchBtn) newMatchBtn.addEventListener("click", endMatchAndStartNew); 
        if (backToHomeBtn) backToHomeBtn.addEventListener("click", backToHomeWithSave);
        
        if (confirmRestartBtn) confirmRestartBtn.addEventListener("click", () => { toggleModal(null); if (state.settings.sounds) sounds.click(); initNewRound(true); }); 
        
        modalCloseBtns.forEach(btn => { 
            btn.addEventListener("click", (e) => { 
                const modalId = e.currentTarget.dataset.modal; 
                if (modalId) { toggleModal(null); if (state.settings.sounds) sounds.click(); } 
            }); 
        }); 
        
        $$(".modal-overlay").forEach(modal => { 
            modal.addEventListener("click", (e) => { 
                if (e.target === modal && modal.id !== 'modal-answer') { 
                    toggleModal(null); 
                    if (state.settings.sounds) sounds.click(); 
                } 
            }); 
        });
        
        if (modeBtnTeamHome) modeBtnTeamHome.addEventListener("click", () => togglePlayMode('team'));
        if (modeBtnIndividualHome) modeBtnIndividualHome.addEventListener("click", () => togglePlayMode('individual'));

        const chipBtnX = document.getElementById("add-chip-x-home");
        if (chipBtnX) chipBtnX.addEventListener("click", () => handleChipInput({target: inputTeamXHome, key: 'Enter'}, 'X', false));
        const chipBtnO = document.getElementById("add-chip-o-home");
        if (chipBtnO) chipBtnO.addEventListener("click", () => handleChipInput({target: inputTeamOHome, key: 'Enter'}, 'O', false));
        const chipBtnCats = document.getElementById("add-chip-cats-home");
        if (chipBtnCats) chipBtnCats.addEventListener("click", () => handleChipInputCategories(true, null));

        if (inputTeamXHome) inputTeamXHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleChipInput(e, 'X', false); });
        if (inputTeamXHome) inputTeamXHome.addEventListener('blur', (e) => handleChipInput(e, 'X', false));
        if (inputTeamOHome) inputTeamOHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleChipInput(e, 'O', false); });
        if (inputTeamOHome) inputTeamOHome.addEventListener('blur', (e) => handleChipInput(e, 'O', false));
        if (inputCatsHome) inputCatsHome.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleChipInputCategories(false, e); });
        if (inputCatsHome) inputCatsHome.addEventListener('blur', (e) => handleChipInputCategories(false, e));
    }

    // بدء التطبيق
    initEventListeners();
    initializeGame();
});
