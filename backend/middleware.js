const jwt = require("jsonwebtoken")

// Vérifie le JWT dans Authorization: Bearer <token>
// Même pattern que productChecker dans le cours
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token)
        return res.status(401).json({ error: "Token manquant" })
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch {
        res.status(401).json({ error: "Token invalide ou expiré" })
    }
}

// Vérifie qu'un rôle minimum est respecté
const requireRole = (role) => (req, res, next) => {
    const roles = ["reader", "editor", "admin"]
    if (roles.indexOf(req.user?.role) < roles.indexOf(role))
        return res.status(403).json({ error: "Droits insuffisants" })
    next()
}

module.exports = { verifyToken, requireRole }
