import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config/app_config.dart';
import '../core/navigation_policy.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import '../widgets/app_nav_bar.dart';
import 'about_app_screen.dart';
import 'account_center_screen.dart';
import 'activity_center_screen.dart';
import 'business_menu_screen.dart';
import 'help_screen.dart';
import 'quick_actions_screen.dart';
import 'welcome_screen.dart';
import 'workspace_screen.dart';

class BusinessWebScreen extends StatefulWidget {
  const BusinessWebScreen({
    this.initialPath = '/login',
    this.initialTitle = 'Business sign in',
    this.autofill,
    super.key,
  });

  final String initialPath;
  final String initialTitle;

  /// Typed on a native screen and handed to the matching web page once (see [WebAutofill]).
  final WebAutofill? autofill;

  @override
  State<BusinessWebScreen> createState() => _BusinessWebScreenState();
}

class _BusinessWebScreenState extends State<BusinessWebScreen> {
  late final WebViewController _controller;
  late final NavigationPolicy _policy;
  int _progress = 0;
  bool _hasError = false;
  bool _replacingRoot = false;
  bool _googleOAuthActive = false;
  bool _autofilled = false;
  Uri? _currentUri;

  static const String _defaultUserAgent =
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 '
      'VenQoreMobile/1.0';

  static const String _cleanBrowserUserAgent =
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

