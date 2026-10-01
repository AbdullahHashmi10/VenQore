// LaserFlow disabled
(function () {
    'use strict';
    function cleanup() {
        var el = document.querySelector('.laser-flow-container');
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanup);
    } else {
        cleanup();
    }
})();
