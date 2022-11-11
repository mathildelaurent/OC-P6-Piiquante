const Sauce = require('../models/sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};

exports.createSauce = (req, res, next) => {
    const parseSauce = JSON.parse(req.body.sauce);
    delete parseSauce._id;
    delete parseSauce._userId;
    const sauce = new Sauce({
        ...parseSauce,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    })

    sauce.save()
    .then(() => {res.status(201).json({message: 'Sauce enregistrée !'})})
    .catch(error => {res.status(400).json({error})});
};

exports.modifySauce = (req, res, next) => {
    const sauceParse = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete sauceParse._userId;
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message : 'Non autorisé'});
            } else {
                if(req.file){
                    Sauce.findOne({_id: req.params.id})
                    .then((sauce) => {
                        const filename = sauce.imageUrl.split('/images')[1];
                        fs.unlink(`images/${filename}`, (error) => {
                            if(error) throw error;
                        })
                    })
                    .catch((error) => res.status(404).json({error}));
                }
                Sauce.updateOne({ _id: req.params.id}, { ...sauceParse, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée !'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        if(sauce.userId != req.auth.userId){
            res.status(403).json({message: 'Non autorisé'});
        }else{
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({_id: req.params.id})
                .then(() => res.status(200).json({message: 'Sauce supprimée'}))
                .catch(error => res.status(401).json({error}));
            })
        }
    })
    .catch(error => res.status(500).json({error}));
};

exports.opinionSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        switch(req.body.like){
            case 1:
                if(!sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId) && req.body.like === 1) {
                    Sauce.updateOne({_id: req.params.id},
                        {
                            $inc: {likes: 1},
                            $push: {usersLiked: req.body.userId}
                        })
                    .then(() => res.status(201).json({message: "L'utilisateur a enregistré un Like !"}))
                    .catch(error => res.status(400).json({error}));
                }else{
                    return res.status(400).json({error: "L'utilisateur a déjà donné son opinion !"})
                }
                break;

            case -1:
                if(!sauce.usersDisliked.includes(req.body.userId) && !sauce.usersLiked.includes(req.body.userId) && req.body.like === -1) {
                    Sauce.updateOne({_id: req.params.id},
                        {
                            $inc: {dislikes: 1},
                            $push: {usersDisliked: req.body.userId}
                        })
                    .then(() => res.status(201).json({message: "L'utilisateur a enregistré un dislike !"}))
                    .catch(error => res.status(400).json({error}));
                }else{
                    return res.status(400).json({error: "L'utilisateur a déjà donné son opinion !"})
                }
                break;

            case 0:
                if(sauce.usersLiked.includes(req.body.userId)) {
                    Sauce.updateOne({_id: req.params.id},
                        {
                            $inc: {likes: -1},
                            $pull: {usersLiked: req.body.userId}
                        })
                    .then(() => res.status(201).json({message: "L'utilisateur a annulé son like !"}))
                    .catch(error => res.status(400).json({error}));
                };

                if(sauce.usersDisliked.includes(req.body.userId)) {
                    Sauce.updateOne({_id: req.params.id},
                        {
                            $inc: {dislikes: -1},
                            $pull: {usersDisliked: req.body.userId}
                        })
                    .then(() => res.status(201).json({message: "L'utilisateur a annulé son dislike !"}))
                    .catch(error => res.status(400).json({error}));
                }
                break;         
        }
    })
    .catch((error) => res.status(404).json({error}));
};