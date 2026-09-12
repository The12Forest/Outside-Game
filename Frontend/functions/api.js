async function checkPassword(password) {
    if (!password) return false;

    try {
        const response = await fetch("/api/admin/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password: password })
        });

        if (!response.ok) return false;

        const data = await response.json();
        return Boolean(data.ok);
    } catch (err) {
        console.error("Login verification failed:", err);
        return false;
    }
}

async function checkPlayCode(code) {
    if (!code) return false;

    try {
        const response = await fetch("/api/code/check/?code=" + code);

        if (!response.ok) return false;

        const data = await response.json();
        return Boolean(data.ok);
    } catch (err) {
        console.error("Code verification failed:", err);
        return false;
    }
}

// --- Server clock sync (clock skew) -------------------------------------
let serverOffset = 0

function serverNow() {
    return Date.now() + serverOffset
}

async function syncServerTime() {
    const t0 = Date.now()
    try {
        const response = await fetch("/api/time/now")
        if (!response.ok) return serverOffset

        const data = await response.json()
        const t1 = Date.now()
        serverOffset = data.serverTime + (t1 - t0) / 2 - t1
    } catch (err) {
        console.error("Time sync failed:", err)
    }
    return serverOffset
}

async function getDeadline() {
    try {
        const response = await fetch("/api/time/deadline")
        if (!response.ok) return null

        const data = await response.json()
        return data.deadline
    } catch (err) {
        console.error("Deadline fetch failed:", err)
        return null
    }
}
