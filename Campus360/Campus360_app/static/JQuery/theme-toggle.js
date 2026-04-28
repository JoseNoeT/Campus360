(function () {
    var STORAGE_KEY = 'campus360-theme';
    var root = document.documentElement;

    function getStoredTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function getPreferredTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function getActiveTheme() {
        return root.getAttribute('data-theme') || getStoredTheme() || getPreferredTheme();
    }

    function iconForTheme(theme) {
        return theme === 'dark' ? '🌙' : '☀️';
    }

    function labelForTheme(theme) {
        return theme === 'dark'
            ? 'Cambiar a modo claro'
            : 'Cambiar a modo oscuro';
    }

    function stateTextForTheme(theme) {
        return theme === 'dark' ? 'Oscuro' : 'Claro';
    }

    function applyTheme(theme) {
        var normalized = theme === 'dark' ? 'dark' : 'light';
        root.setAttribute('data-theme', normalized);
        if (document.body) {
            document.body.setAttribute('data-theme', normalized);
        }
        localStorage.setItem(STORAGE_KEY, normalized);

        var icon = document.getElementById('theme-icon');
        var button = document.getElementById('theme-toggle');
        var text = document.getElementById('theme-label');

        if (icon) {
            icon.textContent = iconForTheme(normalized);
        }

        if (button) {
            button.setAttribute('aria-label', labelForTheme(normalized));
            button.setAttribute('title', labelForTheme(normalized));
            button.setAttribute('aria-pressed', normalized === 'dark' ? 'true' : 'false');
        }

        if (text) {
            text.textContent = stateTextForTheme(normalized);
        }
    }

    function toggleTheme() {
        var current = getActiveTheme();
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Sync button/icon with the theme set by anti-flash inline script.
        applyTheme(getActiveTheme());

        var toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', toggleTheme);
    });
})();
