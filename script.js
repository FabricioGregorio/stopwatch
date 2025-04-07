let oldHoras, oldMin, oldSeg;
let intervalId = null;
let tempoRestante = 0;
let pausado = false;

function estadoInicial() {
    const inputs = document.querySelectorAll('.inpTimer');

    document.getElementById("contagemFinal").style.display = "none";
    document.getElementById("main").style.display = "inline-block";
    document.body.style.backgroundColor = "#242424";
    document.getElementById("contagemFinal").style.color = "#46FFBE";

    inputs.forEach(input => {
        input.dataset.opacity = 0.7;
        input.style.opacity = 0.7;
        input.focus();
    });

    document.getElementById("Bpause").style.display = "none";
}

function fullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
}

function editar() {
    oldHoras = document.getElementById("hours").value;
    oldMin = document.getElementById("min").value;
    oldSeg = document.getElementById("sec").value;
    const inputs = document.querySelectorAll('.inpTimer');
    const confirmButton = document.getElementById('Bconfirm');
    const denyButton = document.getElementById('Bdeny');
    const allButtons = document.querySelectorAll('#buttons button');

    inputs.forEach(input => {
        input.readOnly = false;
        input.focus();
    });

    allButtons.forEach(button => {
        button.style.display = 'none';
    });

    confirmButton.style.display = 'flex';
    denyButton.style.display = 'flex';

    validarInputs();
}

function confirmar() {
    document.getElementById("Bconfirm").style.display = "none";
    document.getElementById("Bdeny").style.display = "none";

    document.getElementById("Bfull").style.display = "flex";
    document.getElementById("Bedit").style.display = "flex";
    document.getElementById("Bstop").style.display = "flex";
    document.getElementById("Bplay").style.display = "flex";

    document.querySelectorAll(".inpTimer").forEach(inp => {
        inp.readOnly = true;
    });
}

function negar() {
    document.getElementById("hours").value = oldHoras;
    document.getElementById("min").value = oldMin;
    document.getElementById("sec").value = oldSeg;

    document.querySelectorAll(".inpTimer").forEach(inp => {
        inp.readOnly = true;
    });

    document.getElementById("Bconfirm").style.display = "none";
    document.getElementById("Bdeny").style.display = "none";

    document.getElementById("Bfull").style.display = "flex";
    document.getElementById("Bedit").style.display = "flex";
    document.getElementById("Bstop").style.display = "flex";
    document.getElementById("Bplay").style.display = "flex";
}

function validarInputs() {
    const hours = document.getElementById("hours");
    const min = document.getElementById("min");
    const sec = document.getElementById("sec");

    [hours, min, sec].forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "");

            let val = parseInt(input.value);
            if (isNaN(val)) val = 0;

            if (input.id === "hours" && val > 23) input.value = 23;
            if ((input.id === "min" || input.id === "sec") && val > 59) input.value = 59;

            if (input.value.length === 1) input.value = "0" + input.value;
            if (input.value.length === 0) input.value = "00";
        });

        input.addEventListener("blur", () => {
            if (input.value.length === 1) input.value = "0" + input.value;
            if (input.value.length === 0) input.value = "00";
        });
    });
}

function iniciar() {
    document.getElementById("Bpause").style.display = "flex";

    const inputs = document.querySelectorAll('.inpTimer');

    inputs.forEach(input => {
        input.dataset.opacity = 1;
        input.style.opacity = 1;
    });

    if (intervalId !== null) return;

    const horas = parseInt(document.getElementById("hours").value) || 0;
    const minutos = parseInt(document.getElementById("min").value) || 0;
    const segundos = parseInt(document.getElementById("sec").value) || 0;

    tempoRestante = (horas * 3600) + (minutos * 60) + segundos;

    if (tempoRestante <= 0) {
        estadoInicial();
        return;
    }

    pausado = false;

    intervalId = setInterval(() => {
        if (pausado === false && tempoRestante > 0) {
            tempoRestante--;
            if (tempoRestante === 10) {
                ocultarInterfaceFinal();
            }
            if (tempoRestante <= 10) {
                tocarSom(100);
            }
        }

        const texto = atualizarInputs(tempoRestante);
        const apenasSeg = texto.split(':')[2];
        document.getElementById("contagemFinal").textContent = apenasSeg;

        if (tempoRestante <= 0) {
            setTimeout(() => {
                estadoInicial();
            }, 2000);
            document.body.style.backgroundColor = "#46FFBE";
            document.getElementById("contagemFinal").style.color = "#242424";
            clearInterval(intervalId);
            intervalId = null;

            tocarSom(1000, 2000);
        }
    }, 1000);
}

function pausar() {
    pausado = !pausado;
}

function parar() {
    clearInterval(intervalId);
    intervalId = null;
    tempoRestante = 0;
    pausado = false;
    atualizarInputs(0);
    estadoInicial();
}

function atualizarInputs(totalSegundos) {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    const hh = String(horas).padStart(2, '0');
    const mm = String(minutos).padStart(2, '0');
    const ss = String(segundos).padStart(2, '0');

    document.getElementById("hours").value = hh;
    document.getElementById("min").value = mm;
    document.getElementById("sec").value = ss;

    return `${hh}:${mm}:${ss}`;
}

function ocultarInterfaceFinal() {
    document.getElementById("main").style.display = "none";
    document.getElementById("contagemFinal").style.display = "flex";
}

function tocarSom(frequencia, duracao = 100) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = frequencia;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duracao / 1000);
}

document.getElementById('Bedit').addEventListener('click', editar);
document.getElementById('Bconfirm').addEventListener('click', confirmar);
document.getElementById('Bdeny').addEventListener('click', negar);
document.getElementById('Bplay').addEventListener('click', iniciar);
document.getElementById('Bpause').addEventListener('click', pausar);
document.getElementById('Bstop').addEventListener('click', parar);
document.getElementById('Bfull').addEventListener('click', fullscreen);