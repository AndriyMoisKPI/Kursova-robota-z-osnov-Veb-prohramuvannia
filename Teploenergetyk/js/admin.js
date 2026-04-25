/* =========================================================
   ADMIN.JS
   Адмін-панель: користувачі, розрахунки, проєкти
   Проєкт: Теплоенергетик
========================================================= */


/* =========================================================
   DOM ЕЛЕМЕНТИ
========================================================= */

const adminMessage = document.getElementById("adminMessage");

const adminEmail = document.getElementById("adminEmail");
const adminUsername = document.getElementById("adminUsername");
const adminRole = document.getElementById("adminRole");

const usersCount = document.getElementById("usersCount");
const calculationsCount = document.getElementById("calculationsCount");
const projectsCount = document.getElementById("projectsCount");

const refreshAdminDataBtn = document.getElementById("refreshAdminDataBtn");

const userSearchInput = document.getElementById("userSearchInput");
const refreshUsersBtn = document.getElementById("refreshUsersBtn");
const usersTableBody = document.getElementById("usersTableBody");

const calculationSearchInput = document.getElementById("calculationSearchInput");
const refreshCalculationsBtn = document.getElementById("refreshCalculationsBtn");
const adminCalculationsTableBody = document.getElementById("adminCalculationsTableBody");

const projectSearchInput = document.getElementById("projectSearchInput");
const refreshAdminProjectsBtn = document.getElementById("refreshAdminProjectsBtn");
const adminProjectsTableBody = document.getElementById("adminProjectsTableBody");


/* =========================================================
   ГЛОБАЛЬНИЙ СТАН
========================================================= */

let currentAdminUser = null;
let currentAdminProfile = null;

let allUsers = [];
let allCalculations = [];
let allProjects = [];


/* =========================================================
   ПОВІДОМЛЕННЯ
========================================================= */

function showAdminMessage(message, type = "success") {
    if (!adminMessage) return;

    adminMessage.className = `alert alert-${type}`;
    adminMessage.textContent = message;
    adminMessage.classList.remove("d-none");
}


function hideAdminMessage() {
    if (!adminMessage) return;

    adminMessage.classList.add("d-none");
    adminMessage.textContent = "";
}


/* =========================================================
   ДОПОМІЖНІ ФУНКЦІЇ
========================================================= */

function formatAdminDate(dateString) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function escapeAdminHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getProfileNameById(userId) {
    const profile = allUsers.find(user => user.id === userId);

    if (!profile) return "Невідомий користувач";

    return profile.username || profile.email || "Користувач";
}


/* =========================================================
   ІНІЦІАЛІЗАЦІЯ АДМІН-ПАНЕЛІ
========================================================= */

async function initAdminPanel() {
    currentAdminUser = await requireAdmin();

    if (!currentAdminUser) return;

    await loadCurrentAdminProfile();
    await loadAdminData();

    showAdminMessage("Адмін-панель завантажено.", "success");
}


/* =========================================================
   ПРОФІЛЬ АДМІНА
========================================================= */

async function loadCurrentAdminProfile() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentAdminUser.id)
        .single();

    if (error || !data) {
        showAdminMessage("Не вдалося завантажити профіль адміністратора.", "danger");
        return;
    }

    currentAdminProfile = data;

    if (adminEmail) {
        adminEmail.textContent = data.email || currentAdminUser.email || "-";
    }

    if (adminUsername) {
        adminUsername.textContent = data.username || "-";
    }

    if (adminRole) {
        adminRole.textContent = data.role || "-";
    }
}


/* =========================================================
   ЗАВАНТАЖЕННЯ ВСІХ ДАНИХ
========================================================= */

async function loadAdminData() {
    hideAdminMessage();

    await loadAllUsers();
    await loadAllCalculations();
    await loadAllProjects();

    updateAdminStats();

    renderUsersTable();
    renderCalculationsTable();
    renderProjectsTable();
}


function updateAdminStats() {
    if (usersCount) {
        usersCount.textContent = allUsers.length;
    }

    if (calculationsCount) {
        calculationsCount.textContent = allCalculations.length;
    }

    if (projectsCount) {
        projectsCount.textContent = allProjects.length;
    }
}


