import 'package:amd_erp_mobile/screens/business_menu_screen.dart';
import 'package:amd_erp_mobile/screens/sales_center_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Future<void> pumpAtSize(
    WidgetTester tester,
    Widget page, {
    required Size size,
    double textScale = 1,
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(
            size: size,
            textScaler: TextScaler.linear(textScale),
          ),
          child: page,
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('sales center fits a narrow phone with large text', (
    tester,
  ) async {
    await pumpAtSize(
      tester,
      const SalesCenterScreen(),
      size: const Size(280, 640),
      textScale: 1.35,
    );

    expect(find.text('Sales'), findsOneWidget);
    expect(find.text('New sale'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('business tools grid adapts to a compact phone', (tester) async {
    await pumpAtSize(
      tester,
      const BusinessMenuScreen(),
      size: const Size(320, 640),
      textScale: 1.2,
    );

    expect(find.text('Business tools'), findsOneWidget);
    expect(find.text('Quick actions'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
