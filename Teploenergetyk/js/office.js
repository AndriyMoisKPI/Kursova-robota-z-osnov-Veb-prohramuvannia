/* =========================================================
   OFFICE.JS
   Мій кабінет: історія, проєкти, експорт
   Проєкт: Теплоенергетик
========================================================= */


/* =========================================================
   DOM ЕЛЕМЕНТИ
========================================================= */

const officeMessage = document.getElementById("officeMessage");

const officeEmail = document.getElementById("officeEmail");
const officeUsername = document.getElementById("officeUsername");

const historySearch = document.getElementById("historySearch");
const historyDateFrom = document.getElementById("historyDateFrom");
const historyDateTo = document.getElementById("historyDateTo");

const applyHistoryFilterBtn = document.getElementById("applyHistoryFilterBtn");
const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");
const exportHistoryCsvBtn = document.getElementById("exportHistoryCsvBtn");
const deleteAllHistoryBtn = document.getElementById("deleteAllHistoryBtn");

const historyTableBody = document.getElementById("historyTableBody");

const projectForm = document.getElementById("projectForm");
const projectTitle = document.getElementById("projectTitle");
const projectTheme = document.getElementById("projectTheme");
const projectIcon = document.getElementById("projectIcon");
const projectDescription = document.getElementById("projectDescription");

const refreshProjectsBtn = document.getElementById("refreshProjectsBtn");
const projectsList = document.getElementById("projectsList");

const projectDetails = document.getElementById("projectDetails");
const selectedProjectTitle = document.getElementById("selectedProjectTitle");
const selectedProjectDescription = document.getElementById("selectedProjectDescription");
const selectedProjectId = document.getElementById("selectedProjectId");
const selectedProjectTheme = document.getElementById("selectedProjectTheme");

const exportProjectPdfBtn = document.getElementById("exportProjectPdfBtn");
const exportProjectDocxBtn = document.getElementById("exportProjectDocxBtn");
const deleteProjectBtn = document.getElementById("deleteProjectBtn");

const projectNoteForm = document.getElementById("projectNoteForm");
const projectNoteInput = document.getElementById("projectNoteInput");

const calculationToProjectSelect = document.getElementById("calculationToProjectSelect");
const addCalculationToProjectBtn = document.getElementById("addCalculationToProjectBtn");

const projectItemsList = document.getElementById("projectItemsList");
const projectCalculationHint = document.getElementById("projectCalculationHint");


/* =========================================================
   ГЛОБАЛЬНИЙ СТАН
========================================================= */

let currentUser = null;
let currentProfile = null;

let calculations = [];
let projects = [];
let selectedProject = null;
let selectedProjectItems = [];


/* =========================================================
   ПОВІДОМЛЕННЯ
========================================================= */

function showOfficeMessage(message, type = "success") {
    if (!officeMessage) return;

    officeMessage.className = `alert alert-${type}`;
    officeMessage.textContent = message;
    officeMessage.classList.remove("d-none");
}

function hideOfficeMessage() {
    if (!officeMessage) return;

    officeMessage.classList.add("d-none");
    officeMessage.textContent = "";
}


/* =========================================================
   ДОПОМІЖНІ ФУНКЦІЇ
========================================================= */

function formatDate(dateString) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatInputData(inputData) {
    if (!inputData || typeof inputData !== "object") {
        return "Вхідні дані відсутні";
    }

    const labels = {
        c: "Питома теплоємність c",
        m: "Маса m",
        dt: "Зміна температури Δt",
        lambda: "Питома теплота плавлення λ",
        r: "Питома теплота пароутворення r",
        q: "Кількість теплоти Q",
        q1: "Q1",
        q2: "Q2",
        q3: "Q3",
        tau: "Час τ",
        k: "Коефіцієнт теплопередачі k",
        f: "Площа поверхні F",
        delta: "Різниця температур",
        alpha: "Коефіцієнт тепловіддачі α",
        a: "Коефіцієнт температуропровідності a",
        l: "Довжина l",
        t1: "Температура t1",
        t2: "Температура t2",
        v: "Об’єм V",
        p: "Тиск p",
        T: "Температура T"
    };

    return Object.entries(inputData)
        .map(([key, value]) => {
            const label = labels[key] || key;
            return `${label}: ${value}`;
        })
        .join("\n");
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    URL.revokeObjectURL(link.href);
}

function safeFileName(name) {
    return String(name || "export")
        .trim()
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, "_");
}


