import '../config/app_config.dart';
import 'app_side.dart';

enum NavigationAction { allow, replaceWithLogin, block }

/// What the in-app web view may open.
///
/// Sign-in and legal pages are shared. Everything else belongs to one side of the app: customer pages
/// never open on the store side and store pages never open on the customer side. With no side given
/// (tests) every app page is allowed.
class NavigationPolicy {
  NavigationPolicy({Uri? baseUri, this.side})
    : baseUri = baseUri ?? AppConfig.baseUri;

  final Uri baseUri;
  final AppSide? side;

  static const _sharedExact = <String>{
    '/account',
    '/auth/google',
    '/auth/google/callback',
    '/confirm-password',
    '/forgot-password',
    '/login',
    '/login/passcode',
    '/login/pin',
    '/logout',
    '/privacy',
    '/profile',
    '/register',
    '/terms',
    '/verify-code',
    '/verify-email',
  };

  static const _sharedPrefixes = <String>[
    '/2fa/',
    '/auth/native-ticket/',
    '/reset-password/',
    '/verify-email/',
  ];

  static const _customerExact = <String>{
    '/my-orders',
    '/order-lookup',
    '/shop',
  };

  static const _customerPrefixes = <String>[
    '/book/',
    '/catalogue/',
    '/order-status/',
    '/shop/',
  ];

  static const _storeExact = <String>{
    '/build-workspace',
    '/dashboard',
    '/hub',
    '/join',
    '/my-rides',
    '/new-store',
    '/redeem',
    '/staff-login',
    '/staff/hub',
    '/start',
  };

  static const _storePrefixes = <String>['/invite/', '/rider/', '/s/'];

  bool isSameOrigin(Uri uri) =>
      uri.scheme == baseUri.scheme &&
      uri.host.toLowerCase() == baseUri.host.toLowerCase() &&
      uri.port == baseUri.port;

  bool isGoogleOAuthStart(Uri uri) =>
      isSameOrigin(uri) && uri.path == '/auth/google';

  bool isGoogleOAuthCallback(Uri uri) =>
      isSameOrigin(uri) && uri.path == '/auth/google/callback';

  bool isGoogleOAuthProvider(Uri uri) {
    if (uri.scheme != 'https' || uri.hasPort || uri.userInfo.isNotEmpty) {
      return false;
    }
    final host = uri.host.toLowerCase();
    if (host == 'accounts.google.com' ||
        host == 'myaccount.google.com' ||
        host == 'oauth2.googleapis.com' ||
        host == 'accounts.youtube.com' ||
        host == 'apis.google.com' ||
        host == 'consent.google.com' ||
        host == 'ssl.gstatic.com') {
      return true;
    }
    if (host.startsWith('accounts.google.') && host.split('.').length <= 4) {
      return true;
    }
    return false;
  }

  bool _matches(String path, Set<String> exact, List<String> prefixes) =>
      exact.contains(path) || prefixes.any(path.startsWith);

  bool _isShared(String path) => _matches(path, _sharedExact, _sharedPrefixes);
  bool _isCustomer(String path) =>
      _matches(path, _customerExact, _customerPrefixes);
  bool _isStore(String path) => _matches(path, _storeExact, _storePrefixes);

  /// True when the page is a real app page, but one that belongs to the other side.
  bool belongsToOtherSide(Uri uri) {
    final s = side;
    if (s == null || !isSameOrigin(uri)) return false;
    final path = uri.path;
    return s == AppSide.customer ? _isStore(path) : _isCustomer(path);
  }

  NavigationAction evaluate(Uri uri) {
    if (!isSameOrigin(uri)) return NavigationAction.block;

    final path = uri.path.isEmpty ? '/' : uri.path;
    if (path == '/') return NavigationAction.replaceWithLogin;
    if (_isShared(path)) return NavigationAction.allow;

    return switch (side) {
      AppSide.customer =>
        _isCustomer(path) ? NavigationAction.allow : NavigationAction.block,
      AppSide.store =>
        _isStore(path) ? NavigationAction.allow : NavigationAction.block,
      null =>
        _isCustomer(path) || _isStore(path)
            ? NavigationAction.allow
            : NavigationAction.block,
    };
  }
}
