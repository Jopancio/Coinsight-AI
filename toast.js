/**
 * toast.js — Global toast notification system
 * Usage: showToast('message', 'success' | 'error' | 'warning' | 'info', durationMs)
 * Include this before any script that needs notifications.
 */

(function () {
    var container = null;

    function getContainer() {
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    var icons = {
        success: 'fa-solid fa-circle-check',
        error:   'fa-solid fa-circle-xmark',
        warning: 'fa-solid fa-triangle-exclamation',
        info:    'fa-solid fa-circle-info'
    };

    var titles = {
        success: 'Berhasil',
        error:   'Gagal',
        warning: 'Perhatian',
        info:    'Info'
    };

    window.showToast = function (message, type, duration) {
        type = type || 'info';
        duration = duration || 4000;

        var c = getContainer();

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<div class="toast-icon"><i class="' + icons[type] + '"></i></div>' +
            '<div class="toast-body">' +
                '<div class="toast-title">' + titles[type] + '</div>' +
                '<div class="toast-message">' + message + '</div>' +
            '</div>' +
            '<button class="toast-close" onclick="this.closest(\'.toast\')._dismiss()"><i class="fa-solid fa-xmark"></i></button>' +
            '<div class="toast-progress" style="animation-duration:' + duration + 'ms;"></div>';

        function dismiss() {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, { once: true });
        }

        toast._dismiss = dismiss;
        toast.addEventListener('click', dismiss);

        c.appendChild(toast);

        // Trigger show animation on next frame
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                toast.classList.add('show');
            });
        });

        setTimeout(dismiss, duration);
    };
})();