/* =========================================================
   ІНІЦІАЛІЗАЦІЯ КАБІНЕТУ
========================================================= */

async function initOffice() {
    currentUser = await protectPage();

    if (!currentUser) return;

    await loadProfile();
    await loadCalculations();
    await loadProjects();
}


/* =========================================================
   ПРОФІЛЬ
========================================================= */

async function loadProfile() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error(error.message);
        showOfficeMessage("Не вдалося завантажити профіль.", "danger");
        return;
    }

    currentProfile = data;

    if (officeEmail) {
        officeEmail.textContent = currentProfile.email || currentUser.email || "-";
    }

    if (officeUsername) {
        officeUsername.textContent = currentProfile.username || "-";
    }
}


/* =========================================================
   ІСТОРІЯ РОЗРАХУНКІВ
========================================================= */

async function loadCalculations() {
    hideOfficeMessage();

    if (!currentUser) return;

    let query = supabase
        .from("calculations")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    const dateFrom = historyDateFrom?.value;
    const dateTo = historyDateTo?.value;

    if (dateFrom) {
        query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
        query = query.lte("created_at", `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error.message);
        showOfficeMessage("Не вдалося завантажити історію розрахунків.", "danger");
        return;
    }

    calculations = data || [];

    renderCalculations();
    fillCalculationSelect();
}


function getFilteredCalculations() {
    const search = historySearch?.value.trim().toLowerCase() || "";

    if (!search) {
        return calculations;
    }

    return calculations.filter(item => {
        return (
            item.section?.toLowerCase().includes(search) ||
            item.formula_name?.toLowerCase().includes(search) ||
            item.result?.toLowerCase().includes(search)
        );
    });
}


function renderCalculations() {
    const filtered = getFilteredCalculations();

    if (!historyTableBody) return;

    if (filtered.length === 0) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    Розрахунків поки немає.
                </td>
            </tr>
        `;
        return;
    }

    historyTableBody.innerHTML = filtered.map(item => `
        <tr>
            <td>${formatDate(item.created_at)}</td>

            <td>${escapeHtml(item.section)}</td>

            <td>
                <strong>${escapeHtml(item.formula_name)}</strong>
                <div class="history-input-json">
                    ${escapeHtml(item.formula || "")}
                </div>
            </td>

            <td>
                <strong>${escapeHtml(item.result)} ${escapeHtml(item.unit || "")}</strong>
            </td>

            <td>
                <div class="d-flex flex-wrap gap-2">
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        onclick="showCalculationDetails(${item.id})"
                    >
                        Деталі
                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger"
                        type="button"
                        onclick="deleteCalculation(${item.id})"
                    >
                        Видалити
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}


function showCalculationDetails(calculationId) {
    const item = calculations.find(calc => calc.id === calculationId);

    if (!item) return;

    const inputs = formatInputData(item.input_data);

    const message =
        `Формула: ${item.formula_name}\n` +
        `Розділ: ${item.section}\n\n` +
        `Вхідні дані:\n${inputs}\n\n` +
        `Результат: ${item.result} ${item.unit || ""}`;

    if (typeof showSiteAlert === "function") {
        showSiteAlert(message, "Деталі розрахунку");
    } else {
        alert(message);
    }
}


async function deleteCalculation(calculationId) {
    showSiteConfirm(
        "Видалити цей розрахунок з історії?",
        async () => {
            const { error } = await supabase
                .from("calculations")
                .delete()
                .eq("id", calculationId)
                .eq("user_id", currentUser.id);

            if (error) {
                showOfficeMessage(`Помилка видалення: ${error.message}`, "danger");
                return;
            }

            showOfficeMessage("Розрахунок видалено.", "success");

            await loadCalculations();

            if (selectedProject) {
                await loadProjectItems(selectedProject.id);
            }
        },
        "Підтвердження видалення",
        "Видалити"
    );
}

async function deleteAllHistory() {
    const confirmDelete = confirm("Ви справді хочете видалити всю історію розрахунків?");

    if (!confirmDelete) return;

    const { error } = await supabase
        .from("calculations")
        .delete()
        .eq("user_id", currentUser.id);

    if (error) {
        showOfficeMessage(`Помилка видалення історії: ${error.message}`, "danger");
        return;
    }

    showOfficeMessage("Усю історію розрахунків видалено.", "success");

    await loadCalculations();

    if (selectedProject) {
        await loadProjectItems(selectedProject.id);
    }
}


/* =========================================================
   CSV ЕКСПОРТ ІСТОРІЇ
========================================================= */

function exportHistoryToCSV() {
    const filtered = getFilteredCalculations();

    if (filtered.length === 0) {
        showOfficeMessage("Немає розрахунків для експорту.", "warning");
        return;
    }

    const headers = [
        "Дата",
        "Розділ",
        "Формула",
        "Вхідні дані",
        "Результат",
        "Одиниця"
    ];

    const rows = filtered.map(item => [
        formatDate(item.created_at),
        item.section,
        item.formula_name,
        JSON.stringify(item.input_data),
        item.result,
        item.unit || ""
    ]);

    const csv = [
        headers.join(";"),
        ...rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    ].join("\n");

    downloadTextFile(
        "history.csv",
        "\uFEFF" + csv,
        "text/csv;charset=utf-8;"
    );

    showOfficeMessage("CSV файл історії сформовано.", "success");
}


/* =========================================================
   ПРОЄКТИ
========================================================= */

async function createProject(event) {
    event.preventDefault();
    hideOfficeMessage();

    const title = projectTitle.value.trim();
    const description = projectDescription.value.trim();
    const theme = projectTheme.value;
    const iconUrl = projectIcon.value;

    if (!title) {
        showOfficeMessage("Введіть назву проєкту.", "danger");
        return;
    }

    const { error } = await supabase
        .from("projects")
        .insert({
            user_id: currentUser.id,
            title: title,
            description: description,
            icon_url: iconUrl,
            theme: theme
        });

    if (error) {
        showOfficeMessage(`Помилка створення проєкту: ${error.message}`, "danger");
        return;
    }

    projectForm.reset();

    showOfficeMessage("Проєкт створено.", "success");

    await loadProjects();
}


async function loadProjects() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error.message);
        showOfficeMessage("Не вдалося завантажити проєкти.", "danger");
        return;
    }

    projects = data || [];

    renderProjects();
}


function renderProjects() {
    if (!projectsList) return;

    if (projects.length === 0) {
        projectsList.innerHTML = `
            <p class="text-muted mb-0">
                Проєктів поки немає. Створіть перший проєкт вище.
            </p>
        `;
        return;
    }

    projectsList.innerHTML = projects.map(project => `
        <div class="col-md-6 col-lg-4">
            <div
                class="project-card ${selectedProject?.id === project.id ? "active" : ""}"
                role="button"
                onclick="selectProject(${project.id})"
            >
                <div class="project-card-header">
                    <img src="${escapeHtml(project.icon_url || "assets/icons/icon-project.png")}" alt="Іконка проєкту">

                    <div>
                        <p class="project-card-title">
                            ${escapeHtml(project.title)}
                        </p>

                        <small class="text-muted">
                            ${formatDate(project.created_at)}
                        </small>
                    </div>
                </div>
                <div class="project-card-theme">
                    Тематика: ${escapeHtml(project.theme || "Інше")}
                </div>
                <p class="project-card-description">
                    ${escapeHtml(project.description || "Без опису")}
                </p>

                <button class="btn btn-sm btn-main" type="button">
                    Відкрити
                </button>
            </div>
        </div>
    `).join("");
}


async function selectProject(projectId) {
    selectedProject = projects.find(project => project.id === projectId);

    if (!selectedProject) return;

    selectedProjectTitle.textContent = selectedProject.title;
    selectedProjectDescription.textContent = selectedProject.description || "Без опису";
    selectedProjectId.textContent = selectedProject.id;
    if (selectedProjectTheme) {
        selectedProjectTheme.textContent = selectedProject.theme || "Інше";
    }

    projectDetails.classList.remove("d-none");

    renderProjects();

    await loadProjectItems(selectedProject.id);

    showOfficeMessage(`Відкрито проєкт: ${selectedProject.title}`, "success");
}


async function deleteSelectedProject() {
    if (!selectedProject) {
        showOfficeMessage("Спочатку оберіть проєкт.", "warning");
        return;
    }

    const confirmDelete = confirm(`Видалити проєкт "${selectedProject.title}"?`);

    if (!confirmDelete) return;

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", selectedProject.id)
        .eq("user_id", currentUser.id);

    if (error) {
        showOfficeMessage(`Помилка видалення проєкту: ${error.message}`, "danger");
        return;
    }

    selectedProject = null;
    selectedProjectItems = [];

    projectDetails.classList.add("d-none");

    showOfficeMessage("Проєкт видалено.", "success");

    await loadProjects();
}


/* =========================================================
   ЕЛЕМЕНТИ ПРОЄКТУ
========================================================= */

async function loadProjectItems(projectId) {
    const { data, error } = await supabase
        .from("project_items")
        .select(`
            *,
            calculations (
                id,
                section,
                formula_name,
                formula,
                input_data,
                result,
                unit,
                chart_data,
                created_at
            )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error.message);
        showOfficeMessage("Не вдалося завантажити елементи проєкту.", "danger");
        return;
    }

    selectedProjectItems = data || [];

    renderProjectItems();
}


