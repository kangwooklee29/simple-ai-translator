if (localStorage.getItem("API_KEY"))
    document.querySelector("div.API_KEY  input").value = localStorage.getItem("API_KEY");

document.body.addEventListener("click", e => {
    if (e.target.nodeName === "BUTTON") {
        const parentNode = e.target.parentNode.parentNode.parentNode;
        if (parentNode.classList.contains("API_KEY"))
            localStorage.setItem("API_KEY", parentNode.querySelector("input").value);
    }
});
