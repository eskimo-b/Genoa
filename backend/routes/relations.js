const { ObjectId } = require("mongodb")
const { verifyToken, requireRole } = require("../middleware")

const isAncestor = (situations, memberId, candidateAncestor) => {
    return situations.find({ child: new ObjectId(memberId) }).toArray()
        .then(parents => {
            if (parents.length === 0) return false
            for (const s of parents) {
                if (s.parent.toString() === candidateAncestor.toString()) return true
            }
            return Promise.all(parents.map(s => isAncestor(situations, s.parent, candidateAncestor)))
                .then(results => results.some(Boolean))
        })
}

module.exports = (app, unions, situations, members) => {

    // GET /unions
    app.get("/unions", verifyToken, (req, res) => {
        unions.find().toArray()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // POST /unions
    app.post("/unions", verifyToken, requireRole("editor"), (req, res) => {
        const { member1, member2, unionDate, separationDate } = req.body
        if (!member1 || !member2)
            return res.status(400).json({ error: "Les deux membres sont requis" })
        if (member1 === member2)
            return res.status(400).json({ error: "Un membre ne peut pas être en couple avec lui-même" })

        Promise.all([
            members.findOne({ _id: new ObjectId(member1) }),
            members.findOne({ _id: new ObjectId(member2) })
        ])
            .then(([m1, m2]) => {
                if (!m1 || !m2)
                    return res.status(404).json({ error: "Un ou les deux membres introuvables" })

                return unions.insertOne({
                    member1:        new ObjectId(member1),
                    member2:        new ObjectId(member2),
                    unionDate:      unionDate      ? new Date(unionDate)      : null,
                    separationDate: separationDate ? new Date(separationDate) : null
                })
                    .then(command => res.status(201).json({ message: "Union créée", unionId: command.insertedId }))
            })
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // DELETE /unions/:id
    app.delete("/unions/:id", verifyToken, requireRole("editor"), (req, res) => {
        unions.deleteOne({ _id: new ObjectId(req.params.id) })
            .then(command => (command.deletedCount == 1)
                ? res.json({ message: "Union supprimée" })
                : res.status(404).json({ error: "Union introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // GET /situations
    app.get("/situations", verifyToken, (req, res) => {
        situations.find().toArray()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // POST /situations
    app.post("/situations", verifyToken, requireRole("editor"), (req, res) => {
        const { parent, child, isBiological = true } = req.body
        if (!parent || !child)
            return res.status(400).json({ error: "Parent et enfant requis" })
        if (parent === child)
            return res.status(400).json({ error: "Un membre ne peut pas être son propre parent" })

        Promise.all([
            members.findOne({ _id: new ObjectId(parent) }),
            members.findOne({ _id: new ObjectId(child) })
        ])
            .then(([p, c]) => {
                if (!p || !c)
                    return res.status(404).json({ error: "Membre(s) introuvable(s)" })

                return isAncestor(situations, child, parent)
                    .then(cycle => {
                        if (cycle)
                            return res.status(400).json({ error: "Relation cyclique détectée" })

                        return situations.insertOne({
                            parent: new ObjectId(parent),
                            child:  new ObjectId(child),
                            isBiological
                        })
                            .then(command => res.status(201).json({ message: "Lien parent-enfant créé", situationId: command.insertedId }))
                    })
            })
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })

    // DELETE /situations/:id
    app.delete("/situations/:id", verifyToken, requireRole("editor"), (req, res) => {
        situations.deleteOne({ _id: new ObjectId(req.params.id) })
            .then(command => (command.deletedCount == 1)
                ? res.json({ message: "Lien supprimé" })
                : res.status(404).json({ error: "Lien introuvable" }))
            .catch(err => res.status(500).json({ error: "Erreur serveur", details: err.message }))
    })
}
