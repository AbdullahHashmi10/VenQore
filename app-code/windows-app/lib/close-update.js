'use strict';

// Called only after an authorized normal close/restart, never on download or OS shutdown.
function finishClose({ updater, state, portable, restart, quit, relaunch, onError }) {
    if (!portable && updater && state === 'ready') {
        try {
            updater.quitAndInstall(true, !!restart);
            // electron-updater can report launch failure by event without throwing.
            // Always finish the requested close rather than leave a stopped till open.
            quit();
            return 'installing';
        } catch (error) { onError(error); }
    }
    if (restart) relaunch();
    quit();
    return 'closed';
}
module.exports = { finishClose };
