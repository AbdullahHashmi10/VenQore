<?php

/**
 * Staff presets. The ONE source is resources/js/Data/staff_presets.json (the Users
 * screen imports it directly); this file only exposes it as config so PHP never
 * keeps a second hand-edited copy that drifts.
 */

return json_decode((string) file_get_contents(base_path('resources/js/Data/staff_presets.json')), true) ?: [];
