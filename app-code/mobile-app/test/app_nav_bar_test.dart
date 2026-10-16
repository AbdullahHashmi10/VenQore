import 'package:amd_erp_mobile/widgets/app_nav_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

AppNavConfig config() => AppNavConfig.fromJson({
  'tabs': [
    {'id': 'home', 'label': 'Dashboard', 'path': '/s/shop/dashboard', 'match': ['/dashboard']},
    {'id': 'contacts', 'label': 'Contacts', 'path': '/s/shop/customers', 'match': ['/customers', '/suppliers']},
    {'id': 'stock', 'label': 'Stock', 'path': '/s/shop/inventory', 'match': ['/inventory']},
    {'id': 'settings', 'label': 'Settings', 'path': '/s/shop/settings', 'match': ['/settings']},
  ],
  'actions': [
    {'label': 'New Sale', 'icon': 'cart', 'tone': 'emerald', 'path': '/s/shop/sales/invoice/create'},
    {'label': 'Add Product', 'icon': 'box', 'tone': 'teal', 'path': '/s/shop/inventory/create'},
  ],
  'hide_on': ['/pos', '/create', '/edit', '/checkout'],
});

Widget host(Widget child) => MaterialApp(home: Scaffold(body: Align(alignment: Alignment.bottomCenter, child: child)));

void main() {
  test('the bar hides where the website hides it, but keeps the returns list', () {
    final c = config();
    expect(c.hiddenAt('/s/shop/pos'), isTrue);
    expect(c.hiddenAt('/s/shop/sales/invoice/create'), isTrue);
    expect(c.hiddenAt('/s/shop/dashboard'), isFalse);
    expect(c.hiddenAt('/s/shop/returns-history'), isFalse);
  });

  test('the open tab follows the page', () {
    final tabs = config().tabs;
    expect(tabs[0].isActiveAt('/s/shop/dashboard'), isTrue);
    expect(tabs[1].isActiveAt('/s/shop/customers/12'), isTrue);
    expect(tabs[2].isActiveAt('/s/shop/inventory'), isTrue);
    expect(tabs[3].isActiveAt('/s/shop/settings/profile'), isTrue);
    expect(tabs[0].isActiveAt('/s/shop/inventory'), isFalse);
  });

  testWidgets('only the open tab shows its name; tabs and + open pages', (tester) async {
    String? opened;
    var plus = 0;
    await tester.pumpWidget(host(AppNavBar(
      config: config(),
      path: '/s/shop/inventory',
      onOpen: (p) => opened = p,
      onPlus: () => plus++,
    )));
    await tester.pumpAndSettle();

    expect(find.text('Stock'), findsOneWidget);
    expect(find.text('Dashboard'), findsNothing);

    await tester.tap(find.bySemanticsLabel('Dashboard'));
    expect(opened, '/s/shop/dashboard');

    await tester.tap(find.bySemanticsLabel('Open quick actions'));
    expect(plus, 1);
  });

  testWidgets('quick actions open the chosen page', (tester) async {
    String? opened;
    var account = 0;
    await tester.pumpWidget(MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: TextButton(
              onPressed: () => showQuickActions(
                context,
                actions: config().actions,
                onOpen: (p) => opened = p,
                onAccount: () => account++,
              ),
              child: const Text('go'),
            ),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('go'));
    await tester.pumpAndSettle();

    expect(find.text('QUICK ACTIONS'), findsOneWidget);
    expect(find.text('Account'), findsOneWidget);
    await tester.tap(find.text('New Sale'));
    await tester.pumpAndSettle();
    expect(opened, '/s/shop/sales/invoice/create');
    expect(account, 0);
  });

  testWidgets('the bar fits a narrow phone with large text', (tester) async {
    tester.view.physicalSize = const Size(280, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(MaterialApp(
      home: MediaQuery(
        data: const MediaQueryData(size: Size(280, 640), textScaler: TextScaler.linear(1.35)),
        child: host(AppNavBar(config: config(), path: '/s/shop/settings', onOpen: (_) {}, onPlus: () {})),
      ),
    ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}