/* =========================================================
   КОРИСТУВАЧІ
========================================================= */

async function loadAllUsers() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error.message);
        showAdminMessage("Не вдалося завантажити користувачів.", "danger");
        return;
    }

    allUsers = data || [];
}


function getFilteredUsers() {
    const search = userSearchInput?.value.trim().toLowerCase() || "";

    if (!search) return allUsers;

    return allUsers.filter(user => {
        return (
            user.email?.toLowerCase().includes(search) ||
            user.username?.toLowerCase().includes(search) ||
            user.role?.toLowerCase().includes(search)
        );
    });
}


function renderUsersTable() {
    if (!usersTableBody) return;

    const users = getFilteredUsers();

    if (users.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    Користувачів не знайдено.
                </td>
            </tr>
        `;
        return;
    }

    usersTableBody.innerHTML = users.map(user => {
        const isCurrentAdmin = currentAdminUser && user.id === currentAdminUser.id;

        return `
            <tr>
                <td>${formatAdminDate(user.created_at)}</td>

                <td>${escapeAdminHtml(user.email || "-")}</td>

                <td>${escapeAdminHtml(user.username || "-")}</td>

                <td>
                    <span class="admin-role-badge ${user.role === "admin" ? "admin-role-admin" : "admin-role-user"}">
                        ${escapeAdminHtml(user.role || "user")}
                    </span>
                </td>

                <td>
                    ${escapeAdminHtml(user.theme || "light")} /
                    ${escapeAdminHtml(user.color_scheme || "green")}
                </td>

                <td>
                    <div class="d-flex flex-wrap gap-2">
                        ${user.role === "admin"
                ? `<button
                                    class="btn btn-sm btn-outline-secondary"
                                    type="button"
                                    ${isCurrentAdmin ? "disabled" : ""}
                                    onclick="setUserRole('${user.id}', 'user')"
                                >
                                    Зробити user
                                </button>`
                : `<button
                                    class="btn btn-sm btn-outline-primary"
                                    type="button"
                                    onclick="setUserRole('${user.id}', 'admin')"
                                >
                                    Зробити admin
                                </button>`
            }

                        <button
                            class="btn btn-sm btn-outline-danger"
                            type="button"
                            ${isCurrentAdmin ? "disabled" : ""}
                            onclick="deleteUserData('${user.id}')"
                        >
                            Видалити дані
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


async function setUserRole(userId, role) {
    hideAdminMessage();

    if (!["user", "admin"].includes(role)) {
        showAdminMessage("Некоректна роль.", "danger");
        return;
    }

    if (currentAdminUser && userId === currentAdminUser.id && role !== "admin") {
        showAdminMessage("Не можна зняти роль адміністратора із самого себе.", "warning");
        return;
    }

    const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

    if (error) {
        showAdminMessage(`Помилка зміни ролі: ${error.message}`, "danger");
        return;
    }

    showAdminMessage("Роль користувача оновлено.", "success");

    await loadAllUsers();
    updateAdminStats();
    renderUsersTable();
}


async function deleteUserData(userId) {
    hideAdminMessage();

    if (currentAdminUser && userId === currentAdminUser.id) {
        showAdminMessage("Не можна видалити власний профіль через адмін-панель.", "warning");
        return;
    }

    const profile = allUsers.find(user => user.id === userId);
    const username = profile?.username || profile?.email || userId;

    const confirmDelete = confirm(
        `Видалити дані користувача "${username}"?\n\n` +
        `Буде видалено профіль, історію розрахунків, проєкти та елементи проєктів.`
    );

    if (!confirmDelete) return;

    try {
        const userProjects = allProjects
            .filter(project => project.user_id === userId)
            .map(project => project.id);

        if (userProjects.length > 0) {
            const { error: projectItemsError } = await supabase
                .from("project_items")
                .delete()
                .in("project_id", userProjects);

            if (projectItemsError) {
                throw projectItemsError;
            }
        }

        const { error: projectsError } = await supabase
            .from("projects")
            .delete()
            .eq("user_id", userId);

        if (projectsError) {
            throw projectsError;
        }

        const { error: calculationsError } = await supabase
            .from("calculations")
            .delete()
            .eq("user_id", userId);

        if (calculationsError) {
            throw calculationsError;
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            throw profileError;
        }

        /*
           Важливо:
           Тут видаляються дані з public-таблиць.
           Сам запис у auth.users через frontend видаляти не можна,
           бо для цього потрібен service_role ключ.
        */

        showAdminMessage("Дані користувача видалено.", "success");

        await loadAdminData();

    } catch (error) {
        console.error(error.message);
        showAdminMessage(`Помилка видалення користувача: ${error.message}`, "danger");
    }
}


/* =========================================================
   РОЗРАХУНКИ
========================================================= */

async function loadAllCalculations() {
    const { data, error } = await supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error.message);
        showAdminMessage("Не вдалося завантажити розрахунки.", "danger");
        return;
    }

    allCalculations = data || [];
}


