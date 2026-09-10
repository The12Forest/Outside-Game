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