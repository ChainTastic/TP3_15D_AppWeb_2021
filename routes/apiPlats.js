'use strict';

var express = require('express');
// Paramètres de configuration généraux.
var config = require('../config');
var routerApiPlat = express.Router();
var url_base = "https://tp3-keveinsimon.herokuapp.com";
var verifierAuth = require('../VerificationAuth');
//ORM Mongoose
var mongoose = require('mongoose');
// Connexion à MongoDB avec Mongoose
mongoose.connect('mongodb+srv://'+config.username+':'+config.psw+'@clustertp3-2021.yr29h.mongodb.net/zubereats?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
});

//Importation du modèle Plat
var PlatModel = require('../models/platModels').PlatModel;


// MIDDLEWARE
//exécuté à chaque requête à l'APi
routerApiPlat.use(function (req, res, next) {
    //Log les requêtes
    console.log(req.method, req.url);
    // Vérification de l'authentification
    verifierAuth(req, function (estAuthentifie, jetonDecode) {
        if (!estAuthentifie) {
            // USAGER NON AUTHENTIFIÉ
            res.status(401).end();
        } else {
            // USAGER AUTHENTIFIÉ
            // Sauvegarde du jeton décodé dans la requête pour usage ultérieur.
            req.jeton = jetonDecode;
            // Pour le déboggage
            console.log("Jeton : " + JSON.stringify(jetonDecode));
            //permet de poursuivre le traitement de la requête
            next();
        }
    });
});


// Route de création d'un plat
// =======================================================
routerApiPlat.route('/')
    .post(function (req, res) {
        console.log('création du plat');
        //création du modèle à partir du body de la requête
        var nouveauPlat = new PlatModel(req.body);
        //on sauvegarde dans la BD
        nouveauPlat.save(function (err) {
            if (err) throw err;
            res.setHeader('Location', url_base + '/plats/' + nouveauPlat.id.toString());
            //si la sauvegarde fonctionne, on retourne 201 et on met le nouveau plat dans le body de la réponse
            res.status(201).json(nouveauPlat, [
                {rel: "self",method: "GET", href: url_base + "/plats/"+nouveauPlat.id.toString()},
                {rel: "delete",method: "DELETE", href: url_base + "/plats/"+nouveauPlat.id.toString()}
            ]);
        });
    })
    //Consultation de tous les  plats
    .get(function (req, res) {
        console.log('consultation de tous les plats');
        PlatModel.find({}, function (err, plats) {
            if (err) throw err;

            var resBody = [];
            
            plats.forEach(plate => {
                //C'Est ici qu'on inclut les hyperliens que l'on souhaite joindre à chaque élément de la collection
                var links =[
                    {rel: "self",method: "GET",href: url_base + "/plats/"+plate._id.toString()},
                    {rel: "delete",method: "DELETE",href: url_base +"/plats/"+plate._id.toString()}
                ];
                var platToJson = plate.toJSON();
                var platAvecLink = {
                    plat : platToJson,
                    links
                };
                resBody.push(platAvecLink);
            });
            res.json(resBody);
        });
    })
    .all(function (req, res) {
        console.log('Méthode HTTP non permise (405)');
        res.status(405).end();
    });




// Route pour accéder à un plat à l'id spécifié en query string
// =======================================================
routerApiPlat.route('/:plat_id')
    // Consulte le plat ayant l’id « plat_id ».
    .get(function (req, res) {
        console.log('consultation du plat avec id : ' + req.params.plat_id);
        // fonction de l'ODM Mongoose qui va chercher notre plat dans la DB via une fonction asynchrone
        PlatModel.findById(req.params.plat_id, function (err, plat) {
            if (err) throw err;
            if (plat) res.json(plat, [
                {rel: "create",method: "POST", href: url_base + "/plats"},
                {rel: "delete",method: "DELETE", href: url_base + "/plats/"+plat.id.toString()}
            ]);
            else res.status(404).end();
        });
    })

    // Suppression du plat ayant l'id « plat_id ».
    .delete(function (req, res) {
        console.log('Suppression du plat id :' + req.params.plat_id);
        PlatModel.findByIdAndDelete(req.params.plat_id, function (err) {
            if (err) throw err;
            res.status(204).end();
        });
    })
    .all(function (req, res) {
        console.log('Méthode HTTP non permise (405)');
        res.status(405).end();
    });

module.exports = routerApiPlat;