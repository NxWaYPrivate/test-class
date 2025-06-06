let currentQrCode = null;
let totalSeconds = 0;
let timerInterval = null;

const video = document.getElementById('video');
const notification = document.getElementById('notification');

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.remove('hidden');
    notification.style.color = isError ? '#ff5252' : '#4caf50';
    setTimeout(() => notification.classList.add('hidden'), 3000);
}

function animateResult(message) {
    document.getElementById('result').textContent = message;
}

function animateTimerDisplay(content) {
    document.getElementById('timer').textContent = content;
}

function animateTimestamp(content) {
    document.getElementById('timestamp').textContent = content;
}

//  un scan côté client
function simulateScan() {
    fetch('/scan_base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: "fake_base64_data" }),
    })
    .then(res => res.json())
    .then(result => {
        if (result.message && result.timestamp) {
            animateResult("QR Code détecté : " + result.message);
            animateTimestamp("Horodatage : " + result.timestamp);
            showNotification("QR Code détecté à " + result.timestamp);
            currentQrCode = result.message;
        } else {
            animateResult(" Erreur de détection");
            showNotification("Erreur lors du scan", true);
        }
    })
    .catch(() => showNotification("Erreur serveur", true));
}

document.getElementById('start-camera').addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.classList.remove('hidden');
        })
        .catch(err => {
            console.error("Erreur caméra :", err);
            alert("Erreur : accès caméra refusé.");
        });
});

document.getElementById('upload-form').addEventListener('submit', function (e) {
    e.preventDefault();
    simulateScan();
});

document.getElementById('start-timer').addEventListener('click', () => {
    if (!currentQrCode) return alert("Veuillez scanner un QR Code.");
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            totalSeconds++;
            let h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            let m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            let s = String(totalSeconds % 60).padStart(2, '0');
            animateTimerDisplay(`Chronomètre : ${h}:${m}:${s}`);
        }, 1000);
    }
});

document.getElementById('pause-timer').addEventListener('click', () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    } else {
        document.getElementById('start-timer').click();
    }
});

document.getElementById('stop-timer').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    totalSeconds = 0;
    animateTimerDisplay("Chronomètre : 00:00:00");
    animateTimestamp("Horodatage : Non défini");
});
