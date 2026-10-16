import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config/app_config.dart';
import '../core/navigation_policy.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import 'about_app_screen.dart';
import 'account_center_screen.dart';
import 'activity_center_screen.dart';
import 'business_menu_screen.dart';
import 'help_screen.dart';
import 'pos_center_screen.dart';
import 'quick_actions_screen.dart';
import 'sales_center_screen.dart';
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
  late String _title;
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
    _title = widget.initialTitle;
    _policy = NavigationPolicy();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(_defaultUserAgent)
      ..setBackgroundColor(AppColors.canvas)
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
            final path = uri?.path ?? '';
            _runAutofill(uri);
            final isGoogle = _googleOAuthActive ||
                (uri != null && _policy.isGoogleOAuthProvider(uri));
            setState(() {
              _progress = 100;
              _currentUri = uri;
              if (isGoogle) {
                _title = 'Sign in with Google';
              } else {
                _title = switch (path) {
                  final value when value.endsWith('/dashboard') => 'My dashboard',
                  final value when value.endsWith('/my-rides') => 'My rides',
                  '/login' => 'Sign in',
                  final value when value.startsWith('/auth/native-ticket/') => 'Signing you in',
                  final value when value.startsWith('/s/') => 'VenQore Business',
                  '/shop' => 'Explore Stores',
                  final value when value.startsWith('/shop/') => 'Store',
                  final value when value.startsWith('/order-status') => 'Order status',
                  '/register' => 'Create account',
                  '/build-workspace' => 'Build your workspace',
                  '/verify-code' => 'Verify your email',
                  final value when value.startsWith('/2fa/') => 'Security check',
                  _ => widget.initialTitle,
                };
              }
            });
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

  NavigationDecision _handleNavigation(NavigationRequest request) {
    if (!request.isMainFrame) return NavigationDecision.navigate;
    final uri = Uri.tryParse(request.url);
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
    return _storeHomeUri != null;
  }

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

  int get _selectedNavigationIndex {
    final path = _currentUri?.path ?? '';
    if (path.endsWith('/dashboard')) return 0;
    if (path.endsWith('/pos') || path.contains('/pos/')) return 2;
    if (path.contains('/sales')) return 1;
    return 3;
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
                    subtitle: const Text('Profile, team, and business settings'),
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
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'Back',
            onPressed: _goBack,
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          titleSpacing: 0,
          title: Text(
            _title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
          ),
          actions: [
            if (!_googleOAuthActive && !_isMarketplace && _storeHomeUri != null)
              IconButton(
                tooltip: 'Activity',
                onPressed: () => _openNativePage(const ActivityCenterScreen()),
                icon: const Icon(Icons.notifications_none_rounded),
              ),
            if (!_googleOAuthActive && !_isMarketplace && _isDashboard)
              IconButton(
                tooltip: 'Add dashboard card',
                onPressed: () => _openDashboardAction('add_card'),
                icon: const Icon(Icons.add_chart_rounded),
              ),
            if (!_googleOAuthActive && !_isMarketplace && _isDashboard)
              IconButton(
                tooltip: 'Edit dashboard layout',
                onPressed: () => _openDashboardAction('edit'),
                icon: const Icon(Icons.dashboard_customize_outlined),
              ),
            if (!_googleOAuthActive)
              IconButton(
                tooltip: 'More',
                onPressed: _openMore,
                icon: const Icon(Icons.more_horiz_rounded),
              ),
          ],
          bottom: _progress < 100
              ? PreferredSize(
                  preferredSize: const Size.fromHeight(2),
                  child: LinearProgressIndicator(
                    value: _progress / 100,
                    minHeight: 2,
                    backgroundColor: AppColors.line,
                    color: AppColors.teal,
                  ),
                )
              : null,
        ),
        body: _hasError
            ? _ConnectionError(onRetry: () => _controller.reload())
            : WebViewWidget(controller: _controller),
        bottomNavigationBar: _showBottomNav
            ? NavigationBar(
                height: 72,
                selectedIndex: _selectedNavigationIndex,
                indicatorColor: const Color(0xFFE6F8F3),
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.dashboard_outlined),
                    selectedIcon: Icon(Icons.dashboard_rounded),
                    label: 'Dashboard',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.receipt_long_outlined),
                    selectedIcon: Icon(Icons.receipt_long_rounded),
                    label: 'Sales',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.point_of_sale_outlined),
                    selectedIcon: Icon(Icons.point_of_sale_rounded),
                    label: 'POS',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.more_horiz_rounded),
                    label: 'More',
                  ),
                ],
                onDestinationSelected: (index) {
                  switch (index) {
                    case 0:
                      final home = _storeHomeUri;
                      _controller.loadRequest(home ?? AppConfig.loginUri);
                    case 1:
                      _openNativePage(const SalesCenterScreen());
                    case 2:
                      _openNativePage(const PosCenterScreen());
                    case 3:
                      _openMore();
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