function renderProjectItems() {
    if (!projectItemsList) return;

    if (!selectedProjectItems || selectedProjectItems.length === 0) {
        projectItemsList.innerHTML = `
            <p class="text-muted mb-0">
                У цьому проєкті ще немає елементів.
            </p>
        `;
        return;
    }

    projectItemsList.innerHTML = selectedProjectItems.map(item => {
        if (item.item_type === "note") {
            return `
                <div class="project-item">
                    <div class="project-item-title">Нотатка</div>

                    <p>${escapeHtml(item.note)}</p>

                    <div class="project-item-meta">
                        ${formatDate(item.created_at)}
                    </div>

                    <button
                        class="btn btn-sm btn-outline-danger mt-2"
                        type="button"
                        onclick="deleteProjectItem(${item.id})"
                    >
                        Видалити
                    </button>
                </div>
            `;
        }


        if (item.item_type === "calculation" && item.calculations) {
            const calc = item.calculations;

            return `
                <div class="project-item">
                    <div class="project-item-title">
                        Розрахунок: ${escapeHtml(calc.formula_name)}
                    </div>

                    <p class="mb-1">
                        <strong>Розділ:</strong> ${escapeHtml(calc.section)}
                    </p>

                    <p class="mb-1">
                        <strong>Формула:</strong> ${escapeHtml(calc.formula || "-")}
                    </p>

                    <p class="mb-1">
                        <strong>Результат:</strong>
                        ${escapeHtml(calc.result)} ${escapeHtml(calc.unit || "")}
                    </p>

                    <div class="project-item-meta">
                        Додано: ${formatDate(item.created_at)}
                    </div>

                    <button
                        class="btn btn-sm btn-outline-danger mt-2"
                        type="button"
                        onclick="deleteProjectItem(${item.id})"
                    >
                        Видалити
                    </button>
                </div>
            `;
        }

        return `
            <div class="project-item">
                <div class="project-item-title">Елемент проєкту</div>
                <p class="text-muted mb-0">Дані недоступні.</p>
            </div>
        `;
    }).join("");
}

