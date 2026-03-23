(function () {
  
  const menu = document.createElement("div");
  menu.id = "custom-context-menu";
  menu.innerHTML = `
    <button id="ctx-back" class="ctx-item">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back</span>
    </button>
    <button id="ctx-forward" class="ctx-item">
      <i class="fa-solid fa-arrow-right"></i>
      <span>Forward</span>
    </button>
    <button id="ctx-refresh" class="ctx-item">
      <i class="fa-solid fa-rotate-right"></i>
      <span>Refresh</span>
    </button>
    <div class="ctx-divider"></div>
    <div class="ctx-footer">CoinSight &copy; 2026</div>
  `;
  document.body.appendChild(menu);

document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    const isAlreadyVisible = menu.classList.contains("visible");
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;

    if (!isAlreadyVisible) {
      
      menu.style.transition = "none";
      menu.style.left = x + "px";
      menu.style.top = y + "px";
      
      void menu.offsetWidth;
      menu.style.transition = "";
      menu.classList.add("visible");
    } else {
      
      menu.style.left = x + "px";
      menu.style.top = y + "px";
    }
  });

document.addEventListener("click", function () {
    menu.classList.remove("visible");
  });

window.addEventListener("scroll", function () {
    menu.classList.remove("visible");
  });

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") menu.classList.remove("visible");
  });

document.getElementById("ctx-back").addEventListener("click", function () {
    history.back();
  });
  document.getElementById("ctx-forward").addEventListener("click", function () {
    history.forward();
  });
  document.getElementById("ctx-refresh").addEventListener("click", function () {
    sessionStorage.setItem("page-transitioning", "1");
    document.body.style.transition = "opacity 500ms ease";
    document.body.style.opacity = "0";
    setTimeout(function () {
      location.reload();
    }, 500);
  });
})();
