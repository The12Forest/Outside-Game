window.addEventListener("load", async () => {
    //AutoLogin
    const adminPW = getCookie("adminPW");

    if (adminPW) {
        const isValid = await checkPassword(adminPW);
        if (isValid) {
            navigation.navigate("/panel", { history: "replace" });
            return;
        } else {
            console.warn("Stored Password for admin is wrong!");
        }
    }
});


