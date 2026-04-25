/* =========================================================
   CALCULATORS.JS
   Калькулятори, графіки, історія, конвертер одиниць
   Проєкт: Теплоенергетик
========================================================= */


/* =========================================================
   DOM ЕЛЕМЕНТИ
========================================================= */

const calculatorMessage = document.getElementById("calculatorMessage");

const sectionButtons = document.querySelectorAll(".calculator-section-card");
const formulaSelect = document.getElementById("formulaSelect");

const formulaInfo = document.getElementById("formulaInfo");
const formulaTitle = document.getElementById("formulaTitle");
const formulaText = document.getElementById("formulaText");
const formulaDescription = document.getElementById("formulaDescription");

const calculationForm = document.getElementById("calculationForm");
const inputFields = document.getElementById("inputFields");

const clearCalculatorBtn = document.getElementById("clearCalculatorBtn");

const resultBlock = document.getElementById("resultBlock");
const resultFormulaName = document.getElementById("resultFormulaName");
const resultValue = document.getElementById("resultValue");

const chartWrapper = document.getElementById("chartWrapper");
const chartEmpty = document.getElementById("chartEmpty");
const formulaChartCanvas = document.getElementById("formulaChart");

const unitValue = document.getElementById("unitValue");
const unitCategory = document.getElementById("unitCategory");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");
const convertUnitBtn = document.getElementById("convertUnitBtn");
const unitResult = document.getElementById("unitResult");


let selectedSectionKey = null;
let selectedFormulaKey = null;
let currentResult = null;
let currentChart = null;


/* =========================================================
   ПОВІДОМЛЕННЯ
========================================================= */

function showCalculatorMessage(message, type = "success") {
    if (!calculatorMessage) return;

    calculatorMessage.className = `alert alert-${type}`;
    calculatorMessage.textContent = message;
    calculatorMessage.classList.remove("d-none");
}

function hideCalculatorMessage() {
    if (!calculatorMessage) return;

    calculatorMessage.classList.add("d-none");
    calculatorMessage.textContent = "";
}


/* =========================================================
   СЛУЖБОВІ ФУНКЦІЇ
========================================================= */

