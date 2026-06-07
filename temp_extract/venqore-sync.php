<?php
/**
 * Plugin Name:       VenQore Sync
 * Plugin URI:        https://venqore.com
 * Description:       Automated bidirectional real-time sync between WooCommerce and VenQore POS. Instantly synchronizes products, live inventory, and multi-tier pricing.
 * Version:           1.0.0
 * Author:            VenQore
 * Author URI:        https://venqore.com
 * Text Domain:       venqore-sync
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * WC requires at least: 6.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('VENQORE_SYNC_VERSION', '1.0.0');
define('VENQORE_SYNC_PLUGIN_FILE', __FILE__);
define('VENQORE_SYNC_PLUGIN_DIR', plugin_dir_path(__FILE__));

// ─── Logging Telemetry Helper ──────────────────────────────────────────────────
function venqore_sync_log($message) {
    $logs = get_option('venqore_sync_debug_logs', []);
    if (!is_array($logs)) {
        $logs = [];
    }
    if (count($logs) >= 50) {
        array_shift($logs);
    }
    $logs[] = [
        'time' => current_time('mysql'),
        'msg'  => $message,
    ];
    update_option('venqore_sync_debug_logs', $logs);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

add_action('plugins_loaded', 'venqore_sync_init');

function venqore_sync_init() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function () {
            echo '<div class="notice notice-error"><p><strong>VenQore Sync</strong> requires WooCommerce to be installed and active.</p></div>';
        });
        return;
    }

    // Admin settings page
    add_action('admin_menu',        'venqore_sync_admin_menu');
    add_action('admin_init',        'venqore_sync_register_settings');
    add_action('admin_enqueue_scripts', 'venqore_sync_admin_styles');

    // Product meta box (shows sync status)
    add_action('add_meta_boxes',    'venqore_sync_add_meta_box');
    add_action('wp_ajax_venqore_push_product', 'venqore_sync_ajax_push_product');

    // Custom product columns in WP admin
    add_filter('manage_edit-product_columns',        'venqore_sync_add_product_column', 20);
    add_action('manage_product_posts_custom_column', 'venqore_sync_render_product_column', 20, 2);

    // Update status to 'staged' on local edits
    add_action('woocommerce_update_product', 'venqore_sync_on_product_updated', 10, 1);

    // On settings save: verify connection + register webhooks (legacy fallback)
    add_action('update_option_venqore_api_token', 'venqore_sync_on_token_saved', 10, 2);

    // Zero-config Handshake check on admin_init
    add_action('admin_init', 'venqore_sync_check_handshake');

    // Handle Disconnect action
    add_action('admin_post_venqore_disconnect', 'venqore_sync_handle_disconnect');
}

// ─── Zero-config Handshake Hook ───────────────────────────────────────────────

function venqore_sync_check_handshake() {
    if (get_option('venqore_sync_connected')) {
        return;
    }

    // Skip handshake check on AJAX, XML-RPC, or WP-CLI
    if (defined('DOING_AJAX') || defined('DOING_XMLRPC') || defined('WP_CLI')) {
        return;
    }

    // Skip handshake check during plugin updates or activation requests to prevent activation failures
    if (isset($_GET['action']) && in_array($_GET['action'], ['activate', 'deactivate', 'upgrade-plugin'])) {
        return;
    }

    global $pagenow;
    if ($pagenow === 'plugins.php' || $pagenow === 'update.php') {
        return;
    }

    $config_path = plugin_dir_path(__FILE__) . 'venqore-config.php';
    if (!file_exists($config_path)) {
        return;
    }

    include_once $config_path;

    if (!defined('VENQORE_SETUP_TOKEN') || !defined('VENQORE_API_URL')) {
        return;
    }

    // Throttle handshake attempts to once every 60 seconds to prevent freezing the admin panel
    $last_attempt = (int) get_option('venqore_last_handshake_attempt', 0);
    if (time() - $last_attempt < 60) {
        return;
    }
    update_option('venqore_last_handshake_attempt', time());

    // Check if we are already attempting a handshake in this request to prevent loops
    if (defined('VENQORE_SYNC_HANDSHAKING')) {
        return;
    }
    define('VENQORE_SYNC_HANDSHAKING', true);

    venqore_sync_perform_handshake();
}

function venqore_sync_perform_handshake() {
    global $wpdb;

    venqore_sync_log("Initiating server-to-server handshake connection...");

    $setup_token = VENQORE_SETUP_TOKEN;
    $api_url     = VENQORE_API_URL;

    // Generate WC API keys programmatically
    $user_id = get_current_user_id() ?: 1;

    $consumer_key    = 'ck_' . wc_rand_hash();
    $consumer_secret = 'cs_' . wc_rand_hash();

    venqore_sync_log("Generating new WooCommerce REST API Consumer Key and Secret for user ID {$user_id}...");

    $inserted = $wpdb->insert(
        $wpdb->prefix . 'woocommerce_api_keys',
        array(
            'user_id'         => $user_id,
            'description'     => 'VenQore Sync (' . get_bloginfo('name') . ')',
            'permissions'     => 'read_write',
            'consumer_key'    => hash('sha256', $consumer_key),
            'consumer_secret' => $consumer_secret,
            'truncated_key'   => substr($consumer_key, -7),
        ),
        array('%d', '%s', '%s', '%s', '%s', '%s')
    );

    if ($inserted === false) {
        $db_err = $wpdb->last_error;
        venqore_sync_log("ERROR: Database insertion of WooCommerce API keys failed. DB Error: " . $db_err);
        update_option('venqore_handshake_error', "Database error inserting WooCommerce API keys: " . $db_err);
        return; // DB error
    }

    venqore_sync_log("WooCommerce API keys successfully registered in database.");

    // Call VenQore Handshake endpoint
    $handshake_url = trailingslashit($api_url) . 'api/woo/handshake';
    $site_url      = get_site_url();

    venqore_sync_log("Sending handshake request to POS server at: {$handshake_url}");
    venqore_sync_log("Payload data: Site URL: {$site_url}, Consumer Key: " . substr($consumer_key, 0, 7) . "...xxxx");

    $response = wp_remote_post($handshake_url, [
        'timeout'   => 15,
        'sslverify' => false,
        'headers'   => [
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ],
        'body'      => wp_json_encode([
            'setup_token'     => $setup_token,
            'site_url'        => $site_url,
            'consumer_key'    => $consumer_key,
            'consumer_secret' => $consumer_secret,
        ]),
    ]);

    if (is_wp_error($response)) {
        $err_msg = $response->get_error_message();
        venqore_sync_log("ERROR: Outbound HTTP post request to POS failed: {$err_msg}");
        update_option('venqore_handshake_error', 'WordPress HTTP Request Failed: ' . $err_msg);
        error_log('[VenQore Sync] Handshake HTTP request failed: ' . $err_msg);
        return; // network error, will retry on next page view
    }

    $code = wp_remote_retrieve_response_code($response);
    $body_text = wp_remote_retrieve_body($response);
    venqore_sync_log("POS Server Response received. HTTP Status Code: {$code}");

    if ($code !== 200) {
        $err_msg = "VenQore Cloud API returned HTTP status code {$code}.";
        if (!empty($body_text)) {
            $parsed = json_decode($body_text, true);
            if (isset($parsed['message'])) {
                $err_msg .= ' Message: ' . $parsed['message'];
            } else {
                $err_msg .= ' Raw Response: ' . substr($body_text, 0, 150);
            }
        }
        venqore_sync_log("ERROR: Handshake rejected by POS: {$err_msg}");
        update_option('venqore_handshake_error', $err_msg);
        error_log("[VenQore Sync] Handshake API error: {$err_msg}");
        return; // API error, will retry
    }

    $body = json_decode($body_text, true);
    if (empty($body) || empty($body['webhook_url']) || empty($body['webhook_secret'])) {
        venqore_sync_log("ERROR: POS returned invalid body format: " . substr($body_text, 0, 150));
        update_option('venqore_handshake_error', 'Invalid API response format.');
        error_log('[VenQore Sync] Handshake invalid response body: ' . $body_text);
        return; // invalid response, will retry
    }

    venqore_sync_log("Handshake response validated. Registered Webhook URL: " . $body['webhook_url']);

    // Success - clear error option
    delete_option('venqore_handshake_error');

    // Store connection credentials & settings in options
    update_option('venqore_site_url', $api_url);
    update_option('venqore_api_token', $body['api_token'] ?? '');
    update_option('venqore_sync_connected', true);
    update_option('venqore_sync_info', [
        'store_name'   => $body['store_name'] ?? 'VenQore Store',
        'connected_at' => current_time('mysql'),
        'webhook_url'  => $body['webhook_url'],
    ]);

    venqore_sync_log("Successfully saved connection options in WordPress database.");

    // Register Webhooks
    venqore_sync_log("Registering active WooCommerce webhooks for products...");
    venqore_sync_register_webhooks($body['webhook_url']);
    venqore_sync_log("Handshake fully completed! Integration is online and active.");
}

// ─── Disconnect Action Hook ───────────────────────────────────────────────────

function venqore_sync_handle_disconnect() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    $webhook_info = get_option('venqore_sync_info', []);
    $delivery_url = $webhook_info['webhook_url'] ?? '';

    if (!empty($delivery_url) && venqore_sync_ensure_woocommerce_webhooks()) {
        $topics = ['product.created', 'product.updated', 'product.deleted'];
        foreach ($topics as $topic) {
            $existing = wc_get_webhooks(['search' => 'VenQore Sync — ' . $topic]);
            if (is_array($existing)) {
                foreach ($existing as $webhook) {
                    if ($webhook->get_delivery_url() === $delivery_url) {
                        $webhook->delete(true);
                    }
                }
            }
        }
    }

    // Delete options
    delete_option('venqore_site_url');
    delete_option('venqore_api_token');
    delete_option('venqore_sync_connected');
    delete_option('venqore_sync_info');
    delete_option('venqore_sync_debug_logs');

    wp_redirect(admin_url('admin.php?page=venqore-sync&disconnected=1'));
    exit;
}

// ─── Admin Settings Page ──────────────────────────────────────────────────────

function venqore_sync_admin_menu() {
    add_menu_page(
        'VenQore Sync',
        'VenQore Sync',
        'manage_options',
        'venqore-sync',
        'venqore_sync_settings_page',
        'dashicons-update-alt',
        58
    );
}

function venqore_sync_register_settings() {
    register_setting('venqore_sync', 'venqore_site_url',  ['sanitize_callback' => 'esc_url_raw']);
    register_setting('venqore_sync', 'venqore_api_token', ['sanitize_callback' => 'sanitize_text_field']);
}

function venqore_sync_admin_styles($hook) {
    if ($hook !== 'toplevel_page_venqore-sync') return;
    wp_enqueue_style('venqore-sync-admin', plugin_dir_url(__FILE__) . 'assets/admin.css', [], VENQORE_SYNC_VERSION);
}

function venqore_sync_settings_page() {
    $site_url    = get_option('venqore_site_url', '');
    $token       = get_option('venqore_api_token', '');
    $connected   = (bool) get_option('venqore_sync_connected', false);
    $conn_info   = get_option('venqore_sync_info', []);
    $config_path = plugin_dir_path(__FILE__) . 'venqore-config.php';
    $has_config  = file_exists($config_path);

    // If configuration exists but we aren't connected yet, the handshake might still be retrying
    $handshake_pending = $has_config && !$connected;
    ?>
    <div class="wrap venqore-sync-wrap">
        <div class="venqore-content-container">
            <!-- Premium Header -->
            <div class="venqore-header">
                <div class="venqore-logo-area">
                    <div class="venqore-logo-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="venqore-header-text">
                        <h1>VenQore Sync</h1>
                        <p>High-performance bidirectional sync bridge for WooCommerce.</p>
                    </div>
                </div>
                <span class="venqore-badge-version">v1.0.0</span>
            </div>

            <!-- Custom Notice Banner -->
            <?php if (isset($_GET['disconnected'])): ?>
                <div class="venqore-notice venqore-notice-info">
                    <span style="font-size:16px;">ℹ</span>
                    <div>
                        <strong>Store Disconnected.</strong> All local options and WooCommerce sync webhooks have been successfully purged.
                    </div>
                </div>
            <?php endif; ?>

            <?php if ($connected): ?>
                <!-- Live Integration Metrics Dashboard -->
                <div class="venqore-grid">
                    <div class="venqore-stat-card">
                        <div class="venqore-stat-icon success">
                            ⚡
                        </div>
                        <div class="venqore-stat-info">
                            <span class="venqore-stat-label">Connection</span>
                            <span class="venqore-stat-value">
                                <span class="venqore-badge venqore-badge-active">
                                    <span class="venqore-badge-pulse"></span> Active
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="venqore-stat-card">
                        <div class="venqore-stat-icon info">
                            ⚓
                        </div>
                        <div class="venqore-stat-info">
                            <span class="venqore-stat-label">Webhooks Status</span>
                            <span class="venqore-stat-value" style="color: #60a5fa; font-weight: 700;">3 Active</span>
                        </div>
                    </div>
                    <div class="venqore-stat-card">
                        <div class="venqore-stat-icon warning">
                            🏪
                        </div>
                        <div class="venqore-stat-info">
                            <span class="venqore-stat-label">Linked POS</span>
                            <span class="venqore-stat-value" style="color: #fbbf24; font-weight: 700; text-overflow: ellipsis; overflow: hidden; max-width: 140px; white-space: nowrap; display: block;" title="<?= esc_attr($conn_info['store_name'] ?? 'VenQore Store') ?>">
                                <?= esc_html($conn_info['store_name'] ?? 'VenQore Store') ?>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Connection Details -->
                <div class="venqore-card">
                    <h2>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px; vertical-align: middle;">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Secure Credentials
                    </h2>
                    <p>The secure sync tunnel between this website and the VenQore Cloud API is active. Catalog updates are delivered instantly without manual intervention.</p>
                    
                    <table class="venqore-table">
                        <tr>
                            <th>VenQore Host URL</th>
                            <td><code><?= esc_html($site_url) ?></code></td>
                        </tr>
                        <tr>
                            <th>Security Handshake URL</th>
                            <td><code><?= esc_html($conn_info['webhook_url'] ?? '—') ?></code></td>
                        </tr>
                        <tr>
                            <th>Connected At</th>
                            <td><span style="color: #94a3b8; font-weight: 500;"><?= esc_html($conn_info['connected_at'] ?? '—') ?></span></td>
                        </tr>
                    </table>

                    <div style="margin-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 25px;">
                        <form method="post" action="<?= esc_url(admin_url('admin-post.php')) ?>">
                            <input type="hidden" name="action" value="venqore_disconnect" />
                            <?php wp_nonce_field('venqore_disconnect'); ?>
                            <button type="submit" class="venqore-btn venqore-btn-danger">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px;">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>
                                </svg>
                                Disconnect Integration
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Webhooks -->
                <div class="venqore-card">
                    <h2>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px; vertical-align: middle;">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        Registered Webhook Routes
                    </h2>
                    <p>WooCommerce broadcasts store events to these dynamic endpoints. They are automatically monitored and self-healing.</p>
                    
                    <div class="venqore-webhooks-list">
                        <div class="venqore-webhook-tag">
                            <span class="venqore-webhook-dot"></span>
                            <code>product.created</code>
                        </div>
                        <div class="venqore-webhook-tag">
                            <span class="venqore-webhook-dot"></span>
                            <code>product.updated</code>
                        </div>
                        <div class="venqore-webhook-tag">
                            <span class="venqore-webhook-dot"></span>
                            <code>product.deleted</code>
                        </div>
                    </div>
                </div>

            <?php elseif ($handshake_pending): 
                $handshake_error = get_option('venqore_handshake_error', '');
            ?>
                <!-- Pending Connection Loader -->
                <div class="venqore-card" style="padding: 40px 30px;">
                    <div class="venqore-loader-container">
                        <div class="venqore-loading-circle"></div>
                        <h2 style="border:none !important; padding:0 !important; justify-content:center; margin-bottom: 8px !important;">Awaiting Security Handshake</h2>
                        <p style="max-width: 480px; margin: 0 auto 20px; color: #94a3b8;">
                            The sync plugin is installed. We are listening for the automated verification signal from your VenQore control panel...
                        </p>

                        <?php if (!empty($handshake_error)): ?>
                            <div class="venqore-notice venqore-notice-error" style="max-width: 500px; margin: 20px auto 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px; text-align: left;">
                                <span style="font-size:18px; color:#ef4444; float:left; margin-right:10px;">⚠️</span>
                                <div style="overflow: hidden;">
                                    <strong style="color:#ef4444; display:block; margin-bottom:4px;">Handshake Diagnostic Warning:</strong>
                                    <span style="color:#f3f4f6; font-size:13px; font-family:monospace;"><?= esc_html($handshake_error) ?></span>
                                </div>
                            </div>
                        <?php endif; ?>
                        
                        <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
                            <button onclick="window.location.reload();" class="venqore-btn venqore-btn-primary">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                </svg>
                                Refresh Status
                            </button>
                            
                            <a href="<?= esc_url(get_site_url() . '/?venqore_debug=' . ($setup_token ?: '1')) ?>" class="venqore-btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; text-decoration:none; display:inline-flex; align-items:center;" target="_blank">
                                🛠️ Open Live Diagnostic Room
                            </a>
                        </div>

                        <div class="venqore-loader-status-steps">
                            <div class="venqore-step completed">
                                <span class="venqore-step-icon">✓</span>
                                <span>Plugin files uploaded and activated</span>
                            </div>
                            <div class="venqore-step active">
                                <span class="venqore-step-icon">●</span>
                                <span>Awaiting secure handshake ping from VenQore</span>
                            </div>
                            <div class="venqore-step">
                                <span class="venqore-step-icon">○</span>
                                <span>Generating dynamic API keys and registering webhooks</span>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    // Poll local state by refreshing the page
                    setTimeout(function() {
                        window.location.reload();
                    }, 4000);
                </script>

            <?php else: ?>
                <!-- Manual Settings Form -->
                <form method="post" action="options.php">
                    <?php settings_fields('venqore_sync'); ?>

                    <div class="venqore-card">
                        <h2>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px; vertical-align: middle;">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                            Manual Configuration
                        </h2>
                        <p style="margin-bottom: 25px;">No setup configuration file was detected inside the plugin folder. Please paste your details manually to connect.</p>

                        <div class="venqore-form-group">
                            <label for="venqore_site_url">VenQore Host API URL</label>
                            <input type="url" id="venqore_site_url" name="venqore_site_url"
                                value="<?= esc_attr($site_url) ?>"
                                placeholder="https://app.venqore.com" />
                            <p class="description">The secure API base address of your VenQore workspace.</p>
                        </div>

                        <div class="venqore-form-group" style="margin-bottom: 30px;">
                            <label for="venqore_api_token">Authentication Token</label>
                            <input type="password" id="venqore_api_token" name="venqore_api_token"
                                value="<?= esc_attr($token) ?>"
                                placeholder="vq_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                autocomplete="off" />
                            <p class="description">Paste the unique authorization token generated from the VenQore panel.</p>
                        </div>

                        <button type="submit" name="submit" id="submit" class="venqore-btn venqore-btn-primary">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Save & Establish Connection
                        </button>
                    </div>
                </form>
            <?php endif; ?>
        </div>
    </div>
    <?php
}

// ─── On Token Save: Verify + Register Webhooks (Legacy Fallback) ──────────────

function venqore_sync_on_token_saved($old_value, $new_value) {
    if (empty($new_value)) {
        return;
    }

    $site_url = get_option('venqore_site_url', '');
    if (empty($site_url)) {
        return;
    }

    // Verify token with VenQore
    $verify_url = trailingslashit($site_url) . 'api/woo/verify/' . urlencode($new_value);
    $response   = wp_remote_get($verify_url, ['timeout' => 15]);

    if (is_wp_error($response)) {
        return;
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (!($body['valid'] ?? false)) {
        update_option('venqore_sync_connected', false);
        return;
    }

    // Store connection info
    update_option('venqore_sync_connected', true);
    update_option('venqore_sync_info', [
        'store_name'   => $body['store_name'] ?? 'VenQore Store',
        'connected_at' => $body['connected_at'] ?? current_time('mysql'),
        'webhook_url'  => $body['webhook_url'] ?? '',
    ]);

    // Register WooCommerce webhooks pointing to VenQore
    venqore_sync_register_webhooks($body['webhook_url'] ?? '');
}

/**
 * Self-healing helper to dynamically load WooCommerce webhook files if they are not yet loaded.
 * Prevents "Fatal Error: Call to undefined function wc_get_webhooks()" on early hooks like admin_init.
 */
