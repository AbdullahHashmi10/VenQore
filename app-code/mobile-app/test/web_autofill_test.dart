import 'package:amd_erp_mobile/core/navigation_policy.dart';
import 'package:amd_erp_mobile/core/web_autofill.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('only applies to the page it was made for', () {
    const fill = WebAutofill(path: '/login', fields: {'email': 'a@b.co'});
    expect(fill.matches(Uri.parse('https://venqore.com/login')), isTrue);
    expect(fill.matches(Uri.parse('https://venqore.com/login?x=1')), isTrue);
    expect(fill.matches(Uri.parse('https://venqore.com/register')), isFalse);
    expect(fill.matches(Uri.parse('https://venqore.com/s/shop/dashboard')), isFalse);
  });

  test('values are embedded as data, never as script', () {
    const nasty = '"); alert(1); ("';
    final js = const WebAutofill(
      path: '/login',
      fields: {'email': 'a@b.co', 'password': nasty},
      submitSelector: 'form button[type="submit"]',
    ).script();

    // The hostile value only appears JSON-escaped inside the config object.
    expect(js.contains(r'\"); alert(1); (\"'), isTrue);
    expect(js.contains('"); alert(1); ("'), isFalse);
    expect(js, contains('input[name="'));
    expect(js, contains('"email":"a@b.co"'));
  });

  test('the register hand-off ticks the terms box and presses submit', () {
    final js = const WebAutofill(
      path: '/register',
      fields: {'name': 'Sam', 'email': 's@x.co', 'password': 'longenough1', 'password_confirmation': 'longenough1'},
      checkboxId: 'terms-checkbox',
      submitSelector: '#register-submit',
    ).script();
    expect(js, contains('"check":"terms-checkbox"'));
    expect(js, contains('"submit":"#register-submit"'));
  });

  test('the PIN hand-off presses a button by its text instead of filling fields', () {
    final js = const WebAutofill(path: '/login', clickButtonText: 'Cashier PIN').script();
    expect(js, contains('"text":"cashier pin"'));
  });

  test('the Google sign-in ticket page is allowed in the app, other auth pages are not', () {
    final policy = NavigationPolicy(baseUri: Uri.parse('https://venqore.com/'));
    expect(
      policy.evaluate(Uri.parse('https://venqore.com/auth/native-ticket/${'a' * 64}')),
      NavigationAction.allow,
    );
    expect(
      policy.evaluate(Uri.parse('https://evil.example/auth/native-ticket/${'a' * 64}')),
      NavigationAction.block,
    );
    expect(policy.evaluate(Uri.parse('https://venqore.com/auth/other')), NavigationAction.block);
  });
}
