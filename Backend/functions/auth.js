const passwd = process.env.passwd || "123ict";

export function adminPasswd() {
    return passwd;
}

export function isAdminReq(req) {
    return req.cookies?.adminPW === passwd;
}

export function adminAuth(req, res, next) {
    if (isAdminReq(req)) return next();
    return res.status(401).json({ ok: false, Reason: "Unauthorized" });
}
