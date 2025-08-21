// TP javascript 2026
// SD
// Application:
//  - echo et textchat : page /textchat.html et websocket /echo
//  - Jeux question/reponse qr : / qr.html et websocket /qr

'use strict';

console.log('TP-CIEL');

/*  *********************** Classe Jeux  ***************************   */
//
class CQr {
    constructor() {
        this.question = '?';
        this.bonneReponse = false;
        this.joueurs = new Array();
    };
    GetRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    };
    NouvelleQuestion() {
        var x = this.GetRandomInt(11);
        var y = this.GetRandomInt(11);
        this.question = x + '*' + y + ' =  ?';
        this.bonneReponse = x * y;
            // Question de conversion de base 2 vers 10
            //var x = this.GetRandomInt(256);
            //this.bonneReponse = x;
            //question = 'Valeur en base 10 du nombre binaire :';
            //for (var i = 7; i >= 0; i--) {
            //    if (Math.floor(x / Math.pow(2, i))) {
            //        question += '1';
            //        x -= Math.pow(2, i);
            //    }
            //    else {
            //        this.question += '0';
            //    }
            //}
        this.EnvoyerResultatDiff();
    };
    TraiterReponse(wsClient, message) {
        var mess = JSON.parse(message);
        if (mess.nom != '') { // Si il y a un nom alors traiement de la reponse sinon on ne fait rien.
            // Recherche du nom du joueur
            var indexjoueur = this.joueurs.findIndex(function (j) {
                return j.nom === mess.nom;
            });
            if (indexjoueur == -1) { // Si nouveau joueur
                if (this.joueurs.length == 0) {   // premier joueur
                    this.NouvelleQuestion();  // premiere question
                }
                this.joueurs.push({ // Ajout du nouveau joueur à la liste de joueurs
                    nom: mess.nom,
                    score: 0,
                    ws: wsClient
                });
                this.EnvoyerResultatDiff();
            }
            else {  // Si joueur dans la liste de joueurs
                if (this.joueurs[indexjoueur].ws == undefined) {// Si reconnexion du joueur on actualise sa webSocket
                    this.joueurs[indexjoueur].ws = wsClient;
                }
                if (mess.reponse == this.bonneReponse) {    // Si bonne réponse on increment son score et change la question a tous le monde
                    this.joueurs[indexjoueur].score++;
                    this.NouvelleQuestion();
                    this.EnvoyerResultatDiff();
                }
                else {  // Si mauvaise reponse on l indique au joueur et il est bloque 3s
                    wsClient.send(
                        JSON.stringify({ question: 'FAUX ' + mess.nom }));

                    setTimeout(() => {  //L affichage de la question apparait 3s après
                        this.EnvoyerResultatDiff();
                    }, 3000);
                }
            }
        }
    }
    // Envoyer a tous les joueurs un message comportant les resultats du jeu
    EnvoyerResultatDiff() {
        // Recopie des joueurs dans un autre tableau joueursSimple sans l'objet WebSocket dans ws 
        var joueursSimple = new Array;
        this.joueurs.forEach(function each(joueur) {
            joueursSimple.push({
                nom: joueur.nom,
                score: joueur.score,
                ws: (joueur.ws == undefined) ? 'deconnecte' : 'connecte'
            });
        });
        // Composition du message a envoyer
        var messagePourLesClients = {
            joueurs: joueursSimple,
            question: this.question
        };
        // Diffusion (Broadcast) aux joueurs connectés;
        this.joueurs.forEach(function each(joueur) {
            if (joueur.ws != undefined) {
                joueur.ws.send(JSON.stringify(messagePourLesClients), function ack(error) {
                    console.log('    -  %s-%s', joueur.ws._socket._peername.address, joueur.ws._socket._peername.port);
                    if (error) {
                        console.log('ERREUR websocket broadcast : %s', error.toString());
                    }
                });
            }
        });
    }
};

var jeuxQr = new CQr;






/*  *********************** Serveur Web ***************************   */
//

var portServ = 80;
var express = require('express');

var exp = express();

exp.use(express.static(__dirname + '/www'));

exp.get('/', function (req, res) {
    console.log('Reponse a un client');
    res.sendFile(__dirname + '/www/index.html');
});

exp.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Erreur serveur express');
});

/*  *************** serveur WebSocket express *********************   */
//
var expressWs = require('express-ws')(exp);

// Connexion des clients à la WebSocket /echo et evenements associés
exp.ws('/echo', function (ws, req) {
    console.log('Connection WebSocket %s sur le port %s', req.connection.remoteAddress, req.connection.remotePort);

    ws.on('message', function (message) {
        console.log('De %s %s, message :%s', req.connection.remoteAddress, req.connection.remotePort, message);
        //ws.send(message);
        aWss.broadcast(message);
    });

    ws.on('close', function (reasonCode, description) {
        console.log('Deconnexion WebSocket %s sur le port %s', req.connection.remoteAddress, req.connection.remotePort);
    });

});


var question = '?';
var bonneReponse = 0;


/*  *************** serveur WebSocket express /qr *********************   */
//
exp.ws('/qr', function (ws, req) {
    console.log('Connection WebSocket %s sur le port %s', req.connection.remoteAddress, req.connection.remotePort);
    jeuxQr.NouvelleQuestion();

    //ws.on('message', TraiterReponse);

    // ws.on('message', TMessage);
    //function TMessage(message) {
    //    jeuxQr.TraiterReponse(ws,message);
    //}

    ws.on('message', jeuxQr.TraiterReponse.bind(jeuxQr, ws));


    ws.on('close', function (reasonCode, description) {
        console.log('Deconnexion WebSocket %s sur le port %s', req.connection.remoteAddress, req.connection.remotePort);
    });

});


/*  ****************** Broadcast clients WebSocket  **************   */
var aWss = expressWs.getWss('/echo');
var WebSocket = require('ws');
aWss.broadcast = function broadcast(data) {
    console.log("Broadcast aux clients navigateur : %s", data);
    aWss.clients.forEach(function each(client) {
        if (client.readyState == WebSocket.OPEN) {
            client.send(data, function ack(error) {
                console.log("    -  %s-%s", client._socket.remoteAddress, client._socket.remotePort);
                if (error) {
                    console.log('ERREUR websocket broadcast : %s', error.toString());
                }
            });
        }
    });
};


exp.listen(portServ, function () {
    console.log('Serveur en ecoute');
});
