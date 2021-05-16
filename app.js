'use strict';

const PORT = process.env.PORT || 8090;
var express = require('express');
var app = express();
var hateoasLinker = require('express-hateoas-links');
//Permet de récupérer du JSON dans le corps de la requête
var bodyParser = require('body-parser');
app.use(bodyParser.json());
// Module pour JWT.
var jwt = require('jsonwebtoken');
// CORS
var cors = require('cors');
//SWAGGER
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');



//importation des routeurs
//routeur Usagers
var routeurApiUsagers = require('./routes/apiUsagers.js');
//routeur Livreurs
var routeurApiLivreurs = require('./routes/apiLivreurs.js');
//routeur Plats
var routeurApiPlats = require('./routes/apiPlats.js');
//routeur Commandes
var routeurApiCommandes = require('./routes/apiCommandes.js');


// replace standar express res.json with the new version
app.use(hateoasLinker);

// Paramètres de configuration généraux.
var config = require('./config');
// Model Usager
var Usager = require('./models/usagerModels.js').UsagerModel;
// Ajout d'une variable globale à l'application.
app.set('jwt-secret', config.secret);

// Route pour l'authentification (connexion).
app.post('/connexions', function (req, res) {
  // Vérification si l'usager existe
  Usager.findOne({
    pseudo: req.body.pseudo,
    motDePasse: req.body.motDePasse
  }, function (err, usager) {
    if (err) throw err;
    if (!usager) {
      res.status(400).end();
    } else {
      var payload = {
        user: usager.pseudo,
        id: usager._id
      };
      // Créer le jeton JWT car les informations d'authentification sont valides.
      var jwtToken = jwt.sign(payload, app.get('jwt-secret'), {
        // Expiration en secondes (24 heures).
        expiresIn: 86400
      });
      res.json({
        "token": jwtToken
      });
    }
  });
});


// CORS qui accepte seulement quelques sites
//---------------------------------------------------------------------------------------------------------------
var whitelist = ['https://www.chess.com', 'https://www.delirescalade.com', 'https://cegepgarneau.omnivox.ca'];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET'],
};

app.options('/plats', cors(corsOptions));
app.get('/plats', cors(corsOptions));

app.use('/usagers', routeurApiUsagers);
app.use('/livreurs', routeurApiLivreurs);
app.use('/plats', routeurApiPlats);
// Route Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/', routeurApiCommandes);


app.all('*', function (req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(404).send('Erreur 404 : Ressource inexistante !');
});

app.listen(PORT, function () {
  console.log('Serveur sur port ' + PORT);
});