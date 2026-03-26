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

var _arrowHeld = {};
var _arrowRaf = null;
var _arrowSpeed = 108;

function _arrowScrollTick() {
    var dy = 0;
    if (_arrowHeld["ArrowDown"]) dy += _arrowSpeed;
    if (_arrowHeld["ArrowUp"])   dy -= _arrowSpeed;
    if (dy !== 0) {
      var el = document.scrollingElement || document.documentElement;
      el.scrollTop += dy;
      _arrowRaf = requestAnimationFrame(_arrowScrollTick);
    } else {
      _arrowRaf = null;
    }
  }

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") menu.classList.remove("visible");

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      _arrowHeld[e.key] = true;
      if (!_arrowRaf) {
        _arrowRaf = requestAnimationFrame(_arrowScrollTick);
      }
    }
  });

document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      _arrowHeld[e.key] = false;
    }
  });

document.getElementById("ctx-back").addEventListener("click", function () {
    history.back();
  });
  document.getElementById("ctx-forward").addEventListener("click", function () {
    history.forward();
  });
  document.getElementById("ctx-refresh").addEventListener("click", function () {
    window._csReloading = true;
    sessionStorage.setItem("page-transitioning", "1");

    document.body.style.transition = "none";
    document.body.style.opacity = "1";
    void document.body.offsetWidth;

    var done = false;
    function onCtxDone() {
      if (done) return;
      done = true;
      document.body.removeEventListener("transitionend", onCtxTrans);
      location.reload();
    }
    function onCtxTrans(ev) {
      if (ev.target === document.body && ev.propertyName === "opacity") onCtxDone();
    }
    document.body.addEventListener("transitionend", onCtxTrans);
    setTimeout(onCtxDone, 600);

    requestAnimationFrame(function () {
      document.body.style.transition = "opacity 500ms ease";
      document.body.style.opacity = "0";
    });
  });
})();
