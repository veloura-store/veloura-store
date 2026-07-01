document.addEventListener('DOMContentLoaded', () => {
  // Sticky Header Effect
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Check initial scroll position
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    }
  }

  // Mobile Menu Toggle (Placeholder logic)
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const desktopNav = document.querySelector('.desktop-nav');

  if (mobileMenuBtn && desktopNav) {
    mobileMenuBtn.addEventListener('click', () => {
      // For a real app, we'd toggle a side drawer here.
      // We will do a basic alert or simple toggle for demonstration.
      if(desktopNav.style.display === 'flex') {
        desktopNav.style.display = 'none';
      } else {
        desktopNav.style.display = 'flex';
        desktopNav.style.flexDirection = 'column';
        desktopNav.style.position = 'absolute';
        desktopNav.style.top = '100%';
        desktopNav.style.left = '0';
        desktopNav.style.right = '0';
        desktopNav.style.backgroundColor = 'var(--bg-primary)';
        desktopNav.style.padding = '1rem';
        desktopNav.style.borderBottom = '1px solid var(--border-color)';
        desktopNav.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
      }
    });
  }

  // Animation on Scroll
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('slide-up');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    animatedElements.forEach(el => observer.observe(el));
  }
});
