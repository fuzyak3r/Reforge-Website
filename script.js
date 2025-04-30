document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video-background');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (video) {
        function checkVideoReady() {
            if (video.readyState >= 3) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            } else {
                setTimeout(checkVideoReady, 100);
            }
        }

        checkVideoReady();

        video.addEventListener('canplay', () => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        });
        
        setTimeout(() => {
            if (loadingOverlay.style.display !== 'none') {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
                
                video.style.display = 'none';
                document.querySelector('.hero').style.background = 'linear-gradient(rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.9)), url("images/background.jpg") no-repeat center center';
                document.querySelector('.hero').style.backgroundSize = 'cover';
            }
        }, 10000);
        
        function ensureVideoPlaying() {
            if (video.paused) {
                video.play().catch(err => {
                    console.log('Ошибка воспроизведения видео:', err);
                    setTimeout(ensureVideoPlaying, 1000);
                });
            }
        }

        video.addEventListener('loadedmetadata', ensureVideoPlaying);
        video.addEventListener('error', (e) => {
            console.error('Ошибка загрузки видео:', e);
            video.style.display = 'none';
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
            document.querySelector('.hero').style.background = 'linear-gradient(rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.9)), url("images/background.jpg") no-repeat center center';
            document.querySelector('.hero').style.backgroundSize = 'cover';
        });
    }
    
    setupFadeInAnimation();
    
    setupMobileMenu();
});

function setupFadeInAnimation() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => {
        observer.observe(element);
    });
}

function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.position = 'absolute';
                navLinks.style.flexDirection = 'column';
                navLinks.style.top = '70px';
                navLinks.style.right = '20px';
                navLinks.style.backgroundColor = 'rgba(18, 18, 18, 0.95)';
                navLinks.style.padding = '20px';
                navLinks.style.borderRadius = '12px';
                navLinks.style.backdropFilter = 'blur(10px)';
                navLinks.style.border = '1px solid rgba(209, 212, 255, 0.1)';
                navLinks.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                
                const navItems = navLinks.querySelectorAll('li');
                navItems.forEach(item => {
                    item.style.margin = '12px 0';
                });
            }
        });
    }
}