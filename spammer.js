let eventloop = require("event_loop");
let gui = require("gui");
let subMenu = require("gui/submenu");
let textInput = require("gui/text_input");
let dialog = require("gui/dialog");
let badusb = require("badusb");
let notify = require("notification");
let core = load(__dirname + "/.lib/api.js");

let messageAmounts = [5, 10, 50, 100, 500, 1000, 5000, -1];
let waitMillisAmounts = [1, 500, 1000];

// Globale Einstellungen
let attackAmount = 0;
let waitMillis = 0;
let textToSpam = "";
// Wenn randomLength größer als 0 ist wird textToSpam nicht verwendet, sondern ein random Text mit dieser
// Länge erzeugt.
let randomLength = 0;

// GUIs
let views = {
    messageAmountChooser: subMenu.makeWith({
        header: "Anzahl",
        items: ["5x", "10x", "50x", "100x", "500x", "1000x", "5000x", "Dauerhaft"]
    }),
    millisChooser: subMenu.makeWith({
        header: "Intervall",
        items: ["1ms", "500ms", "1s"]
    }),
    textTypeChooser: subMenu.makeWith({
        header: "Spam-Typ",
        items: ["Random 64", "Random 100", "Custom"]
    }),
    spamTextInput: textInput.makeWith({
        minLength: 1,
        maxLength: 100,
        header: "Text",
        defaultText: "Spam",
        defaultTextClear: true
    }),
    confirmStart: dialog.makeWith({
        header: "Angriff starten?",
        text: "Soll der Angriff wirklich gestartet werden?",
        center: "Ja",
        left: "Config",
        right: "Nein"
    }),
    abortAttack: dialog.makeWith({
        header: "Angriff laeuft...",
        text: "Dies kann je nach Einstellung einige Zeit dauern!",
        center: "Abbrechen"
    })
};

badusb.setup({
    vid: 0xAAAA,
    pid: 0xBBBB,
    mfr_name: "SuperGamingKeyBoard",
    prod_name: "LogitecKeyboard",
    layoutPath: "/ext/badusb/assets/layouts/de-DE.kl"
});

function init() {
    print("## Message Spammer ##\nVersion: 1.0.1\nVon: Joey <3\n## Message Spammer ##\n ");
    delay(1000);
    // Menu zum wählen der Nachrichten Anzahl anzeigen.
    gui.viewDispatcher.switchTo(views.messageAmountChooser);
};

// Wird ausgeführt wenn die Anzahl an Nachrichten ausgewählt wurde.
function onMessageAmountChoosen(_sub, index) {
    attackAmount = messageAmounts[index];
    gui.viewDispatcher.switchTo(views.millisChooser);
};

// Wird ausgeführt wenn die Wartezeit zwischen den Nachrichten ausgewählt wurde.
function onMillisChoosen(_sub, index) {
    // Wartezeit zwischen den Nachrichten wird gesetzt.
    waitMillis = waitMillisAmounts[index];

    // Menu zur Auswahl des Spam-Textes anzeigen.
    gui.viewDispatcher.switchTo(views.textTypeChooser);
};

// Wird ausgeführt, wenn der Text ausgewählt wurde, der gesendet werden soll.
function onTextInput(_sub, text) {
    textToSpam = text;
    gui.viewDispatcher.switchTo(views.confirmStart);
};

// Wird ausgeführt wenn der Nutzer einen Spam-Typ gewählt hat.
function onSpamTypeChoosen(_sub, index) {
    if (index === 0) {
        randomLength = 64;
        gui.viewDispatcher.switchTo(views.confirmStart)
    } else if (index === 1) {
        randomLength = 100;
        gui.viewDispatcher.switchTo(views.confirmStart)
    } else if (index === 2) {
        randomLength = 0;
        gui.viewDispatcher.switchTo(views.spamTextInput);
    }
};

// Wird ausgeführt, wenn der Angriffsstart vom Nutzer bestätigt wird.
function onConfirm(_sub, button, eventLoop) {
    if (button === "center") {
        // Angriff starten
        gui.viewDispatcher.switchTo(views.abortAttack);
        startAttack(eventLoop);
    } else if (button === "left") {
        // Config
        views.spamTextInput.set("defaultText", textToSpam);
        gui.viewDispatcher.switchTo(views.messageAmountChooser);
    } else if (button === "right") {
        // Cancel
        eventLoop.stop();
    }
};

// Wird ausgeführt wenn der Nutzer einen laufenden Angriff abbricht.
function onAbort(_sub, _, eventLoop) {
    print("Du hast den Angriff abgebrochen!");
    eventLoop.stop();
};

function connectionFailed() {
    return !badusb.isConnected();
};

// Gibt den zu spammenden Text je nach Einstellung zurück.
function makeSpamText() {
    if (randomLength > 0) {
        return core.randomString(randomLength);
    }
    return textToSpam;
};

// Startet den Angriff
function startAttack(eventLoop) {
    let timer = eventLoop.timer("periodic", waitMillis);
    eventLoop.subscribe(timer, function (_sub, _item, eventLoop, counter) {
        if (counter !== -1 && counter <= 0) {
            print("Angriff beendet!");
            eventLoop.stop();
            return [eventLoop, 0];
        }
        if (connectionFailed()) {
            print("Keine USB Verbindung!");
            notify.error();
            eventLoop.stop();
            return [eventLoop, 0];
        }
        badusb.print(makeSpamText());
        delay(10);
        badusb.press("ENTER");

        if (counter !== -1) {
            // Der counter ist nicht -1 also nicht dauerhaft.
            // daher müssen wir den counter jedesmal verringern.
            return [eventLoop, counter - 1];
        } else {
            // Der counter ist -1 also "dauerhaft". Um RAM zu sparen
            // machen wir nichts mit dem counter. Er wird quasi jedesmal wieder auf -1 gesetzt.
            return [eventLoop, -1];
        }
    }, eventLoop, attackAmount);
};

eventloop.subscribe(views.messageAmountChooser.chosen, onMessageAmountChoosen);
eventloop.subscribe(views.millisChooser.chosen, onMillisChoosen);
eventloop.subscribe(views.textTypeChooser.chosen, onSpamTypeChoosen)
eventloop.subscribe(views.spamTextInput.input, onTextInput);
eventloop.subscribe(views.confirmStart.input, onConfirm, eventloop);
eventloop.subscribe(views.abortAttack.input, onAbort, eventloop);
eventloop.subscribe(gui.viewDispatcher.navigation, function (_sub, _, eventLoop) {
    let currentView = gui.viewDispatcher.currentView;
    if(currentView === views.messageAmountChooser){
        // Wenn man im ersten Menu zurück drückt wird das Programm
        // beendet.
        eventLoop.stop();
    }else if(currentView === views.millisChooser){
        // Nach dem "Anzahl" Menü kommt das "Intervall" Menü. Drückt man Zurück,
        //  kommt man wieder in das "Anzahl" Menü.
        gui.viewDispatcher.switchTo(views.messageAmountChooser);
    }else if(currentView === views.textTypeChooser){
        // Nach dem "Intervall" Menu kommt das "Text-Typ" Menu. Drückt man zurück
        // kommt man wieder in das "Intervall" Menü
        gui.viewDispatcher.switchTo(views.millisChooser);
    }
}, eventloop);

init();
eventloop.run();