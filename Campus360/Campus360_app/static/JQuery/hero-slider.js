(function () {
    const slides = Array.from(document.querySelectorAll('.hero__slide'));
    const dots = Array.from(document.querySelectorAll('.hero__dot'));
    const prevBtn = document.querySelector('.hero__arrow--prev');
    const nextBtn = document.querySelector('.hero__arrow--next');

    if (!slides.length) return;

    let current = 0;
    let timer = null;
    const INTERVAL_MS = 5000;

    function render(index) {
        current = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
            slide.classList.toggle('hero__slide--active', i === current);
            slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('hero__dot--active', i === current);
            dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
            dot.tabIndex = i === current ? 0 : -1;
        });
    }

    function next() {
        render(current + 1);
    }

    function prev() {
        render(current - 1);
    }

    function stopAutoPlay() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function startAutoPlay() {
        stopAutoPlay();
        timer = setInterval(next, INTERVAL_MS);
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', function () {
            render(i);
            startAutoPlay();
        });
    });

    prevBtn && prevBtn.addEventListener('click', function () {
        prev();
        startAutoPlay();
    });

    nextBtn && nextBtn.addEventListener('click', function () {
        next();
        startAutoPlay();
    });

    const hero = document.querySelector('.hero');
    hero && hero.addEventListener('mouseenter', stopAutoPlay);
    hero && hero.addEventListener('mouseleave', startAutoPlay);

    render(0);
    startAutoPlay();
})();
