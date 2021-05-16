'use strict';

var express = require('express');
// Paramètres de configuration généraux.
var config = require('./config');
var routerApiLivreur = express.Router();
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

//Importation du modèle Livreur
var LivreurModel = require('../models/livreurModels').LivreurModel;

// MIDDLEWARE
//exécuté à chaque requête à l'APi
routerApiLivreur.use(function (req, res, next) {
  // Log les requêtes
  console.log(req.method, req.url);
  //Vérification de l'authorisation.
  verifierAuth(req, function (estAuthentifie, jetonDecode) {
    if (!estAuthentifie) {
      // Usager NON authentifié.
      res.status(401).end();
    } else {
      // Usager authentifié
      // sauvegarde du jeton décodé dans la requête pour usage ultérieur
      req.jeton = jetonDecode;
      // Pour le déboggage.
      console.log("Jeton :" + JSON.stringify(jetonDecode));
      // Poursuite du traitement de la requête.
      next();
    }
  });
});



// Route de création d'un livreur
// =======================================================
routerApiLivreur.route('/')
  .post(function (req, res) {
    console.log('création du livreur');
    //création du modèle à partir du body de la requête
    var nouveauLivreur = new LivreurModel(req.body);
    //on sauvegarde dans la BD
    nouveauLivreur.save(function (err) {
      if (err) throw err;
      res.setHeader('Location', url_base + '/livreurs/' + nouveauLivreur.id.toString());
      //si la sauvegarde fonctionne, on retourne 201 et on met le nouveau usager dans le body de la réponse
      res.status(201).json(nouveauLivreur);
    });

  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).end();
  });

// Route pour accéder à un livreur à l'id spécifié en query string
// =======================================================
routerApiLivreur.route('/:livreur_id')
  // Consulte le livreur ayant l’id « livreur_id ».
  .get(function (req, res) {
    console.log('consultation du livreur avec id : ' + req.params.livreur_id);
    // fonction de l'ODM Mongoose qui va chercher notre livreur dans la DB via une fonction asynchrone
    LivreurModel.findById(req.params.livreur_id, function (err, livreur) {
      if (err) throw err;
      if (livreur) res.json(livreur);
      else res.status(404).end();
    });
  })

  // Suppression du livreur ayant l'id « livreur_id ».
  .delete(function (req, res) {
    console.log('Suppression du livreur id :' + req.params.livreur_id);
    LivreurModel.findByIdAndDelete(req.params.livreur_id, function (err) {
      if (err) throw err;
      res.status(204).end();
    });
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).end();
  });

module.exports = routerApiLivreur;