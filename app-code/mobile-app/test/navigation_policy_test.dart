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
}
