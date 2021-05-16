'use strict';

var jwt = require('jsonwebtoken');

/**
 * Permet de vérifier si l'utilisateur est authentifié à l'aide d'un jeton JWT.
 * @param {Object} req Requête HTTP.
 * @param {Function} callback Fonction de callback.
 */
 function verifierAuthentification(req, callback) {
  // Récupération du jeton JWT dans l'en-tête HTTP "Authorization".
  var auth = req.headers.authorization;
  if (!auth) {
      // Pas de jeton donc pas connecté.
      callback(false, null);
  } else {
      // Pour le déboggae.
      console.log("Authorization : " + auth);
      // Structure de l'en-tête "Authorization" : "Bearer jeton-jwt"
      var authArray = auth.split(' ');
      if (authArray.length !== 2) {
          // Mauvaise structure pour l'en-tête "Authorization".
          callback(false, null);
      } else {
          // Le jeton est après l'espace suivant "Bearer".
          var jetonEndode = authArray[1];
          // Vérification du jeton.
          jwt.verify(jetonEndode, req.app.get('jwt-secret'), function (err, jetonDecode) {
              if (err) {
                  // Jeton invalide.
                  callback(false, null);
              } else {
                  // Jeton valide.
                  callback(true, jetonDecode);
              }
          });
      }
  }
}

module.exports = verifierAuthentification;