// Portfolio JavaScript functionality

// DOM elements
const typewriterText = document.getElementById('typewriterText');
const cursor = document.getElementById('cursor');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

// Typewriter animation
const fullText = "Welcome, I'm Bhargava Sarma";
let currentText = '';
let letterIndex = 0;

function typeWriter() {
    if (letterIndex < fullText.length) {
        // Typing forward
        currentText += fullText.charAt(letterIndex);
        typewriterText.textContent = currentText;
        letterIndex++;
        
        // Variable speed for more realistic typing
        const typingSpeed = Math.random() * 100 + 50; // 50-150ms
        setTimeout(typeWriter, typingSpeed);
    } else {
        // Animation complete, keep cursor blinking
        cursor.style.display = 'inline';
    }
}

// Navigation functionality - Fixed
function navigateToSection(sectionId) {
    console.log('Navigating to:', sectionId); // Debug log
    
    // Hide all sections first
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        // Force display and active state
        targetSection.classList.add('active');
        console.log('Section activated:', sectionId); // Debug log
    } else {
        console.error('Section not found:', sectionId);
    }
    
    // Update active nav link
    updateActiveNavLink(sectionId);
}

function updateActiveNavLink(sectionId) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Initialize navigation event listeners - Fixed
function initializeNavigation() {
    console.log('Initializing navigation...'); // Debug log
    
    navLinks.forEach((link, index) => {
        console.log(`Setting up nav link ${index}:`, link.getAttribute('href')); // Debug log
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const href = link.getAttribute('href');
            const sectionId = href.substring(1); // Remove the '#'
            
            console.log('Nav link clicked:', sectionId); // Debug log
            navigateToSection(sectionId);
        });
    });
}

