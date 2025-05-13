let currentQrCode = null;
let totalSeconds = 0;
let timerInterval = null;
let scanInterval = null;

const video = document.getElementById('video');
const notification = document.getElementById('notification');

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.remove('hidden');
    notification.style.color = isError ? '#ff5252' : '#4caf50';
    setTimeout(() => notification.classList.add('hidden'), 3000);
}
function animateResult(message) {
    const resultEl = document.getElementById('result');
    resultEl.textContent = message;
}
function animateTimerDisplay(content) {
    document.getElementById('timer').textContent = content;
}
function animateTimestamp(content) {
    document.getElementById('timestamp').textContent = content;
}
function scanCameraFrame() {
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/png');

    fetch('/scan_base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
    })
    .then(res => res.json())
    .then(result => {
        console.log(result);
        if (result.message) {
            animateResult("✅ " + result.message);
            showNotification("QR Code détecté !");
            currentQrCode = result.message;
        } else if (result.error) {
            animateResult(result.error);
            showNotification("Erreur : " + result.error, true);
        }
    })
    .catch(() => showNotification("Erreur serveur", true));
}
document.getElementById('start-camera').addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            video.classList.remove('hidden');
            showNotification("Caméra arrière activée !");
            video.addEventListener('loadedmetadata', () => {
                if (!scanInterval) scanInterval = setInterval(scanCameraFrame, 2000);
            });
        })
        .catch(err => {
            console.error("Erreur caméra :", err);
            showNotification("Erreur accès caméra", true);
        });
});
document.getElementById('start-timer').addEventListener('click', () => {
    if (!currentQrCode) return alert("Veuillez scanner un QR Code.");
    if (!timerInterval) {
        const ts = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
        animateTimestamp("Horodatage : " + ts);
        timerInterval = setInterval(() => {
            totalSeconds++;
            let h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            let m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            let s = String(totalSeconds % 60).padStart(2, '0');
            animateTimerDisplay(`Chronomètre : ${h}:${m}:${s}`);
        }, 1000);
    }
});
document.getElementById('pause-timer').addEventListener('click', () => clearInterval(timerInterval));
document.getElementById('stop-timer').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    totalSeconds = 0;
    animateTimerDisplay("Chronomètre : 00:00:00");
    animateTimestamp("Horodatage : Non défini");
});