function fillCalculationSelect() {
    if (!calculationToProjectSelect) return;

    if (!calculations || calculations.length === 0) {
        calculationToProjectSelect.innerHTML = `
            <option value="">Немає доступних розрахунків</option>
        `;

        if (projectCalculationHint) {
            projectCalculationHint.classList.remove("d-none");
        }

        return;
    }

    if (projectCalculationHint) {
        projectCalculationHint.classList.add("d-none");
    }

    calculationToProjectSelect.innerHTML = `
        <option value="">Оберіть розрахунок</option>
    `;

    calculations.forEach(calc => {
        const option = document.createElement("option");

        option.value = calc.id;
        option.textContent = `${formatDate(calc.created_at)} — ${calc.formula_name} = ${calc.result} ${calc.unit || ""}`;

        calculationToProjectSelect.appendChild(option);
    });
}

async function addNoteToProject(event) {
    event.preventDefault();
    hideOfficeMessage();

    if (!selectedProject) {
        showOfficeMessage("Спочатку оберіть проєкт.", "warning");
        return;
    }

    const note = projectNoteInput.value.trim();

    if (!note) {
        showOfficeMessage("Введіть текст нотатки.", "danger");
        return;
    }

    const { error } = await supabase
        .from("project_items")
        .insert({
            project_id: selectedProject.id,
            item_type: "note",
            note: note
        });

    if (error) {
        showOfficeMessage(`Помилка додавання нотатки: ${error.message}`, "danger");
        return;
    }

    projectNoteForm.reset();

    showOfficeMessage("Нотатку додано до проєкту.", "success");

    await loadProjectItems(selectedProject.id);
}


