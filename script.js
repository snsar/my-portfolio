// Check for dark mode preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
});

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});

// Particles.js initialization
document.addEventListener('DOMContentLoaded', function () {
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 230,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#d4af37'
            },
            shape: {
                type: 'circle',
                stroke: {
                    width: 0,
                    color: '#000000'
                },
            },
            opacity: {
                value: 0.3,
                random: false,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#d4af37',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200
                }
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 0.5
                    }
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });
});

// GSAP Animations
document.addEventListener('DOMContentLoaded', function () {
    // Hero animations
    gsap.to('#hero-title', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2
    });

    gsap.to('#hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.4
    });

    gsap.to('#hero-text', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.6
    });

    gsap.to('#hero-cta', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.8
    });

    gsap.to('#hero-socials', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1
    });

    // Scroll triggered animations
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('[data-gsap="reveal"]').forEach(elem => {
        gsap.from(elem, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
                trigger: elem,
                start: "top 80%",
                toggleActions: "play none none none"
            }
        });
    });

    // Skill bars animation
    ScrollTrigger.create({
        trigger: '#skills',
        start: "top 80%",
        onEnter: () => {
            document.querySelectorAll('.skill-fill').forEach(fill => {
                const width = fill.getAttribute('data-width');
                fill.style.width = `${width}%`;
            });
        }
    });
});

// Navigation dots
const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');

function setActiveNavItem() {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        item.querySelector('.nav-dot').classList.remove('active');

        if (item.getAttribute('data-target') === current) {
            item.classList.add('active');
            item.querySelector('.nav-dot').classList.add('active');
        }
    });
}

window.addEventListener('scroll', setActiveNavItem);
window.addEventListener('load', setActiveNavItem);

navItems.forEach(item => {
    item.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Project modal functionality
const projectButtons = document.querySelectorAll('.project-view');
const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.modal-close');

projectButtons.forEach(button => {
    button.addEventListener('click', () => {
        const projectId = button.getAttribute('data-project');
        const modal = document.getElementById(`project-modal-${projectId}`);

        if (modal) {
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');

        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
});

// Close modal when clicking outside
modals.forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
});
