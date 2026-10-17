import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../config/app_config.dart';
import '../core/app_side.dart';
import '../core/navigation_policy.dart';
import '../core/push_service.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import '../widgets/app_nav_bar.dart';
import 'about_app_screen.dart';
import 'account_center_screen.dart';
import 'activity_center_screen.dart';
import 'business_menu_screen.dart';
import 'help_screen.dart';
import 'register_screen.dart';
import 'sign_in_screen.dart';
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

  AppSide? get _side => AppSideStore.current;

  /// `VenQoreSide/customer` or `VenQoreSide/store` tells the server which side of the app is asking.
  String get _defaultUserAgent =>
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 '
      'VenQoreMobile/1.0${_side == null ? '' : ' VenQoreSide/${_side!.name}'}';

  static const String _cleanBrowserUserAgent =
      'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

  @override
  void initState() {
    super.initState();
    _policy = NavigationPolicy(side: AppSideStore.current);
    PushService.addOpener(_openPath);
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
            final uri = Uri.tryParse(url);
            if (uri != null) _useNativeSignIn(uri);
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
    _allowLocation();
  }

  /// Pages ask for the phone's location (find stores near me, delivery address). Android needs the app
  /// itself to hold the permission and to answer the web view's prompt; only VenQore's own site is answered.
  static const _permissions = MethodChannel('venqore/permissions');

  void _allowLocation() {
    final platform = _controller.platform;
    if (platform is! AndroidWebViewController) return;
    platform.setGeolocationPermissionsPromptCallbacks(
      onShowPrompt: (request) async {
        final origin = Uri.tryParse(request.origin);
        if (origin == null || !_policy.isSameOrigin(origin)) {
          return const GeolocationPermissionsResponse(
            allow: false,
            retain: false,
          );
        }
        bool granted;
        try {
          granted =
              await _permissions.invokeMethod<bool>('requestLocation') ?? false;
        } catch (_) {
          granted = false;
        }
        return GeolocationPermissionsResponse(allow: granted, retain: granted);
      },
    );
  }

  @override
  void dispose() {
    PushService.removeOpener(_openPath);
    super.dispose();
  }

  /// A tapped notification opens its page here (the newest web screen handles it).
  void _openPath(String path) {
    if (mounted) _controller.loadRequest(PushService.resolve(path));
  }

  bool _pushTried = false;

  /// Once per screen, on a signed-in store page: ask in plain words, then give this phone's address to
  /// the signed-in account (from inside the web view, so it uses the same session).
  Future<void> _registerPush() async {
    if (_pushTried || _slug == null) return;
    _pushTried = true;
    final token = await PushService.token(context);
    if (token != null && mounted) {
      await _controller.runJavaScript(PushService.registerScript(token));
    }
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

  bool _nativeShown = false;

  /// Sign-in and sign-up are always the app's own screens. A page here only keeps the website's form when
  /// the native screen just handed it the details to submit (autofill).
  void _useNativeSignIn(Uri uri) {
    if (widget.autofill != null || _nativeShown || !_policy.isSameOrigin(uri)) {
      return;
    }
    if (uri.path != '/login' && uri.path != '/register') return;
    _nativeShown = true;
    final side = _side ?? AppSide.store;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => uri.path == '/register'
            ? RegisterScreen(side: side)
            : SignInScreen(side: side),
      ),
    );
  }

  /// The customer dashboard's "Create your own store" is the one door to the store side.
  Future<void> _becomeOwner(String path) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Become a store owner?'),
        content: const Text(
          'You will switch to the store side and set up your own store. You can switch back to customer from your account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    await AppSideStore.set(AppSide.store);
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (_) =>
            BusinessWebScreen(initialPath: path, initialTitle: 'VenQore'),
      ),
      (_) => false,
    );
  }

  NavigationDecision _handleNavigation(NavigationRequest request) {
    final uri = Uri.tryParse(request.url);
    if (uri != null && _opensOutsideApp(uri)) {
      launchUrl(uri, mode: LaunchMode.externalApplication);
      return NavigationDecision.prevent;
    }
    if (!request.isMainFrame) return NavigationDecision.navigate;
    if (uri == null) return NavigationDecision.prevent;

    if (_policy.isSameOrigin(uri)) {
      if (_side == AppSide.customer &&
          (uri.path == '/new-store' ||
              uri.path == '/start' ||
              uri.path == '/dashboard')) {
        _becomeOwner(uri.path == '/dashboard' ? '/dashboard' : '/new-store');
        return NavigationDecision.prevent;
      }
      if (widget.autofill == null &&
          (uri.path == '/login' || uri.path == '/register')) {
        _useNativeSignIn(uri);
        return NavigationDecision.prevent;
      }
    }

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
          final other = _policy.belongsToOtherSide(uri);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                other
                    ? 'That page is on the ${_side == AppSide.customer ? 'store' : 'customer'} side of VenQore. Change sides from your account if you need it.'
                    : 'That page is not available inside the VenQore app.',
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
    final pushToken = PushService.currentToken;
    if (pushToken != null) {
      // Stop alerts to this phone for this account before the session ends.
      await _controller.runJavaScript(PushService.removeScript(pushToken));
      await Future<void>.delayed(const Duration(milliseconds: 700));
    }
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
  int? _padApplied;

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
    _registerPush();
  }

  /// The bar floats over the page, so the scrolling area gets room under its last row.
  void _syncPadding() {
    final show = _showBottomNav;
    final market = _showMarketNav;
    final key = (show ? 1 : 0) + (market ? 2 : 0);
    if (_padApplied == key) return;
    _padApplied = key;
    _controller.runJavaScript(
      "(function(){var s=document.getElementById('vq-native-nav-pad');"
      "if(!s){s=document.createElement('style');s.id='vq-native-nav-pad';"
      "s.textContent='html.vq-native-nav [data-vq-content]{padding-bottom:104px !important}"
      "html.vq-native-market body{padding-bottom:96px !important}';"
      "document.head.appendChild(s);}"
      "document.documentElement.classList.toggle('vq-native-nav',$show);"
      "document.documentElement.classList.toggle('vq-native-market',$market);})();",
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


  /// Pages with no bottom bar (a rider's rides) still need a way to reach the account sheet.
  bool get _showProfileButton {
    if (_googleOAuthActive || _showBottomNav) return false;
    final path = _currentUri?.path ?? '';
    // Public customer pages (stores, ordering): a profile button takes you to your own dashboard.
    // The dashboard itself has its own menu, so no button there.
    if (_showMarketNav) return path != '/my-orders';
    return path.endsWith('/my-rides');
  }

  // ── Account sheet: customer side, seller side, create a store ──────────────
  Map<String, dynamic>? _context;

  void _onBridge(String message) {
    try {
      final data = jsonDecode(message) as Map<String, dynamic>;
      if (data['t'] == 'signout' && mounted) {
        _confirmSignOut();
        return;
      }
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

  /// Native sign-in / register screens (the sheet closes first).
  void _openNative(Widget page) {
    Navigator.pop(context);
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));
  }

  /// The one way across: an explicit, confirmed switch. The pages themselves can never link across.
  Future<void> _switchSide(BuildContext sheet, bool hasStore) async {
    final to = (_side ?? AppSide.store).other;
    final toCustomer = to == AppSide.customer;
    final ok = await showDialog<bool>(
      context: sheet,
      builder: (c) => AlertDialog(
        title: Text(
          toCustomer ? 'Switch to the customer side?' : 'Become a store owner?',
        ),
        content: Text(
          toCustomer
              ? 'You will see stores and your orders instead of business tools. You can switch back from your account.'
              : hasStore
              ? 'You will open your business tools. You can switch back from your account.'
              : 'You will set up your own store. You can switch back to customer from your account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
            child: Text(toCustomer ? 'Switch' : 'Continue'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    await AppSideStore.set(to);
    if (!mounted) return;
    Navigator.pop(context); // the sheet
    final path = toCustomer ? '/shop' : (hasStore ? '/dashboard' : '/start');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (_) =>
            BusinessWebScreen(initialPath: path, initialTitle: 'VenQore'),
      ),
      (_) => false,
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
              if (ctx == null) ...[
                Text(
                  _side == AppSide.customer
                      ? 'You are browsing as a guest. Sign in to track your orders and keep your points, or create a free account.'
                      : 'Sign in to your business, or create one.',
                  style: const TextStyle(
                    fontSize: 13.5,
                    height: 1.4,
                    color: AppColors.inkMuted,
                  ),
                ),
                const SizedBox(height: 10),
                _AccountTile(
                  icon: Icons.login_rounded,
                  title: 'Sign in',
                  subtitle: 'Use your VenQore account',
                  onTap: () =>
                      _openNative(SignInScreen(side: _side ?? AppSide.store)),
                ),
                _AccountTile(
                  icon: Icons.person_add_alt_1_rounded,
                  title: 'Create an account',
                  subtitle: _side == AppSide.customer
                      ? 'Order and track from any store'
                      : 'Start your business workspace',
                  onTap: () =>
                      _openNative(RegisterScreen(side: _side ?? AppSide.store)),
                ),
              ],
              // ── Customer side: the customer dashboard only ──
              if (ctx != null && _side == AppSide.customer) ...[
                _AccountTile(
                  icon: Icons.dashboard_customize_outlined,
                  title: 'My dashboard',
                  subtitle: 'Orders, favourites, addresses and your details',
                  onTap: () => _goTo('/my-orders'),
                ),
                _AccountTile(
                  icon: Icons.settings_outlined,
                  title: 'Profile settings',
                  subtitle: 'Your account, and creating your own store',
                  onTap: () => _goTo('/my-orders?tab=profile'),
                ),
              ],
              // ── Store side: the businesses you belong to, or set one up ──
              if (ctx != null && _side != AppSide.customer) ...[
                for (final store in stores)
                  _AccountTile(
                    icon: Icons.storefront_rounded,
                    title: store['name'] as String,
                    subtitle: _roleLabel(store['role'] as String?),
                    onTap: () => _goTo(store['home'] as String),
                  ),
                if (stores.isEmpty)
                  _AccountTile(
                    icon: Icons.add_business_outlined,
                    title: 'Create your store',
                    subtitle: 'Start selling with VenQore',
                    highlight: true,
                    onTap: () =>
                        _goTo((ctx['create_store'] as String?) ?? '/new-store'),
                  ),
                _AccountTile(
                  icon: Icons.swap_horiz_rounded,
                  title: 'Switch to customer side',
                  subtitle: 'Order from stores instead',
                  onTap: () => _switchSide(sheet, stores.isNotEmpty),
                ),
              ],
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
                  top: _showMarketNav ? 10 : null,
                  bottom: _showMarketNav
                      ? null
                      : 12 + MediaQuery.of(context).padding.bottom,
                  child: _ProfileButton(onTap: _openAccount),
                ),
            ],
          ),
        ),
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
