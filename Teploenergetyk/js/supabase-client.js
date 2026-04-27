/* =========================================================
   SUPABASE CLIENT
   Проєкт: Теплоенергетик
========================================================= */

(function () {
    const SUPABASE_URL = "https://izpldgnzfedgtqyvynuv.supabase.co";

    const SUPABASE_ANON_KEY = "sb_publishable_KhFF6-wVFTfc0MYkmHeA_Q_Fo2onlLk";

    if (!window.supabase || !window.supabase.createClient) {
        console.error("Supabase CDN не завантажився.");
        return;
    }

    const client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    /*
       Перезаписуємо window.supabase вже готовим клієнтом,
       щоб у всіх інших файлах можна було писати:
       supabase.auth...
       supabase.from...
    */
    window.supabase = client;

    console.log("Supabase connected:", SUPABASE_URL);
})();


/* =========================================================
   ОТРИМАТИ ПОТОЧНОГО КОРИСТУВАЧА
========================================================= */

async function getCurrentUser() {
    const { data, error } = await window.supabase.auth.getUser();

    if (error) {
        console.error("Помилка отримання користувача:", error.message);
        return null;
    }

    return data.user;
}


/* =========================================================
   ОТРИМАТИ ПРОФІЛЬ ПОТОЧНОГО КОРИСТУВАЧА
========================================================= */

async function getCurrentProfile() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }

    const { data, error } = await window.supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Помилка отримання профілю:", error.message);
        return null;
    }

    if (!data || data.is_deleted) {
        return null;
    }

    return data;
}


/* =========================================================
   ПЕРЕВІРКА АВТОРИЗАЦІЇ
========================================================= */

async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return null;
    }

    const profile = await getCurrentProfile();

    if (!profile) {
        await window.supabase.auth.signOut();

        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_role");

        window.location.href = "login.html";
        return null;
    }

    return user;
}


/* =========================================================
   ПЕРЕВІРКА АДМІНА
========================================================= */

async function requireAdmin() {
    const user = await requireAuth();

    if (!user) {
        return null;
    }

    const { data: profile, error } = await window.supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error || !profile || profile.role !== "admin") {
        if (typeof showSiteAlert === "function") {
            showSiteAlert(
                "Доступ заборонено. Ця сторінка доступна лише адміністратору.",
                "Повідомлення",
                () => {
                    window.location.href = "index.html";
                }
            );
        } else {
            alert("Доступ заборонено. Ця сторінка доступна лише адміністратору.");
            window.location.href = "index.html";
        }

        return null;
    }

    return user;
}


/* =========================================================
   ВИХІД З АКАУНТА
========================================================= */

async function logoutUser() {
    const { error } = await window.supabase.auth.signOut();

    if (error) {
        console.error("Помилка виходу:", error.message);
        if (typeof showSiteAlert === "function") {
            showSiteAlert("Не вдалося вийти з акаунта.");
        } else {
            alert("Не вдалося вийти з акаунта.");
        }
        return;
    }

    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("user_role");

    window.location.href = "login.html";
}

/* =========================================================
   ПЕРЕКЛАД ПОМИЛОК
========================================================= */


function translateSupabaseError(message) {
    if (!message) {
        return "Сталася невідома помилка.";
    }

    const text = String(message).toLowerCase();

    if (text.includes("invalid login credentials")) {
        return "Неправильний email, нікнейм або пароль.";
    }

    if (text.includes("email not confirmed")) {
        return "Email ще не підтверджено.";
    }

    if (text.includes("email logins are disabled")) {
        return "Вхід через email вимкнено в налаштуваннях Supabase.";
    }

    if (text.includes("user already registered") || text.includes("already registered")) {
        return "Користувач із таким email уже зареєстрований.";
    }

    if (text.includes("password should be at least")) {
        return "Пароль занадто короткий.";
    }

    if (text.includes("rate limit")) {
        return "Забагато спроб. Спробуйте трохи пізніше.";
    }

    if (text.includes("invalid email")) {
        return "Некоректна email-адреса.";
    }

    if (text.includes("jwt expired")) {
        return "Сесія завершилася. Увійдіть знову.";
    }

    if (text.includes("permission denied") || text.includes("row-level security")) {
        return "Недостатньо прав для виконання цієї дії.";
    }

    if (text.includes("violates foreign key constraint")) {
        return "Неможливо виконати дію через пов’язані дані.";
    }

    if (text.includes("violates check constraint")) {
        return "Введене значення не відповідає допустимим параметрам.";
    }

    return message;
}