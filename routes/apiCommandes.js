'use strict';

var express = require('express');
// Paramètres de configuration généraux.
var config = require('../config');
var routerApiCommande = express.Router();
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

//Importation du modèle Commande
var CommandeModel = require('../models/commandeModels').CommandeModel;
var PlatModel = require('../models/platModels').PlatModel;

// MIDDLEWARE
//exécuté à chaque requête à l'APi
routerApiCommande.use(function (req, res, next) {
  //Log les requêtes
  console.log(req.method, req.url);
  //Vérification de l'authentification
  verifierAuth(req, function (estAuthentifie, jetonDecode) {
    if (!estAuthentifie) {
      // USAGER NON AUTHENTIFIÉ
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      // USAGER AUTHENTIFIÉ
      // Sauvegarde du jeton décodé dans la requête pour usage ultérieur.
      req.jeton = jetonDecode;
      // Pour le déboggage
      console.log("Jeton : " + JSON.stringify(jetonDecode));
      next();
    }
  });
});

// Création d'une commande
routerApiCommande.route('/:usager_id/commandes')
  .post(function (req, res) {
    console.log('création d\'une commande pour l\'usager ayant l\'id ' + req.params.usager_id);
    // Vérification de l'id de l'usager connecté 
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      if (req.body.dateArrivee && req.body.usager && req.body.livreur === undefined && req.body.plats === undefined) {
        //création du modèle à partir du body de la requête
        var nouvelleCommande = new CommandeModel(req.body);
        //on sauvegarde dans la BD
        nouvelleCommande.save(function (err) {
          if (err) console.log(err._message);
          res.contentType('application/json');
          res.location(url_base + '/usagers/' + req.params.usager_id + '/commandes/' + nouvelleCommande.id.toString());
          //si la sauvegarde fonctionne, on retourne 201 et on met le nouveau usager dans le body de la réponse
          res.status(201).json(nouvelleCommande);
        });
      } else {
        res.status(400).send('Erreur 400 - champs manquants/invalides');
      }
    }
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
  });

// Consultation de la commande ayant l'id " commande_id ".
routerApiCommande.route('/:usager_id/commandes/:commande_id')
  .get(function (req, res) {
    console.log('consultation de la commande id: ' + req.params.commande_id + ' de l\'usager id: ' + req.params.usager_id);
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      CommandeModel.findById(req.params.commande_id, function (err, commande) {
        if (err) console.log(err._message);
        if (!commande) res.status(404).send('Erreur 404 : Ressource inexistante !');
        else {
          res.json(commande);
        }
      });
    }
  })
  // Création ou modification de la commande ayant l'id " commande_id ".
  .put(function (req, res) {
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      if (req.body.livreur !== undefined || req.body.usager._id !== req.params.usager_id || req.body.plats !== undefined) {
        res.status(403).send('Erreur 403 : interdit');
      } else {
        CommandeModel.findById(req.params.commande_id, function (err, commande) {
          if (err) console.log(err._message);
          if (!commande) {
            // Création de la commande
            console.log('création de la commande id :' + req.params.commande_id);
            // Création du modèle à partir du body de la requête
            commande = new CommandeModel(req.body);
            commande._id = req.params.commande_id;
            commande.save(function (err) {
              if (err) console.log(err._message);
              // si la sauvegarde fonctionne, on retourne 201 et on met la nouvelle commande dans le body de la reponse
              res.status(201).json(commande);
            });
          } else {
            // MOdification de la commande
            console.log('modification de la commande id : ' + req.params.commande_id);
            CommandeModel.findByIdAndUpdate(req.params.commande_id, req.body, {
              new: true,
              runValidators: true
            }, function (err, commande) {
              if (err) console.log(err._message);
              res.json(commande);
            });

          }
        });
      }
    }
  })
  // Suppression de la commande ayant l'id " commande_id ".
  .delete(function (req, res) {
    console.log("Suppression de la commande id : " + req.params.commande_id);
    if (req.jeton.id !== req.params.usager_id) {
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      CommandeModel.findByIdAndDelete(req.params.commande_id, function (err) {
        if (err) console.log(err._message);
        res.status(204).end();
      });
    }
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
  });

