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
        this.joueurs;
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
        if (mess.reponse == this.bonneReponse) {
            this.question="Bonne reponse de "+mess.nom;
        }
        else {
            this.question ="Mauvaise reponse de " + mess.nom;
        }
        this.EnvoyerResultatDiff();
        setTimeout(() => {  //affichage de la question 3s après
            this.NouvelleQuestion();
        }, 3000);
    }
    EnvoyerResultatDiff() {
        var messagePourLesClients = {
            question: this.question
        };
        aWss.broadcast(JSON.stringify(messagePourLesClients));
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
