class AppConfig {
  AppConfig._();

  static const String baseUrlValue = String.fromEnvironment(
    'VENQORE_BASE_URL',
    defaultValue: 'https://venqore.com',
  );

  static Uri get baseUri {
    final uri = Uri.parse(baseUrlValue);
    final localHttp =
        uri.scheme == 'http' &&
        (uri.host == 'localhost' ||
            uri.host == '127.0.0.1' ||
            uri.host == '10.0.2.2');
    if ((!uri.hasScheme || uri.host.isEmpty) ||
        (uri.scheme != 'https' && !localHttp)) {
      throw StateError(
        'VENQORE_BASE_URL must be HTTPS, or HTTP on localhost/127.0.0.1/10.0.2.2.',
      );
    }
    return uri.replace(path: '/', query: null, fragment: null);
  }

  static Uri get loginUri => baseUri.resolve('/login');
}
