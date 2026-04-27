/* =========================================================
   AUTH.JS
   Авторизація та реєстрація
   Проєкт: Теплоенергетик
========================================================= */


/* =========================================================
   DOM ЕЛЕМЕНТИ
========================================================= */

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const authMessage = document.getElementById("authMessage");

const userPanel = document.getElementById("userPanel");
const authForms = document.getElementById("authForms");

const currentUserEmail = document.getElementById("currentUserEmail");
const currentUsername = document.getElementById("currentUsername");
const currentUserRole = document.getElementById("currentUserRole");

const logoutBtn = document.getElementById("logoutBtn");

const forgotPasswordLink = document.getElementById("forgotPasswordLink");

const DEFAULT_AVATAR = "assets/avatars/Avatar-engineer.png";

/* =========================================================
   ПОВІДОМЛЕННЯ
========================================================= */

function showMessage(message, type = "success") {
    if (!authMessage) return;

    authMessage.className = `alert alert-${type}`;
    authMessage.textContent = message;
    authMessage.classList.remove("d-none");
}

function hideMessage() {
    if (!authMessage) return;

    authMessage.classList.add("d-none");
    authMessage.textContent = "";
}


/* =========================================================
   ПЕРЕВІРКА НІКНЕЙМУ
========================================================= */

function normalizeUsername(username) {
    return username.trim();
}

function isValidUsername(username) {
    const usernamePattern = /^[a-zA-Z0-9_а-яА-ЯіІїЇєЄґҐ-]{3,30}$/;
    return usernamePattern.test(username);
}

async function isUsernameTaken(username) {
    const normalizedUsername = normalizeUsername(username);

    const { data, error } = await supabase
        .rpc("username_exists", {
            p_username: normalizedUsername
        });

    if (error) {
        console.error("Помилка перевірки нікнейму:", error.message);
        throw new Error("Не вдалося перевірити нікнейм.");
    }

    return Boolean(data);
}


/* =========================================================
   РЕЄСТРАЦІЯ
========================================================= */

async function registerUser(event) {
    event.preventDefault();
    hideMessage();

    const email = document.getElementById("registerEmail").value.trim();
    const username = normalizeUsername(
        document.getElementById("registerUsername").value
    );
    const password = document.getElementById("registerPassword").value;
    const passwordRepeat = document.getElementById("registerPasswordRepeat").value;

    if (!email || !username || !password || !passwordRepeat) {
        showMessage("Заповніть усі поля реєстрації.", "danger");
        return;
    }

    if (!isValidUsername(username)) {
        showMessage(
            "Нікнейм має містити від 3 до 30 символів. Дозволені літери, цифри, дефіс і нижнє підкреслення.",
            "danger"
        );
        return;
    }

    if (password.length < 6) {
        showMessage("Пароль має містити мінімум 6 символів.", "danger");
        return;
    }

    if (password !== passwordRepeat) {
        showMessage("Паролі не співпадають.", "danger");
        return;
    }

    try {
        const taken = await isUsernameTaken(username);

        if (taken) {
            showMessage("Такий нікнейм уже зайнятий. Оберіть інший.", "danger");
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    avatar_url: DEFAULT_AVATAR
                }
            }
        });

        if (error) {
            showMessage(`Помилка реєстрації: ${translateSupabaseError(error.message)}`, "danger");
            return;
        }

        showMessage("Реєстрація успішна. Зараз вас буде перенаправлено на сторінку входу.", "success");

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 800);

    } catch (error) {
        showMessage(error.message || "Сталася помилка під час реєстрації.", "danger");
    }
}


/* =========================================================
   ПОШУК EMAIL ЗА НІКНЕЙМОМ
========================================================= */

async function getEmailByUsername(username) {
    const normalizedUsername = normalizeUsername(username);

    const { data, error } = await supabase
        .rpc("get_email_by_username", {
            p_username: normalizedUsername
        });

    if (error) {
        console.error("Помилка пошуку email:", error.message);
        throw new Error("Не вдалося знайти користувача.");
    }

    return data || null;
}

/* =========================================================
   ВХІД
========================================================= */

