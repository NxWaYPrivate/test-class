let currentQrCode = null;
let totalSeconds = 0;
let timerInterval = null;
let scanInterval = null;

// Initialiser la vidéo
const video = document.getElementById('video');
const notification = document.getElementById('notification');

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.classList.remove('hidden');
    notification.style.color = isError ? '#ff5252' : '#4caf50'; // rouge ou vert
    setTimeout(() => notification.classList.add('hidden'), 3000); // cache après 3s
}

// Animations
document.getElementById('result').style.transition = 'opacity 0.3s';
document.getElementById('timer').style.transition = 'transform 0.15s';
document.getElementById('timestamp').style.transition = 'opacity 0.3s';

function animateResult(message) {
    const resultEl = document.getElementById('result');
    resultEl.style.opacity = 0;
    setTimeout(() => {
        resultEl.textContent = message;
        resultEl.style.opacity = 1;
    }, 300);
}

function animateTimerDisplay(content) {
    const timerEl = document.getElementById('timer');
    timerEl.style.transform = 'scale(1.1)';
    timerEl.textContent = content;
    setTimeout(() => {
        timerEl.style.transform = 'scale(1)';
    }, 150);
}

function animateTimestamp(content) {
    const timestampEl = document.getElementById('timestamp');
    timestampEl.style.opacity = 0.5;
    timestampEl.textContent = content;
    setTimeout(() => {
        timestampEl.style.opacity = 1;
    }, 300);
}

function toggleLoader(show) {
    const loader = document.getElementById('loader');
    loader.classList.toggle('hidden', !show);
}

// Scan caméra
function scanCameraFrame() {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Vidéo pas prête...");
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    toggleLoader(true);
    fetch('/scan_base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
    })
    .then(response => response.json())
    .then(result => {
        toggleLoader(false);
        if (result.message) {
            animateResult("✅ " + result.message);
            showNotification("QR Code détecté !");
            currentQrCode = result.message.split(': ')[1];
        } else if (result.error) {
            animateResult(result.error);
        }
    })
    .catch(error => {
        console.error('Erreur QR :', error);
        toggleLoader(false);
    });
}

// Activer caméra
document.getElementById('start-camera').addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.classList.remove('hidden');
            showNotification("Caméra activée !");
            video.addEventListener('loadedmetadata', () => {
                if (!scanInterval) {
                    scanInterval = setInterval(scanCameraFrame, 2000);
                }
            });
        })
        .catch(err => {
            console.error("Erreur caméra :", err);
            showNotification("Erreur accès caméra", true);
        });
});

// Chrono
document.getElementById('start-timer').addEventListener('click', () => {
    if (!currentQrCode) {
        alert("Veuillez scanner un QR Code avant de commencer.");
        return;
    }
    if (!timerInterval) {
        animateTimestamp(`Horodatage : ${new Date().toLocaleString()}`);
        timerInterval = setInterval(() => {
            totalSeconds++;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            animateTimerDisplay(`Chronomètre : ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
    }
});

// Pause / Reprendre
document.getElementById('pause-timer').addEventListener('click', async () => {
    if (!currentQrCode) {
        alert("Aucun QR Code détecté.");
        return;
    }
    try {
        const response = await fetch('/pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_name: currentQrCode }),
        });
        const result = await response.json();
        alert(result.message || result.error);
        if (result.message.includes("Pause commencée")) {
            clearInterval(timerInterval);
            timerInterval = null;
        } else if (result.message.includes("Pause terminée")) {
            if (!timerInterval) {
                timerInterval = setInterval(() => {
                    totalSeconds++;
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    animateTimerDisplay(`Chronomètre : ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Erreur pause :', error);
    }
});

// Stop session
document.getElementById('stop-timer').addEventListener('click', async () => {
    if (!currentQrCode) {
        alert("Aucun QR Code détecté.");
        return;
    }
    try {
        const response = await fetch('/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_name: currentQrCode }),
        });
        const result = await response.json();
        alert(result.message || result.error);
        clearInterval(timerInterval);
        timerInterval = null;
        totalSeconds = 0;
        animateTimerDisplay("Chronomètre : 00:00:00");
        animateTimestamp("Horodatage : Non défini");
        currentQrCode = null;
    } catch (error) {
        console.error('Erreur fin session :', error);
    }
});
