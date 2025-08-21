

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
        // recopie des joueurs dans un autre tableau joueursSimple sans ws
        var joueursSimple = new Array;
        this.joueurs.forEach(function each(joueur) {
            joueursSimple.push({
                nom: joueur.nom,
                score: joueur.score
            });
        });

        var messagePourLesClients = {
            joueurs: joueursSimple,
            question: this.question
        };

        // broadcast aux joueurs connectés;
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
    Deconnecter(ws) { // Le joueur se déconnecte on supprime sa webSocket dans la liste
        // Recherche de l'index de ce joueur possedant cette webSocket
        var indexjoueur = this.joueurs.findIndex(function (j) {
            return j.ws === ws;
        });
        if (indexjoueur != -1) { // Peut arriver si un joueur s'est connecté sans rentrer un nom et qui se déconnecte.
            this.joueurs[indexjoueur].ws = undefined;  // Suppression de la webSocket joueur dans la liste
        }
    }

};


module.exports = CQr;