function venqore_sync_ensure_woocommerce_webhooks() {
    if (!class_exists('WooCommerce') || !defined('WC_ABSPATH')) {
        return false;
    }
    if (!function_exists('wc_get_webhooks')) {
        $fns = WC_ABSPATH . 'includes/wc-webhook-functions.php';
        if (file_exists($fns)) {
            include_once $fns;
        }
    }
    if (!class_exists('WC_Webhook')) {
        $cls = WC_ABSPATH . 'includes/class-wc-webhook.php';
        if (file_exists($cls)) {
            include_once $cls;
        }
    }
    return function_exists('wc_get_webhooks') && class_exists('WC_Webhook');
}

function venqore_sync_register_webhooks(string $delivery_url) {
    if (empty($delivery_url)) {
        return;
    }

    if (!venqore_sync_ensure_woocommerce_webhooks()) {
        venqore_sync_log("WARNING: WooCommerce webhook engine not loaded or active. Cannot register webhooks.");
        return;
    }

    $topics = ['product.created', 'product.updated', 'product.deleted'];

    foreach ($topics as $topic) {
        $existing = wc_get_webhooks(['search' => 'VenQore Sync — ' . $topic]);
        if (!empty($existing)) {
            continue;
        }

        $webhook = new WC_Webhook();
        $webhook->set_name('VenQore Sync — ' . $topic);
        $webhook->set_topic($topic);
        $webhook->set_delivery_url($delivery_url);
        $webhook->set_status('active');
        $webhook->set_user_id(get_current_user_id() ?: 1);
        $webhook->save();
    }
}

