// Підсвічування активного пункту меню
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
    let current = "";
    const isBottom = (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2;

    if (isBottom) {
        current = sections[sections.length - 1].getAttribute("id");
    } else {
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute("id");
            }
        });
    }

    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
});

// Висувне меню для мобільних
const navbarToggler = document.querySelector(".navbar-toggler");
const navbarCollapse = document.querySelector(".navbar-collapse");

navbarToggler.addEventListener("click", () => {
    navbarCollapse.classList.toggle("show");
});