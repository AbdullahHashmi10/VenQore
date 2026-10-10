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
    '/new-store',
    '/privacy',
    '/redeem',
    '/register',
    '/staff-login',
    '/staff/hub',
    '/start',
    '/terms',
    '/verify-code',
    '/verify-email',
  };

  static const _allowedPrefixes = <String>[
    '/2fa/',
    '/invite/',
    '/reset-password/',
    '/s/',
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

  bool isGoogleOAuthProvider(Uri uri) =>
      uri.scheme == 'https' &&
      uri.host.toLowerCase() == 'accounts.google.com' &&
      !uri.hasPort &&
      uri.userInfo.isEmpty;

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
