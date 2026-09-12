window.addEventListener("load", async () => {
    //AutoLogin
    const adminPW = getCookie("adminPW");

    if (adminPW) {
        const isValid = await checkPassword(adminPW);
        if (isValid) {
            window.location.href = "/panel";
            return;
        } else {
            console.warn("Stored Password for admin is wrong!");
        }
    }

    //AutoFocus
    const inputEl = document.getElementById("inp-admipw");
    if (inputEl) inputEl.focus();
});

document.getElementById("loginButton").addEventListener("click", async (event) => {
    event.preventDefault();
    const adminPW = document.getElementById("inp-admipw").value;
    const errorEl = document.getElementById("non_valid_pw");

    const isValid = await checkPassword(adminPW);

    if (isValid) {
        setCookie("adminPW", adminPW, 365)
        window.location.href = "/panel";
    } else {
        errorEl.classList.remove("invisible");
    }
});

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