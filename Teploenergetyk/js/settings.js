/* =========================================================
   SETTINGS.JS
   Налаштування профілю користувача
   Проєкт: Теплоенергетик
========================================================= */


/* =========================================================
   DOM ЕЛЕМЕНТИ
========================================================= */

const settingsMessage = document.getElementById("settingsMessage");

const DEFAULT_AVATAR = "assets/avatars/Avatar-engineer.png";

const profileForm = document.getElementById("profileForm");
const appearanceForm = document.getElementById("appearanceForm");

const usernameInput = document.getElementById("usernameInput");

const profileUsername = document.getElementById("profileUsername");
const profileEmail = document.getElementById("profileEmail");
const currentAvatar = document.getElementById("currentAvatar");

const themeSelect = document.getElementById("themeSelect");
const colorSchemeSelect = document.getElementById("colorSchemeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");

const avatarButtons = document.querySelectorAll(".avatar-option");

const logoutSettingsBtn = document.getElementById("logoutSettingsBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const passwordForm = document.getElementById("passwordForm");
const oldPasswordInput = document.getElementById("oldPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const repeatPasswordInput = document.getElementById("repeatPasswordInput");

const avatarGrid = document.querySelector(".avatar-grid");
const showAllAvatarsBtn = document.getElementById("showAllAvatarsBtn");

let currentUser = null;
let currentProfileData = null;


/* =========================================================
   ПОВІДОМЛЕННЯ
========================================================= */

function showSettingsMessage(message, type = "success") {
    if (!settingsMessage) return;

    settingsMessage.className = `alert alert-${type}`;
    settingsMessage.textContent = message;
    settingsMessage.classList.remove("d-none");
}

function hideSettingsMessage() {
    if (!settingsMessage) return;

    settingsMessage.classList.add("d-none");
    settingsMessage.textContent = "";
}


/* =========================================================
   НІКНЕЙМ
========================================================= */

function normalizeSettingsUsername(username) {
    return username.trim();
}

function isValidSettingsUsername(username) {
    const usernamePattern = /^[a-zA-Z0-9_а-яА-ЯіІїЇєЄґҐ-]{3,30}$/;
    return usernamePattern.test(username);
}

async function isSettingsUsernameTaken(username, userId) {
    const normalizedUsername = normalizeSettingsUsername(username);

    const { data, error } = await supabase
        .rpc("username_exists", {
            p_username: normalizedUsername
        });

    if (error) {
        console.error("Помилка перевірки нікнейму:", error.message);
        throw new Error("Не вдалося перевірити нікнейм.");
    }

    if (!data) {
        return false;
    }

    if (
        currentProfileData &&
        currentProfileData.username &&
        currentProfileData.username.toLowerCase() === normalizedUsername.toLowerCase()
    ) {
        return false;
    }

    return true;
}


/* =========================================================
   ЗАВАНТАЖЕННЯ ПРОФІЛЮ
========================================================= */

async function loadSettingsProfile() {
    currentUser = await protectPage();

    if (!currentUser) return;

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error || !profile) {
        console.error("Помилка завантаження профілю:", error?.message);
        showSettingsMessage("Не вдалося завантажити профіль.", "danger");
        return;
    }

    currentProfileData = profile;

    fillSettingsForm(profile);
}


/* =========================================================
   ЗАПОВНЕННЯ ФОРМИ
========================================================= */

function fillSettingsForm(profile) {
    if (usernameInput) {
        usernameInput.value = profile.username || "";
    }

    if (profileUsername) {
        profileUsername.textContent = profile.username || "Користувач";
    }

    if (profileEmail) {
        profileEmail.textContent = profile.email || currentUser.email || "-";
    }

    if (currentAvatar) {
        currentAvatar.src = profile.avatar_url || DEFAULT_AVATAR;
    }

    

    if (themeSelect) {
        themeSelect.value = profile.theme || "light";
    }

    if (colorSchemeSelect) {
        colorSchemeSelect.value = profile.color_scheme || "green";
    }

    if (fontSizeSelect) {
        fontSizeSelect.value = profile.font_size || "normal";
    }

    markActiveAvatar(profile.avatar_url || DEFAULT_AVATAR);

}


/* =========================================================
   АКТИВНИЙ АВАТАР
========================================================= */

function markActiveAvatar(avatarUrl) {
    avatarButtons.forEach(button => {
        const buttonAvatar = button.dataset.avatar;

        if (buttonAvatar === avatarUrl) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}


/* =========================================================
   ОНОВЛЕННЯ НІКНЕЙМУ
========================================================= */

async function updateProfile(event) {
    event.preventDefault();
    hideSettingsMessage();

    if (!currentUser) return;

    const username = usernameInput.value.trim();

    if (!username) {
        showSettingsMessage("Введіть нікнейм.", "danger");
        return;
    }

    if (!isValidSettingsUsername(username)) {
        showSettingsMessage(
            "Нікнейм має містити від 3 до 30 символів. Дозволені літери, цифри, дефіс і нижнє підкреслення.",
            "danger"
        );
        return;
    }

    try {
        const taken = await isSettingsUsernameTaken(username, currentUser.id);

        if (taken) {
            showSettingsMessage("Такий нікнейм уже зайнятий.", "danger");
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .update({
                username: username
            })
            .eq("id", currentUser.id)
            .select()
            .single();

        if (error) {
            showSettingsMessage(`Помилка оновлення профілю: ${translateSupabaseError(error.message)}`, "danger");
            return;
        }

        currentProfileData = data;
        fillSettingsForm(data);

        showSettingsMessage("Профіль успішно оновлено.", "success");

    } catch (error) {
        showSettingsMessage(error.message || "Не вдалося оновити профіль.", "danger");
    }
}


/* =========================================================
   ОНОВЛЕННЯ АВАТАРА
========================================================= */

async function updateAvatar(avatarUrl) {
    hideSettingsMessage();

    if (!currentUser) return;

    const { data, error } = await supabase
        .from("profiles")
        .update({
            avatar_url: avatarUrl
        })
        .eq("id", currentUser.id)
        .select()
        .single();

    if (error) {
        showSettingsMessage(`Помилка оновлення аватара: ${translateSupabaseError(error.message)}`, "danger");
        return;
    }

    currentProfileData = data;

    if (currentAvatar) {
        currentAvatar.src = avatarUrl;
    }

    markActiveAvatar(avatarUrl);

    showSettingsMessage("Аватар оновлено.", "success");
}


/* =========================================================
   ОНОВЛЕННЯ ВИГЛЯДУ
========================================================= */

async function updateAppearance(event) {
    event.preventDefault();
    hideSettingsMessage();

    if (!currentUser) return;

    const theme = themeSelect.value;
    const colorScheme = colorSchemeSelect.value;
    const fontSize = fontSizeSelect.value;

    const { data, error } = await supabase
        .from("profiles")
        .update({
            theme: theme,
            color_scheme: colorScheme,
            font_size: fontSize
        })
        .eq("id", currentUser.id)
        .select()
        .single();

    if (error) {
        showSettingsMessage(`Помилка збереження налаштувань: ${translateSupabaseError(error.message)}`, "danger");
        return;
    }

    currentProfileData = data;

    applyAllSettings({
        theme: theme,
        color_scheme: colorScheme,
        font_size: fontSize
    });

    showSettingsMessage("Налаштування інтерфейсу збережено.", "success");
}


/* =========================================================
   МИТТЄВИЙ ПЕРЕГЛЯД ТЕМИ
========================================================= */

function previewAppearance() {
    applyAllSettings({
        theme: themeSelect.value,
        color_scheme: colorSchemeSelect.value,
        font_size: fontSizeSelect.value
    });
}


/* =========================================================
   ВИХІД
========================================================= */

async function settingsLogout() {
    await logoutUser();
}


/* =========================================================
   ВИДАЛЕННЯ ПРОФІЛЮ
========================================================= */

async function deleteAccountData() {
    hideSettingsMessage();

    if (!currentUser) return;

    showSiteConfirm(
        "Ви справді хочете видалити профіль? Будуть видалені ваші проєкти, історія розрахунків і налаштування.",
        async () => {
            try {
                const { error: projectItemsError } = await supabase
                    .from("project_items")
                    .delete()
                    .in(
                        "project_id",
                        await getUserProjectIds(currentUser.id)
                    );

                if (projectItemsError) {
                    console.error(projectItemsError.message);
                }

                const deletedUsername = `deleted_user_${Date.now()}`;

                const { error: profileDeleteError } = await supabase
                    .from("profiles")
                    .update({
                        is_deleted: true,
                        username: deletedUsername,
                        avatar_url: null,
                        role: "user"
                    })
                    .eq("id", currentUser.id);

                if (profileDeleteError) {
                    showSettingsMessage(
                        `Помилка видалення профілю: ${translateSupabaseError(profileDeleteError.message)}`,
                        "danger"
                    );
                    return;
                }

                const { error: calculationsError } = await supabase
                    .from("calculations")
                    .delete()
                    .eq("user_id", currentUser.id);

                if (calculationsError) {
                    console.error(calculationsError.message);
                }


                await supabase.auth.signOut();

                showSiteAlert(
                    "Профіль і дані користувача видалено.",
                    "Профіль видалено",
                    () => {
                        window.location.href = "index.html";
                    }
                );

            } catch (error) {
                console.error(error);
                showSettingsMessage("Не вдалося видалити профіль.", "danger");
            }
        },
        "Підтвердження видалення",
        "Видалити"
    );
}


async function getUserProjectIds(userId) {
    const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", userId);

    if (error || !data || data.length === 0) {
        return [-1];
    }

    return data.map(project => project.id);
}

/* =========================================================
   ЗМІНА ПАРОЛЮ
========================================================= */

async function updatePassword(event) {
    event.preventDefault();
    hideSettingsMessage();

    if (!currentUser) {
        showSettingsMessage("Користувач не авторизований.", "danger");
        return;
    }

    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const repeatPassword = repeatPasswordInput.value;

    if (!oldPassword || !newPassword || !repeatPassword) {
        showSettingsMessage("Заповніть усі поля зміни паролю.", "danger");
        return;
    }

    if (newPassword.length < 6) {
        showSettingsMessage("Новий пароль має містити мінімум 6 символів.", "danger");
        return;
    }

    if (newPassword !== repeatPassword) {
        showSettingsMessage("Нові паролі не співпадають.", "danger");
        return;
    }

    if (oldPassword === newPassword) {
        showSettingsMessage("Новий пароль має відрізнятися від старого.", "warning");
        return;
    }

    const email = currentUser.email || currentProfileData?.email;

    if (!email) {
        showSettingsMessage("Не вдалося визначити email користувача.", "danger");
        return;
    }

    /*
       Перевіряємо старий пароль через повторний вхід.
       Якщо пароль неправильний — Supabase поверне помилку.
    */
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: oldPassword
    });

    if (signInError) {
        showSettingsMessage("Старий пароль введено неправильно.", "danger");
        return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (updateError) {
        showSettingsMessage(`Помилка зміни паролю: ${updateError.message}`, "danger");
        return;
    }

    passwordForm.reset();

    showSettingsMessage("Пароль успішно змінено.", "success");
}

/* =========================================================
   ОБРОБНИКИ ПОДІЙ
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    await loadSettingsProfile();

    if (profileForm) {
        profileForm.addEventListener("submit", updateProfile);
    }

    if (appearanceForm) {
        appearanceForm.addEventListener("submit", updateAppearance);
    }

    avatarButtons.forEach(button => {
        button.addEventListener("click", () => {
            const avatarUrl = button.dataset.avatar;
            updateAvatar(avatarUrl);
        });
    });

    if (themeSelect) {
        themeSelect.addEventListener("change", previewAppearance);
    }

    if (colorSchemeSelect) {
        colorSchemeSelect.addEventListener("change", previewAppearance);
    }

    if (fontSizeSelect) {
        fontSizeSelect.addEventListener("change", previewAppearance);
    }

    if (logoutSettingsBtn) {
        logoutSettingsBtn.addEventListener("click", settingsLogout);
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", deleteAccountData);
    }

    if (passwordForm) {
        passwordForm.addEventListener("submit", updatePassword);
    }

    if (avatarGrid && showAllAvatarsBtn && avatarButtons.length > 6) {
        avatarGrid.classList.add("avatar-collapsed");

        showAllAvatarsBtn.addEventListener("click", () => {
            avatarGrid.classList.toggle("avatar-collapsed");

            const isCollapsed = avatarGrid.classList.contains("avatar-collapsed");

            showAllAvatarsBtn.textContent = isCollapsed
                ? "Показати всі аватарки"
                : "Сховати зайві аватарки";
        });
    }
});