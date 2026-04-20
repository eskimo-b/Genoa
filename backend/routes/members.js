const { ObjectId } = require("mongodb")
const { verifyToken, requireRole } = require("../middleware")

const memberChecker = (req, res, next) => {
    if (!req.body.firstname || !req.body.lastname)
        return res.status(400).json({ error: "Prénom et nom requis" })
    next()
}

module.exports = (app, members) => {

    // GET /members/search?q=... — Recherche par nom ou prénom
    app.get("/members/search", verifyToken, (req, res) => {
        if (!req.query.q)
            return res.status(400).json({ error: "Paramètre q requis" })

        const isEditor = ["editor", "admin"].includes(req.user.role)
        const projection = isEditor ? {} : { privateInfo: 0 }

        members.find({
            $or: [
                { firstname: { $regex: req.query.q, $options: "i" } },
                { lastname:  { $regex: req.query.q, $options: "i" } }
            ]
        }, { projection }).toArray()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // GET /members — Liste tous les membres
    app.get("/members", verifyToken, (req, res) => {
        const isEditor = ["editor", "admin"].includes(req.user.role)
        const projection = isEditor ? {} : { privateInfo: 0 }

        members.find({}, { projection }).toArray()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // GET /members/:id — Détail d'un membre
    app.get("/members/:id", verifyToken, (req, res) => {
        const isEditor = ["editor", "admin"].includes(req.user.role)
        const projection = isEditor ? {} : { privateInfo: 0 }

        members.findOne({ _id: new ObjectId(req.params.id) }, { projection })
            .then(item => item
                ? res.json(item)
                : res.status(404).json({ error: "Membre introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // POST /members — Créer un membre (éditeur ou admin)
    app.post("/members", verifyToken, requireRole("editor"), memberChecker, (req, res) => {
        const member = {
            firstname:   req.body.firstname,
            lastname:    req.body.lastname,
            sex:         req.body.sex        || null,
            birthDate:   req.body.birthDate  ? new Date(req.body.birthDate) : null,
            deathDate:   req.body.deathDate  ? new Date(req.body.deathDate) : null,
            profession:  req.body.profession || [],
            photo:       req.body.photo      || null,
            addresses:   req.body.addresses  || [],
            phones:      req.body.phones     || [],
            emails:      req.body.emails     || [],
            publicInfo:  req.body.publicInfo  || null,
            privateInfo: req.body.privateInfo || null,
            createdBy:   req.user.userId
        }

        members.insertOne(member)
            .then(command => res.status(201).json({ message: "Membre créé", memberId: command.insertedId }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // PUT /members/:id — Modifier un membre (éditeur ou admin)
    app.put("/members/:id", verifyToken, requireRole("editor"), memberChecker, (req, res) => {
        const member = {
            firstname:   req.body.firstname,
            lastname:    req.body.lastname,
            sex:         req.body.sex        || null,
            birthDate:   req.body.birthDate  ? new Date(req.body.birthDate) : null,
            deathDate:   req.body.deathDate  ? new Date(req.body.deathDate) : null,
            profession:  req.body.profession || [],
            photo:       req.body.photo      || null,
            addresses:   req.body.addresses  || [],
            phones:      req.body.phones     || [],
            emails:      req.body.emails     || [],
            publicInfo:  req.body.publicInfo  || null,
            privateInfo: req.body.privateInfo || null
        }

        members.updateOne({ _id: new ObjectId(req.params.id) }, { $set: member })
            .then(command => (command.matchedCount == 1)
                ? res.json({ message: "Membre mis à jour" })
                : res.status(404).json({ error: "Membre introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // DELETE /members/:id — Supprimer un membre (éditeur ou admin)
    app.delete("/members/:id", verifyToken, requireRole("editor"), (req, res) => {
        members.deleteOne({ _id: new ObjectId(req.params.id) })
            .then(command => (command.deletedCount == 1)
                ? res.json({ message: "Membre supprimé" })
                : res.status(404).json({ error: "Membre introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })
}