// Space Background Enhancement Functions - Fixed
function createShootingStar() {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star-dynamic';
    
    // Random starting positions
    const startX = Math.random() * window.innerWidth + 200;
    const startY = Math.random() * (window.innerHeight * 0.6);
    const endX = -300;
    const endY = startY + Math.random() * 400 + 200;
    
    // Random size and rotation
    const size = Math.random() * 3 + 2; // Increased size for visibility
    const rotation = Math.random() * 60 - 30; // -30 to 30 degrees
    
    shootingStar.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50%;
        left: ${startX}px;
        top: ${startY}px;
        transform: rotate(${rotation}deg);
        box-shadow: 
            0 0 8px 3px rgba(255, 255, 255, 0.9),
            0 0 15px 6px rgba(0, 255, 255, 0.4),
            -${50 + Math.random() * 50}px 0 ${15 + Math.random() * 20}px rgba(255, 255, 255, 0.5),
            -${100 + Math.random() * 100}px 0 ${20 + Math.random() * 30}px rgba(0, 255, 255, 0.3);
        z-index: 0;
        pointer-events: none;
        opacity: 0;
        transition: all 0.2s ease;
    `;
    
    document.body.appendChild(shootingStar);
    
    // Animate
    requestAnimationFrame(() => {
        shootingStar.style.opacity = '1';
        shootingStar.style.left = endX + 'px';
        shootingStar.style.top = endY + 'px';
        shootingStar.style.transition = `all ${2.5 + Math.random() * 2}s linear`;
    });
    
    // Remove after animation
    setTimeout(() => {
        if (shootingStar.parentNode) {
            shootingStar.parentNode.removeChild(shootingStar);
        }
    }, 6000);
}

function initializeSpaceBackground() {
    console.log('Initializing space background...'); // Debug log
    
    // Ensure space background elements are visible
    const spaceBackground = document.querySelector('.space-background');
    if (spaceBackground) {
        spaceBackground.style.display = 'block';
        console.log('Space background container found and displayed');
    }
    
    // Create more frequent shooting stars
    const createRandomShootingStar = () => {
        createShootingStar();
        setTimeout(createRandomShootingStar, 1500 + Math.random() * 3000); // 1.5-4.5 seconds interval
    };
    
    // Start immediately and create multiple initial stars
    for (let i = 0; i < 3; i++) {
        setTimeout(() => createShootingStar(), i * 1000);
    }
    
    setTimeout(createRandomShootingStar, 2000);
    
    // Enhanced CSS shooting stars
    const style = document.createElement('style');
    style.textContent = `
        .shooting-star-dynamic {
            position: fixed !important;
            background: white !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            z-index: 0 !important;
        }
        
        @keyframes shootingStar3 {
            0% {
                transform: translateX(80vw) translateY(20vh) rotate(-25deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
                box-shadow: 
                    0 0 8px 3px rgba(255, 255, 255, 0.9),
                    0 0 15px 6px rgba(0, 255, 255, 0.4),
                    -120px 0 25px rgba(255, 255, 255, 0.5),
                    -240px 0 35px rgba(0, 255, 255, 0.3);
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateX(-30vw) translateY(60vh) rotate(-25deg);
                opacity: 0;
            }
        }
        
        @keyframes shootingStar4 {
            0% {
                transform: translateX(110vw) translateY(40vh) rotate(-35deg);
                opacity: 0;
            }
            15% {
                opacity: 1;
                box-shadow: 
                    0 0 6px 2px rgba(255, 255, 255, 0.8),
                    0 0 12px 5px rgba(0, 255, 255, 0.3),
                    -100px 0 20px rgba(255, 255, 255, 0.4),
                    -200px 0 30px rgba(0, 255, 255, 0.2);
            }
            85% {
                opacity: 1;
            }
            100% {
                transform: translateX(-50vw) translateY(80vh) rotate(-35deg);
                opacity: 0;
            }
        }
        
        .shooting-stars::before {
            animation: shootingStar3 4s linear infinite 1s;
        }
        
        .shooting-stars::after {
            animation: shootingStar4 3s linear infinite 3s;
        }
    `;
    document.head.appendChild(style);
}

// Enhanced sparkle effects for header - Fixed
function initializeAdvancedSparkles() {
    const sparklesContainer = document.querySelector('.sparkles');
    if (!sparklesContainer) {
        console.log('Sparkles container not found');
        return;
    }
    
    console.log('Initializing sparkles...'); // Debug log
    
    // Add more dynamic sparkles
    setInterval(() => {
        if (Math.random() < 0.6) { // 60% chance - increased
            const dynamicSparkle = document.createElement('span');
            dynamicSparkle.className = 'sparkle dynamic-sparkle';
            
            const sparkleChars = ['✦', '✧', '★', '☆', '✨', '⭐'];
            dynamicSparkle.textContent = sparkleChars[Math.floor(Math.random() * sparkleChars.length)];
            
            // Random position around the text
            const parentRect = sparklesContainer.parentElement.getBoundingClientRect();
            dynamicSparkle.style.cssText = `
                position: absolute;
                color: #00FFFF;
                font-size: ${8 + Math.random() * 8}px;
                opacity: 0;
                top: ${-10 + Math.random() * (parentRect.height + 20)}px;
                left: ${-15 + Math.random() * (parentRect.width + 30)}px;
                animation: sparkleAnimation ${1.5 + Math.random()}s ease-in-out forwards;
                z-index: 10;
                pointer-events: none;
                text-shadow: 0 0 6px #00FFFF;
            `;
            
            sparklesContainer.appendChild(dynamicSparkle);
            
            // Remove after animation
            setTimeout(() => {
                if (dynamicSparkle.parentNode) {
                    dynamicSparkle.parentNode.removeChild(dynamicSparkle);
                }
            }, 3000);
        }
    }, 1200); // More frequent
}

// Add floating animation to project cards
function initializeProjectCardAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    const achievementCards = document.querySelectorAll('.achievement-card');
    
    [...projectCards, ...achievementCards].forEach((card, index) => {
        // Add mouse move effect for 3D tilt
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
            
            // Add subtle shooting star effect on hover
            if (Math.random() < 0.15) { // 15% chance
                createMiniShootingStar(rect.left + x, rect.top + y);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
}

function createMiniShootingStar(x, y) {
    const miniStar = document.createElement('div');
    miniStar.style.cssText = `
        position: fixed;
        width: 2px;
        height: 2px;
        background: #00FFFF;
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        box-shadow: 0 0 6px 2px rgba(0, 255, 255, 0.8);
        z-index: 1000;
        pointer-events: none;
        opacity: 1;
        transition: all 1s linear;
    `;
    
    document.body.appendChild(miniStar);
    
    requestAnimationFrame(() => {
        miniStar.style.left = (x - 60) + 'px';
        miniStar.style.top = (y + 40) + 'px';
        miniStar.style.opacity = '0';
    });
    
    setTimeout(() => {
        if (miniStar.parentNode) {
            miniStar.parentNode.removeChild(miniStar);
        }
    }, 1200);
}

// Add glow effect to buttons on hover
function initializeButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('btn-primary')) {
                button.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('btn-primary')) {
                button.style.boxShadow = 'none';
            }
        });
    });
}

// Initialize glitch effect for name
function initializeGlitchEffect() {
    const glitchText = document.querySelector('.typewriter-text');
    
    if (glitchText) {
        setInterval(() => {
            if (Math.random() < 0.05) { // 5% chance
                const originalShadow = glitchText.style.textShadow;
                glitchText.style.textShadow = `
                    2px 0 #ff0000,
                    -2px 0 #00ff00,
                    0 2px #0000ff
                `;
                
                setTimeout(() => {
                    glitchText.style.textShadow = '0 0 20px rgba(0, 255, 255, 0.8)';
                }, 100);
            }
        }, 3000);
    }
}

// Add subtle matrix rain effect
function createMatrixRain() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        opacity: 0.03;
        pointer-events: none;
    `;
    
    document.body.appendChild(canvas);
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const chars = '01';
    const charArray = chars.split('');
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00FFFF';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const text = charArray[Math.floor(Math.random() * charArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 150);
}

// Initialize intersection observer for animations
function initializeIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                
                // Trigger shooting star on card appearance
                if (Math.random() < 0.4) {
                    setTimeout(() => createShootingStar(), Math.random() * 1000);
                }
            }
        });
    }, observerOptions);
    
    // Observe animated elements
    const animatedElements = document.querySelectorAll('.project-card, .achievement-card, .resume-item');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Mobile responsive handling