// ─── Product Meta Box ─────────────────────────────────────────────────────────

function venqore_sync_add_meta_box() {
    if (!get_option('venqore_sync_connected')) {
        return;
    }

    add_meta_box(
        'venqore-sync-status',
        '🔄 VenQore Sync',
        'venqore_sync_meta_box_html',
        'product',
        'side',
        'default'
    );
}

function venqore_sync_meta_box_html($post) {
    $product_id = $post->ID;
    $sku        = get_post_meta($product_id, '_sku', true);
    $site_url   = get_option('venqore_site_url', '');
    $token      = get_option('venqore_api_token', '');
    $connected  = get_option('venqore_sync_connected', false);

    // Fetch local cache first
    $sync_status = get_post_meta($product_id, '_venqore_sync_status', true);
    $last_synced = get_post_meta($product_id, '_venqore_last_synced', true);

    if (!$connected) {
        ?>
        <div style="font-size:13px;line-height:1.6">
            <p style="color:#64748b">VenQore Sync is not connected. Go to <a href="<?= admin_url('admin.php?page=venqore-sync') ?>">Settings</a>.</p>
        </div>
        <?php
        return;
    }

    // Fallback: if not cached or unknown, poll VenQore API once
    if (empty($sync_status) || $sync_status === 'unknown') {
        $sync_status = 'staged';
        if ($site_url && $token && $sku) {
            $status_url = trailingslashit($site_url) . 'api/woo/product-status/' . urlencode($sku);
            $response   = wp_remote_get($status_url, [
                'timeout' => 5,
                'headers' => ['Authorization' => 'Bearer ' . $token],
            ]);

            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                $data        = json_decode(wp_remote_retrieve_body($response), true);
                $sync_status = $data['sync_status'] ?? 'staged';
                $last_synced = $data['last_synced_at'] ?? null;

                // Cache it
                update_post_meta($product_id, '_venqore_sync_status', $sync_status);
                if ($last_synced) {
                    update_post_meta($product_id, '_venqore_last_synced', $last_synced);
                }
            }
        }
    }

    $status_colors = [
        'synced'   => '#10b981',
        'conflict' => '#dc2626',
        'staged'   => '#d97706',
        'ignored'  => '#94a3b8',
    ];
    $color = $status_colors[$sync_status] ?? '#d97706';
    ?>
    <div style="font-size:13px;line-height:1.6">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="width:9px;height:9px;border-radius:50%;background:<?= esc_attr($color) ?>;display:inline-block;flex-shrink:0"></span>
            <span style="font-weight:600;color:#1e293b;text-transform:capitalize"><?= esc_html($sync_status) ?></span>
        </div>
        <?php if ($sku): ?>
            <div style="color:#64748b;font-size:12px">SKU: <code><?= esc_html($sku) ?></code></div>
        <?php else: ?>
            <div style="color:#ef4444;font-size:12px">⚠ No SKU — product cannot be synced</div>
        <?php endif; ?>
        <?php if ($last_synced): ?>
            <div style="color:#94a3b8;font-size:11px;margin-top:6px">Last sync: <?= esc_html(date('M j, Y g:i a', strtotime($last_synced))) ?></div>
        <?php endif; ?>

        <hr style="margin:12px 0;border:0;border-top:1px solid #e2e8f0" />

        <button
            type="button"
            id="venqore-push-btn"
            onclick="venqorePushProduct(<?= (int)$product_id ?>)"
            style="width:100%;padding:7px 12px;background:#7c3aed;color:#fff;border:0;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;transition: background 0.2s;"
            onmouseover="this.style.background='#6d28d9'"
            onmouseout="this.style.background='#7c3aed'"
        >
            Push to VenQore
        </button>
        <div id="venqore-push-msg" style="font-size:11px;margin-top:6px;color:#64748b"></div>
    </div>

    <script>
    function venqorePushProduct(productId) {
        var btn = document.getElementById('venqore-push-btn');
        var msg = document.getElementById('venqore-push-msg');
        btn.disabled = true;
        btn.textContent = 'Pushing…';
        msg.textContent = '';

        var formData = new FormData();
        formData.append('action', 'venqore_push_product');
        formData.append('product_id', productId);
        formData.append('nonce', '<?= wp_create_nonce('venqore_push_product') ?>');

        fetch(ajaxurl, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                msg.textContent = data.success ? '✓ ' + data.message : '✗ ' + data.message;
                msg.style.color = data.success ? '#16a34a' : '#ef4444';
                if (data.success) {
                    window.location.reload(); // Reload page to update columns and meta box status
                }
            })
            .catch(() => { msg.textContent = 'Network error.'; msg.style.color = '#ef4444'; })
            .finally(() => { btn.disabled = false; btn.textContent = 'Push to VenQore'; });
    }
    </script>
    <?php
}

