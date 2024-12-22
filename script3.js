const instrukcja = document.getElementById("instrukcja");
const neon = document.getElementById("neon");

function Iopen() {
    instrukcja.style.display = "block";
}

function Iclose() {
    instrukcja.style.display = "none";
}

function lightoff() {
    neon.style.textShadow = "none";
}

function lighton() {
    neon.style.textShadow = "0 0 5px #fff, 0 0 10px #fff, 0 0 20px #fff, 0 0 40px #faf, 0 0 80px #faf, 0 0 90px #faf, 0 0 100px #faf";
}

function neontoggle() {
    if (neon.style.textShadow === "none") {
        lighton();
    } else {
        lightoff();
    }
}



    neon.addEventListener("click", neontoggle);
