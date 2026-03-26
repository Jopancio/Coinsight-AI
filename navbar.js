(function () {
    var nav = document.getElementById("main-nav");
    var navContainer = document.getElementById("nav-container");
    var logoIcon = document.getElementById("logo-icon");
    var logoText = document.getElementById("logo-text");
    var navLinks = document.getElementById("nav-links");
    var navBtn = document.getElementById("nav-btn");

    if (!nav || !navContainer) return;

    var mobileBtn = document.getElementById("mobile-menu-btn");
    var mobileDropdown = document.getElementById("mobile-menu-dropdown");
    var mobileOverlay = document.getElementById("mobile-menu-overlay");
    var mobileOpen = false;

    function openMobileMenu() {
        mobileOpen = true;
        if (mobileBtn) mobileBtn.classList.add("is-open");
        if (mobileDropdown) {
            var navH = nav.getBoundingClientRect().height;
            mobileDropdown.style.paddingTop = navH + "px";
            mobileDropdown.classList.add("open");
            var links = mobileDropdown.querySelectorAll("a");
            gsap.fromTo(links,
                { y: 14, opacity: 0, x: -10 },
                { y: 0, opacity: 1, x: 0, duration: 0.4, ease: "power3.out", stagger: 0.06, delay: 0.08, clearProps: "transform" }
            );
        }
        if (mobileOverlay) mobileOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        mobileOpen = false;
        if (mobileBtn) mobileBtn.classList.remove("is-open");
        if (mobileDropdown) {
            var links = mobileDropdown.querySelectorAll("a");
            gsap.killTweensOf(links);
            gsap.set(links, { clearProps: "all" });
            mobileDropdown.classList.remove("open");
        }
        if (mobileOverlay) mobileOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (mobileBtn) {
        mobileBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            mobileOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener("click", closeMobileMenu);
    }

    if (mobileDropdown) {
        mobileDropdown.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMobileMenu);
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && mobileOpen) closeMobileMenu();
    });

    var btt = document.getElementById("back-to-top");

    if (!btt) {
        btt = document.createElement("button");
        btt.id = "back-to-top";
        btt.setAttribute("aria-label", "Kembali ke atas");
        btt.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
        document.body.appendChild(btt);
    }

    btt.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", function () {
        if (window.scrollY > 400) {
            btt.classList.add("visible");
        } else {
            btt.classList.remove("visible");
        }
    }, { passive: true });

    var isScrolled = false;
    var navTween = null;

    function navToScrolled() {
        if (isScrolled) return;
        isScrolled = true;

        var isMob = window.innerWidth < 1024;
        if (isMob) return; 

        if (navTween) navTween.kill();
        navTween = gsap.timeline({ defaults: { duration: 0.6, ease: "expo.out", overwrite: "auto" } });

        navTween
            .to(nav, { width: "58rem", maxWidth: "88%", top: "0.875rem", borderRadius: "9999px", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }, 0)
            .to(navContainer, { padding: "0.7rem 1.5rem" }, 0)
            .to(logoIcon, { width: "2rem", height: "2rem", fontSize: "1.25rem" }, 0)
            .to(logoText, { fontSize: "1.25rem" }, 0)
            .to(navLinks, { gap: "1.5rem", fontSize: "0.875rem" }, 0)
            .to(navBtn, { padding: "0.5rem 1.5rem", fontSize: "0.875rem" }, 0);
    }

    function navToExpanded() {
        if (!isScrolled) return;
        isScrolled = false;

        var isMob = window.innerWidth < 1024;
        if (isMob) return; 

        if (navTween) navTween.kill();
        navTween = gsap.timeline({ defaults: { duration: 0.6, ease: "expo.out", overwrite: "auto" } });

        navTween
            .to(nav, { width: "100%", maxWidth: "100%", top: "0px", borderRadius: "0px", boxShadow: "0 0 0 0 rgba(0,0,0,0)" }, 0)
            .to(navContainer, { padding: "2rem 1.5rem" }, 0)
            .to(logoIcon, { width: "2.5rem", height: "2.5rem", fontSize: "1.5rem" }, 0)
            .to(logoText, { fontSize: "1.5rem" }, 0)
            .to(navLinks, { gap: "2.5rem", fontSize: "1rem" }, 0)
            .to(navBtn, { padding: "0.75rem 2rem", fontSize: "1rem" }, 0);
    }

    var scrollTicking = false;
    window.addEventListener("scroll", function () {
        if (!scrollTicking) {
            requestAnimationFrame(function () {
                if (window.scrollY > 50) {
                    navToScrolled();
                } else {
                    navToExpanded();
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    if (window.scrollY > 50 && window.innerWidth >= 1024) {
        gsap.set(nav, { width: "56rem", maxWidth: "90%", top: "1rem", borderRadius: "9999px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" });
        gsap.set(navContainer, { padding: "0.75rem 1.5rem" });
        gsap.set(logoIcon, { width: "2rem", height: "2rem", fontSize: "1.25rem" });
        gsap.set(logoText, { fontSize: "1.25rem" });
        gsap.set(navLinks, { gap: "1.5rem", fontSize: "0.875rem" });
        gsap.set(navBtn, { padding: "0.5rem 1.5rem", fontSize: "0.875rem" });
        isScrolled = true;
    }

    document.querySelectorAll(".nav-hover-link").forEach(function (link) {
        link._isHovered = false;

        link.addEventListener("mouseenter", function () {
            link._isHovered = true;
            gsap.killTweensOf(link);
            gsap.to(link, {
                scale: 1.07,
                y: -2,
                color: "#ffffff",
                textShadow: "0 0 16px rgba(255,255,255,0.45)",
                duration: 0.35,
                ease: "power3.out"
            });
        });

        link.addEventListener("mouseleave", function () {
            link._isHovered = false;
            gsap.killTweensOf(link);

            if (link.classList.contains("nav-active")) {
                gsap.to(link, { scale: 1.04, y: 0, color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.25)", duration: 0.45, ease: "power3.out" });
            } else {
                gsap.to(link, { scale: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "color,textShadow" });
            }
        });
    });
})();