// ─── AJAX: Manual Push ────────────────────────────────────────────────────────

function venqore_sync_ajax_push_product() {
    check_ajax_referer('venqore_push_product', 'nonce');

    $product_id = absint($_POST['product_id'] ?? 0);
    $site_url   = get_option('venqore_site_url', '');
    $token      = get_option('venqore_api_token', '');

    if (!$product_id || !$site_url || !$token) {
        wp_send_json(['success' => false, 'message' => 'Not configured.']);
    }

    $product = wc_get_product($product_id);
    if (!$product) {
        wp_send_json(['success' => false, 'message' => 'Product not found.']);
    }

    // Build minimal product payload and POST to VenQore
    $payload = [
        'id'            => $product->get_id(),
        'name'          => $product->get_name(),
        'sku'           => $product->get_sku(),
        'regular_price' => $product->get_regular_price(),
        'sale_price'    => $product->get_sale_price(),
        'stock_quantity'=> $product->get_stock_quantity(),
        'status'        => $product->get_status(),
        'description'   => $product->get_description(),
    ];

    // Simulate a product.updated webhook POST to VenQore
    $webhook_info = get_option('venqore_sync_info', []);
    $delivery_url = $webhook_info['webhook_url'] ?? '';

    if (empty($delivery_url)) {
        wp_send_json(['success' => false, 'message' => 'Webhook URL not found. Re-save settings.']);
    }

    $response = wp_remote_post($delivery_url, [
        'timeout' => 15,
        'headers' => [
            'Content-Type'         => 'application/json',
            'x-wc-webhook-topic'   => 'product.updated',
            'x-wc-webhook-source'  => get_site_url(),
        ],
        'body'    => wp_json_encode($payload),
    ]);

    if (is_wp_error($response)) {
        wp_send_json(['success' => false, 'message' => $response->get_error_message()]);
    }

    $code = wp_remote_retrieve_response_code($response);
    if ($code >= 200 && $code < 300) {
        // Successful push: cache locally!
        update_post_meta($product_id, '_venqore_sync_status', 'synced');
        update_post_meta($product_id, '_venqore_last_synced', current_time('mysql'));
        wp_send_json(['success' => true, 'message' => 'Product pushed to VenQore successfully.']);
    } else {
        wp_send_json(['success' => false, 'message' => "VenQore returned HTTP {$code}."]);
    }
}

// ─── Custom Column Registration ───────────────────────────────────────────────

function venqore_sync_add_product_column($columns) {
    $new_columns = [];
    foreach ($columns as $key => $title) {
        if ($key === 'price') {
            $new_columns['venqore_sync'] = '🔄 VenQore';
        }
        $new_columns[$key] = $title;
    }
    return $new_columns;
}

// ─── Render Product Column Content ────────────────────────────────────────────

function venqore_sync_render_product_column($column, $post_id) {
    if ($column !== 'venqore_sync') {
        return;
    }

    if (!get_option('venqore_sync_connected')) {
        echo '<span style="color:#64748b; font-size:12px;">Not Connected</span>';
        return;
    }

    $product = wc_get_product($post_id);
    if (!$product) {
        return;
    }

    $sku = $product->get_sku();
    if (!$sku) {
        echo '<span style="color:#ef4444; font-size:11px; font-weight:600;">⚠️ No SKU</span>';
        return;
    }

    $sync_status = get_post_meta($post_id, '_venqore_sync_status', true) ?: 'staged';
    $last_synced = get_post_meta($post_id, '_venqore_last_synced', true);

    $colors = [
        'synced'   => ['#10b981', '#f0fdf4', '#bbf7d0'], // text, bg, border
        'staged'   => ['#d97706', '#fffbeb', '#fef3c7'],
        'conflict' => ['#dc2626', '#fef2f2', '#fecaca'],
        'ignored'  => ['#64748b', '#f8fafc', '#e2e8f0'],
    ];

    $style = $colors[$sync_status] ?? $colors['staged'];

    echo '<div style="display:inline-flex; align-items:center; gap:6px; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:600; color:' . $style[0] . '; background:' . $style[1] . '; border:1.5px solid ' . $style[2] . ';">';
    echo '<span style="width:5px; height:5px; border-radius:50%; background:' . $style[0] . ';"></span>';
    echo esc_html(ucfirst($sync_status));
    echo '</div>';

    if ($last_synced) {
        $time = strtotime($last_synced);
        echo '<div style="font-size:10px; color:#94a3b8; margin-top:4px;" title="' . esc_attr($last_synced) . '">Sync: ' . esc_html(date('M j, g:i a', $time)) . '</div>';
    }
}

// ─── Mark Product as Staged on Local Update ──────────────────────�add_action('init', 'venqore_sync_debug_page');

function venqore_sync_on_product_updated($product_id) {
    if (defined('REST_REQUEST') && REST_REQUEST) {
        return;
    }
    if (defined('DOING_AJAX') || defined('DOING_CRON')) {
        return;
    }
    $product = wc_get_product($product_id);
    if (!$product) {
        return;
    }
    update_post_meta($product_id, '_venqore_sync_status', 'staged');
}

add_action('init', 'venqore_sync_debug_page');

