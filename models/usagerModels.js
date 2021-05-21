//ORM Mongoose
var mongoose = require('mongoose');

//Création du schéma usager
var usagerSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  adresse: {
    type: String,
    required: true
  },
  pseudo: {
    type: String,
    index: true,
    required: true
  },
  motDePasse: {
    type: String,
    required: true
  }
});

// Crée le modèle à partir du schéma et l'Exporte pour pouvoir l'utiliser dans le reste du projet
module.exports.UsagerModel = mongoose.model('Usager', usagerSchema);
module.exports.UsagerSchema = usagerSchema;