function fillCalculationSelect() {
    if (!calculationToProjectSelect) return;

    if (!calculations || calculations.length === 0) {
        calculationToProjectSelect.innerHTML = `
            <option value="">Немає доступних розрахунків</option>
        `;
        return;
    }

    calculationToProjectSelect.innerHTML = `
        <option value="">Оберіть розрахунок</option>
    `;

    calculations.forEach(calc => {
        const option = document.createElement("option");

        option.value = calc.id;
        option.textContent = `${formatDate(calc.created_at)} — ${calc.formula_name} = ${calc.result} ${calc.unit || ""}`;

        calculationToProjectSelect.appendChild(option);
    });
}


async function addCalculationToProject() {
    hideOfficeMessage();

    if (!selectedProject) {
        showOfficeMessage("Спочатку оберіть проєкт.", "warning");
        return;
    }

    const calculationId = Number(calculationToProjectSelect.value);

    if (!calculationId) {
        showOfficeMessage("Оберіть розрахунок з історії.", "danger");
        return;
    }

    const selectedCalculation = calculations.find(calc => calc.id === calculationId);

    const { error } = await supabase
        .from("project_items")
        .insert({
            project_id: selectedProject.id,
            calculation_id: calculationId,
            item_type: "calculation",
            chart_data: selectedCalculation?.chart_data || null
        });

    if (error) {
        showOfficeMessage(`Помилка додавання розрахунку: ${error.message}`, "danger");
        return;
    }

    showOfficeMessage("Розрахунок додано до проєкту.", "success");

    await loadProjectItems(selectedProject.id);
}


async function deleteProjectItem(itemId) {
    const confirmDelete = confirm("Видалити цей елемент з проєкту?");

    if (!confirmDelete) return;

    const { error } = await supabase
        .from("project_items")
        .delete()
        .eq("id", itemId);

    if (error) {
        showOfficeMessage(`Помилка видалення елемента: ${error.message}`, "danger");
        return;
    }

    showOfficeMessage("Елемент проєкту видалено.", "success");

    if (selectedProject) {
        await loadProjectItems(selectedProject.id);
    }
}


/* =========================================================
   PDF ЕКСПОРТ ПРОЄКТУ
========================================================= */

function exportSelectedProjectToPDF() {
    if (!selectedProject) {
        showOfficeMessage("Спочатку оберіть проєкт.", "warning");
        return;
    }

    if (!window.pdfMake) {
        showOfficeMessage("Бібліотека pdfMake не підключена.", "danger");
        return;
    }

    const content = [];

    content.push({
        text: `Проєкт: ${selectedProject.title}`,
        style: "title"
    });

    content.push({
        text: `Опис: ${selectedProject.description || "Без опису"}`,
        margin: [0, 8, 0, 4]
    });

    content.push({
        text: `Тематика: ${selectedProject.theme || "Інше"}`,
        margin: [0, 0, 0, 4]
    });

    content.push({
        text: `Створено: ${formatDate(selectedProject.created_at)}`,
        margin: [0, 0, 0, 14]
    });

    content.push({
        text: "Елементи проєкту",
        style: "sectionTitle"
    });

    if (!selectedProjectItems || selectedProjectItems.length === 0) {
        content.push({
            text: "У проєкті немає елементів.",
            italics: true,
            margin: [0, 8, 0, 0]
        });
    }

    selectedProjectItems.forEach((item, index) => {
        if (item.item_type === "note") {
            content.push({
                text: `${index + 1}. Нотатка`,
                style: "itemTitle"
            });

            content.push({
                text: item.note || "",
                margin: [0, 0, 0, 10]
            });
        }

        if (item.item_type === "calculation" && item.calculations) {
            const calc = item.calculations;

            content.push({
                text: `${index + 1}. Розрахунок`,
                style: "itemTitle"
            });

            content.push({
                table: {
                    widths: ["30%", "70%"],
                    body: [
                        ["Розділ", calc.section || "-"],
                        ["Формула", calc.formula_name || "-"],
                        ["Вираз", calc.formula || "-"],
                        ["Результат", `${calc.result || "-"} ${calc.unit || ""}`],
                        ["Дата", formatDate(calc.created_at)]
                    ]
                },
                layout: "lightHorizontalLines",
                margin: [0, 0, 0, 12]
            });
        }
    });

    const docDefinition = {
        pageSize: "A4",
        pageMargins: [40, 40, 40, 40],

        content: content,

        defaultStyle: {
            fontSize: 11
        },

        styles: {
            title: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            sectionTitle: {
                fontSize: 15,
                bold: true,
                margin: [0, 12, 0, 8]
            },
            itemTitle: {
                fontSize: 13,
                bold: true,
                margin: [0, 10, 0, 6]
            }
        }
    };

    pdfMake.createPdf(docDefinition).download(`${safeFileName(selectedProject.title)}.pdf`);

    showOfficeMessage("PDF проєкту сформовано.", "success");
}