function getFilteredCalculationsAdmin() {
    const search = calculationSearchInput?.value.trim().toLowerCase() || "";

    if (!search) return allCalculations;

    return allCalculations.filter(item => {
        const username = getProfileNameById(item.user_id).toLowerCase();

        return (
            item.section?.toLowerCase().includes(search) ||
            item.formula_name?.toLowerCase().includes(search) ||
            item.result?.toLowerCase().includes(search) ||
            username.includes(search)
        );
    });
}


function renderCalculationsTable() {
    if (!adminCalculationsTableBody) return;

    const calculations = getFilteredCalculationsAdmin();

    if (calculations.length === 0) {
        adminCalculationsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    Розрахунків не знайдено.
                </td>
            </tr>
        `;
        return;
    }

    adminCalculationsTableBody.innerHTML = calculations.map(item => `
        <tr>
            <td>${formatAdminDate(item.created_at)}</td>

            <td>${escapeAdminHtml(getProfileNameById(item.user_id))}</td>

            <td>${escapeAdminHtml(item.section || "-")}</td>

            <td>
                <strong>${escapeAdminHtml(item.formula_name || "-")}</strong>
                <div class="history-input-json">
                    ${escapeAdminHtml(item.formula || "")}
                </div>
            </td>

            <td>
                <strong>
                    ${escapeAdminHtml(item.result || "-")}
                    ${escapeAdminHtml(item.unit || "")}
                </strong>
            </td>

            <td>
                <div class="d-flex flex-wrap gap-2">
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        onclick="showAdminCalculationDetails(${item.id})"
                    >
                        Деталі
                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger"
                        type="button"
                        onclick="deleteAdminCalculation(${item.id})"
                    >
                        Видалити
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}


function showAdminCalculationDetails(calculationId) {
    const item = allCalculations.find(calc => calc.id === calculationId);

    if (!item) return;

    const inputs = JSON.stringify(item.input_data, null, 2);

    alert(
        `Користувач: ${getProfileNameById(item.user_id)}\n` +
        `Розділ: ${item.section}\n` +
        `Формула: ${item.formula_name}\n` +
        `Вираз: ${item.formula || "-"}\n\n` +
        `Вхідні дані:\n${inputs}\n\n` +
        `Результат: ${item.result} ${item.unit || ""}`
    );
}


async function deleteAdminCalculation(calculationId) {
    hideAdminMessage();

    const confirmDelete = confirm("Видалити цей розрахунок?");

    if (!confirmDelete) return;

    const { error } = await supabase
        .from("calculations")
        .delete()
        .eq("id", calculationId);

    if (error) {
        showAdminMessage(`Помилка видалення розрахунку: ${error.message}`, "danger");
        return;
    }

    showAdminMessage("Розрахунок видалено.", "success");

    await loadAllCalculations();
    await loadAllProjects();

    updateAdminStats();
    renderCalculationsTable();
    renderProjectsTable();
}


/* =========================================================
   ПРОЄКТИ
========================================================= */

async function loadAllProjects() {
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error.message);
        showAdminMessage("Не вдалося завантажити проєкти.", "danger");
        return;
    }

    allProjects = data || [];
}


function getFilteredProjectsAdmin() {
    const search = projectSearchInput?.value.trim().toLowerCase() || "";

    if (!search) return allProjects;

    return allProjects.filter(project => {
        const username = getProfileNameById(project.user_id).toLowerCase();

        return (
            project.title?.toLowerCase().includes(search) ||
            project.description?.toLowerCase().includes(search) ||
            project.theme?.toLowerCase().includes(search) ||
            username.includes(search)
        );
    });
}


