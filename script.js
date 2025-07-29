// Enhanced Particle effect
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `rgba(108, 99, 255, ${Math.random() * 0.5})`;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = Math.random() * 0.2 - 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.spin;
        if (this.size > 0.2) this.size -= 0.1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Initialize particles with enhanced effects
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.classList.add('particles');
document.body.appendChild(canvas);

let particles = [];
let mouseX = 0;
let mouseY = 0;
let isHovering = false;

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
}

function createParticles(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
        
        if (particles[i].size <= 0.2) {
            particles.splice(i, 1);
            i--;
        }
    }
    
    requestAnimationFrame(animateParticles);
}

// Enhanced Magnetic hover effect
function initMagneticEffect() {
    const magneticElements = document.querySelectorAll('.magnetic, .logo-header, .dia-header, .logo-large, .dia-large, .dia-welcome, .logo-carousel-item, .dia-carousel-item, .mylogo-carousel-item, .mylogo-dia-group');
    
    magneticElements.forEach(element => {
        // Check if the element is one of the carousel logo items or their container
        const isCarouselLogo = element.classList.contains('logo-carousel-item') ||
                               element.classList.contains('dia-carousel-item') ||
                               element.classList.contains('mylogo-carousel-item') ||
                               element.classList.contains('mylogo-dia-group');

        element.addEventListener('mousemove', (e) => {
            if (!isCarouselLogo) {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                // Store the x and y values as CSS variables
                element.style.setProperty('--x', `${x * 0.3}px`);
                element.style.setProperty('--y', `${y * 0.3}px`);
                
                // Apply the transform with translation
                element.style.transform = `scale(1.05) translate(${x * 0.3}px, ${y * 0.3}px)`;
            } else {
                // Apply only scale transform for carousel logos
                element.style.transform = 'scale(1.05)';
                // Remove any stored CSS variables for position if they exist
                element.style.removeProperty('--x');
                element.style.removeProperty('--y');
            }
            
            createParticles(e.clientX, e.clientY, 1);
        });
        
        element.addEventListener('mouseleave', () => {
            // Reset transform for all magnetic elements
            element.style.transform = 'scale(1)';
            // Also remove CSS variables on mouseleave for consistency
            element.style.removeProperty('--x');
            element.style.removeProperty('--y');
        });
    });
}

// Enhanced Smooth scroll with parallax
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add parallax effect to sections
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('.parallax').forEach(element => {
            const speed = element.dataset.speed || 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Enhanced Fade in elements with stagger effect
function initFadeIn() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1
    });
    
    fadeElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(element);
    });
}

// Enhanced Mouse trail effect with color change
function initMouseTrail() {
    let trailTimeout;
    
    document.addEventListener('mousemove', (e) => {
        clearTimeout(trailTimeout);
        createParticles(e.clientX, e.clientY, 2);
        
        trailTimeout = setTimeout(() => {
            isHovering = false;
        }, 100);
    });
}

// Text animation effect
function initTextAnimation() {
    const textElements = document.querySelectorAll('h1, h2, h3');
    
    textElements.forEach(element => {
        const text = element.textContent;
        element.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            span.style.animationDelay = `${i * 0.1}s`;
            span.classList.add('text-float');
            element.appendChild(span);
        }
    });
}

// Initialize all features
window.addEventListener('load', () => {
    initParticles();
    animateParticles();
    initMagneticEffect();
    initSmoothScroll();
    initFadeIn();
    initMouseTrail();
    initTextAnimation();
});

// Handle window resize with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initParticles();
    }, 250);
});

// Image Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const scrollRight = document.getElementById('scrollRight');
    const scrollLeft = document.getElementById('scrollLeft');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;

    // Set initial position
    track.style.transform = `translateX(0%)`;

    function updateCarousel() {
        track.style.transition = 'transform 0.5s ease-in-out';
        const offset = -currentIndex * 100;
        track.style.transform = `translateX(${offset}%)`;
    }

    scrollRight.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    });

    scrollLeft.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    });

    // Auto-advance carousel every 5 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }, 5000);
});

// Fullscreen map logic
(function() {
  const btn = document.getElementById('fullscreen-map-btn');
  const mapSection = document.querySelector('.map-section');
  if (!btn || !mapSection) return;

  function enterFullscreen() {
    document.body.classList.add('fullscreen-map-active');
    if (mapSection.requestFullscreen) {
      mapSection.requestFullscreen();
    } else if (mapSection.webkitRequestFullscreen) {
      mapSection.webkitRequestFullscreen();
    } else if (mapSection.msRequestFullscreen) {
      mapSection.msRequestFullscreen();
    }
    btn.textContent = '⤫';
    btn.title = 'Exit Fullscreen';
  }

  function exitFullscreen() {
    document.body.classList.remove('fullscreen-map-active');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    } else if (document.msFullscreenElement) {
      document.msExitFullscreen();
    }
    btn.textContent = '⛶';
    btn.title = 'Fullscreen Map';
  }

  btn.addEventListener('click', function() {
    if (!document.body.classList.contains('fullscreen-map-active')) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
      exitFullscreen();
    }
  });
})();

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.main-header');
    const mapSection = document.querySelector('.map-section');
    if (!header || !mapSection) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                header.classList.add('header-hidden');
            } else {
                header.classList.remove('header-hidden');
            }
        },
        {
            root: null,
            threshold: 0.2 // Adjust as needed
        }
    );
    observer.observe(mapSection);
});