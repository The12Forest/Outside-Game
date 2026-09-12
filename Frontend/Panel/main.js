let nextImageAt
window.addEventListener("load", async () => {
    //AutoLogin
    const adminPW = getCookie("adminPW");

    if (adminPW) {
        const isValid = await checkPassword(adminPW);
        if (!isValid) {
            console.warn("Stored Password for admin is wrong!");
            navigation.navigate("/", { history: "replace" });
            return;
        }
    }
});