function renderProjectsTable() {
    if (!adminProjectsTableBody) return;

    const projects = getFilteredProjectsAdmin();

    if (projects.length === 0) {
        adminProjectsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    Проєктів не знайдено.
                </td>
            </tr>
        `;
        return;
    }

    adminProjectsTableBody.innerHTML = projects.map(project => `
        <tr>
            <td>${formatAdminDate(project.created_at)}</td>

            <td>
                <strong>${escapeAdminHtml(project.title || "-")}</strong>
            </td>

            <td>${escapeAdminHtml(project.description || "Без опису")}</td>

            <td>${escapeAdminHtml(getProfileNameById(project.user_id))}</td>

            <td>${escapeAdminHtml(project.theme || "green")}</td>

            <td>
                <div class="d-flex flex-wrap gap-2">
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        onclick="showAdminProjectDetails(${project.id})"
                    >
                        Деталі
                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger"
                        type="button"
                        onclick="deleteAdminProject(${project.id})"
                    >
                        Видалити
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}


async function showAdminProjectDetails(projectId) {
    const project = allProjects.find(item => item.id === projectId);

    if (!project) return;

    const { data: items, error } = await supabase
        .from("project_items")
        .select(`
            *,
            calculations (
                formula_name,
                result,
                unit
            )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) {
        showAdminMessage(`Помилка завантаження елементів проєкту: ${error.message}`, "danger");
        return;
    }

    const itemsText = (items || []).map((item, index) => {
        if (item.item_type === "note") {
            return `${index + 1}. Нотатка: ${item.note || ""}`;
        }

        if (item.item_type === "calculation" && item.calculations) {
            return `${index + 1}. Розрахунок: ${item.calculations.formula_name} = ${item.calculations.result} ${item.calculations.unit || ""}`;
        }

        return `${index + 1}. Елемент: ${item.item_type}`;
    }).join("\n");

    alert(
        `Проєкт: ${project.title}\n` +
        `Опис: ${project.description || "Без опису"}\n` +
        `Користувач: ${getProfileNameById(project.user_id)}\n` +
        `Тема: ${project.theme || "green"}\n\n` +
        `Елементи:\n${itemsText || "Елементів немає"}`
    );
}


async function deleteAdminProject(projectId) {
    hideAdminMessage();

    const project = allProjects.find(item => item.id === projectId);
    const title = project?.title || projectId;

    const confirmDelete = confirm(`Видалити проєкт "${title}"?`);

    if (!confirmDelete) return;

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

    if (error) {
        showAdminMessage(`Помилка видалення проєкту: ${error.message}`, "danger");
        return;
    }

    showAdminMessage("Проєкт видалено.", "success");

    await loadAllProjects();
    updateAdminStats();
    renderProjectsTable();
}


/* =========================================================
   ОБРОБНИКИ ПОДІЙ
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    await initAdminPanel();

    if (refreshAdminDataBtn) {
        refreshAdminDataBtn.addEventListener("click", async () => {
            await loadAdminData();
            showAdminMessage("Дані оновлено.", "success");
        });
    }

    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener("click", async () => {
            userSearchInput.value = "";
            await loadAllUsers();
            updateAdminStats();
            renderUsersTable();
        });
    }

    if (userSearchInput) {
        userSearchInput.addEventListener("input", renderUsersTable);
    }

    if (refreshCalculationsBtn) {
        refreshCalculationsBtn.addEventListener("click", async () => {
            calculationSearchInput.value = "";
            await loadAllCalculations();
            updateAdminStats();
            renderCalculationsTable();
        });
    }

    if (calculationSearchInput) {
        calculationSearchInput.addEventListener("input", renderCalculationsTable);
    }

    if (refreshAdminProjectsBtn) {
        refreshAdminProjectsBtn.addEventListener("click", async () => {
            projectSearchInput.value = "";
            await loadAllProjects();
            updateAdminStats();
            renderProjectsTable();
        });
    }

    if (projectSearchInput) {
        projectSearchInput.addEventListener("input", renderProjectsTable);
    }
});