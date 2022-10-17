let text_name = document.getElementById("name");
let text_intro = document.getElementById("intro");
let top_container = document.getElementById("top-container");

text_name.style.backgroundPositionX = "100%";

text_name.addEventListener("mouseover", function() {
    top_container.style.backgroundPositionX = "100%";
    text_name.style.backgroundPositionX = "0%";
    text_intro.style.color = "white";
}, false);

text_name.addEventListener("mouseleave", function() {
    top_container.style.backgroundPositionX = "0%";
    text_intro.style.color = "black";
    text_name.style.backgroundPositionX = "100%";
}, false);