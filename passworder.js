// Test
let eventloop = require("event_loop");
let gui = require("gui");
let subMenu = require("gui/submenu");
let textinput = require("gui/text_input");
let dialog = require("gui/dialog");
let loading = require("gui/loading");
let storage = require("storage");
let badusb = require("badusb");
let notify = require("notification");

let core = load(__dirname + "/.lib/api.js");

let filePath = "/ext/apps_data/passworder";
let fileName = "/passwords.txt";

let lengths = [5, 8, 40, 45, 100];

let generatedPassword = "";

let views = {
    lengthChooser: subMenu.makeWith({
        header: "Wie lang?",
        items: ["5", "8", "40", "45", "100"]
    }),
    nameInput: textinput.makeWith({
        header: "Name"
    }),
    generated: dialog.makeWith({
        header: "Passwort erstellt!",
        text: "Das Passwort wurde erstellt und gespeichert!",
        center: "Weiter",
        right: "Ende"
    }),
    sendDialog: dialog.makeWith({
        header: "Passwort senden",
        text: "Soll das Passwort gesendet werden?",
        center: "Senden",
        right: "Fertig"
    }),
    sending: loading.make()
};

badusb.setup({
    vid: 0xAAAA,
    pid: 0xBBBB,
    mfr_name: "ProxySocke",
    prod_name: "Passworder",
    layoutPath: "/ext/badusb/assets/layouts/de-DE.kl"
});

function writePassword(name, password) {
    storage.makeDirectory(filePath);
    let line = name + ": " + password + "\n";
    let file;
    if (storage.fileExists(filePath + fileName)) {
        file = storage.openFile(filePath + fileName, "w", "open_append");
        file.write(line);
        file.close();
        return;
    }
    file = storage.openFile(filePath + fileName, "w", "create_always");
    file.write(line);
    file.close();
};

function onLengthChoosen(_sub, index) {
    generatedPassword = core.randomString(lengths[index]);
    gui.viewDispatcher.switchTo(views.nameInput);
};

function onNameInput(_sub, name) {
    writePassword(name, generatedPassword);
    gui.viewDispatcher.switchTo(views.generated);
};

function onGeneratedNext(_sub, button, eventLoop) {
    if (button === "center") {
        gui.viewDispatcher.switchTo(views.sendDialog);
    } else if (button === "right") {
        eventLoop.stop();
    }
};

function onSendDialogInput(_sub, button, eventLoop) {
    if (button === "center") {
        gui.viewDispatcher.switchTo(views.sending);
        delay(50);
        if (!badusb.isConnected()) {
            views.sendDialog.set("header", "Senden schlug fehl")
            views.sendDialog.set("text", "Keine USB Verbindung!")
            gui.viewDispatcher.switchTo(views.sendDialog);
            notify.error();
            return;
        }else {
            views.sendDialog.set("header", "Gesendet!")
            views.sendDialog.set("text", "Das Passwort wurde gesendet!")
        }
        badusb.print(generatedPassword);
        notify.success();
        delay(50);
        gui.viewDispatcher.switchTo(views.sendDialog);
    } else if (button === "right") {
        eventLoop.stop();
    }
};


gui.viewDispatcher.switchTo(views.lengthChooser);

eventloop.subscribe(views.lengthChooser.chosen, onLengthChoosen);
eventloop.subscribe(views.nameInput.input, onNameInput);
eventloop.subscribe(views.generated.input, onGeneratedNext, eventloop);
eventloop.subscribe(views.sendDialog.input, onSendDialogInput, eventloop);

eventloop.subscribe(gui.viewDispatcher.navigation, function(_sub, _, eventLoop){
    eventLoop.stop();
}, eventloop);

eventloop.run();
badusb.quit();