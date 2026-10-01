// Both the layout designer and device settings edit these same preferences.
// Keep their save allowlists identical so preview-only values cannot be lost.
export const printerSettingsFields = [
    'default_print_type', 'thermal_page_size', 'thermal_custom_chars',
    'thermal_use_bold', 'thermal_auto_cut', 'thermal_open_drawer',
    'thermal_extra_lines', 'thermal_copies', 'thermal_font_size',
    'thermal_show_headers', 'thermal_show_sno', 'thermal_show_units',
    'thermal_show_mrp', 'thermal_show_description', 'thermal_show_batch',
    'thermal_show_expiry', 'thermal_show_mfg_date', 'thermal_show_size',
    'thermal_show_model', 'thermal_show_serial', 'thermal_show_barcode',
    'thermal_custom_footer',
];
