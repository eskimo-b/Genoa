const jwt    = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const registerChecker = (req, res, next) => {
    if (!req.body.email || !req.body.password)
        return res.status(400).json({ error: "Email et mot de passe requis" })
    next()
}

module.exports = (app, users) => {

    // POST /auth/register — Inscription
    app.post("/auth/register", registerChecker, (req, res) => {
        const { email, password } = req.body

        users.findOne({ email })
            .then(existing => {
                if (existing)
                    return res.status(409).json({ error: "Email déjà utilisé" })

                return users.countDocuments()
                    .then(count => {
                        const isFirstUser = count === 0
                        const role = isFirstUser ? "admin" : "reader"

                        return bcrypt.hash(password, 10)
                            .then(hash => users.insertOne({
                                email,
                                password: hash,
                                role,
                                isValidated: isFirstUser
                            }))
                            .then(() => {
                                const message = isFirstUser
                                    ? "Compte administrateur créé"
                                    : "Inscription en attente de validation"
                                res.status(201).json({ message })
                            })
                    })
            })
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // POST /auth/login — Connexion
    app.post("/auth/login", registerChecker, (req, res) => {
        const { email, password } = req.body

        users.findOne({ email })
            .then(user => {
                if (!user)
                    return res.status(401).json({ error: "Identifiants invalides" })
                if (!user.isValidated)
                    return res.status(401).json({ error: "Compte non encore validé par l'administrateur" })

                return bcrypt.compare(password, user.password)
                    .then(match => {
                        if (!match)
                            return res.status(401).json({ error: "Identifiants invalides" })

                        const token = jwt.sign(
                            { userId: user._id, role: user.role },
                            process.env.JWT_SECRET,
                            { expiresIn: "24h" }
                        )
                        res.json({ token, role: user.role, email: user.email })
                    })
            })
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })
}
