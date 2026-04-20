const { ObjectId } = require("mongodb")
const bcrypt = require("bcrypt")
const { verifyToken, requireRole } = require("../middleware")

module.exports = (app, users) => {

    // GET /users — Liste tous les utilisateurs (admin)
    app.get("/users", verifyToken, requireRole("admin"), (req, res) => {
        users.find({}, { projection: { password: 0 } }).toArray()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // POST /users — Créer un compte pour un tiers (admin)
    app.post("/users", verifyToken, requireRole("admin"), (req, res) => {
        const { email, password, role = "reader" } = req.body
        if (!email || !password)
            return res.status(400).json({ error: "Email et mot de passe requis" })

        users.findOne({ email })
            .then(existing => {
                if (existing)
                    return res.status(409).json({ error: "Email déjà utilisé" })
                return bcrypt.hash(password, 10)
                    .then(hash => users.insertOne({ email, password: hash, role, isValidated: true }))
                    .then(command => res.status(201).json({ message: "Compte créé", userId: command.insertedId }))
            })
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // PATCH /users/:id/validate — Valider un utilisateur (admin)
    app.patch("/users/:id/validate", verifyToken, requireRole("admin"), (req, res) => {
        users.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { isValidated: true } })
            .then(command => (command.matchedCount == 1)
                ? res.json({ message: "Utilisateur validé" })
                : res.status(404).json({ error: "Utilisateur introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // PATCH /users/:id/role — Modifier le rôle (admin)
    app.patch("/users/:id/role", verifyToken, requireRole("admin"), (req, res) => {
        const { role } = req.body
        if (!["reader", "editor", "admin"].includes(role))
            return res.status(400).json({ error: "Rôle invalide" })

        users.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { role } })
            .then(command => (command.matchedCount == 1)
                ? res.json({ message: "Rôle mis à jour" })
                : res.status(404).json({ error: "Utilisateur introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // DELETE /users/:id — Supprimer un compte (admin)
    app.delete("/users/:id", verifyToken, requireRole("admin"), (req, res) => {
        users.deleteOne({ _id: new ObjectId(req.params.id) })
            .then(command => (command.deletedCount == 1)
                ? res.json({ message: "Compte supprimé" })
                : res.status(404).json({ error: "Utilisateur introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })
}
