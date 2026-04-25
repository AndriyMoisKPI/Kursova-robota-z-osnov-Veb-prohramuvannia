/* =========================================================
   APP.JS
   Глобальна логіка сайту "Теплоенергетик"
========================================================= */


/* =========================================================
   НАЛАШТУВАННЯ ЗА ЗАМОВЧУВАННЯМ
========================================================= */

const DEFAULT_THEME = "light";
const DEFAULT_COLOR_SCHEME = "green";
const DEFAULT_FONT_SIZE = "normal";


/* =========================================================
   LOCAL STORAGE
========================================================= */

function saveLocalSettings(settings) {
    if (settings.theme) {
        localStorage.setItem("theme", settings.theme);
    }

    if (settings.color_scheme) {
        localStorage.setItem("color_scheme", settings.color_scheme);
    }

    if (settings.font_size) {
        localStorage.setItem("font_size", settings.font_size);
    }
}


function getLocalSettings() {
    return {
        theme: localStorage.getItem("theme") || DEFAULT_THEME,
        color_scheme: localStorage.getItem("color_scheme") || DEFAULT_COLOR_SCHEME,
        font_size: localStorage.getItem("font_size") || DEFAULT_FONT_SIZE
    };
}


/* =========================================================
   ЗАСТОСУВАННЯ ТЕМИ
========================================================= */

function applyTheme(theme) {
    const selectedTheme = theme || DEFAULT_THEME;

    document.documentElement.setAttribute("data-theme", selectedTheme);

    const themeButton = document.getElementById("themeToggle");

    if (themeButton) {
        themeButton.textContent = selectedTheme === "dark" ? "☀️" : "🌙";
        themeButton.title = selectedTheme === "dark"
            ? "Увімкнути світлу тему"
            : "Увімкнути темну тему";
    }
}


function applyColorScheme(colorScheme) {
    const selectedColor = colorScheme || DEFAULT_COLOR_SCHEME;

    document.documentElement.setAttribute("data-color", selectedColor);
}


function applyFontSize(fontSize) {
    const selectedSize = fontSize || DEFAULT_FONT_SIZE;

    document.documentElement.setAttribute("data-font-size", selectedSize);
}


function applyAllSettings(settings) {
    applyTheme(settings.theme);
    applyColorScheme(settings.color_scheme);
    applyFontSize(settings.font_size);
    saveLocalSettings(settings);
}


/* =========================================================
   ПЕРЕМИКАННЯ ТЕМИ
========================================================= */

async function toggleTheme() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;

    const newTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon();
    /*
       Якщо користувач авторизований,
       зберігаємо тему в Supabase.
    */
    try {
        if (typeof getCurrentUser !== "function") return;

        const user = await getCurrentUser();

        if (!user) return;

        const { error } = await supabase
            .from("profiles")
            .update({ theme: newTheme })
            .eq("id", user.id);

        if (error) {
            console.error("Помилка збереження теми:", error.message);
        }
    } catch (error) {
        console.error("Помилка перемикання теми:", error.message);
    }
}

function updateThemeIcon() {
    const themeIcon = document.getElementById("themeIcon");
    if (!themeIcon) return;

    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";

    if (currentTheme === "dark") {
        themeIcon.className = "bi bi-sun-fill";
    } else {
        themeIcon.className = "bi bi-moon-stars-fill";
    }
}

/* =========================================================
   ЗАВАНТАЖЕННЯ НАЛАШТУВАНЬ КОРИСТУВАЧА
========================================================= */

async function loadUserSettings() {
    /*
       Спочатку застосовуємо локальні налаштування,
       щоб тема не блимала при завантаженні.
    */
    const localSettings = getLocalSettings();
    applyAllSettings(localSettings);

    /*
       Якщо користувач не авторизований,
       залишаємо локальні налаштування.
    */
    try {
        if (typeof getCurrentUser !== "function") return;

        const user = await getCurrentUser();

        if (!user) return;

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("theme, color_scheme, font_size")
            .eq("id", user.id)
            .single();

        if (error || !profile) {
            console.error("Помилка завантаження налаштувань:", error?.message);
            return;
        }

        applyAllSettings(profile);

    } catch (error) {
        console.error("Помилка налаштувань користувача:", error.message);
    }
}


/* =========================================================
   СТАН АВТОРИЗАЦІЇ В МЕНЮ
========================================================= */