function venqore_sync_debug_page() {
    $config_path = plugin_dir_path(__FILE__) . 'venqore-config.php';
    $setup_token = '';
    $api_url = '';
    if (file_exists($config_path)) {
        include_once $config_path;
        if (defined('VENQORE_SETUP_TOKEN')) {
            $setup_token = VENQORE_SETUP_TOKEN;
        }
        if (defined('VENQORE_API_URL')) {
            $api_url = VENQORE_API_URL;
        }
    }

    $is_check_request = isset($_GET['venqore_debug']) || isset($_GET['venqore_check']) || isset($_GET['venqore_status']);

    // If they aren't trying to access the debug view, let the request proceed normally
    if (!$is_check_request) {
        return;
    }

    // Determine authorization: Either a logged-in administrator OR a request passing the secret setup token
    $authorized = false;
    if (current_user_can('manage_options')) {
        $authorized = true;
    }

    $passed_token = '';
    if (isset($_GET['venqore_debug'])) {
        $passed_token = $_GET['venqore_debug'];
    } elseif (isset($_GET['venqore_check']) && $_GET['venqore_check'] !== '1') {
        $passed_token = $_GET['venqore_check'];
    } elseif (isset($_GET['venqore_status']) && $_GET['venqore_status'] !== '1') {
        $passed_token = $_GET['venqore_status'];
    }

    if (!empty($setup_token) && !empty($passed_token) && $passed_token === $setup_token) {
        $authorized = true;
    }

    // If unauthorized, block it
    if (!$authorized) {
        $current_url = (is_ssl() ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $login_url = wp_login_url($current_url);
        $is_mismatch = !empty($setup_token) && !empty($passed_token) && $passed_token !== $setup_token;

        status_header(403);
        nocache_headers();
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Access Denied — VenQore Sync</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root {
                    --bg-main: #060913;
                    --bg-card: #0c1223;
                    --border-color: rgba(255, 255, 255, 0.06);
                    --text-primary: #f8fafc;
                    --text-secondary: #94a3b8;
                    --brand-color: #7c3aed;
                    --brand-gradient: linear-gradient(135deg, #7c3aed, #4f46e5);
                    --success: #10b981;
                    --warning: #f59e0b;
                    --danger: #ef4444;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    background-color: var(--bg-main);
                    color: var(--text-primary);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 24px;
                    line-height: 1.6;
                }
                .error-card {
                    background-color: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 580px;
                    width: 100%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                }
                .error-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--danger), var(--warning));
                }
                .icon-container {
                    width: 64px;
                    height: 64px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1.5px solid rgba(239, 68, 68, 0.2);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }
                .icon-container svg {
                    width: 30px;
                    height: 30px;
                    color: var(--danger);
                }
                h1 {
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    margin-bottom: 12px;
                    color: #fff;
                }
                p {
                    color: var(--text-secondary);
                    font-size: 14.5px;
                    margin-bottom: 24px;
                }
                .alert-box {
                    background: rgba(245, 158, 11, 0.08);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                    font-size: 13.5px;
                    color: #fef3c7;
                    text-align: left;
                }
                .alert-box strong {
                    color: var(--warning);
                    display: block;
                    margin-bottom: 4px;
                }
                .steps-list {
                    text-align: left;
                    margin-bottom: 32px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--border-color);
                    border-radius: 14px;
                    padding: 20px;
                }
                .steps-list h3 {
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #cbd5e1;
                    margin-bottom: 16px;
                    font-weight: 700;
                }
                .step-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 14px;
                    font-size: 13.5px;
                    color: var(--text-secondary);
                }
                .step-item:last-child {
                    margin-bottom: 0;
                }
                .step-number {
                    width: 22px;
                    height: 22px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    color: #fff;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .step-text {
                    line-height: 1.5;
                }
                .step-text strong {
                    color: #fff;
                }
                .btn-group {
                    display: flex;
                    gap: 12px;
                }
                .btn {
                    flex: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 20px;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                }
                .btn-primary {
                    background: var(--brand-gradient);
                    color: #fff;
                    border: none;
                    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
                }
                .btn-primary:hover {
                    opacity: 0.95;
                    transform: translateY(-1px);
                }
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                }
            </style>
        </head>
        <body>
            <div class="error-card">
                <div class="icon-container">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>

                <?php if ($is_mismatch): ?>
                    <h1>Setup Token Mismatch</h1>
                    <p>Your WordPress site is holding an older secure token that does not match the token supplied by your POS workspace. This happens when you delete a connection in the POS panel and create a new one.</p>

                    <div class="alert-box">
                        <strong>Why did this happen?</strong>
                        Deleting a WooCommerce connection inside VenQore destroys the old link credentials and instantly issues a brand-new, unique setup token. The old sync plugin installed here is still configured with the old token.
                    </div>

                    <div class="steps-list">
                        <h3>How to Solve this issue:</h3>
                        <div class="step-item">
                            <div class="step-number">1</div>
                            <div class="step-text">Open your WordPress Admin area, go to <strong>Plugins</strong>.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">2</div>
                            <div class="step-text">Locate the <strong>VenQore Sync</strong> plugin, click <strong>Deactivate</strong>, and then <strong>Delete</strong> it.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">3</div>
                            <div class="step-text">Return to your <strong>VenQore POS dashboard</strong> under WooCommerce Connections.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">4</div>
                            <div class="step-text">Click <strong>Setup</strong> and download the freshly generated, customized <strong>venqore-sync.zip</strong>.</div>
                        </div>
                        <div class="step-item">
                            <div class="step-number">5</div>
                            <div class="step-text">Upload and activate the new plugin zip on this site. The handshake will complete instantly!</div>
                        </div>
                    </div>

                    <div class="btn-group">
                        <a href="<?php echo esc_url(admin_url('plugins.php')); ?>" class="btn btn-primary">Go to WP Plugins Manager</a>
                        <a href="<?php echo esc_url($login_url); ?>" class="btn btn-secondary">Log in as Administrator</a>
                    </div>
                <?php else: ?>
                    <h1>Access Denied</h1>
                    <p>You must be logged in as an Administrator in this browser, or provide the correct secure setup token in the URL parameter (e.g., <code>/?venqore_check=YOUR_SETUP_TOKEN</code>).</p>

                    <div class="btn-group">
                        <a href="<?php echo esc_url($login_url); ?>" class="btn btn-primary">Log in to WordPress Admin</a>
                        <a href="<?php echo esc_url(home_url()); ?>" class="btn btn-secondary">Back to Storefront</a>
                    </div>
                <?php endif; ?>
            </div>
        </body>
        </html>
        <?php
        exit;
    }

    // Determine the active parameter for redirects
    $active_param = 'venqore_debug';
    $active_val = '1';
    if (isset($_GET['venqore_check'])) {
        $active_param = 'venqore_check';
        $active_val = $_GET['venqore_check'];
    } elseif (isset($_GET['venqore_status'])) {
        $active_param = 'venqore_status';
        $active_val = $_GET['venqore_status'];
    } elseif (isset($_GET['venqore_debug'])) {
        $active_val = $_GET['venqore_debug'];
    }

    // ─── Handle Interactive Actions ───
    if ($authorized && isset($_GET['venqore_action'])) {
        $action = sanitize_text_field($_GET['venqore_action']);
        
        if ($action === 'force_handshake') {
            // Delete lock and handshake error flags
            delete_option('venqore_last_handshake_attempt');
            delete_option('venqore_handshake_error');
            
            venqore_sync_log("Diagnostics: Forcing direct synchronous handshake invocation...");
            
            // Execute handshake synchronously
            if (function_exists('venqore_sync_perform_handshake')) {
                venqore_sync_perform_handshake();
            }
            
            // Redirect back to clean URL
            wp_redirect(add_query_arg([$active_param => $active_val], remove_query_arg(['venqore_action', 'nonce'])));
            exit;
        }
        
        if ($action === 'reset_connection') {
            venqore_sync_log("Diagnostics: Request to completely reset connection states.");
            // Pure reset of all option states
            delete_option('venqore_site_url');
            delete_option('venqore_api_token');
            delete_option('venqore_sync_connected');
            delete_option('venqore_sync_info');
            delete_option('venqore_handshake_error');
            delete_option('venqore_last_handshake_attempt');
            delete_option('venqore_sync_debug_logs');
            
            venqore_sync_log("Diagnostics: Integration cleanly reset and logs purged.");
            
            wp_redirect(add_query_arg([$active_param => $active_val], remove_query_arg(['venqore_action', 'nonce'])));
            exit;
        }
    }

    // ─── Perform Intensive System Diagnostics ───
    global $wpdb;

    $php_ok = version_compare(PHP_VERSION, '7.4.0', '>=');
    $wc_ok = class_exists('WooCommerce');
    $config_exists = file_exists($config_path);
    $setup_token_defined = !empty($setup_token);
    $api_url_defined = !empty($api_url);

    // 1. Connectivity Check: Outbound POS check
    $ssl_verify_ok = false;
    $ssl_no_verify_ok = false;
    $ssl_response_code = 'N/A';
    $no_ssl_response_code = 'N/A';
    $ssl_error = '';
    $no_ssl_error = '';

    if ($api_url_defined) {
        $ping_endpoint = trailingslashit($api_url) . 'up';
        
        // Strict SSL
        $res_ssl = wp_remote_get($ping_endpoint, ['timeout' => 8, 'sslverify' => true]);
        if (is_wp_error($res_ssl)) {
            $ssl_error = $res_ssl->get_error_message();
        } else {
            $ssl_response_code = wp_remote_retrieve_response_code($res_ssl);
            $ssl_verify_ok = ($ssl_response_code >= 200 && $ssl_response_code < 400) || $ssl_response_code === 404;
        }

        // Bypass SSL
        $res_no_ssl = wp_remote_get($ping_endpoint, ['timeout' => 8, 'sslverify' => false]);
        if (is_wp_error($res_no_ssl)) {
            $no_ssl_error = $res_no_ssl->get_error_message();
        } else {
            $no_ssl_response_code = wp_remote_retrieve_response_code($res_no_ssl);
            $ssl_no_verify_ok = ($no_ssl_response_code >= 200 && $no_ssl_response_code < 400) || $no_ssl_response_code === 404;
        }
    }

    // 2. Connectivity Check: Local WC REST API Loopback check
    $rest_api_url = get_rest_url(null, 'wc/v3');
    $res_rest = wp_remote_get($rest_api_url, ['timeout' => 8, 'sslverify' => false]);
    $rest_ok = false;
    $rest_error = '';
    $rest_code = 'N/A';
    if (is_wp_error($res_rest)) {
        $rest_error = $res_rest->get_error_message();
    } else {
        $rest_code = wp_remote_retrieve_response_code($res_rest);
        // 200 (Success) or 401 (Unauthorized) means the endpoint is active and listening
        $rest_ok = ($rest_code >= 200 && $rest_code < 400) || $rest_code === 401;
    }

    // 3. Permalinks Check
    $permalink_structure = get_option('permalink_structure');
    $permalinks_ok = !empty($permalink_structure);

    // 4. Security Plugins Check
    $active_plugins = (array) get_option('active_plugins', []);
    $security_plugins = [];
    $security_keywords = ['wordfence', 'security', 'firewall', 'limit-login', 'defender', 'sucuri', 'cloudflare', 'cerber', 'ithemes'];
    foreach ($active_plugins as $plugin) {
        foreach ($security_keywords as $keyword) {
            if (strpos(strtolower($plugin), $keyword) !== false) {
                $security_plugins[] = basename($plugin, '.php');
                break;
            }
        }
    }

    // Database check (API Keys)
    $has_api_keys = false;
    $api_keys_list = [];
    if ($wc_ok) {
        $keys_table = $wpdb->prefix . 'woocommerce_api_keys';
        $table_check = $wpdb->get_var("SHOW TABLES LIKE '{$keys_table}'");
        if ($table_check) {
            $api_keys_list = $wpdb->get_results("SELECT key_id, description, permissions, truncated_key FROM {$keys_table} WHERE description LIKE '%VenQore%'");
            $has_api_keys = count($api_keys_list) > 0;
        }
    }

    // Database check (Webhooks)
    $registered_webhooks = [];
    if ($wc_ok && venqore_sync_ensure_woocommerce_webhooks()) {
        $webhooks = wc_get_webhooks(['status' => 'active']);
        foreach ($webhooks as $wh) {
            if (strpos($wh->get_name(), 'VenQore') !== false) {
                $registered_webhooks[] = [
                    'name' => $wh->get_name(),
                    'topic' => $wh->get_topic(),
                    'status' => $wh->get_status(),
                    'delivery_url' => $wh->get_delivery_url(),
                ];
            }
        }
    }

    // DB Stored options
    $connected = (bool) get_option('venqore_sync_connected', false);
    $handshake_error = get_option('venqore_handshake_error', '');
    $last_attempt = (int) get_option('venqore_last_handshake_attempt', 0);
    $saved_api_url = get_option('venqore_site_url', '');
    $saved_token = get_option('venqore_api_token', '');
    $sync_info = get_option('venqore_sync_info', []);

    // ─── Render HTML Diagnostics View ───
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>VenQore Sync — Diagnostic Room</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            :root {
                --bg-main: #060913;
                --bg-card: #0c1223;
                --border-color: rgba(255, 255, 255, 0.06);
                --text-primary: #f8fafc;
                --text-secondary: #94a3b8;
                --accent-indigo: #6366f1;
                --accent-indigo-glow: rgba(99, 102, 241, 0.15);
                --success: #10b981;
                --success-glow: rgba(16, 185, 129, 0.15);
                --warning: #f59e0b;
                --warning-glow: rgba(245, 158, 11, 0.15);
                --error: #ef4444;
                --error-glow: rgba(239, 68, 68, 0.15);
            }

            body {
                background-color: var(--bg-main);
                color: var(--text-primary);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                margin: 0;
                padding: 40px 20px;
                line-height: 1.5;
            }

            .container {
                max-width: 1000px;
                margin: 0 auto;
            }

            header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 40px;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 25px;
            }

            .logo-area {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .logo-icon {
                width: 48px;
                height: 48px;
                border-radius: 14px;
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
            }

            .logo-icon svg {
                width: 24px;
                height: 24px;
                fill: none;
                stroke: #ffffff;
                stroke-width: 2.5;
            }

            h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }

            .subtitle {
                margin: 4px 0 0 0;
                font-size: 13px;
                color: var(--text-secondary);
            }

            .badge {
                font-size: 11px;
                font-weight: 700;
                padding: 5px 12px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .badge-active {
                background: var(--success-glow);
                color: var(--success);
                border: 1px solid rgba(16, 185, 129, 0.2);
            }

            .badge-pending {
                background: var(--warning-glow);
                color: var(--warning);
                border: 1px solid rgba(245, 158, 11, 0.2);
            }

            /* System Summary Alert Box */
            .alert-banner {
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 30px;
                display: flex;
                gap: 16px;
                align-items: flex-start;
            }

            .alert-banner-error {
                background: var(--error-glow);
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: #fca5a5;
            }

            .alert-banner-success {
                background: var(--success-glow);
                border: 1px solid rgba(16, 185, 129, 0.2);
                color: #a7f3d0;
            }

            .alert-banner-info {
                background: var(--accent-indigo-glow);
                border: 1px solid rgba(99, 102, 241, 0.2);
                color: #c7d2fe;
            }

            .alert-title {
                font-weight: 700;
                margin: 0 0 6px 0;
                font-size: 15px;
            }

            .alert-body {
                font-size: 13px;
                line-height: 1.6;
                margin: 0;
            }

            /* Grid Layout */
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 25px;
                margin-bottom: 30px;
            }

            @media (max-width: 768px) {
                .grid {
                    grid-template-columns: 1fr;
                }
            }

            .card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 18px;
                padding: 25px;
                position: relative;
                overflow: hidden;
            }

            .card-glow {
                position: absolute;
                top: 0;
                right: 0;
                width: 150px;
                height: 150px;
                background: radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent 70%);
                pointer-events: none;
            }

            .card h2 {
                margin: 0 0 20px 0;
                font-size: 16px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #ffffff;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                padding-bottom: 12px;
            }

            .check-item {
                display: flex;
                align-items: center;
                justify-content: justify;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            }

            .check-item:last-child {
                border-bottom: none;
            }

            .check-label {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-secondary);
                flex: 1;
            }

            .check-value {
                font-size: 13px;
                font-family: monospace;
                font-weight: 600;
                text-align: right;
            }

            .status-dot {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-weight: 700;
                font-size: 12px;
                text-align: right;
            }

            .dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .dot-success { background-color: var(--success); box-shadow: 0 0 8px var(--success); color: var(--success); }
            .dot-warning { background-color: var(--warning); box-shadow: 0 0 8px var(--warning); color: var(--warning); }
            .dot-error { background-color: var(--error); box-shadow: 0 0 8px var(--error); color: var(--error); }

            /* Action Buttons */
            .actions-panel {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-top: 20px;
            }

            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 11px 20px;
                font-size: 13px;
                font-weight: 700;
                border-radius: 12px;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s ease;
                border: none;
            }

            .btn-primary {
                background: var(--accent-indigo);
                color: #ffffff;
                box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
            }

            .btn-primary:hover {
                background: #4f46e5;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: rgba(255, 255, 255, 0.04);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }

            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.08);
            }

            .btn-danger {
                background: rgba(239, 68, 68, 0.1);
                color: var(--error);
                border: 1px solid rgba(239, 68, 68, 0.2);
            }

            .btn-danger:hover {
                background: rgba(239, 68, 68, 0.18);
            }

            code {
                font-family: "Courier New", Courier, monospace;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.06);
                padding: 2px 6px;
                border-radius: 6px;
                color: #c7d2fe;
                font-size: 12px;
            }

            .log-box {
                background: #03050a;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 15px;
                font-family: "Courier New", Courier, monospace;
                font-size: 12px;
                color: #e2e8f0;
                overflow-x: auto;
                max-height: 250px;
                margin-top: 15px;
                white-space: pre-wrap;
                line-height: 1.6;
                text-align: left;
            }
            
            .secret-box {
                margin-top: 30px;
                background: rgba(99, 102, 241, 0.04);
                border: 1px dashed rgba(99, 102, 241, 0.2);
                border-radius: 12px;
                padding: 15px;
                font-size: 12px;
                text-align: left;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="logo-area">
                    <div class="logo-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div>
                        <h1>VenQore Sync Diagnostic Room</h1>
                        <p class="subtitle">Real-time plugin telemetry and API handshake analysis</p>
                    </div>
                </div>
                <div>
                    <?php if ($connected): ?>
                        <span class="badge badge-active">Connected</span>
                    <?php else: ?>
                        <span class="badge badge-pending">Handshake Pending</span>
                    <?php endif; ?>
                </div>
            </header>

            <!-- ─── Core Telemetry Diagnostics Summary ─── -->
            <?php if (!$rest_ok): ?>
                <div class="alert-banner alert-banner-error">
                    <span style="font-size: 24px; line-height: 1;">⚠️</span>
                    <div>
                        <div class="alert-title">WooCommerce REST API Blocked!</div>
                        <p class="alert-body">
                            The local loopback test to the WooCommerce API failed. VenQore POS cannot communicate with your store unless `/wp-json/wc/v3` is accessible. Please ensure no security plugin or basic auth is blocking it. Stored error:<br>
                            <code><?= esc_html($rest_error ?: "Returned HTTP Code: " . $rest_code) ?></code>
                        </p>
                    </div>
                </div>
            <?php elseif (!$permalinks_ok): ?>
                <div class="alert-banner alert-banner-error">
                    <span style="font-size: 24px; line-height: 1;">⚠️</span>
                    <div>
                        <div class="alert-title">Plain Permalinks Active!</div>
                        <p class="alert-body">
                            WordPress is currently using Plain Permalinks (`?p=123`). The WooCommerce REST API requires modern, pretty permalinks (e.g. Post name). Please go to <strong>Settings > Permalinks</strong> in WP Admin and change the structure.
                        </p>
                    </div>
                </div>
            <?php elseif (!empty($handshake_error)): ?>
                <div class="alert-banner alert-banner-error">
                    <span style="font-size: 24px; line-height: 1;">⚠️</span>
                    <div>
                        <div class="alert-title">Active Handshake Block Detected</div>
                        <p class="alert-body">
                            The WordPress server was unable to establish a secure link. Stored diagnostic telemetry:<br>
                            <code><?= esc_html($handshake_error) ?></code>
                        </p>
                    </div>
                </div>
            <?php elseif ($connected): ?>
                <div class="alert-banner alert-banner-success">
                    <span style="font-size: 24px; line-height: 1;">✓</span>
                    <div>
                        <div class="alert-title">Integration Healthy & Online</div>
                        <p class="alert-body">
                            WooCommerce is successfully linked to VenQore Cloud. Manual and automatic catalog events are transmitting in real-time.
                        </p>
                    </div>
                </div>
            <?php else: ?>
                <div class="alert-banner alert-banner-info">
                    <span style="font-size: 24px; line-height: 1;">ℹ️</span>
                    <div>
                        <div class="alert-title">Awaiting Handshake Signals</div>
                        <p class="alert-body">
                            The plugin is fully loaded. It will automatically connect and generate secure REST keys once it receives a validated activation payload from your VenQore Cloud POS control room.
                        </p>
                    </div>
                </div>
            <?php endif; ?>

            <div class="grid">
                <!-- Card 1: Environment & Dependency Check -->
                <div class="card">
                    <div class="card-glow"></div>
                    <h2>🖥️ Server Environment Check</h2>
                    
                    <div class="check-item">
                        <span class="check-label">PHP Version</span>
                        <span class="check-value" style="color: <?= $php_ok ? 'var(--success)' : 'var(--error)' ?>;">
                            <?= esc_html(PHP_VERSION) ?> (<?= $php_ok ? 'OK' : 'Requires 7.4+' ?>)
                        </span>
                    </div>
                    
                    <div class="check-item">
                        <span class="check-label">WooCommerce Installed & Active</span>
                        <span class="status-dot">
                            <span class="dot <?= $wc_ok ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $wc_ok ? 'var(--success)' : 'var(--error)' ?>;"><?= $wc_ok ? 'Yes' : 'No' ?></span>
                        </span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">WooCommerce Webhook Engine</span>
                        <span class="status-dot">
                            <span class="dot <?= function_exists('wc_get_webhooks') ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= function_exists('wc_get_webhooks') ? 'var(--success)' : 'var(--error)' ?>;"><?= function_exists('wc_get_webhooks') ? 'Ready' : 'Not Loaded' ?></span>
                        </span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">SSL (HTTPS) Active</span>
                        <span class="status-dot">
                            <span class="dot <?= is_ssl() ? 'dot-success' : 'dot-warning' ?>"></span>
                            <span style="color: <?= is_ssl() ? 'var(--success)' : 'var(--warning)' ?>;"><?= is_ssl() ? 'Active (HTTPS)' : 'Inactive (HTTP)' ?></span>
                        </span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">WP Permalink Structure</span>
                        <span class="status-dot">
                            <span class="dot <?= $permalinks_ok ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $permalinks_ok ? 'var(--success)' : 'var(--error)' ?>;">
                                <?= $permalinks_ok ? 'Pretty Permalinks' : 'Plain Permalinks (⚠️ API Blocked)' ?>
                            </span>
                        </span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">WordPress Site URL</span>
                        <span class="check-value" style="font-size:11px; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><?= esc_html(get_site_url()) ?></span>
                    </div>
                </div>

                <!-- Card 2: Configuration & Credentials Check -->
                <div class="card">
                    <div class="card-glow"></div>
                    <h2>⚙️ VenQore Config Manifest</h2>
                    
                    <div class="check-item">
                        <span class="check-label">venqore-config.php Exists</span>
                        <span class="status-dot">
                            <span class="dot <?= $config_exists ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $config_exists ? 'var(--success)' : 'var(--error)' ?>;"><?= $config_exists ? 'Found' : 'Missing' ?></span>
                        </span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">Setup Token Defined</span>
                        <span class="status-dot">
                            <span class="dot <?= $setup_token_defined ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $setup_token_defined ? 'var(--success)' : 'var(--error)' ?>;"><?= $setup_token_defined ? 'Defined' : 'Undefined' ?></span>
                        </span>
                    </div>

                    <?php if ($setup_token_defined): ?>
                    <div class="check-item">
                        <span class="check-label">Setup Token Value</span>
                        <span class="check-value"><?= esc_html(substr($setup_token, 0, 7)) ?>...xxxx</span>
                    </div>
                    <?php endif; ?>

                    <div class="check-item">
                        <span class="check-label">Target POS API URL</span>
                        <span class="check-value" style="font-size:11px; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: #a5b4fc;"><?= $api_url_defined ? esc_html($api_url) : 'Not Defined' ?></span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">Active Security Plugins</span>
                        <span class="check-value" style="font-size:11px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: <?= empty($security_plugins) ? 'var(--success)' : 'var(--warning)' ?>;">
                            <?= empty($security_plugins) ? 'None detected' : esc_html(implode(', ', $security_plugins)) ?>
                        </span>
                    </div>
                </div>
            </div>

            <div class="grid">
                <!-- Card 3: Deep Loopback & Outbound cURL Connection Check -->
                <div class="card">
                    <div class="card-glow"></div>
                    <h2>🌐 Outbound API Handshake & Local REST Loopback</h2>
                    <p style="font-size:11px; color: var(--text-secondary); margin:-10px 0 15px 0;">We test if your WordPress hosting allows outbound requests to the POS, and if the local WooCommerce API is reachable.</p>
                    
                    <div class="check-item">
                        <span class="check-label">Local WC REST API Loopback</span>
                        <span class="status-dot">
                            <span class="dot <?= $rest_ok ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $rest_ok ? 'var(--success)' : 'var(--error)' ?>;">
                                <?= $rest_ok ? 'PASS' : 'FAIL' ?> (HTTP <?= esc_html($rest_code) ?>)
                            </span>
                        </span>
                    </div>
                    <?php if (!$rest_ok && !empty($rest_error)): ?>
                        <div style="font-size:10px; color:#ef4444; background:rgba(239, 68, 68, 0.05); padding:6px 10px; border-radius:6px; border:1px solid rgba(239, 68, 68, 0.1); font-family:monospace; margin-bottom:10px;"><?= esc_html($rest_error) ?></div>
                    <?php endif; ?>

                    <div class="check-item">
                        <span class="check-label">cURL Test (Strict SSL POS check)</span>
                        <span class="status-dot">
                            <span class="dot <?= $ssl_verify_ok ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $ssl_verify_ok ? 'var(--success)' : 'var(--error)' ?>;">
                                <?= $ssl_verify_ok ? 'PASS' : 'FAIL' ?> (HTTP <?= esc_html($ssl_response_code) ?>)
                            </span>
                        </span>
                    </div>
                    <?php if (!$ssl_verify_ok && !empty($ssl_error)): ?>
                        <div style="font-size:10px; color:#ef4444; background:rgba(239, 68, 68, 0.05); padding:6px 10px; border-radius:6px; border:1px solid rgba(239, 68, 68, 0.1); font-family:monospace; margin-bottom:10px;"><?= esc_html($ssl_error) ?></div>
                    <?php endif; ?>

                    <div class="check-item">
                        <span class="check-label">cURL Test (Bypass SSL POS check)</span>
                        <span class="status-dot">
                            <span class="dot <?= $ssl_no_verify_ok ? 'dot-success' : 'dot-error' ?>"></span>
                            <span style="color: <?= $ssl_no_verify_ok ? 'var(--success)' : 'var(--error)' ?>;">
                                <?= $ssl_no_verify_ok ? 'PASS' : 'FAIL' ?> (HTTP <?= esc_html($no_ssl_response_code) ?>)
                            </span>
                        </span>
                    </div>
                    <?php if (!$ssl_no_verify_ok && !empty($no_ssl_error)): ?>
                        <div style="font-size:10px; color:#ef4444; background:rgba(239, 68, 68, 0.05); padding:6px 10px; border-radius:6px; border:1px solid rgba(239, 68, 68, 0.1); font-family:monospace; margin-bottom:10px;"><?= esc_html($no_ssl_error) ?></div>
                    <?php endif; ?>

                    <div style="margin-top:15px; font-size:11px; background:rgba(255, 255, 255, 0.02); border:1px solid rgba(255, 255, 255, 0.04); padding:12px; border-radius:10px; line-height:1.6; text-align:left;">
                        💡 <strong>Loopback & Connection Analysis:</strong><br>
                        <?php if (!$rest_ok): ?>
                            <span style="color:#ef4444; font-weight:700;">⚠️ Local WooCommerce REST API is blocked!</span> Security plugins or server configurations (e.g. Cloudflare, Wordfence, basic auth) are blocking loopback calls to <code>/wp-json/wc/v3</code>. This will completely prevent VenQore from reading/writing to your store. Disable API blocks or Whitelist VenQore.<br>
                        <?php endif; ?>
                        <?php if (!$permalinks_ok): ?>
                            <span style="color:#ef4444; font-weight:700;">⚠️ Plain Permalinks are active!</span> Go to <strong>Settings > Permalinks</strong> and change it to anything other than "Plain" (e.g. "Post name"). WooCommerce API requests will always fail on Plain permalinks.<br>
                        <?php endif; ?>
                        <?php if ($ssl_no_verify_ok && !$ssl_verify_ok): ?>
                            <span style="color:#f59e0b; font-weight:700;">Hostinger/Server SSL validation failure!</span> The WordPress server can talk to the POS backend, but rejects the SSL certificate. The handshake will still proceed safely because the bypass is active.<br>
                        <?php elseif ($ssl_no_verify_ok && $ssl_verify_ok): ?>
                            <span style="color:#10b981; font-weight:700;">Perfect connection!</span> Server-to-server TLS handshakes are completely unimpeded.<br>
                        <?php else: ?>
                            <span style="color:#ef4444; font-weight:700;">Server cannot reach POS at all.</span> Your WordPress server has a host firewall, routing block, or offline IP restriction preventing any communication with the POS address.
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Card 4: Integration DB States -->
                <div class="card">
                    <div class="card-glow"></div>
                    <h2>💾 WordPress DB Option Statuses</h2>
                    
                    <div class="check-item">
                        <span class="check-label">venqore_sync_connected</span>
                        <span class="check-value" style="color: <?= $connected ? 'var(--success)' : 'var(--text-secondary)' ?>;"><?= $connected ? 'true' : 'false' ?></span>
                    </div>

                    <div class="check-item">
                        <span class="check-label">WooCommerce Generated API Keys</span>
                        <span class="status-dot">
                            <span class="dot <?= $has_api_keys ? 'dot-success' : 'dot-warning' ?>"></span>
                            <span style="color: <?= $has_api_keys ? 'var(--success)' : 'var(--warning)' ?>;"><?= $has_api_keys ? esc_html(count($api_keys_list)) . ' Found' : '0 Generated' ?></span>
                        </span>
                    </div>

                    <?php if ($has_api_keys): ?>
                        <div style="font-size:10px; background:rgba(255, 255, 255, 0.02); border:1px solid rgba(255, 255, 255, 0.04); padding:8px 12px; border-radius:8px; margin-top:8px; line-height:1.5; text-align:left;">
                            <?php foreach ($api_keys_list as $key): ?>
                                🔑 <strong>ID <?= esc_html($key->key_id) ?>:</strong> <code>...<?= esc_html($key->truncated_key) ?></code> (<?= esc_html($key->permissions) ?>)<br>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <div class="check-item" style="margin-top:10px;">
                        <span class="check-label">WooCommerce Registered Webhooks</span>
                        <span class="status-dot">
                            <span class="dot <?= count($registered_webhooks) > 0 ? 'dot-success' : 'dot-warning' ?>"></span>
                            <span style="color: <?= count($registered_webhooks) > 0 ? 'var(--success)' : 'var(--warning)' ?>;"><?= count($registered_webhooks) ?> Active</span>
                        </span>
                    </div>

                    <?php if (count($registered_webhooks) > 0): ?>
                        <div style="font-size:10px; background:rgba(255, 255, 255, 0.02); border:1px solid rgba(255, 255, 255, 0.04); padding:8px 12px; border-radius:8px; margin-top:8px; line-height:1.5; max-height: 80px; overflow-y: auto; text-align:left;">
                            <?php foreach ($registered_webhooks as $wh): ?>
                                ⚓ <code><?= esc_html($wh['topic']) ?></code> -> <span style="color:#a5b4fc;"><?= esc_html(substr($wh['delivery_url'], 0, 30)) ?>...</span><br>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- ─── Live Telemetry Debug Logs ─── -->
            <div class="card" style="margin-bottom: 30px;">
                <div class="card-glow"></div>
                <h2>📟 Live System Telemetry & Event Log</h2>
                <p style="font-size:11px; color: var(--text-secondary); margin:-10px 0 15px 0;">Real-time chronological log of all integration and handshake actions.</p>
                
                <div class="log-box" style="max-height: 250px;"><?php
                    $logs = get_option('venqore_sync_debug_logs', []);
                    if (empty($logs)) {
                        echo 'No telemetry events recorded yet.';
                    } else {
                        foreach (array_reverse($logs) as $log) {
                            echo '[' . esc_html($log['time']) . '] ' . esc_html($log['msg']) . "\n";
                        }
                    }
                ?></div>
            </div>

            <!-- ─── Stored Telemetry Console & Diagnostics ─── -->
            <div class="card" style="margin-bottom: 30px;">
                <div class="card-glow"></div>
                <h2>📟 Stored Handshake Diagnostic History Log</h2>
                <p style="font-size:11px; color: var(--text-secondary); margin:-10px 0 15px 0;">This logs the exact response code, headers, and debug message of the last handshake attempt.</p>
                
                <div class="log-box"><?= !empty($handshake_error) ? esc_html($handshake_error) : 'NO DIAGNOSTIC ERRORS STORED. The server has not encountered a handshake block, or has not attempted a connection yet.' ?></div>
                
                <?php if ($last_attempt > 0): ?>
                    <div style="font-size:11px; margin-top:10px; color:var(--text-secondary); text-align:left;">
                        🕒 Last attempted: <strong style="color:#ffffff;"><?= esc_html(date('Y-m-d H:i:s', $last_attempt)) ?></strong> (<?= esc_html(human_time_diff($last_attempt)) ?> ago)
                    </div>
                <?php endif; ?>
            </div>

            <!-- ─── Interactive Diagnostic Console Controls ─── -->
            <div class="card">
                <div class="card-glow"></div>
                <h2>🛠️ Diagnostic Panel Operations</h2>
                <p style="font-size:11px; color: var(--text-secondary); margin:-10px 0 15px 0;">Trigger direct actions inside the WordPress environment to debug handshakes in real-time.</p>
                
                <div class="actions-panel">
                    <a href="<?= esc_url(add_query_arg(['venqore_action' => 'force_handshake', 'venqore_debug' => isset($_GET['venqore_debug']) ? $_GET['venqore_debug'] : '1'])) ?>" class="btn btn-primary">
                        🚀 Force Handshake Attempt Now
                    </a>
                    
                    <a href="<?= esc_url(add_query_arg(['venqore_action' => 'reset_connection', 'venqore_debug' => isset($_GET['venqore_debug']) ? $_GET['venqore_debug'] : '1'])) ?>" class="btn btn-danger" onclick="return confirm('Are you sure you want to purge all connection metadata, tokens, and active flags? This will cleanly reset the integration.');">
                        🗑️ Reset Connection & Purge Options
                    </a>

                    <a href="<?= esc_url(admin_url('admin.php?page=venqore-sync')) ?>" class="btn btn-secondary">
                        🔌 Go to WP Admin Settings
                    </a>
                </div>

                <div class="secret-box">
                    🔒 <strong>Secure Debug Parameter:</strong> Share or bookmark this URL to access this Diagnostic Room directly from any device without needing to log in to WordPress:<br>
                    <code style="display:block; margin-top:8px; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); user-select:all; word-break:break-all;">
                        <?= esc_html(get_site_url() . '/?venqore_debug=' . ($setup_token ?: '1')) ?>
                    </code>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}
