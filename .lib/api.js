let math = require("math");

let letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function randomInt(min, max) {
    return math.floor(math.random() * (max - min) + min);
};

function randomBoolean() {
    let a = math.floor(math.random() * 2);
    if (a === 1) { return true; } else { return false; }
};

function randomStringUpper(length){
    let a = "";
    for (let i = length; i > 0; i--) {
        let randomIndex = math.floor(math.random() * 26);
        a = a + letters[randomIndex];
    }
    return a;
};

function randomString(length){
    let a = "";
    for (let i = length; i > 0; i--) {
        let randomIndex = math.floor(math.random() * 36);
        let letter = letters[randomIndex];
        if(randomBoolean()){
            // Zufälliger Buchstabe wird lowercased.
            a = a + letter.toLowerCase();
        }else {
            // Zufälliger Buchstabe bleibt uppercased.
            a = a + letter;
        }
    }
    return a;
};

// API Objekt
({
    randomInt: randomInt,
    randomBoolean: randomBoolean,
    randomStringUpper: randomStringUpper,
    randomString: randomString
})