// Associer livreur à la commande ayant l'id " commande_id ".
routerApiCommande.route('/:usager_id/commandes/:commande_id/livreur')
  .put(function (req, res) {
    console.log("Association du livreur à la commande ayant l'id : " + req.params.commande_id);
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      CommandeModel.findById(req.params.commande_id, function (err, commande) {
        if (err) console.log(err._message);
        if (!commande) res.status(404).send('Erreur 404 : Ressource inexistante !');
        else {
          if (commande.livreur) {
            // Modification du livreur
            console.log("Modification du livreur de la commande id : " + req.params.commande_id);
            commande.livreur = req.body;
            commande.save(function (err) {
              if (err) console.log(err._message);
              res.json(commande);
            });
          } else {
            // Création du livreur
            console.log("Ajout du livreur pour la commande id : " + req.params.commande_id);
            commande.livreur = req.body;
            commande.save(function (err) {
              if (err) console.log(err._message);
              res.status(201).json(commande);
            });
          }
        }
      });
    }
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
  });

// Consultation des plats de la commande ayant l'id " commande_id ".
routerApiCommande.route('/:usager_id/commandes/:commande_id/plats')
  .get(function (req, res) {
    console.log("Consultation des plats de la commande ayant l'id : " + req.params.commande_id);
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      CommandeModel.findById(req.params.commande_id, function (err, commande) {
        if (err) console.log(err._message);
        if (commande && commande.plats)
          res.json(commande.plats);
        else
          res.status(404).send('Erreur 404 : Ressource inexistante !');
      });
    }
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
  });


routerApiCommande.route('/:usager_id/commandes/:commande_id/plats/:plat_id')
  // permet d'associer un plat à la commande ayant l'id " commande_id ".
  .put(function (req, res) {
    console.log("Association du plat ayant l'id " + req.params.plat_id + " à la commande ayant l'id : " + req.params.commande_id);
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      CommandeModel.findById(req.params.commande_id, function (err, commande) {
        if (err) console.log(err._message);
        if (!commande) res.status(404).send('Erreur 404 : Ressource inexistante !');
        else {
          PlatModel.findById(req.params.plat_id, function (err, plat) {
            if (err) console.log(err._message);
            if (!plat) res.status(404).send('Erreur 404 : Ressource inexistante !');
            else {
              var plat_commande = commande.plats.id(req.params.plat_id);
              if (!plat_commande) {
                console.log("Ajout du plat id " + req.params.plat_id + " pour la commande id : " + req.params.commande_id);
                plat.nom = req.body.nom;
                plat.nbrPortions = req.body.nbrPortions;
                commande.plats.push(plat);
                commande.save(function (err) {
                  if (err) console.log(err._message);
                  res.status(201).json(commande);
                });
              } else {
                console.log("Modification du plat id " + req.params.plat_id + " pour la commande id :" + req.params.commande_id);
                plat_commande.nom = req.body.nom;
                plat_commande.nbrPortions = req.body.nbrPortions;
                commande.save(function (err) {
                  if (err) console.log(err._message);
                  res.json(commande);
                });
              }
            }
          });
        }
      });
    }
  })
  // suppression d'un plat à la commande ayant l'id " commande_id ".
  .delete(function (req, res) {
    console.log("Suppression du plat ayant l'id " + req.params.plat_id + " de la commande ayant l'id : " + req.params.commande_id);
    if (req.jeton.id !== req.params.usager_id) {
      // Jeton non-valide
      res.status(401).send('Erreur 401 : non authentifié');
    } else {
      CommandeModel.findById(req.params.commande_id, function (err, commande) {
        if (err) console.log(err._message);
        if (!commande || commande.plats === []) res.status(404).send('Erreur 404 : Ressource inexistante !');
        else {
          var platARetirer = commande.plats.id(req.params.plat_id);
          if (!platARetirer) {
            res.status(404).send('Erreur 404 : Ressource inexistante !');
          } else {
            commande.plats.remove(platARetirer);
            commande.save(function (err) {
              if (err) console.log(err._message);
              res.status(204).end();
            });
          }
        }
      });
    }
  })
  .all(function (req, res) {
    console.log('Méthode HTTP non permise (405)');
    res.status(405).send('Erreur 405 : Méthode non-permise !');
  });

module.exports = routerApiCommande;