function getNumber(id) {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Поле ${id} не знайдено.`);
    }

    const value = Number(element.value);

    if (Number.isNaN(value)) {
        throw new Error("Усі поля мають містити числові значення.");
    }

    return value;
}


function validatePositive(value, name) {
    if (value <= 0) {
        throw new Error(`${name} має бути більше нуля.`);
    }
}


function validateNotZero(value, name) {
    if (value === 0) {
        throw new Error(`${name} не може дорівнювати нулю.`);
    }
}


function roundResult(value, digits = 4) {
    if (!Number.isFinite(value)) {
        throw new Error("Результат не є коректним числом.");
    }

    return Number(value.toFixed(digits));
}


function formatResult(value, unit) {
    return `${roundResult(value)} ${unit || ""}`.trim();
}


function getSelectedFormula() {
    if (!selectedSectionKey || !selectedFormulaKey) return null;

    return calculatorsData[selectedSectionKey].formulas[selectedFormulaKey];
}


function getSelectedSection() {
    if (!selectedSectionKey) return null;

    return calculatorsData[selectedSectionKey];
}


/* =========================================================
   ДАНІ ФОРМУЛ
========================================================= */

const calculatorsData = {
    heat: {
        title: "Теплова енергія та кількість теплоти",
        formulas: {
            heatBody: {
                name: "Кількість теплоти при нагріванні або охолодженні тіла",
                formula: "Q = c · m · Δt",
                description: "Використовується для визначення кількості теплоти, потрібної для нагрівання або охолодження тіла.",
                unit: "Дж",
                inputs: [
                    { id: "c", label: "Питома теплоємність c", unit: "Дж/(кг·°C)" },
                    { id: "m", label: "Маса m", unit: "кг" },
                    { id: "dt", label: "Зміна температури Δt", unit: "°C" }
                ],
                calculate: () => {
                    const c = getNumber("c");
                    const m = getNumber("m");
                    const dt = getNumber("dt");

                    validatePositive(c, "Питома теплоємність");
                    validatePositive(m, "Маса");

                    return c * m * dt;
                },
                chart: (inputs) => {
                    const c = inputs.c;
                    const m = inputs.m;
                    const labels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
                    const data = labels.map(dt => c * m * dt);

                    return {
                        title: "Залежність Q від Δt",
                        xLabel: "Δt, °C",
                        yLabel: "Q, Дж",
                        labels,
                        data
                    };
                }
            },

            melting: {
                name: "Кількість теплоти при плавленні",
                formula: "Q = λ · m",
                description: "Розраховує кількість теплоти, необхідну для плавлення речовини.",
                unit: "Дж",
                inputs: [
                    { id: "lambda", label: "Питома теплота плавлення λ", unit: "Дж/кг" },
                    { id: "m", label: "Маса m", unit: "кг" }
                ],
                calculate: () => {
                    const lambda = getNumber("lambda");
                    const m = getNumber("m");

                    validatePositive(lambda, "Питома теплота плавлення");
                    validatePositive(m, "Маса");

                    return lambda * m;
                }
            },

            vaporization: {
                name: "Кількість теплоти при пароутворенні",
                formula: "Q = r · m",
                description: "Визначає кількість теплоти, потрібну для пароутворення.",
                unit: "Дж",
                inputs: [
                    { id: "r", label: "Питома теплота пароутворення r", unit: "Дж/кг" },
                    { id: "m", label: "Маса m", unit: "кг" }
                ],
                calculate: () => {
                    const r = getNumber("r");
                    const m = getNumber("m");

                    validatePositive(r, "Питома теплота пароутворення");
                    validatePositive(m, "Маса");

                    return r * m;
                }
            },

            totalHeat: {
                name: "Повна кількість теплоти з урахуванням фазових переходів",
                formula: "Qзаг = Q1 + Q2 + Q3",
                description: "Складає кілька етапів теплообміну або фазових переходів.",
                unit: "Дж",
                inputs: [
                    { id: "q1", label: "Q1", unit: "Дж" },
                    { id: "q2", label: "Q2", unit: "Дж" },
                    { id: "q3", label: "Q3", unit: "Дж" }
                ],
                calculate: () => {
                    const q1 = getNumber("q1");
                    const q2 = getNumber("q2");
                    const q3 = getNumber("q3");

                    return q1 + q2 + q3;
                }
            },

            heatPower: {
                name: "Теплова потужність",
                formula: "N = Q / τ",
                description: "Показує, яка кількість теплоти передається за одиницю часу.",
                unit: "Вт",
                inputs: [
                    { id: "q", label: "Кількість теплоти Q", unit: "Дж" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const q = getNumber("q");
                    const tau = getNumber("tau");

                    validatePositive(tau, "Час");

                    return q / tau;
                },
                chart: (inputs) => {
                    const q = inputs.q;
                    const labels = [10, 20, 30, 40, 50, 60, 90, 120, 180, 240];
                    const data = labels.map(tau => q / tau);

                    return {
                        title: "Залежність N від τ",
                        xLabel: "τ, с",
                        yLabel: "N, Вт",
                        labels,
                        data
                    };
                }
            }
        }
    },

    exchange: {
        title: "Теплообмін",
        formulas: {
            heatTransfer: {
                name: "Основне рівняння теплопередачі",
                formula: "Q = k · F · Δt · τ",
                description: "Використовується для розрахунку кількості теплоти, що передається через поверхню теплообміну.",
                unit: "Дж",
                inputs: [
                    { id: "k", label: "Коефіцієнт теплопередачі k", unit: "Вт/(м²·°C)" },
                    { id: "f", label: "Площа поверхні F", unit: "м²" },
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const k = getNumber("k");
                    const f = getNumber("f");
                    const dt = getNumber("dt");
                    const tau = getNumber("tau");

                    validatePositive(k, "Коефіцієнт теплопередачі");
                    validatePositive(f, "Площа");
                    validatePositive(tau, "Час");

                    return k * f * dt * tau;
                },
                chart: (inputs) => {
                    const k = inputs.k;
                    const f = inputs.f;
                    const tau = inputs.tau;
                    const labels = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70];
                    const data = labels.map(dt => k * f * dt * tau);

                    return {
                        title: "Залежність Q від Δt",
                        xLabel: "Δt, °C",
                        yLabel: "Q, Дж",
                        labels,
                        data
                    };
                }
            },

            heatFlow: {
                name: "Тепловий потік",
                formula: "q = Q / τ",
                description: "Характеризує кількість теплоти, що передається за одиницю часу.",
                unit: "Вт",
                inputs: [
                    { id: "qTotal", label: "Кількість теплоти Q", unit: "Дж" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const qTotal = getNumber("qTotal");
                    const tau = getNumber("tau");

                    validatePositive(tau, "Час");

                    return qTotal / tau;
                }
            },

            heatFluxDensity: {
                name: "Густина теплового потоку",
                formula: "q = Q / F",
                description: "Показує кількість теплоти, що припадає на одиницю площі.",
                unit: "Дж/м²",
                inputs: [
                    { id: "qTotal", label: "Кількість теплоти Q", unit: "Дж" },
                    { id: "f", label: "Площа F", unit: "м²" }
                ],
                calculate: () => {
                    const qTotal = getNumber("qTotal");
                    const f = getNumber("f");

                    validatePositive(f, "Площа");

                    return qTotal / f;
                }
            },

            heatTransferCoefficient: {
                name: "Коефіцієнт теплопередачі",
                formula: "k = Q / (F · Δt · τ)",
                description: "Дає змогу визначити коефіцієнт теплопередачі за відомою кількістю теплоти.",
                unit: "Вт/(м²·°C)",
                inputs: [
                    { id: "qTotal", label: "Кількість теплоти Q", unit: "Дж" },
                    { id: "f", label: "Площа F", unit: "м²" },
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const qTotal = getNumber("qTotal");
                    const f = getNumber("f");
                    const dt = getNumber("dt");
                    const tau = getNumber("tau");

                    validatePositive(f, "Площа");
                    validateNotZero(dt, "Різниця температур");
                    validatePositive(tau, "Час");

                    return qTotal / (f * dt * tau);
                }
            },

            logMeanTemp: {
                name: "Логарифмічна середня різниця температур",
                formula: "Δtср = (Δt1 - Δt2) / ln(Δt1 / Δt2)",
                description: "Використовується у теплових апаратах для оцінки середньої рушійної сили теплообміну.",
                unit: "°C",
                inputs: [
                    { id: "dt1", label: "Різниця температур Δt1", unit: "°C" },
                    { id: "dt2", label: "Різниця температур Δt2", unit: "°C" }
                ],
                calculate: () => {
                    const dt1 = getNumber("dt1");
                    const dt2 = getNumber("dt2");

                    validatePositive(dt1, "Δt1");
                    validatePositive(dt2, "Δt2");

                    if (dt1 === dt2) {
                        return dt1;
                    }

                    return (dt1 - dt2) / Math.log(dt1 / dt2);
                }
            }
        }
    },

    conduction: {
        title: "Теплопровідність",
        formulas: {
            fourier: {
                name: "Закон теплопровідності Фур’є",
                formula: "Q = λ · F · Δt · τ / δ",
                description: "Описує передачу теплоти через шар матеріалу.",
                unit: "Дж",
                inputs: [
                    { id: "lambda", label: "Коефіцієнт теплопровідності λ", unit: "Вт/(м·°C)" },
                    { id: "f", label: "Площа F", unit: "м²" },
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "tau", label: "Час τ", unit: "с" },
                    { id: "delta", label: "Товщина шару δ", unit: "м" }
                ],
                calculate: () => {
                    const lambda = getNumber("lambda");
                    const f = getNumber("f");
                    const dt = getNumber("dt");
                    const tau = getNumber("tau");
                    const delta = getNumber("delta");

                    validatePositive(lambda, "Коефіцієнт теплопровідності");
                    validatePositive(f, "Площа");
                    validatePositive(tau, "Час");
                    validatePositive(delta, "Товщина шару");

                    return lambda * f * dt * tau / delta;
                },
                chart: (inputs) => {
                    const lambda = inputs.lambda;
                    const f = inputs.f;
                    const dt = inputs.dt;
                    const tau = inputs.tau;
                    const labels = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.5];
                    const data = labels.map(delta => lambda * f * dt * tau / delta);

                    return {
                        title: "Залежність Q від δ",
                        xLabel: "δ, м",
                        yLabel: "Q, Дж",
                        labels,
                        data
                    };
                }
            },

            layerResistance: {
                name: "Тепловий опір шару",
                formula: "R = δ / λ",
                description: "Показує опір шару матеріалу проходженню теплового потоку.",
                unit: "м²·°C/Вт",
                inputs: [
                    { id: "delta", label: "Товщина шару δ", unit: "м" },
                    { id: "lambda", label: "Коефіцієнт теплопровідності λ", unit: "Вт/(м·°C)" }
                ],
                calculate: () => {
                    const delta = getNumber("delta");
                    const lambda = getNumber("lambda");

                    validatePositive(delta, "Товщина шару");
                    validatePositive(lambda, "Коефіцієнт теплопровідності");

                    return delta / lambda;
                }
            },

            totalResistance: {
                name: "Тепловий опір багатошарової стінки",
                formula: "Rзаг = R1 + R2 + R3",
                description: "Складає теплові опори кількох шарів конструкції.",
                unit: "м²·°C/Вт",
                inputs: [
                    { id: "r1", label: "Опір R1", unit: "м²·°C/Вт" },
                    { id: "r2", label: "Опір R2", unit: "м²·°C/Вт" },
                    { id: "r3", label: "Опір R3", unit: "м²·°C/Вт" }
                ],
                calculate: () => {
                    const r1 = getNumber("r1");
                    const r2 = getNumber("r2");
                    const r3 = getNumber("r3");

                    return r1 + r2 + r3;
                }
            },

            wallHeatFlow: {
                name: "Тепловий потік через стінку",
                formula: "q = Δt / Rзаг",
                description: "Визначає тепловий потік через конструкцію з відомим тепловим опором.",
                unit: "Вт/м²",
                inputs: [
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "rTotal", label: "Загальний тепловий опір Rзаг", unit: "м²·°C/Вт" }
                ],
                calculate: () => {
                    const dt = getNumber("dt");
                    const rTotal = getNumber("rTotal");

                    validatePositive(rTotal, "Загальний тепловий опір");

                    return dt / rTotal;
                }
            },

            conductivity: {
                name: "Коефіцієнт теплопровідності",
                formula: "λ = Q · δ / (F · Δt · τ)",
                description: "Дозволяє визначити коефіцієнт теплопровідності матеріалу.",
                unit: "Вт/(м·°C)",
                inputs: [
                    { id: "qTotal", label: "Кількість теплоти Q", unit: "Дж" },
                    { id: "delta", label: "Товщина шару δ", unit: "м" },
                    { id: "f", label: "Площа F", unit: "м²" },
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const qTotal = getNumber("qTotal");
                    const delta = getNumber("delta");
                    const f = getNumber("f");
                    const dt = getNumber("dt");
                    const tau = getNumber("tau");

                    validatePositive(delta, "Товщина шару");
                    validatePositive(f, "Площа");
                    validateNotZero(dt, "Різниця температур");
                    validatePositive(tau, "Час");

                    return qTotal * delta / (f * dt * tau);
                }
            }
        }
    },

    radiation: {
        title: "Конвекція та випромінювання",
        formulas: {
            convection: {
                name: "Тепловіддача конвекцією",
                formula: "Q = α · F · Δt · τ",
                description: "Описує тепловіддачу між поверхнею і середовищем.",
                unit: "Дж",
                inputs: [
                    { id: "alpha", label: "Коефіцієнт тепловіддачі α", unit: "Вт/(м²·°C)" },
                    { id: "f", label: "Площа F", unit: "м²" },
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const alpha = getNumber("alpha");
                    const f = getNumber("f");
                    const dt = getNumber("dt");
                    const tau = getNumber("tau");

                    validatePositive(alpha, "Коефіцієнт тепловіддачі");
                    validatePositive(f, "Площа");
                    validatePositive(tau, "Час");

                    return alpha * f * dt * tau;
                },
                chart: (inputs) => {
                    const alpha = inputs.alpha;
                    const f = inputs.f;
                    const tau = inputs.tau;
                    const labels = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70];
                    const data = labels.map(dt => alpha * f * dt * tau);

                    return {
                        title: "Залежність Q від Δt",
                        xLabel: "Δt, °C",
                        yLabel: "Q, Дж",
                        labels,
                        data
                    };
                }
            },

            convectionCoefficient: {
                name: "Коефіцієнт тепловіддачі",
                formula: "α = Q / (F · Δt · τ)",
                description: "Визначає коефіцієнт тепловіддачі за відомими параметрами теплообміну.",
                unit: "Вт/(м²·°C)",
                inputs: [
                    { id: "qTotal", label: "Кількість теплоти Q", unit: "Дж" },
                    { id: "f", label: "Площа F", unit: "м²" },
                    { id: "dt", label: "Різниця температур Δt", unit: "°C" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const qTotal = getNumber("qTotal");
                    const f = getNumber("f");
                    const dt = getNumber("dt");
                    const tau = getNumber("tau");

                    validatePositive(f, "Площа");
                    validateNotZero(dt, "Різниця температур");
                    validatePositive(tau, "Час");

                    return qTotal / (f * dt * tau);
                }
            },

            stefanBoltzmann: {
                name: "Закон Стефана — Больцмана",
                formula: "E = ε · σ · T⁴",
                description: "Визначає енергію випромінювання абсолютно або сірого тіла.",
                unit: "Вт/м²",
                inputs: [
                    { id: "epsilon", label: "Ступінь чорноти ε", unit: "0...1" },
                    { id: "sigma", label: "Стала Стефана-Больцмана σ", unit: "Вт/(м²·К⁴)", value: 5.67e-8 },
                    { id: "t", label: "Температура T", unit: "К" }
                ],
                calculate: () => {
                    const epsilon = getNumber("epsilon");
                    const sigma = getNumber("sigma");
                    const t = getNumber("t");

                    validatePositive(sigma, "Стала Стефана-Больцмана");
                    validatePositive(t, "Температура");

                    if (epsilon < 0 || epsilon > 1) {
                        throw new Error("Ступінь чорноти ε має бути в межах від 0 до 1.");
                    }

                    return epsilon * sigma * Math.pow(t, 4);
                },
                chart: (inputs) => {
                    const epsilon = inputs.epsilon;
                    const sigma = inputs.sigma;
                    const labels = [250, 300, 350, 400, 450, 500, 600, 700, 800, 900];
                    const data = labels.map(t => epsilon * sigma * Math.pow(t, 4));

                    return {
                        title: "Залежність E від T",
                        xLabel: "T, К",
                        yLabel: "E, Вт/м²",
                        labels,
                        data
                    };
                }
            },

            radiationExchange: {
                name: "Теплообмін випромінюванням між поверхнями",
                formula: "Q = ε · σ · F · (T1⁴ - T2⁴) · τ",
                description: "Розрахунок теплового обміну випромінюванням між двома поверхнями.",
                unit: "Дж",
                inputs: [
                    { id: "epsilon", label: "Ступінь чорноти ε", unit: "0...1" },
                    { id: "sigma", label: "Стала σ", unit: "Вт/(м²·К⁴)", value: 5.67e-8 },
                    { id: "f", label: "Площа F", unit: "м²" },
                    { id: "t1", label: "Температура T1", unit: "К" },
                    { id: "t2", label: "Температура T2", unit: "К" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const epsilon = getNumber("epsilon");
                    const sigma = getNumber("sigma");
                    const f = getNumber("f");
                    const t1 = getNumber("t1");
                    const t2 = getNumber("t2");
                    const tau = getNumber("tau");

                    if (epsilon < 0 || epsilon > 1) {
                        throw new Error("Ступінь чорноти ε має бути в межах від 0 до 1.");
                    }

                    validatePositive(sigma, "Стала σ");
                    validatePositive(f, "Площа");
                    validatePositive(t1, "Температура T1");
                    validatePositive(t2, "Температура T2");
                    validatePositive(tau, "Час");

                    return epsilon * sigma * f * (Math.pow(t1, 4) - Math.pow(t2, 4)) * tau;
                }
            }
        }
    },

    water: {
        title: "Вода, пара та вологе повітря",
        formulas: {
            waterEnthalpy: {
                name: "Ентальпія води",
                formula: "i = c · t",
                description: "Орієнтовний розрахунок ентальпії води за температурою.",
                unit: "кДж/кг",
                inputs: [
                    { id: "c", label: "Питома теплоємність c", unit: "кДж/(кг·°C)", value: 4.19 },
                    { id: "t", label: "Температура t", unit: "°C" }
                ],
                calculate: () => {
                    const c = getNumber("c");
                    const t = getNumber("t");

                    validatePositive(c, "Питома теплоємність");

                    return c * t;
                }
            },

            waterHeating: {
                name: "Кількість теплоти для нагрівання води",
                formula: "Q = m · c · (t2 - t1)",
                description: "Розраховує кількість теплоти для нагрівання води від t1 до t2.",
                unit: "кДж",
                inputs: [
                    { id: "m", label: "Маса води m", unit: "кг" },
                    { id: "c", label: "Питома теплоємність c", unit: "кДж/(кг·°C)", value: 4.19 },
                    { id: "t1", label: "Початкова температура t1", unit: "°C" },
                    { id: "t2", label: "Кінцева температура t2", unit: "°C" }
                ],
                calculate: () => {
                    const m = getNumber("m");
                    const c = getNumber("c");
                    const t1 = getNumber("t1");
                    const t2 = getNumber("t2");

                    validatePositive(m, "Маса");
                    validatePositive(c, "Питома теплоємність");

                    return m * c * (t2 - t1);
                },
                chart: (inputs) => {
                    const m = inputs.m;
                    const c = inputs.c;
                    const t1 = inputs.t1;
                    const labels = [20, 30, 40, 50, 60, 70, 80, 90, 100];
                    const data = labels.map(t2 => m * c * (t2 - t1));

                    return {
                        title: "Залежність Q від t2",
                        xLabel: "t2, °C",
                        yLabel: "Q, кДж",
                        labels,
                        data
                    };
                }
            },

            steamFormation: {
                name: "Кількість теплоти для утворення пари",
                formula: "Q = m · r",
                description: "Визначає теплоту, необхідну для утворення пари.",
                unit: "кДж",
                inputs: [
                    { id: "m", label: "Маса m", unit: "кг" },
                    { id: "r", label: "Питома теплота пароутворення r", unit: "кДж/кг", value: 2256 }
                ],
                calculate: () => {
                    const m = getNumber("m");
                    const r = getNumber("r");

                    validatePositive(m, "Маса");
                    validatePositive(r, "Питома теплота пароутворення");

                    return m * r;
                }
            },

            steamConsumption: {
                name: "Витрата пари",
                formula: "G = Q / (i1 - i2)",
                description: "Розрахунок витрати пари за тепловим навантаженням і різницею ентальпій.",
                unit: "кг",
                inputs: [
                    { id: "q", label: "Теплота Q", unit: "кДж" },
                    { id: "i1", label: "Ентальпія i1", unit: "кДж/кг" },
                    { id: "i2", label: "Ентальпія i2", unit: "кДж/кг" }
                ],
                calculate: () => {
                    const q = getNumber("q");
                    const i1 = getNumber("i1");
                    const i2 = getNumber("i2");

                    validateNotZero(i1 - i2, "Різниця ентальпій");

                    return q / (i1 - i2);
                }
            },

            relativeHumidity: {
                name: "Відносна вологість повітря",
                formula: "φ = ρ / ρнас · 100%",
                description: "Показує відношення фактичної густини водяної пари до насиченої.",
                unit: "%",
                inputs: [
                    { id: "rho", label: "Абсолютна вологість ρ", unit: "кг/м³" },
                    { id: "rhoSat", label: "Насичена вологість ρнас", unit: "кг/м³" }
                ],
                calculate: () => {
                    const rho = getNumber("rho");
                    const rhoSat = getNumber("rhoSat");

                    validatePositive(rhoSat, "Насичена вологість");

                    return rho / rhoSat * 100;
                }
            },

            absoluteHumidity: {
                name: "Абсолютна вологість",
                formula: "ρ = mпари / V",
                description: "Визначає масу водяної пари в одиниці об’єму повітря.",
                unit: "кг/м³",
                inputs: [
                    { id: "mSteam", label: "Маса пари mпари", unit: "кг" },
                    { id: "v", label: "Об’єм V", unit: "м³" }
                ],
                calculate: () => {
                    const mSteam = getNumber("mSteam");
                    const v = getNumber("v");

                    validatePositive(v, "Об’єм");

                    return mSteam / v;
                }
            }
        }
    },

    fuel: {
        title: "Паливо та горіння",
        formulas: {
            combustionHeat: {
                name: "Кількість теплоти при згорянні палива",
                formula: "Q = B · Qн",
                description: "Розраховує кількість теплоти, що виділяється під час згоряння палива.",
                unit: "кДж",
                inputs: [
                    { id: "b", label: "Витрата палива B", unit: "кг або м³" },
                    { id: "qn", label: "Нижча теплота згоряння Qн", unit: "кДж/кг або кДж/м³" }
                ],
                calculate: () => {
                    const b = getNumber("b");
                    const qn = getNumber("qn");

                    validatePositive(b, "Витрата палива");
                    validatePositive(qn, "Нижча теплота згоряння");

                    return b * qn;
                },
                chart: (inputs) => {
                    const qn = inputs.qn;
                    const labels = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
                    const data = labels.map(b => b * qn);

                    return {
                        title: "Залежність Q від B",
                        xLabel: "B, кг або м³",
                        yLabel: "Q, кДж",
                        labels,
                        data
                    };
                }
            },

            fuelConsumption: {
                name: "Витрата палива",
                formula: "B = Q / Qн",
                description: "Визначає потрібну витрату палива для отримання заданої кількості теплоти.",
                unit: "кг або м³",
                inputs: [
                    { id: "q", label: "Кількість теплоти Q", unit: "кДж" },
                    { id: "qn", label: "Нижча теплота згоряння Qн", unit: "кДж/кг або кДж/м³" }
                ],
                calculate: () => {
                    const q = getNumber("q");
                    const qn = getNumber("qn");

                    validatePositive(qn, "Нижча теплота згоряння");

                    return q / qn;
                }
            },

            standardFuel: {
                name: "Умовне паливо",
                formula: "Bум = Q / 29300",
                description: "Переводить кількість теплоти в еквівалент умовного палива.",
                unit: "кг у.п.",
                inputs: [
                    { id: "q", label: "Кількість теплоти Q", unit: "кДж" }
                ],
                calculate: () => {
                    const q = getNumber("q");
                    return q / 29300;
                }
            },

            boilerEfficiency: {
                name: "ККД котельної установки",
                formula: "η = Qкор / Qпал · 100%",
                description: "Показує ефективність використання теплоти палива.",
                unit: "%",
                inputs: [
                    { id: "qUseful", label: "Корисна теплота Qкор", unit: "кДж" },
                    { id: "qFuel", label: "Теплота палива Qпал", unit: "кДж" }
                ],
                calculate: () => {
                    const qUseful = getNumber("qUseful");
                    const qFuel = getNumber("qFuel");

                    validatePositive(qFuel, "Теплота палива");

                    return qUseful / qFuel * 100;
                }
            },

            specificFuelConsumption: {
                name: "Питома витрата палива",
                formula: "b = B / N",
                description: "Показує витрату палива на одиницю потужності.",
                unit: "кг/кВт",
                inputs: [
                    { id: "bFuel", label: "Витрата палива B", unit: "кг" },
                    { id: "n", label: "Потужність N", unit: "кВт" }
                ],
                calculate: () => {
                    const bFuel = getNumber("bFuel");
                    const n = getNumber("n");

                    validatePositive(n, "Потужність");

                    return bFuel / n;
                }
            }
        }
    },

    engine: {
        title: "Теплові машини та ККД",
        formulas: {
            efficiencyWork: {
                name: "ККД теплової машини",
                formula: "η = A / Q1 · 100%",
                description: "Визначає ефективність теплової машини через корисну роботу.",
                unit: "%",
                inputs: [
                    { id: "a", label: "Корисна робота A", unit: "Дж" },
                    { id: "q1", label: "Підведена теплота Q1", unit: "Дж" }
                ],
                calculate: () => {
                    const a = getNumber("a");
                    const q1 = getNumber("q1");

                    validatePositive(q1, "Підведена теплота");

                    return a / q1 * 100;
                }
            },

            efficiencyHeat: {
                name: "ККД через кількість теплоти",
                formula: "η = (Q1 - Q2) / Q1 · 100%",
                description: "Розраховує ККД за підведеною та відведеною теплотою.",
                unit: "%",
                inputs: [
                    { id: "q1", label: "Підведена теплота Q1", unit: "Дж" },
                    { id: "q2", label: "Відведена теплота Q2", unit: "Дж" }
                ],
                calculate: () => {
                    const q1 = getNumber("q1");
                    const q2 = getNumber("q2");

                    validatePositive(q1, "Підведена теплота");

                    return (q1 - q2) / q1 * 100;
                }
            },

            carnot: {
                name: "Ідеальний ККД циклу Карно",
                formula: "η = (T1 - T2) / T1 · 100%",
                description: "Максимально можливий ККД ідеальної теплової машини.",
                unit: "%",
                inputs: [
                    { id: "t1", label: "Температура нагрівача T1", unit: "К" },
                    { id: "t2", label: "Температура холодильника T2", unit: "К" }
                ],
                calculate: () => {
                    const t1 = getNumber("t1");
                    const t2 = getNumber("t2");

                    validatePositive(t1, "Температура T1");
                    validatePositive(t2, "Температура T2");

                    if (t2 >= t1) {
                        throw new Error("T2 має бути меншою за T1.");
                    }

                    return (t1 - t2) / t1 * 100;
                },
                chart: (inputs) => {
                    const t2 = inputs.t2;
                    const labels = [350, 400, 450, 500, 550, 600, 700, 800, 900, 1000];
                    const data = labels.map(t1 => {
                        if (t1 <= t2) return 0;
                        return (t1 - t2) / t1 * 100;
                    });

                    return {
                        title: "Залежність η від T1",
                        xLabel: "T1, К",
                        yLabel: "η, %",
                        labels,
                        data
                    };
                }
            },

            usefulWork: {
                name: "Корисна робота",
                formula: "A = Q1 - Q2",
                description: "Визначає корисну роботу теплової машини.",
                unit: "Дж",
                inputs: [
                    { id: "q1", label: "Підведена теплота Q1", unit: "Дж" },
                    { id: "q2", label: "Відведена теплота Q2", unit: "Дж" }
                ],
                calculate: () => {
                    const q1 = getNumber("q1");
                    const q2 = getNumber("q2");

                    return q1 - q2;
                }
            },

            enginePower: {
                name: "Потужність теплової машини",
                formula: "N = A / τ",
                description: "Показує роботу, виконану за одиницю часу.",
                unit: "Вт",
                inputs: [
                    { id: "a", label: "Робота A", unit: "Дж" },
                    { id: "tau", label: "Час τ", unit: "с" }
                ],
                calculate: () => {
                    const a = getNumber("a");
                    const tau = getNumber("tau");

                    validatePositive(tau, "Час");

                    return a / tau;
                }
            }
        }
    },

    gas: {
        title: "Газові процеси",
        formulas: {
            idealGasMass: {
                name: "Рівняння стану ідеального газу",
                formula: "p · V = m · R · T",
                description: "Розрахунок тиску ідеального газу через масу, газову сталу, температуру та об’єм.",
                unit: "Па",
                inputs: [
                    { id: "m", label: "Маса m", unit: "кг" },
                    { id: "r", label: "Газова стала R", unit: "Дж/(кг·К)" },
                    { id: "t", label: "Температура T", unit: "К" },
                    { id: "v", label: "Об’єм V", unit: "м³" }
                ],
                calculate: () => {
                    const m = getNumber("m");
                    const r = getNumber("r");
                    const t = getNumber("t");
                    const v = getNumber("v");

                    validatePositive(m, "Маса");
                    validatePositive(r, "Газова стала");
                    validatePositive(t, "Температура");
                    validatePositive(v, "Об’єм");

                    return m * r * t / v;
                },
                chart: (inputs) => {
                    const m = inputs.m;
                    const r = inputs.r;
                    const t = inputs.t;
                    const labels = [0.1, 0.2, 0.5, 1, 1.5, 2, 3, 4, 5, 6];
                    const data = labels.map(v => m * r * t / v);

                    return {
                        title: "Залежність p від V",
                        xLabel: "V, м³",
                        yLabel: "p, Па",
                        labels,
                        data
                    };
                }
            },

            clapeyron: {
                name: "Рівняння Менделєєва — Клапейрона",
                formula: "p · V = ν · R · T",
                description: "Розрахунок тиску газу через кількість речовини.",
                unit: "Па",
                inputs: [
                    { id: "nu", label: "Кількість речовини ν", unit: "моль" },
                    { id: "r", label: "Універсальна газова стала R", unit: "Дж/(моль·К)", value: 8.314 },
                    { id: "t", label: "Температура T", unit: "К" },
                    { id: "v", label: "Об’єм V", unit: "м³" }
                ],
                calculate: () => {
                    const nu = getNumber("nu");
                    const r = getNumber("r");
                    const t = getNumber("t");
                    const v = getNumber("v");

                    validatePositive(nu, "Кількість речовини");
                    validatePositive(r, "Газова стала");
                    validatePositive(t, "Температура");
                    validatePositive(v, "Об’єм");

                    return nu * r * t / v;
                }
            },

            boyleMariotte: {
                name: "Закон Бойля — Маріотта",
                formula: "p1 · V1 = p2 · V2",
                description: "Для ізотермічного процесу добуток тиску на об’єм є сталим.",
                unit: "Па",
                inputs: [
                    { id: "p1", label: "Початковий тиск p1", unit: "Па" },
                    { id: "v1", label: "Початковий об’єм V1", unit: "м³" },
                    { id: "v2", label: "Кінцевий об’єм V2", unit: "м³" }
                ],
                calculate: () => {
                    const p1 = getNumber("p1");
                    const v1 = getNumber("v1");
                    const v2 = getNumber("v2");

                    validatePositive(p1, "Тиск p1");
                    validatePositive(v1, "Об’єм V1");
                    validatePositive(v2, "Об’єм V2");

                    return p1 * v1 / v2;
                },
                chart: (inputs) => {
                    const p1 = inputs.p1;
                    const v1 = inputs.v1;
                    const labels = [0.1, 0.2, 0.5, 1, 1.5, 2, 3, 4, 5, 6];
                    const data = labels.map(v2 => p1 * v1 / v2);

                    return {
                        title: "Залежність p2 від V2",
                        xLabel: "V2, м³",
                        yLabel: "p2, Па",
                        labels,
                        data
                    };
                }
            },

            gayLussac: {
                name: "Закон Гей-Люссака",
                formula: "V1 / T1 = V2 / T2",
                description: "При сталому тиску об’єм газу пропорційний абсолютній температурі.",
                unit: "м³",
                inputs: [
                    { id: "v1", label: "Початковий об’єм V1", unit: "м³" },
                    { id: "t1", label: "Початкова температура T1", unit: "К" },
                    { id: "t2", label: "Кінцева температура T2", unit: "К" }
                ],
                calculate: () => {
                    const v1 = getNumber("v1");
                    const t1 = getNumber("t1");
                    const t2 = getNumber("t2");

                    validatePositive(v1, "Об’єм V1");
                    validatePositive(t1, "Температура T1");
                    validatePositive(t2, "Температура T2");

                    return v1 * t2 / t1;
                }
            },

            charles: {
                name: "Закон Шарля",
                formula: "p1 / T1 = p2 / T2",
                description: "При сталому об’ємі тиск газу пропорційний абсолютній температурі.",
                unit: "Па",
                inputs: [
                    { id: "p1", label: "Початковий тиск p1", unit: "Па" },
                    { id: "t1", label: "Початкова температура T1", unit: "К" },
                    { id: "t2", label: "Кінцева температура T2", unit: "К" }
                ],
                calculate: () => {
                    const p1 = getNumber("p1");
                    const t1 = getNumber("t1");
                    const t2 = getNumber("t2");

                    validatePositive(p1, "Тиск p1");
                    validatePositive(t1, "Температура T1");
                    validatePositive(t2, "Температура T2");

                    return p1 * t2 / t1;
                }
            },

            gasWork: {
                name: "Робота газу при сталому тиску",
                formula: "A = p · ΔV",
                description: "Розраховує роботу газу в ізобарному процесі.",
                unit: "Дж",
                inputs: [
                    { id: "p", label: "Тиск p", unit: "Па" },
                    { id: "dv", label: "Зміна об’єму ΔV", unit: "м³" }
                ],
                calculate: () => {
                    const p = getNumber("p");
                    const dv = getNumber("dv");

                    validatePositive(p, "Тиск");

                    return p * dv;
                }
            },

            internalEnergy: {
                name: "Внутрішня енергія ідеального газу",
                formula: "U = cv · m · T",
                description: "Орієнтовний розрахунок внутрішньої енергії ідеального газу.",
                unit: "Дж",
                inputs: [
                    { id: "cv", label: "Питома теплоємність cv", unit: "Дж/(кг·К)" },
                    { id: "m", label: "Маса m", unit: "кг" },
                    { id: "t", label: "Температура T", unit: "К" }
                ],
                calculate: () => {
                    const cv = getNumber("cv");
                    const m = getNumber("m");
                    const t = getNumber("t");

                    validatePositive(cv, "Питома теплоємність");
                    validatePositive(m, "Маса");
                    validatePositive(t, "Температура");

                    return cv * m * t;
                }
            }
        }
    }
};


/* =========================================================
   ПОБУДОВА ІНТЕРФЕЙСУ ФОРМУЛ
========================================================= */

function selectSection(sectionKey) {
    selectedSectionKey = sectionKey;
    selectedFormulaKey = null;
    currentResult = null;

    sectionButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.section === sectionKey);
    });

    fillFormulaSelect(sectionKey);
    resetFormulaInfo();
    resetCalculationForm();
    clearResult();
    clearChart();

    showCalculatorMessage(`Обрано розділ: ${calculatorsData[sectionKey].title}`, "success");
}


function fillFormulaSelect(sectionKey) {
    const section = calculatorsData[sectionKey];

    formulaSelect.innerHTML = `<option value="">Оберіть формулу</option>`;

    Object.entries(section.formulas).forEach(([key, formula]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = formula.name;
        formulaSelect.appendChild(option);
    });
}


function selectFormula(formulaKey) {
    selectedFormulaKey = formulaKey;
    currentResult = null;

    const formula = getSelectedFormula();

    if (!formula) return;

    showFormulaInfo(formula);
    buildInputFields(formula);
    clearResult();
    clearChart();
}


function showFormulaInfo(formula) {
    formulaTitle.textContent = formula.name;
    formulaText.textContent = formula.formula;
    formulaDescription.textContent = formula.description;

    formulaInfo.classList.remove("d-none");
}


function resetFormulaInfo() {
    formulaInfo.classList.add("d-none");
    formulaTitle.textContent = "";
    formulaText.textContent = "";
    formulaDescription.textContent = "";
}


function buildInputFields(formula) {
    inputFields.innerHTML = "";

    formula.inputs.forEach(input => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";

        col.innerHTML = `
            <label for="${input.id}" class="form-label">
                ${input.label}
                <span class="text-muted">(${input.unit})</span>
            </label>
            <input
                type="number"
                step="any"
                class="form-control calculator-input"
                id="${input.id}"
                value="${input.value !== undefined ? input.value : ""}"
                required
            >
        `;

        inputFields.appendChild(col);
    });
}


function resetCalculationForm() {
    inputFields.innerHTML = `
        <p class="text-muted mb-0">
            Оберіть розділ і формулу, щоб з’явилися поля для введення.
        </p>
    `;
}


function clearResult() {
    currentResult = null;
    resultBlock.classList.add("d-none");
    resultValue.textContent = "-";
    resultFormulaName.textContent = "Формула";
}


function clearChart() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    chartWrapper.classList.add("d-none");
    chartEmpty.classList.remove("d-none");
}


function collectInputData(formula) {
    const data = {};

    formula.inputs.forEach(input => {
        data[input.id] = getNumber(input.id);
    });

    return data;
}


/* =========================================================
   РОЗРАХУНОК
========================================================= */

async function calculateCurrentFormula(event) {
    event.preventDefault();
    hideCalculatorMessage();

    const section = getSelectedSection();
    const formula = getSelectedFormula();

    if (!section || !formula) {
        showCalculatorMessage("Оберіть розділ і формулу.", "danger");
        return;
    }

    try {
        const inputData = collectInputData(formula);
        const rawResult = formula.calculate();
        const rounded = roundResult(rawResult);

        currentResult = {
            section: section.title,
            formula_name: formula.name,
            formula: formula.formula,
            input_data: inputData,
            result: String(rounded),
            unit: formula.unit,
            chart_data: null
        };

        resultFormulaName.textContent = formula.name;
        resultValue.textContent = formatResult(rawResult, formula.unit);
        resultBlock.classList.remove("d-none");

        if (typeof formula.chart === "function") {
            const chartData = formula.chart(inputData);
            currentResult.chart_data = chartData;
            buildChart(chartData);
        } else {
            clearChart();
        }

        const saved = await autoSaveCalculationToHistory();

        if (saved) {
            showCalculatorMessage("Розрахунок виконано та автоматично збережено в історію.", "success");
        } else {
            showCalculatorMessage("Розрахунок виконано. Для збереження історії потрібно увійти в акаунт.", "warning");
        }

    } catch (error) {
        clearResult();
        clearChart();
        showCalculatorMessage(error.message || "Помилка розрахунку.", "danger");
    }
}


/* =========================================================
   ГРАФІК
========================================================= */

function buildChart(chartData) {
    clearChart();

    chartWrapper.classList.remove("d-none");
    chartEmpty.classList.add("d-none");

    currentChart = new Chart(formulaChartCanvas, {
        type: "line",
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: chartData.title,
                    data: chartData.data,
                    borderWidth: 2,
                    tension: 0.25
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartData.title
                },
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: chartData.xLabel
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: chartData.yLabel
                    }
                }
            }
        }
    });
}


/* =========================================================
   ЗБЕРЕЖЕННЯ В ІСТОРІЮ
========================================================= */

async function autoSaveCalculationToHistory() {
    if (!currentResult) {
        return false;
    }

    const user = await getCurrentUser();

    if (!user) {
        return false;
    }

    const { error } = await supabase
        .from("calculations")
        .insert({
            user_id: user.id,
            section: currentResult.section,
            formula_name: currentResult.formula_name,
            formula: currentResult.formula,
            input_data: currentResult.input_data,
            result: currentResult.result,
            unit: currentResult.unit,
            chart_data: currentResult.chart_data
        });

    if (error) {
        console.error("Помилка автозбереження:", error.message);
        showCalculatorMessage(`Розрахунок виконано, але не збережено: ${error.message}`, "warning");
        return false;
    }

    return true;
}

/* =========================================================
   ОЧИЩЕННЯ
========================================================= */

function clearCalculator() {
    const formula = getSelectedFormula();

    if (formula) {
        buildInputFields(formula);
    }

    clearResult();
    clearChart();
    hideCalculatorMessage();
}


/* =========================================================
   КОНВЕРТЕР ОДИНИЦЬ
========================================================= */

const unitData = {
    energy: {
        label: "Енергія",
        base: "J",
        units: {
            J: { label: "Дж", factor: 1 },
            kJ: { label: "кДж", factor: 1000 },
            MJ: { label: "МДж", factor: 1000000 },
            Wh: { label: "Вт·год", factor: 3600 },
            kWh: { label: "кВт·год", factor: 3600000 },
            cal: { label: "кал", factor: 4.1868 },
            kcal: { label: "ккал", factor: 4186.8 }
        }
    },

    power: {
        label: "Потужність",
        base: "W",
        units: {
            W: { label: "Вт", factor: 1 },
            kW: { label: "кВт", factor: 1000 },
            MW: { label: "МВт", factor: 1000000 },
            hp: { label: "к.с.", factor: 735.5 }
        }
    },

    mass: {
        label: "Маса",
        base: "kg",
        units: {
            g: { label: "г", factor: 0.001 },
            kg: { label: "кг", factor: 1 },
            t: { label: "т", factor: 1000 }
        }
    },

    volume: {
        label: "Об’єм",
        base: "m3",
        units: {
            ml: { label: "мл", factor: 0.000001 },
            l: { label: "л", factor: 0.001 },
            m3: { label: "м³", factor: 1 }
        }
    },

    pressure: {
        label: "Тиск",
        base: "Pa",
        units: {
            Pa: { label: "Па", factor: 1 },
            kPa: { label: "кПа", factor: 1000 },
            MPa: { label: "МПа", factor: 1000000 },
            bar: { label: "бар", factor: 100000 },
            atm: { label: "атм", factor: 101325 }
        }
    },

    temperature: {
        label: "Температура",
        units: {
            C: { label: "°C" },
            K: { label: "К" },
            F: { label: "°F" }
        }
    }
};


function fillUnitSelects() {
    const category = unitCategory.value;
    const units = unitData[category].units;

    fromUnit.innerHTML = "";
    toUnit.innerHTML = "";

    Object.entries(units).forEach(([key, unit]) => {
        const optionFrom = document.createElement("option");
        optionFrom.value = key;
        optionFrom.textContent = unit.label;

        const optionTo = document.createElement("option");
        optionTo.value = key;
        optionTo.textContent = unit.label;

        fromUnit.appendChild(optionFrom);
        toUnit.appendChild(optionTo);
    });

    const unitKeys = Object.keys(units);

    if (unitKeys.length > 1) {
        toUnit.value = unitKeys[1];
    }
}


function convertTemperature(value, from, to) {
    let celsius;

    if (from === "C") celsius = value;
    if (from === "K") celsius = value - 273.15;
    if (from === "F") celsius = (value - 32) * 5 / 9;

    if (to === "C") return celsius;
    if (to === "K") return celsius + 273.15;
    if (to === "F") return celsius * 9 / 5 + 32;

    return value;
}


function convertUnits() {
    unitResult.classList.add("d-none");

    const value = Number(unitValue.value);
    const category = unitCategory.value;
    const from = fromUnit.value;
    const to = toUnit.value;

    if (Number.isNaN(value)) {
        unitResult.className = "alert alert-danger mt-3";
        unitResult.textContent = "Введіть коректне числове значення.";
        unitResult.classList.remove("d-none");
        return;
    }

    let result;

    if (category === "temperature") {
        result = convertTemperature(value, from, to);
    } else {
        const fromFactor = unitData[category].units[from].factor;
        const toFactor = unitData[category].units[to].factor;

        result = value * fromFactor / toFactor;
    }

    const fromLabel = unitData[category].units[from].label;
    const toLabel = unitData[category].units[to].label;

    unitResult.className = "alert alert-success mt-3";
    unitResult.textContent = `${value} ${fromLabel} = ${roundResult(result, 6)} ${toLabel}`;
    unitResult.classList.remove("d-none");
}


/* =========================================================
   ОБРОБНИКИ ПОДІЙ
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    sectionButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectSection(button.dataset.section);
        });
    });

    if (formulaSelect) {
        formulaSelect.addEventListener("change", () => {
            if (!formulaSelect.value) {
                selectedFormulaKey = null;
                resetFormulaInfo();
                resetCalculationForm();
                clearResult();
                clearChart();
                return;
            }

            selectFormula(formulaSelect.value);
        });
    }

    if (calculationForm) {
        calculationForm.addEventListener("submit", calculateCurrentFormula);
    }

    if (clearCalculatorBtn) {
        clearCalculatorBtn.addEventListener("click", clearCalculator);
    }

    if (unitCategory) {
        unitCategory.addEventListener("change", fillUnitSelects);
    }

    if (convertUnitBtn) {
        convertUnitBtn.addEventListener("click", convertUnits);
    }

    fillUnitSelects();
});