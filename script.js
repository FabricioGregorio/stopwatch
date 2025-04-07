(function () {
    'use strict';

    // Cache DOM elements
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('min');
    const secondsInput = document.getElementById('sec');
    const inputs = Array.from(document.querySelectorAll('.inpTimer'));
    const editButton = document.getElementById('Bedit');
    const confirmButton = document.getElementById('Bconfirm');
    const denyButton = document.getElementById('Bdeny');
    const playButton = document.getElementById('Bplay');
    const pauseButton = document.getElementById('Bpause');
    const stopButton = document.getElementById('Bstop');
    const fullscreenButton = document.getElementById('Bfull');
    const allButtons = Array.from(document.querySelectorAll('#buttons button'));
    const mainContainer = document.getElementById('main');
    const finalCountDisplay = document.getElementById('finalCount');

    // State variables
    let oldHours, oldMinutes, oldSeconds;
    let timerId = null;
    let remainingTime = 0;
    let paused = false;
    let endTime = 0;
    let lastRemainingSec = null;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Utility to show/hide buttons via CSS class
    function toggleButtons(showIds = [], hideIds = []) {
        showIds.forEach(id => document.getElementById(id).classList.remove('hidden'));
        hideIds.forEach(id => document.getElementById(id).classList.add('hidden'));
    }

    // Set initial UI state
    function initializeState() {
        toggleButtons([], ['Bpause']);
        finalCountDisplay.style.display = 'none';
        mainContainer.style.display = 'inline-block';
        document.body.style.backgroundColor = '#242424';
        finalCountDisplay.style.color = '#46FFBE';

        inputs.forEach(input => {
            input.dataset.opacity = 0.7;
            input.style.opacity = 0.7;
            input.readOnly = true;
            input.backgroundColor = '#242424';
            input.focus();
        });
    }

    // Fullscreen toggle
    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    // Enable edit mode
    function enterEditMode() {
        oldHours = hoursInput.value;
        oldMinutes = minutesInput.value;
        oldSeconds = secondsInput.value;

        inputs.forEach(inp => inp.readOnly = false);
        allButtons.forEach(btn => btn.classList.add('hidden'));
        toggleButtons(['Bconfirm', 'Bdeny'], []);
    }

    // Confirm edits
    function confirmEdit() {
        inputs.forEach(inp => inp.readOnly = true);
        toggleButtons(['Bfull', 'Bedit', 'Bstop', 'Bplay'], ['Bconfirm', 'Bdeny']);
    }

    // Deny edits
    function denyEdit() {
        hoursInput.value = oldHours;
        minutesInput.value = oldMinutes;
        secondsInput.value = oldSeconds;

        inputs.forEach(inp => inp.readOnly = true);
        toggleButtons(['Bfull', 'Bedit', 'Bstop', 'Bplay'], ['Bconfirm', 'Bdeny']);
    }

    // Validate numeric inputs
    function validateInputs() {
        [hoursInput, minutesInput, secondsInput].forEach(input => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '');
                let val = parseInt(input.value, 10);
                if (isNaN(val) || val < 0) val = 0;
                if ((input.id === 'min' || input.id === 'sec') && val > 59) val = 59;
                input.value = String(val).padStart(2, '0');
            });
            input.addEventListener('blur', () => {
                input.value = input.value.padStart(2, '0');
            });
        });
    }

    // Update display based on total seconds
    function updateInputs(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        hoursInput.value = String(h).padStart(2, '0');
        minutesInput.value = String(m).padStart(2, '0');
        secondsInput.value = String(s).padStart(2, '0');
        return `${hoursInput.value}:${minutesInput.value}:${secondsInput.value}`;
    }

    // Hide main interface and show final count
    function hideFinalInterface() {
        mainContainer.style.display = 'none';
        finalCountDisplay.style.display = 'flex';
        inputs.forEach(input => {
            input.backgroundColor = '#46FFBE';
        });
    }

    // Play a beep sound
    function playSound(freq, dur = 100) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur / 1000);
    }

    // Tick function using requestAnimationFrame for precision
    function tick() {
        const now = Date.now();
        const diffMs = Math.max(0, endTime - now);
        const remSec = Math.ceil(diffMs / 1000);

        if (lastRemainingSec === null || remSec < lastRemainingSec) {
            if (remSec <= 10 && remSec > 0) {
                hideFinalInterface();
                playSound(100);
            }
            lastRemainingSec = remSec;
        }

        updateInputs(remSec);
        finalCountDisplay.textContent = String(remSec % 60).padStart(2, '0');

        if (diffMs > 0 && !paused) {
            timerId = requestAnimationFrame(tick);
        } else if (!paused) {
            document.body.style.backgroundColor = '#46FFBE';
            finalCountDisplay.style.color = '#242424';
            playSound(1000, 2000);
            setTimeout(initializeState, 2000);
            timerId = null;
        }
    }

    // Start the timer
    function startTimer() {
        inputs.forEach(inp => {
            inp.dataset.opacity = 1;
            inp.style.opacity = 1;
            inp.readOnly = true;
        });
        if (timerId) return;

        const h = parseInt(hoursInput.value, 10) || 0;
        const m = parseInt(minutesInput.value, 10) || 0;
        const s = parseInt(secondsInput.value, 10) || 0;
        remainingTime = h * 3600 + m * 60 + s;

        if (remainingTime <= 0) {
            initializeState();
            return;
        } else {
            toggleButtons(['Bpause'], ['Bplay']);
        }

        paused = false;
        endTime = Date.now() + remainingTime * 1000;
        lastRemainingSec = remainingTime;
        tick();
    }

    // Pause or resume the timer
    function pauseTimer() {
        if (!timerId) return;
        paused = !paused;
        if (paused) {
            const now = Date.now();
            remainingTime = Math.ceil((endTime - now) / 1000);
            cancelAnimationFrame(timerId);
            toggleButtons(['Bplay'], ['Bpause']);
        } else {
            endTime = Date.now() + remainingTime * 1000;
            tick();
            toggleButtons(['Bpause'], ['Bplay']);
        }
    }

    // Stop the timer completely
    function stopTimer() {
        if (timerId) cancelAnimationFrame(timerId);
        timerId = null;
        remainingTime = 0;
        paused = false;
        updateInputs(0);
        initializeState();
    }

    // Attach event listeners
    editButton.addEventListener('click', enterEditMode);
    confirmButton.addEventListener('click', confirmEdit);
    denyButton.addEventListener('click', denyEdit);
    playButton.addEventListener('click', () => paused ? pauseTimer() : startTimer());
    pauseButton.addEventListener('click', pauseTimer);
    stopButton.addEventListener('click', stopTimer);
    fullscreenButton.addEventListener('click', toggleFullscreen);

    validateInputs();
    initializeState();
})();