async function updateNavbarAuthState() {
    const navMenu = document.querySelector(".nav-custom");
    const authLink = document.querySelector('a[href="login.html"], a[data-auth-link="true"]');

    if (!navMenu || !authLink) return;

    const oldAdminItem = document.getElementById("adminNavItem");

    if (oldAdminItem) {
        oldAdminItem.remove();
    }

    authLink.dataset.authLink = "true";

    const newAuthLink = authLink.cloneNode(true);
    authLink.parentNode.replaceChild(newAuthLink, authLink);

    // 1. Миттєво показуємо стан із localStorage
    const cachedRole = localStorage.getItem("user_role");
    const cachedLoggedIn = localStorage.getItem("is_logged_in");

    if (cachedLoggedIn === "true") {
        newAuthLink.textContent = "Вийти";
        newAuthLink.href = "#";

        newAuthLink.addEventListener("click", async (event) => {
            event.preventDefault();

            showSiteConfirm(
                "Вийти з акаунта?",
                async () => {
                    localStorage.removeItem("is_logged_in");
                    localStorage.removeItem("user_role");

                    await logoutUser();
                },
                "Підтвердження виходу",
                "Вийти"
            );
        });

        if (cachedRole === "admin") {
            addAdminNavItem(navMenu, newAuthLink);
        }
    } else {
        newAuthLink.textContent = "Вхід";
        newAuthLink.href = "login.html";
    }

    // 2. Потім перевіряємо реальний стан у Supabase
    const user = await getCurrentUser();

    if (!user) {
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_role");

        const adminItem = document.getElementById("adminNavItem");
        if (adminItem) adminItem.remove();

        newAuthLink.textContent = "Вхід";
        newAuthLink.href = "login.html";

        return;
    }

    localStorage.setItem("is_logged_in", "true");

    newAuthLink.textContent = "Вийти";
    newAuthLink.href = "#";

    const profile = await getCurrentProfile();

    if (profile && profile.role) {
        localStorage.setItem("user_role", profile.role);
    }

    const currentAdminItem = document.getElementById("adminNavItem");
    if (currentAdminItem) currentAdminItem.remove();

    if (profile && profile.role === "admin") {
        addAdminNavItem(navMenu, newAuthLink);
    }
}

function addAdminNavItem(navMenu, authLink) {
    if (document.getElementById("adminNavItem")) return;

    const adminItem = document.createElement("li");
    adminItem.className = "nav-item";
    adminItem.id = "adminNavItem";

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const isAdminPage = currentPage === "admin.html";

    adminItem.innerHTML = `
        <a class="nav-link ${isAdminPage ? "active" : ""}" href="admin.html">Адмін</a>
    `;

    navMenu.insertBefore(adminItem, authLink.parentElement);
}


/* =========================================================
   АКТИВНЕ ПОСИЛАННЯ В МЕНЮ
========================================================= */

function setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");

        if (href === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}


/* =========================================================
   ДОПОМІЖНА ФУНКЦІЯ ДЛЯ ЗАХИЩЕНИХ СТОРІНОК
========================================================= */

async function protectPage() {
    if (typeof getCurrentUser !== "function") return null;

    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}

function closeSiteModal() {
    if (!siteModal) return;
    siteModal.classList.add("d-none");
    siteModalOkBtn.onclick = null;
    siteModalCancelBtn.onclick = null;
    siteModalCloseBtn.onclick = null;
}

function getSiteModalElements() {
    return {
        modal: document.getElementById("siteModal"),
        title: document.getElementById("siteModalTitle"),
        body: document.getElementById("siteModalBody"),
        okBtn: document.getElementById("siteModalOkBtn"),
        cancelBtn: document.getElementById("siteModalCancelBtn"),
        closeBtn: document.getElementById("siteModalCloseBtn"),
        backdrop: document.querySelector(".site-modal-backdrop")
    };
}

function closeSiteModal() {
    const { modal, okBtn, cancelBtn, closeBtn, backdrop } = getSiteModalElements();

    if (!modal) return;

    modal.classList.add("d-none");

    if (okBtn) okBtn.onclick = null;
    if (cancelBtn) cancelBtn.onclick = null;
    if (closeBtn) closeBtn.onclick = null;
    if (backdrop) backdrop.onclick = null;
}

function showSiteAlert(message, title = "Повідомлення", onOk = null) {
    const { modal, title: titleEl, body, okBtn, cancelBtn, closeBtn, backdrop } = getSiteModalElements();

    if (!modal || !titleEl || !body || !okBtn || !cancelBtn || !closeBtn) {
        alert(message);

        if (typeof onOk === "function") {
            onOk();
        }

        return;
    }

    titleEl.textContent = title;
    body.textContent = message;

    cancelBtn.classList.add("d-none");
    okBtn.textContent = "OK";

    const finish = () => {
        closeSiteModal();

        if (typeof onOk === "function") {
            onOk();
        }
    };

    okBtn.onclick = finish;
    closeBtn.onclick = finish;

    if (backdrop) {
        backdrop.onclick = finish;
    }

    modal.classList.remove("d-none");
}

function showSiteConfirm(message, onConfirm, title = "Підтвердження", okText = "Підтвердити") {
    const { modal, title: titleEl, body, okBtn, cancelBtn, closeBtn, backdrop } = getSiteModalElements();

    if (!modal || !titleEl || !body || !okBtn || !cancelBtn || !closeBtn) {
        const result = confirm(message);

        if (result && typeof onConfirm === "function") {
            onConfirm();
        }

        return;
    }

    titleEl.textContent = title;
    body.textContent = message;

    cancelBtn.classList.remove("d-none");
    cancelBtn.textContent = "Скасувати";
    okBtn.textContent = okText;

    okBtn.onclick = () => {
        closeSiteModal();

        if (typeof onConfirm === "function") {
            onConfirm();
        }
    };

    cancelBtn.onclick = closeSiteModal;
    closeBtn.onclick = closeSiteModal;

    if (backdrop) {
        backdrop.onclick = closeSiteModal;
    }

    modal.classList.remove("d-none");
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSiteModal();
    }
});

/* =========================================================
   ІНІЦІАЛІЗАЦІЯ
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    
    setTimeout(() => {
    document.documentElement.classList.add("theme-ready");
}, 50);

    loadUserSettings();
    setActiveNavLink();
    await updateNavbarAuthState();
    updateThemeIcon();

    const themeButton = document.getElementById("themeToggle");

    if (themeButton) {
        themeButton.addEventListener("click", toggleTheme);
    }
});