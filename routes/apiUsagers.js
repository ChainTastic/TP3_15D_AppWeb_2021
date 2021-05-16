'use strict';

var express = require('express');
// Paramètres de configuration généraux.
var config = require('./config');
var routerApiUsager = express.Router();
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

//Importation du modèle Usager
var UsagerModel = require('../models/usagerModels').UsagerModel;

// MIDDLEWARE
//exécuté à chaque requête à l'APi
routerApiUsager.use(function (req, res, next) {
  //Log les requêtes
  console.log(req.method, req.url);
  //permet de poursuivre le traitement de la requête
  next();
});

// Route de création d'un usager
// =======================================================
routerApiUsager.route('/')
  .post(function (req, res) {
    console.log('création de l\'usager');
    //création du modèle à partir du body de la requête
    var nouveauUsager = new UsagerModel(req.body);
    //on sauvegarde dans la BD
    nouveauUsager.save(function (err) {
      if (err) throw err;
      res.setHeader('Location', url_base + '/usagers/' + nouveauUsager.id.toString());
      //si la sauvegarde fonctionne, on retourne 201 et on met le nouveau usager dans le body de la réponse
      res.status(201).json(nouveauUsager);
    });

  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).end();
  });


// Route pour accéder à un usager à l'id spécifié en query string
// =======================================================
routerApiUsager.route('/:usager_id')
  // Consulte l'usager  ayant l’id « usager_id ».
  .get(function (req, res) {
    console.log('consultation de l\'usager avec id : ' + req.params.usager_id);
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
        // Vérification de l'id de l'usager connecté 
        if (jetonDecode.id !== req.params.usager_id) {
          res.status(401).end();
        } else {
          // fonction de l'ODM Mongoose qui va chercher notre usager dans la DB via une fonction asynchrone
          UsagerModel.findById(req.params.usager_id, function (err, usager) {
            if (err) throw err;
            if (usager) res.json(usager);
            else res.status(404).end();
          });
        }
      }
    });
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).end();
  });

module.exports = routerApiUsager;