/* =========================================================
   DOCX ЕКСПОРТ ПРОЄКТУ
========================================================= */

async function exportSelectedProjectToDOCX() {
    if (!selectedProject) {
        showOfficeMessage("Спочатку оберіть проєкт.", "warning");
        return;
    }

    if (!window.docx) {
        showOfficeMessage("Бібліотека docx не підключена.", "danger");
        return;
    }

    const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        HeadingLevel
    } = window.docx;

    const children = [];

    children.push(
        new Paragraph({
            text: `Проєкт: ${selectedProject.title}`,
            heading: HeadingLevel.TITLE
        })
    );

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Опис: ${selectedProject.description || "Без опису"}`,
                    size: 24
                })
            ]
        })
    );

    children.push(
        new Paragraph({
            text: `Створено: ${formatDate(selectedProject.created_at)}`
        })
    );

    children.push(
        new Paragraph({
            text: "Елементи проєкту",
            heading: HeadingLevel.HEADING_1
        })
    );

    if (selectedProjectItems.length === 0) {
        children.push(
            new Paragraph({
                text: "У проєкті немає елементів."
            })
        );
    }

    selectedProjectItems.forEach((item, index) => {
        if (item.item_type === "note") {
            children.push(
                new Paragraph({
                    text: `${index + 1}. Нотатка`,
                    heading: HeadingLevel.HEADING_2
                })
            );

            children.push(
                new Paragraph({
                    text: item.note || ""
                })
            );
        }

        if (item.item_type === "calculation" && item.calculations) {
            const calc = item.calculations;

            children.push(
                new Paragraph({
                    text: `${index + 1}. Розрахунок`,
                    heading: HeadingLevel.HEADING_2
                })
            );

            children.push(new Paragraph({ text: `Розділ: ${calc.section}` }));
            children.push(new Paragraph({ text: `Формула: ${calc.formula_name}` }));
            children.push(new Paragraph({ text: `Вираз: ${calc.formula || "-"}` }));
            children.push(new Paragraph({ text: `Результат: ${calc.result} ${calc.unit || ""}` }));
            children.push(new Paragraph({ text: `Дата: ${formatDate(calc.created_at)}` }));
        }
    });

    const docxDocument = new Document({
        sections: [
            {
                properties: {},
                children: children
            }
        ]
    });

    const blob = await Packer.toBlob(docxDocument);

    const link = window.document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${safeFileName(selectedProject.title)}.docx`;

    window.document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(link.href);
}


/* =========================================================
   ОБРОБНИКИ ПОДІЙ
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    await initOffice();

    if (applyHistoryFilterBtn) {
        applyHistoryFilterBtn.addEventListener("click", loadCalculations);
    }

    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener("click", async () => {
            historySearch.value = "";
            historyDateFrom.value = "";
            historyDateTo.value = "";
            await loadCalculations();
        });
    }

    if (historySearch) {
        historySearch.addEventListener("input", renderCalculations);
    }

    if (exportHistoryCsvBtn) {
        exportHistoryCsvBtn.addEventListener("click", exportHistoryToCSV);
    }

    if (deleteAllHistoryBtn) {
        deleteAllHistoryBtn.addEventListener("click", deleteAllHistory);
    }

    if (projectForm) {
        projectForm.addEventListener("submit", createProject);
    }

    if (refreshProjectsBtn) {
        refreshProjectsBtn.addEventListener("click", loadProjects);
    }

    if (projectNoteForm) {
        projectNoteForm.addEventListener("submit", addNoteToProject);
    }

    if (addCalculationToProjectBtn) {
        addCalculationToProjectBtn.addEventListener("click", addCalculationToProject);
    }

    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener("click", deleteSelectedProject);
    }

    if (exportProjectPdfBtn) {
        exportProjectPdfBtn.addEventListener("click", exportSelectedProjectToPDF);
    }

    if (exportProjectDocxBtn) {
        exportProjectDocxBtn.addEventListener("click", exportSelectedProjectToDOCX);
    }
});