//ORM Mongoose
var mongoose = require('mongoose');
var platSchema = require('./platModels').PlatSchema;
var usagerSchema = require('./usagerModels').UsagerSchema;
var livreurSchema = require('./livreurModels').LivreurSchema;

// Création du schéma commande
var commandeSchema = new mongoose.Schema({
  dateArrivee: {
    type: Date,
    required: true
  },
  livreur: livreurSchema,
  usager: {
   type: usagerSchema,
   required: true
  },
  plats: [platSchema]
  
});

module.exports.CommandeModel = mongoose.model('Commande', commandeSchema);