function handleMobileNavigation() {
    if (window.innerWidth <= 768) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    // Hide menu after clicking on mobile
                    navMenu.style.display = 'none';
                }
            });
        }
    }
}

// Global functions for button clicks
window.navigateToSection = navigateToSection;

// Initialize certificate links
function initializeCertificateLinks() {
    // The links are already in the HTML as anchor tags with target="_blank"
    const certificateLinks = document.querySelectorAll('a[href*="coursera.org"]');
    console.log(`Found ${certificateLinks.length} certificate links`); // Debug log
    
    certificateLinks.forEach((link, index) => {
        console.log(`Certificate link ${index}:`, link.href); // Debug log
        link.addEventListener('click', (e) => {
            // Let the default behavior handle the link opening
            // The target="_blank" is already set in the HTML
            console.log('Certificate link clicked:', link.href);
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...'); // Debug log
    
    // Show home section immediately
    navigateToSection('home');
    
    // Start typewriter animation after a short delay
    setTimeout(() => {
        typeWriter();
    }, 500);
    
    // Initialize all functionality
    initializeNavigation();
    initializeProjectCardAnimations();
    initializeButtonEffects();
    initializeIntersectionObserver();
    initializeGlitchEffect();
    handleMobileNavigation();
    initializeCertificateLinks();
    
    // Initialize space theme immediately
    initializeSpaceBackground();
    initializeAdvancedSparkles();
    
    // Add matrix background effect after page loads
    setTimeout(() => {
        createMatrixRain();
    }, 1000);
    
    // Fix social media links
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                window.open(href, '_blank');
            }
        });
    });
    
    console.log('All initialization complete'); // Debug log
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const currentActiveSection = document.querySelector('.section.active');
    if (!currentActiveSection) return;
    
    const currentIndex = Array.from(sections).indexOf(currentActiveSection);
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % sections.length;
        const nextSection = sections[nextIndex];
        navigateToSection(nextSection.id);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
        const prevSection = sections[prevIndex];
        navigateToSection(prevSection.id);
    }
    
    // Space key for shooting stars
    if (e.key === ' ') {
        e.preventDefault();
        createShootingStar();
    }
});

// Add smooth transitions and enhanced styles
const style = document.createElement('style');
style.textContent = `
    /* Enhanced space effects */
    .shooting-star-dynamic {
        position: fixed !important;
        background: white !important;
        border-radius: 50% !important;
        pointer-events: none !important;
        z-index: 0 !important;
    }
    
    /* Enhanced sparkle animations */
    .dynamic-sparkle {
        animation: dynamicSparkle 2s ease-out forwards !important;
    }
    
    @keyframes dynamicSparkle {
        0% {
            opacity: 0;
            transform: scale(0.3) rotate(0deg);
        }
        50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
            text-shadow: 0 0 15px #00FFFF;
        }
        100% {
            opacity: 0;
            transform: scale(0.5) rotate(360deg);
        }
    }
    
    /* Ensure sections display properly */
    .section {
        transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
    }
    
    .section.active {
        display: flex !important;
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .section:not(.active) {
        display: none !important;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fade-in-up {
        animation: fadeInUp 0.6s ease-out;
    }
`;
document.head.appendChild(style);

// Utility functions
const utils = {
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export for external use
window.portfolioUtils = utils;
