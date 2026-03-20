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
        }
        if (mobileOverlay) mobileOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        mobileOpen = false;
        if (mobileBtn) mobileBtn.classList.remove("is-open");
        if (mobileDropdown) mobileDropdown.classList.remove("open");
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
        btt.innerHTML = '<span class="btt-text">Klik untuk kembali ke atas</span>';
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

        if (navTween) navTween.kill();
        navTween = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.out", overwrite: "auto" } });

        navTween
            .to(nav, { width: "56rem", maxWidth: "90%", top: "1rem", borderRadius: "9999px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }, 0)
            .to(navContainer, { padding: "0.75rem 1.5rem" }, 0)
            .to(logoIcon, { width: "2rem", height: "2rem", fontSize: "1.25rem" }, 0)
            .to(logoText, { fontSize: "1.25rem" }, 0)
            .to(navLinks, { gap: "1.5rem", fontSize: "0.875rem" }, 0)
            .to(navBtn, { padding: "0.5rem 1.5rem", fontSize: "0.875rem" }, 0);
    }

    function navToExpanded() {
        if (!isScrolled) return;
        isScrolled = false;

        if (navTween) navTween.kill();
        navTween = gsap.timeline({ defaults: { duration: 0.4, ease: "power2.out", overwrite: "auto" } });

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

    if (window.scrollY > 50) {
        gsap.set(nav, { width: "56rem", maxWidth: "90%", top: "1rem", borderRadius: "9999px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" });
        gsap.set(navContainer, { padding: "0.75rem 1.5rem" });
        gsap.set(logoIcon, { width: "2rem", height: "2rem", fontSize: "1.25rem" });
        gsap.set(logoText, { fontSize: "1.25rem" });
        gsap.set(navLinks, { gap: "1.5rem", fontSize: "0.875rem" });
        gsap.set(navBtn, { padding: "0.5rem 1.5rem", fontSize: "0.875rem" });
        isScrolled = true;
    }

    document.querySelectorAll(".nav-hover-link").forEach(function (link) {
        var floatTween = null;
        link._isHovered = false;

        link.addEventListener("mouseenter", function () {
            link._isHovered = true;
            gsap.killTweensOf(link);
            if (floatTween) {
                floatTween.kill();
                floatTween = null;
            }

            gsap.to(link, {
                scale: 1.35,
                color: "#ffffff",
                duration: 0.3,
                ease: "back.out(1.7)",
                onComplete: function () {
                    if (link._isHovered) {
                        floatTween = gsap.to(link, {
                            y: -4,
                            duration: 0.75,
                            ease: "sine.inOut",
                            yoyo: true,
                            repeat: -1
                        });
                    }
                }
            });
        });

        link.addEventListener("mouseleave", function () {
            link._isHovered = false;
            gsap.killTweensOf(link);
            if (floatTween) {
                floatTween.kill();
                floatTween = null;
            }

            if (link.classList.contains("nav-active")) {
                gsap.to(link, { scale: 1.15, y: 0, color: "#ffffff", duration: 0.4, ease: "power2.out" });
            } else {
                gsap.to(link, { scale: 1, y: 0, color: "", duration: 0.4, ease: "power2.out", clearProps: "color" });
            }
        });
    });
})();