async function loginUser(event) {
    event.preventDefault();
    hideMessage();

    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!identifier || !password) {
        showMessage("Введіть email або нікнейм і пароль.", "danger");
        return;
    }

    let email = identifier;

    try {
        /*
           Якщо користувач ввів не email,
           шукаємо email за username у profiles.
        */
        if (!identifier.includes("@")) {
            email = await getEmailByUsername(identifier);

            if (!email) {
                showMessage("Користувача з таким нікнеймом не знайдено.", "danger");
                return;
            }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showMessage(`Помилка входу: ${translateSupabaseError(error.message)}`, "danger");
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profileError) {
            await supabase.auth.signOut();

            showMessage(
                `Помилка перевірки профілю: ${translateSupabaseError(profileError.message)}`,
                "danger"
            );

            return;
        }

        if (!profile || profile.is_deleted) {
            const { error: recreateError } = await supabase
                .from("profiles")
                .upsert({
                    id: data.user.id,
                    email: data.user.email,
                    username: `user_${Date.now()}`,
                    avatar_url: DEFAULT_AVATAR,
                    role: "user",
                    theme: "light",
                    color_scheme: "green",
                    font_size: "normal",
                    is_deleted: false
                });

            if (recreateError) {
                await supabase.auth.signOut();

                showMessage(
                    `Не вдалося створити профіль заново: ${translateSupabaseError(recreateError.message)}`,
                    "danger"
                );

                return;
            }
        }

        showMessage("Вхід виконано успішно.", "success");

        loginForm.reset();

        await checkAuthState();
        localStorage.setItem("is_logged_in", "true");

        setTimeout(() => {
            window.location.href = "office.html";
        }, 700);

    } catch (error) {
        showMessage(error.message || "Сталася помилка під час входу.", "danger");
    }
}


/* =========================================================
   ОТРИМАННЯ ПРОФІЛЮ
========================================================= */

async function loadProfile(userId) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("Помилка завантаження профілю:", error.message);
        return null;
    }

    return data;
}


/* =========================================================
   ПЕРЕВІРКА СТАНУ АВТОРИЗАЦІЇ
========================================================= */

async function checkAuthState() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        console.error("Помилка перевірки користувача:", error.message);
        return;
    }

    const user = data.user;

    if (!user) {
        if (userPanel) userPanel.classList.add("d-none");
        if (authForms) authForms.classList.remove("d-none");
        return;
    }

    const profile = await loadProfile(user.id);

    if (!profile || profile.is_deleted) {
        await supabase.auth.signOut();

        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_role");

        if (userPanel) userPanel.classList.add("d-none");
        if (authForms) authForms.classList.remove("d-none");

        return;
    }

    if (currentUserEmail) {
        currentUserEmail.textContent = user.email || "-";
    }

    if (currentUsername) {
        currentUsername.textContent = profile?.username || "-";
    }

    if (currentUserRole) {
        currentUserRole.textContent = profile?.role || "user";
    }

    if (userPanel) userPanel.classList.remove("d-none");
    if (authForms) authForms.classList.add("d-none");
}


/* =========================================================
   ВИХІД
========================================================= */

async function handleLogout() {
    await logoutUser();
}

/* =========================================================
   ВІДНОВЛЕННЯ ПАРОЛЮ
========================================================= */

async function resetPasswordByEmail() {
    const identifier = document.getElementById("loginIdentifier")?.value.trim();

    if (!identifier || !identifier.includes("@")) {
        showMessage("Введіть email у поле входу, щоб отримати лист для скидання пароля.", "warning");
        return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
        redirectTo: window.location.origin + window.location.pathname.replace("login.html", "settings.html")
    });

    if (error) {
        showMessage(`Помилка скидання пароля: ${translateSupabaseError(error.message)}`, "danger");
        return;
    }

    showMessage("Лист для скидання пароля надіслано на вашу пошту.", "success");
}


/* =========================================================
   ОБРОБНИКИ ПОДІЙ
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    if (loginForm) {
        loginForm.reset();
    }

    if (registerForm) {
        registerForm.reset();
    }

    await checkAuthState();

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", registerUser);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (event) => {
            event.preventDefault();
            resetPasswordByEmail();
        });
    }
});