<?php
$content = file_get_contents('routes/web.php');
// Replace ->name('admin.X') with ->name('legacy.admin.X') inside the /admin-panel block.
// To be safe, I'll match exactly the lines in that section for DataManagement etc.

$content = str_replace("name('admin.data')", "name('legacy.admin.data')", $content);
$content = str_replace("name('admin.data.export')", "name('legacy.admin.data.export')", $content);
$content = str_replace("name('admin.data.import')", "name('legacy.admin.data.import')", $content);
$content = str_replace("name('admin.data.upload-mapping')", "name('legacy.admin.data.upload-mapping')", $content);
$content = str_replace("name('admin.data.process-import')", "name('legacy.admin.data.process-import')", $content);
$content = str_replace("name('admin.data.validate-import')", "name('legacy.admin.data.validate-import')", $content);
$content = str_replace("name('admin.data.template')", "name('legacy.admin.data.template')", $content);
$content = str_replace("name('admin.dashboard')", "name('legacy.admin.dashboard')", $content);
$content = str_replace("name('admin.migration.index')", "name('legacy.admin.migration.index')", $content);
$content = str_replace("name('admin.migration.analyze')", "name('legacy.admin.migration.analyze')", $content);
$content = str_replace("name('admin.migration.execute')", "name('legacy.admin.migration.execute')", $content);
$content = str_replace("name('admin.users')", "name('legacy.admin.users')", $content);
$content = str_replace("name('admin.users.store')", "name('legacy.admin.users.store')", $content);
$content = str_replace("name('admin.users.update')", "name('legacy.admin.users.update')", $content);
$content = str_replace("name('admin.users.destroy')", "name('legacy.admin.users.destroy')", $content);
$content = str_replace("name('admin.settings')", "name('legacy.admin.settings')", $content);
$content = str_replace("name('admin.settings.update')", "name('legacy.admin.settings.update')", $content);
$content = str_replace("name('admin.logs')", "name('legacy.admin.logs')", $content);
$content = str_replace("name('admin.database')", "name('legacy.admin.database')", $content);
$content = str_replace("name('admin.staff')", "name('legacy.admin.staff')", $content);

file_put_contents('routes/web.php', $content);
