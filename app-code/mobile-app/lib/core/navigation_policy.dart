import '../config/app_config.dart';

enum NavigationAction { allow, replaceWithLogin, block }

class NavigationPolicy {
  NavigationPolicy({Uri? baseUri}) : baseUri = baseUri ?? AppConfig.baseUri;

  final Uri baseUri;

  static const _allowedExactPaths = <String>{
    '/account',
    '/auth/google',
    '/auth/google/callback',
    '/build-workspace',
    '/confirm-password',
    '/dashboard',
    '/forgot-password',
    '/hub',
    '/join',
    '/login',
    '/login/passcode',
    '/login/pin',
    '/logout',
    '/my-rides',
    '/my-orders',
    '/new-store',
    '/order-lookup',
    '/privacy',
    '/profile',
    '/redeem',
    '/register',
    '/shop',
    '/staff-login',
    '/staff/hub',
    '/start',
    '/terms',
    '/verify-code',
    '/verify-email',
  };

  static const _allowedPrefixes = <String>[
    '/2fa/',
    '/auth/native-ticket/',
    '/book/',
    '/catalogue/',
    '/invite/',
    '/order-status/',
    '/reset-password/',
    '/rider/',
    '/s/',
    '/shop/',
    '/verify-email/',
  ];

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

  NavigationAction evaluate(Uri uri) {
    if (!isSameOrigin(uri)) return NavigationAction.block;

    final path = uri.path.isEmpty ? '/' : uri.path;
    if (path == '/') return NavigationAction.replaceWithLogin;
    if (_allowedExactPaths.contains(path) ||
        _allowedPrefixes.any(path.startsWith)) {
      return NavigationAction.allow;
    }
    return NavigationAction.block;
  }
}
