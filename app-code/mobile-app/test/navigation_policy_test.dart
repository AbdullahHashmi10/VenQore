import 'package:amd_erp_mobile/core/navigation_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final policy = NavigationPolicy(baseUri: Uri.parse('https://venqore.com/'));

  test('allows authentication and business workspace routes', () {
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/login')),
      NavigationAction.allow,
    );
    expect(
      policy.evaluate(
        Uri.parse('https://venqore.com/build-workspace?prompt=I+run+a+bakery'),
      ),
      NavigationAction.allow,
    );
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/s/demo-store/dashboard')),
      NavigationAction.allow,
    );
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/s/demo-store/pos')),
      NavigationAction.allow,
    );
  });

  test('keeps public and external pages out of the app', () {
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/pricing')),
      NavigationAction.block,
    );
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/pos')),
      NavigationAction.block,
    );
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/a-new-public-page')),
      NavigationAction.block,
    );
    expect(
      policy.evaluate(Uri.parse('https://example.com/login')),
      NavigationAction.block,
    );
    expect(
      policy.evaluate(Uri.parse('javascript:alert(1)')),
      NavigationAction.block,
    );
  });

  test('replaces the public root with login', () {
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/')),
      NavigationAction.replaceWithLogin,
    );
  });

  test('recognizes only the scoped Google OAuth navigation', () {
    expect(
      policy.isGoogleOAuthStart(
        Uri.parse('https://venqore.com/auth/google'),
      ),
      isTrue,
    );
    expect(
      policy.isGoogleOAuthProvider(
        Uri.parse('https://accounts.google.com/o/oauth2/v2/auth?client_id=x'),
      ),
      isTrue,
    );
    expect(
      policy.isGoogleOAuthCallback(
        Uri.parse('https://venqore.com/auth/google/callback?code=x&state=y'),
      ),
      isTrue,
    );
    expect(
      policy.isGoogleOAuthProvider(
        Uri.parse('https://google.com/search?q=venqore'),
      ),
      isFalse,
    );
    expect(
      policy.isGoogleOAuthProvider(
        Uri.parse('https://accounts.google.com.evil.example/o/oauth2/auth'),
      ),
      isFalse,
    );
  });
}
