import 'package:amd_erp_mobile/core/app_side.dart';
import 'package:amd_erp_mobile/core/navigation_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final base = Uri.parse('https://venqore.com/');
  Uri u(String path) => Uri.parse('https://venqore.com$path');

  test('customer side opens customer pages and never store pages', () {
    final p = NavigationPolicy(baseUri: base, side: AppSide.customer);
    for (final ok in [
      '/shop',
      '/shop/my-cafe',
      '/my-orders',
      '/order-lookup',
      '/order-status/abc',
      '/login',
      '/register',
    ]) {
      expect(p.evaluate(u(ok)), NavigationAction.allow, reason: ok);
    }
    for (final no in [
      '/s/shop/dashboard',
      '/s/shop/pos',
      '/new-store',
      '/start',
      '/hub',
      '/build-workspace',
      '/my-rides',
      '/rider/abc',
    ]) {
      expect(p.evaluate(u(no)), NavigationAction.block, reason: no);
      expect(p.belongsToOtherSide(u(no)), isTrue, reason: no);
    }
  });

  test('store side opens store pages and never customer pages', () {
    final p = NavigationPolicy(baseUri: base, side: AppSide.store);
    for (final ok in [
      '/s/shop/dashboard',
      '/s/shop/pos',
      '/new-store',
      '/start',
      '/hub',
      '/build-workspace',
      '/my-rides',
      '/login',
    ]) {
      expect(p.evaluate(u(ok)), NavigationAction.allow, reason: ok);
    }
    for (final no in [
      '/shop',
      '/shop/my-cafe',
      '/my-orders',
      '/order-lookup',
      '/order-status/abc',
    ]) {
      expect(p.evaluate(u(no)), NavigationAction.block, reason: no);
      expect(p.belongsToOtherSide(u(no)), isTrue, reason: no);
    }
  });

  test('a page that is on no side is simply unavailable', () {
    final p = NavigationPolicy(baseUri: base, side: AppSide.customer);
    expect(p.evaluate(u('/pricing')), NavigationAction.block);
    expect(p.belongsToOtherSide(u('/pricing')), isFalse);
  });

  test('another site is never opened, on either side', () {
    for (final side in AppSide.values) {
      final p = NavigationPolicy(baseUri: base, side: side);
      expect(p.evaluate(Uri.parse('https://evil.example/shop')), NavigationAction.block);
    }
  });

  test('the other side is the other side', () {
    expect(AppSide.customer.other, AppSide.store);
    expect(AppSide.store.other, AppSide.customer);
  });
}
