window.addEventListener("load", async () => {
    //AutoLogin
    const code = getCookie("code");
    if (code) {
        const isValid = await checkPlayCode(code);
        if (isValid) {
            navigation.navigate("/game");
            return;
        } else {
            delCookie("code")
            console.warn("Stored Password for code is wrong!");
        }
    }
});

document.getElementById("GameCodeForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = document.getElementById("GroupAName").value;
    const isValid = await checkPlayCode(code);

    if (isValid) {
        navigation.navigate("/game");
    } else {
        window.location.href = "/error/?msg=wrong-code&status=401";
    }
});

