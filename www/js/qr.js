var ipServeur;     // Adresse ip du serveur 
var ws;                             // Variable pour l'instance de la WebSocket.

window.onload = function () {
    ipServeur = location.hostname
    if (TesterLaCompatibilite()) {
        ConnexionAuServeurWebsocket();
    }
    ControleIHM();
}
    function TesterLaCompatibilite() {
        let estCompatible = true;
        if (!('WebSocket' in window)) {
            window.alert('WebSocket non supporté par le navigateur');
            estCompatible = false;
        }
        return estCompatible;
    }

    /*  ***************** Connexion au serveur WebSocket ********************   */
    //
    function ConnexionAuServeurWebsocket() {
        ws = new WebSocket('ws://' + ipServeur + '/qr');

        ws.onclose = function (evt) {
            window.alert('WebSocket close');
        };

        ws.onopen = function () {
            console.log('WebSocket open');
        };

        ws.onmessage = function (evt) {
            document.getElementById('messageRecu').value = evt.data;
        };
    }


    function ControleIHM() {
        document.getElementById('Envoyer').onclick = BPEnvoyer;
    }

    function BPEnvoyer() {
        //ws.send(document.getElementById('messageEnvoi').value);
        ws.send(JSON.stringify({
            nom: document.getElementById('nom').value,
            reponse: document.getElementById('messageEnvoi').value
        }));
    }
