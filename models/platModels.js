//ORM Mongoose
var mongoose = require('mongoose');

//Création du schéma plat
var platSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  nbrPortions: {
    type: Number,
    required: true
  }
});

// Crée le modèle à partir du schéma et l'Exporte pour pouvoir l'utiliser dans le reste du projet
module.exports.PlatModel = mongoose.model('Plats', platSchema);

module.exports.PlatSchema = platSchema;