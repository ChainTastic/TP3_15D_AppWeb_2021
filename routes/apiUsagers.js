'use strict';

var express = require('express');
// Paramètres de configuration généraux.
var config = require('../config');
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
mongoose.set('useCreateIndex', true);

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
    if (req.body.pseudo && req.body.motDePasse) {
      UsagerModel.findOne({
        pseudo: req.body.pseudo
      }, function (err, usager) {
        if (err) console.log(err._message);
        if (usager) {
          res.status(404).send('Erreur 404 : Pseudo déja existant');
        } else {
          var nouveauUsager = new UsagerModel(req.body);
          //on sauvegarde dans la BD
          nouveauUsager.save(function (err) {
            if (err) console.log(err._message);
            res.setHeader('Location', url_base + '/usagers/' + nouveauUsager.id.toString());
            //si la sauvegarde fonctionne, on retourne 201 et on met le nouveau usager dans le body de la réponse
            res.status(201).json(nouveauUsager);
          });
        }
      });

    } else {
      res.status(400).send('Erreur 400 : Pseudo ou mot de passe manquant !');
    }
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
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
        res.status(401).send('Erreur 401 : non authentifié');
      } else {
        UsagerModel.findById(req.params.usager_id, function (err, usager) {
          if (err) console.log(err._message);
          if (usager) {
            // USAGER AUTHENTIFIÉ
            // Sauvegarde du jeton décodé dans la requête pour usage ultérieur.
            req.jeton = jetonDecode;
            // Pour le déboggage
            console.log("Jeton : " + JSON.stringify(jetonDecode));
            // Vérification de l'id de l'usager connecté 
            if (jetonDecode.id !== req.params.usager_id) {
              res.status(401).send('Erreur 401 : non authentifié');
            } else {
              res.json(usager);
            }
          } else {
            res.status(404).send('Erreur 404 : Ressource inexistante !');
          }
        });
      }
    });
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
  });

module.exports = routerApiUsager;