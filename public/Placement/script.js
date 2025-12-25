document.getElementById("moreInfoBtn").addEventListener("click", function() {
    const moreInfo = document.getElementById("moreInfo");
    if (moreInfo.style.display === "none") {
        moreInfo.style.display = "block";
        this.textContent = "Hide Info";
    } else {
        moreInfo.style.display = "none";
        this.textContent = "Click for More Info";
    }
});
