let vibrationInterval = null;

async function startVibrating() {
    if (vibrationInterval !== null) return;

    if ('vibrate' in navigator) {
        navigator.vibrate(200);
        vibrationInterval = setInterval(() => {
            navigator.vibrate(200);
        }, 1000);
    } else {
        console.warn('Vibration API not supported on this device.');
    }
}

function stopVibrating() {
    if (vibrationInterval !== null) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
        console.log('Vibration gestoppt.');
    }
}

document.addEventListener('click', () => {
    if ('vibrate' in navigator) {
        navigator.vibrate(7);
    }
}, { once: true });