  @override
  void initState() {
    super.initState();
    _policy = NavigationPolicy();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(_defaultUserAgent)
      ..setBackgroundColor(AppColors.canvas)
      ..addJavaScriptChannel(
        'VQ',
        onMessageReceived: (m) => _onBridge(m.message),
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress);
          },
          onPageStarted: (url) {
            if (mounted) setState(() => _hasError = false);
          },
          onPageFinished: (url) {
            if (!mounted) return;
            final uri = Uri.tryParse(url);
            _runAutofill(uri);
            setState(() {
              _progress = 100;
              _currentUri = uri;
              _padApplied = null;
            });
            _syncNav();
          },
          // In-page moves (the site changes screens without reloading) still update the app's bars.
          onUrlChange: (change) {
            final uri = change.url == null ? null : Uri.tryParse(change.url!);
            if (mounted && uri != null) {
              setState(() => _currentUri = uri);
              _syncNav();
            }
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame == true && mounted) {
              setState(() => _hasError = true);
            }
          },
          onNavigationRequest: _handleNavigation,
        ),
      )
      ..loadRequest(AppConfig.baseUri.resolve(widget.initialPath));
  }

  /// Hands the native form's input to the web page, once, and only on our own site.
  void _runAutofill(Uri? uri) {
    final autofill = widget.autofill;
    if (autofill == null || _autofilled || uri == null) return;
    if (!_policy.isSameOrigin(uri) || !autofill.matches(uri)) return;
    _autofilled = true;
    _controller.runJavaScript(autofill.script());
  }

  /// Phone calls, messages, WhatsApp and maps belong to the phone's own apps, not the web view.
  bool _opensOutsideApp(Uri uri) {
    if (const {
      'tel',
      'sms',
      'mailto',
      'geo',
      'whatsapp',
    }.contains(uri.scheme)) {
      return true;
    }
    final host = uri.host.toLowerCase();
    if (host == 'wa.me' ||
        host == 'api.whatsapp.com' ||
        host == 'maps.app.goo.gl') {
      return true;
    }
    return (host == 'www.google.com' || host == 'google.com') &&
        uri.path.startsWith('/maps');
  }

  NavigationDecision _handleNavigation(NavigationRequest request) {
    final uri = Uri.tryParse(request.url);
    if (uri != null && _opensOutsideApp(uri)) {
      launchUrl(uri, mode: LaunchMode.externalApplication);
      return NavigationDecision.prevent;
    }
    if (!request.isMainFrame) return NavigationDecision.navigate;
    if (uri == null) return NavigationDecision.prevent;

    if (_policy.isGoogleOAuthStart(uri)) {
      _googleOAuthActive = true;
      _controller.setUserAgent(_cleanBrowserUserAgent);
      return NavigationDecision.navigate;
    }
    if (_googleOAuthActive && _policy.isGoogleOAuthProvider(uri)) {
      return NavigationDecision.navigate;
    }
    if (_policy.isGoogleOAuthCallback(uri)) {
      _googleOAuthActive = false;
      _controller.setUserAgent(_defaultUserAgent);
      return NavigationDecision.navigate;
    }

    switch (_policy.evaluate(uri)) {
      case NavigationAction.allow:
        return NavigationDecision.navigate;
      case NavigationAction.replaceWithLogin:
        if (!_replacingRoot) {
          _replacingRoot = true;
          Future<void>.microtask(() async {
            await _controller.loadRequest(AppConfig.loginUri);
            _replacingRoot = false;
          });
        }
        return NavigationDecision.prevent;
      case NavigationAction.block:
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'That page is not available inside the VenQore app.',
              ),
            ),
          );
        });
        return NavigationDecision.prevent;
    }
  }

  Future<void> _goBack() async {
    if (_googleOAuthActive) {
      _googleOAuthActive = false;
      await _controller.setUserAgent(_defaultUserAgent);
      await _controller.loadRequest(AppConfig.loginUri);
      return;
    }
    if (await _controller.canGoBack()) {
      await _controller.goBack();
    } else if (mounted) {
      Navigator.of(context).maybePop();
    }
  }

  Future<void> _signOut() async {
    await _controller.loadRequest(AppConfig.baseUri.resolve('/logout'));
    await WebViewCookieManager().clearCookies();
    await _controller.clearCache();
    await _controller.clearLocalStorage();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const WelcomeScreen()),
      (_) => false,
    );
  }

  Future<void> _confirmSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
          'You will need to sign in again to open your business workspace.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed == true) await _signOut();
  }

  Uri? get _storeHomeUri {
    final segments = _currentUri?.pathSegments ?? const <String>[];
    if (segments.length < 2 || segments.first != 's') return null;
    return AppConfig.baseUri.resolve('/s/${segments[1]}/dashboard');
  }

  bool get _isDashboard => _currentUri?.path.endsWith('/dashboard') ?? false;

  bool get _isMarketplace {
    final path = _currentUri?.path ?? '';
    return path.startsWith('/shop') || path.startsWith('/order-status');
  }

  bool get _showBottomNav {
    if (_googleOAuthActive) return false;
    final path = _currentUri?.path ?? '';
    if (path == '/login' ||
        path == '/register' ||
        path == '/start' ||
        path == '/verify-code' ||
        path == '/verify-email' ||
        path == '/forgot-password' ||
        path == '/confirm-password' ||
        path.startsWith('/2fa/') ||
        _isMarketplace ||
        // A rider's home is their rides: no dashboard/sales/POS tabs they cannot use.
        path.endsWith('/my-rides') ||
        path.startsWith('/rider/')) {
      return false;
    }
    final nav = _nav;
    if (_storeHomeUri == null || nav == null) return false;
    return !nav.hiddenAt(path);
  }

  // ── The phone bar (same as the website's), drawn natively ─────────────────
  AppNavConfig? _nav;
  String? _navSlug;
  bool? _padApplied;

  String? get _slug {
    final segs = _currentUri?.pathSegments ?? const <String>[];
    return segs.length >= 2 && segs.first == 's' ? segs[1] : null;
  }

  /// Fetches the bar for the store being viewed (once per store) and keeps the page clear of it.
  void _syncNav() {
    final slug = _slug;
    if (slug != null && slug != _navSlug) {
      _navSlug = slug;
      _nav = null;
      _controller.runJavaScript(
        "fetch('/s/$slug/app-nav',{credentials:'same-origin',headers:{'Accept':'application/json'}})"
        ".then(function(r){return r.ok?r.json():null}).catch(function(){return null})"
        ".then(function(j){VQ.postMessage(JSON.stringify({t:'nav',slug:'$slug',d:j}))});",
      );
    }
    _syncPadding();
  }

  /// The bar floats over the page, so the scrolling area gets room under its last row.
  void _syncPadding() {
    final show = _showBottomNav;
    if (_padApplied == show) return;
    _padApplied = show;
    _controller.runJavaScript(
      "(function(){var s=document.getElementById('vq-native-nav-pad');"
      "if(!s){s=document.createElement('style');s.id='vq-native-nav-pad';"
      "s.textContent='html.vq-native-nav [data-vq-content]{padding-bottom:104px !important}';"
      "document.head.appendChild(s);}"
      "document.documentElement.classList.toggle('vq-native-nav',$show);})();",
    );
  }

  bool get _showMarketNav {
    if (_googleOAuthActive) return false;
    final path = _currentUri?.path ?? '';
    return path.startsWith('/shop') ||
        path.startsWith('/order-status') ||
        path == '/order-lookup' ||
        path == '/my-orders';
  }

  int get _marketIndex => (_currentUri?.path ?? '').startsWith('/shop') ? 0 : 1;

  /// Pages with no bottom bar (a rider's rides) still need a way to reach the account sheet.
  bool get _showProfileButton {
    if (_googleOAuthActive || _showBottomNav || _showMarketNav) return false;
    final path = _currentUri?.path ?? '';
    return path.endsWith('/my-rides');
  }

  // ── Account sheet: customer side, seller side, create a store ──────────────
  Map<String, dynamic>? _context;

  void _onBridge(String message) {
    try {
      final data = jsonDecode(message) as Map<String, dynamic>;
      if (data['t'] == 'nav' && mounted && data['slug'] == _navSlug) {
        final d = data['d'];
        setState(() {
          _nav = d is Map<String, dynamic> ? AppNavConfig.fromJson(d) : null;
          _padApplied = null;
        });
        _syncPadding();
        return;
      }
      if (data['t'] == 'ctx' && mounted) {
        _context = data['d'] as Map<String, dynamic>?;
        _showAccountSheet();
      }
    } catch (_) {}
  }

  /// Asks the signed-in web session who this is (same cookies, no second login).
  Future<void> _openAccount() async {
    await _controller.runJavaScript(
      "fetch('/app/context',{credentials:'same-origin',headers:{'Accept':'application/json'}})"
      ".then(function(r){return r.ok?r.json():null}).catch(function(){return null})"
      ".then(function(j){VQ.postMessage(JSON.stringify({t:'ctx',d:j}))});",
    );
  }

  void _goTo(String path) {
    Navigator.pop(context);
    _controller.loadRequest(AppConfig.baseUri.resolve(path));
  }

  void _showAccountSheet() {
    final ctx = _context;
    final stores = ((ctx?['stores'] as List?) ?? const [])
        .cast<Map<String, dynamic>>();
    final user = ctx?['user'] as Map<String, dynamic>?;

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      builder: (sheet) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (user != null) ...[
                Text(
                  (user['name'] as String?) ?? '',
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                Text(
                  (user['email'] as String?) ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.inkMuted,
                  ),
                ),
                const SizedBox(height: 14),
              ],
              const Text(
                'Go to',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppColors.inkFaint,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 6),
              _AccountTile(
                icon: Icons.shopping_bag_outlined,
                title: 'Customer dashboard',
                subtitle: 'Browse stores and track your orders',
                onTap: () =>
                    _goTo((ctx?['customer_home'] as String?) ?? '/shop'),
              ),
              for (final store in stores)
                _AccountTile(
                  icon: Icons.storefront_rounded,
                  title: 'Seller dashboard · ${store['name']}',
                  subtitle: _roleLabel(store['role'] as String?),
                  onTap: () => _goTo(store['home'] as String),
                ),
              if (ctx != null && stores.isEmpty)
                _AccountTile(
                  icon: Icons.add_business_outlined,
                  title: 'Create your own store',
                  subtitle: 'Start selling with VenQore',
                  highlight: true,
                  onTap: () =>
                      _goTo((ctx['create_store'] as String?) ?? '/new-store'),
                ),
              if (ctx == null)
                _AccountTile(
                  icon: Icons.login_rounded,
                  title: 'Sign in',
                  subtitle: 'Use your VenQore account',
                  onTap: () => _goTo('/login'),
                ),
              const SizedBox(height: 8),
              const Divider(),
              if (_storeHomeUri != null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.apps_rounded),
                  title: const Text('Business tools'),
                  onTap: () {
                    Navigator.pop(sheet);
                    _openMore();
                  },
                ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.help_outline_rounded),
                title: const Text('Help & security'),
                onTap: () {
                  Navigator.pop(sheet);
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const HelpScreen()),
                  );
                },
              ),
              if (ctx != null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.logout_rounded,
                    color: AppColors.danger,
                  ),
                  title: const Text(
                    'Sign out',
                    style: TextStyle(color: AppColors.danger),
                  ),
                  onTap: () {
                    Navigator.pop(sheet);
                    _confirmSignOut();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _roleLabel(String? role) => switch (role) {
    'owner' => 'Owner',
    'admin' => 'Admin',
    'manager' => 'Manager',
    'cashier' => 'Cashier',
    'custom' => 'Staff',
    null || '' => 'Team member',
    final r => r[0].toUpperCase() + r.substring(1),
  };

  Future<void> _openDashboardAction(String action) async {
    final dashboard = _storeHomeUri;
    if (dashboard == null) return;
    if (_isDashboard) {
      final event = switch (action) {
        'edit' => 'vq:edit-layout',
        'reset' => 'vq:start-fresh',
        _ => 'vq:add-card',
      };
      await _controller.runJavaScript(
        "window.dispatchEvent(new CustomEvent('$event'));",
      );
      return;
    }
    await _controller.loadRequest(
      dashboard.replace(queryParameters: <String, String>{action: '1'}),
    );
  }

  Uri? _storePath(String path) {
    final segments = _currentUri?.pathSegments ?? const <String>[];
    if (segments.length < 2 || segments.first != 's') return null;
    return AppConfig.baseUri.resolve('/s/${segments[1]}$path');
  }

  Future<void> _openNativePage(Widget page) async {
    final path = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute<String>(builder: (_) => page));
    if (!mounted || path == null) return;
    final target = path == '/hub'
        ? AppConfig.baseUri.resolve(path)
        : _storePath(path);
    if (target != null) await _controller.loadRequest(target);
  }

  void _openMore() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      builder: (context) => SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_storeHomeUri != null) ...[
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppColors.pine,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: ListTile(
                      leading: const Icon(
                        Icons.grid_view_rounded,
                        color: Colors.white,
                      ),
                      title: const Text(
                        'All business tools',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      subtitle: const Text(
                        'Sales, stock, money, reports, team, and settings',
                        style: TextStyle(color: Color(0xFFB8D0CA)),
                      ),
                      trailing: const Icon(
                        Icons.arrow_forward_rounded,
                        color: Colors.white,
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        _openNativePage(const BusinessMenuScreen());
                      },
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.bolt_rounded),
                    title: const Text('Quick actions'),
                    subtitle: const Text('Start a sale, expense, or purchase'),
                    onTap: () {
                      Navigator.pop(context);
                      _openNativePage(const QuickActionsScreen());
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.notifications_active_outlined),
                    title: const Text('Activity'),
                    subtitle: const Text('Approvals and recent movement'),
                    onTap: () {
                      Navigator.pop(context);
                      _openNativePage(const ActivityCenterScreen());
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.apps_rounded),
                    title: const Text('Workspace'),
                    subtitle: const Text('Inventory, purchases, and reports'),
                    onTap: () {
                      Navigator.pop(context);
                      _openNativePage(const WorkspaceScreen());
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.manage_accounts_outlined),
                    title: const Text('Account & business'),
                    subtitle: const Text(
                      'Profile, team, and business settings',
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      _openNativePage(const AccountCenterScreen());
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.apps_rounded),
                    title: const Text('All business pages'),
                    subtitle: const Text('Open your workspace navigation'),
                    onTap: () {
                      Navigator.pop(context);
                      _controller.runJavaScript(
                        "window.dispatchEvent(new CustomEvent('vq:open-navigation'));",
                      );
                    },
                  ),
                ],
                if (_isDashboard) ...[
                  ListTile(
                    leading: const Icon(Icons.add_chart_rounded),
                    title: const Text('Add dashboard card'),
                    subtitle: const Text(
                      'Only cards available for your account can be added.',
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      _openDashboardAction('add_card');
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.dashboard_customize_outlined),
                    title: const Text('Edit layout'),
                    subtitle: const Text('Move and resize cards and graphs.'),
                    onTap: () {
                      Navigator.pop(context);
                      _openDashboardAction('edit');
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.view_quilt_outlined),
                    title: const Text('Choose starting layout'),
                    onTap: () {
                      Navigator.pop(context);
                      _openDashboardAction('reset');
                    },
                  ),
                  const Divider(),
                ],
                ListTile(
                  leading: const Icon(Icons.refresh_rounded),
                  title: const Text('Refresh this page'),
                  onTap: () {
                    Navigator.pop(context);
                    _controller.reload();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline_rounded),
                  title: const Text('Help & security'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(this.context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const HelpScreen(),
                      ),
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.info_outline_rounded),
                  title: const Text('About this app'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.of(this.context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const AboutAppScreen(),
                      ),
                    );
                  },
                ),
                if (_storeHomeUri != null)
                  ListTile(
                    leading: const Icon(
                      Icons.logout_rounded,
                      color: AppColors.danger,
                    ),
                    title: const Text(
                      'Sign out',
                      style: TextStyle(color: AppColors.danger),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      _confirmSignOut();
                    },
                  )
                else
                  ListTile(
                    leading: const Icon(Icons.home_outlined),
                    title: const Text('Return to start'),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.of(this.context).pushAndRemoveUntil(
                        MaterialPageRoute<void>(
                          builder: (_) => const WelcomeScreen(),
                        ),
                        (_) => false,
                      );
                    },
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _goBack();
      },
      child: Scaffold(
        backgroundColor: AppColors.canvas,
        body: SafeArea(
          bottom: false,
          child: Stack(
            children: [
              Positioned.fill(
                child: _hasError
                    ? _ConnectionError(onRetry: () => _controller.reload())
                    : WebViewWidget(controller: _controller),
              ),
              if (_progress < 100)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _progress / 100,
                    minHeight: 2,
                    backgroundColor: Colors.transparent,
                    color: AppColors.teal,
                  ),
                ),
              if (_showBottomNav && _nav != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: AppNavBar(
                    config: _nav!,
                    path: _currentUri?.path ?? '',
                    onOpen: (path) => _controller.loadRequest(
                      AppConfig.baseUri.resolve(path),
                    ),
                    onPlus: () => showQuickActions(
                      context,
                      actions: _nav!.actions,
                      onOpen: (path) => _controller.loadRequest(
                        AppConfig.baseUri.resolve(path),
                      ),
                      onAccount: _openAccount,
                    ),
                  ),
                ),
              if (_showProfileButton)
                Positioned(
                  right: 12,
                  bottom: 12 + MediaQuery.of(context).padding.bottom,
                  child: _ProfileButton(onTap: _openAccount),
                ),
            ],
          ),
        ),
        bottomNavigationBar: _showMarketNav
            ? NavigationBar(
                height: 68,
                selectedIndex: _marketIndex,
                indicatorColor: const Color(0xFFE6F8F3),
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.storefront_outlined),
                    selectedIcon: Icon(Icons.storefront_rounded),
                    label: 'Stores',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.receipt_long_outlined),
                    selectedIcon: Icon(Icons.receipt_long_rounded),
                    label: 'My orders',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.account_circle_outlined),
                    selectedIcon: Icon(Icons.account_circle_rounded),
                    label: 'Account',
                  ),
                ],
                onDestinationSelected: (index) {
                  switch (index) {
                    case 0:
                      _controller.loadRequest(
                        AppConfig.baseUri.resolve('/shop'),
                      );
                    case 1:
                      _controller.loadRequest(
                        AppConfig.baseUri.resolve('/my-orders'),
                      );
                    case 2:
                      _openAccount();
                  }
                },
              )
            : null,
      ),
    );
  }
}

class _ConnectionError extends StatelessWidget {
  const _ConnectionError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 44,
              color: AppColors.inkMuted,
            ),
            const SizedBox(height: 16),
            Text(
              'Could not open VenQore',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Check your internet connection and try again.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.inkMuted),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _ProfileButton extends StatelessWidget {
  const _ProfileButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pine,
      shape: const CircleBorder(),
      elevation: 3,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: const SizedBox(
          width: 46,
          height: 46,
          child: Icon(Icons.person_rounded, color: Colors.white, size: 24),
        ),
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.highlight = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: highlight ? AppColors.pine : AppColors.surface2,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: highlight ? AppColors.tealBright : AppColors.teal600,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: highlight ? Colors.white : AppColors.ink,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12.5,
                          color: highlight
                              ? const Color(0xFFC6F5E9)
                              : AppColors.inkMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: highlight ? Colors.white70 : AppColors.inkFaint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
