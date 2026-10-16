import 'package:amd_erp_mobile/core/google_sign_in_service.dart';
import 'package:amd_erp_mobile/screens/ai_builder_intro_screen.dart';
import 'package:amd_erp_mobile/screens/register_screen.dart';
import 'package:amd_erp_mobile/screens/sign_in_screen.dart';
import 'package:amd_erp_mobile/screens/splash_screen.dart';
import 'package:amd_erp_mobile/screens/welcome_screen.dart';
import 'package:amd_erp_mobile/widgets/brand_logo.dart';
import 'package:amd_erp_mobile/widgets/google_mark.dart';
import 'package:amd_erp_mobile/widgets/thinking_orb.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeGoogle implements GoogleSignInService {
  _FakeGoogle(this.result);

  final GoogleSignInResult result;
  int calls = 0;

  @override
  Future<GoogleSignInResult> signIn() async {
    calls++;
    return result;
  }
}

void main() {
  // The orb animates forever, so pumpAndSettle would never return on those screens.
  Future<void> settle(WidgetTester tester) async {
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 900));
  }

  void phone(WidgetTester tester) {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  }

  testWidgets('SplashScreen renders BrandLogo and ThinkingOrb', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));

    expect(find.byType(BrandLogo), findsOneWidget);
    expect(find.byType(ThinkingOrb), findsOneWidget);
    expect(find.text('VenQore'), findsOneWidget);
    expect(find.text('COMMERCE & OPERATIONS'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 2000));
    await tester.pump(const Duration(milliseconds: 500));
  });

  testWidgets('WelcomeScreen offers customers, staff and owners without pilot tags',
      (tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: WelcomeScreen()));
    await settle(tester);

    expect(find.text('Welcome to\nVenQore.'), findsOneWidget);
    expect(find.text('Order from stores'), findsOneWidget);
    expect(find.text('I work at a store'), findsOneWidget);
    expect(find.text('Run my business'), findsOneWidget);
    expect(find.textContaining(RegExp(r'pilot', caseSensitive: false)), findsNothing);
    // Nobody is asked whether they are an owner or an employee.
    expect(find.textContaining('Owner or manager'), findsNothing);
  });

  testWidgets('SignInScreen is one form for every role, with the real Google mark',
      (tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: SignInScreen()));
    await settle(tester);

    expect(find.text('Welcome back.'), findsOneWidget);
    expect(find.byKey(const Key('signin-email')), findsOneWidget);
    expect(find.byKey(const Key('signin-password')), findsOneWidget);
    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.byType(GoogleMark), findsOneWidget);
    // No role picker and no separate staff tab.
    expect(find.text('Staff / POS PIN'), findsNothing);
    expect(find.textContaining('Owner'), findsNothing);
  });

  testWidgets('SignInScreen checks the form before leaving the app screen', (tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: SignInScreen()));
    await settle(tester);

    await tester.tap(find.byKey(const Key('signin-submit')));
    await settle(tester);
    expect(find.text('Enter the email address you sign in with.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('signin-email')), 'cashier@shop.com');
    await tester.tap(find.byKey(const Key('signin-submit')));
    await settle(tester);
    expect(find.text('Enter your password.'), findsOneWidget);
    expect(find.byType(SignInScreen), findsOneWidget);
  });

  testWidgets('Google sign-in: a failure is explained on the sign-in screen', (tester) async {
    phone(tester);
    final google = _FakeGoogle(const GoogleSignInResult(
      GoogleSignInOutcome.failed,
      message: 'Google could not confirm this sign-in.',
    ));
    await tester.pumpWidget(MaterialApp(home: SignInScreen(googleService: google)));
    await settle(tester);

    await tester.ensureVisible(find.byKey(const Key('signin-google')));
    await tester.tap(find.byKey(const Key('signin-google')));
    await settle(tester);

    expect(google.calls, 1);
    expect(find.text('Google could not confirm this sign-in.'), findsOneWidget);
  });

  testWidgets('Google sign-in: closing the picker changes nothing', (tester) async {
    phone(tester);
    final google = _FakeGoogle(const GoogleSignInResult(GoogleSignInOutcome.cancelled));
    await tester.pumpWidget(MaterialApp(home: SignInScreen(googleService: google)));
    await settle(tester);

    await tester.ensureVisible(find.byKey(const Key('signin-google')));
    await tester.tap(find.byKey(const Key('signin-google')));
    await settle(tester);

    expect(google.calls, 1);
    expect(find.byType(SignInScreen), findsOneWidget);
    expect(find.byType(SnackBar), findsNothing);
  });

  testWidgets('RegisterScreen asks only what the server asks, and needs the terms',
      (tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: RegisterScreen()));
    await settle(tester);

    expect(find.text('Start your business workspace'), findsOneWidget);
    expect(find.text('Want AI to set it up for you?'), findsOneWidget);
    expect(find.byKey(const Key('register-name')), findsOneWidget);
    expect(find.byKey(const Key('register-email')), findsOneWidget);
    expect(find.byKey(const Key('register-password')), findsOneWidget);
    // Fields the server never receives are not collected.
    expect(find.text('Retail & Shop'), findsNothing);

    await tester.enterText(find.byKey(const Key('register-name')), 'Sam Owner');
    await tester.enterText(find.byKey(const Key('register-email')), 'sam@shop.com');
    await tester.enterText(find.byKey(const Key('register-password')), 'longenough1');
    await tester.ensureVisible(find.byKey(const Key('register-submit')));
    await tester.tap(find.byKey(const Key('register-submit')));
    await settle(tester);
    expect(
      find.text('Please agree to the Terms and Privacy Policy to continue.'),
      findsOneWidget,
    );
  });

  testWidgets('RegisterScreen rejects a short password', (tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: RegisterScreen()));
    await settle(tester);

    await tester.enterText(find.byKey(const Key('register-name')), 'Sam Owner');
    await tester.enterText(find.byKey(const Key('register-email')), 'sam@shop.com');
    await tester.enterText(find.byKey(const Key('register-password')), 'short');
    await tester.ensureVisible(find.byKey(const Key('register-submit')));
    await tester.tap(find.byKey(const Key('register-submit')));
    await settle(tester);
    expect(find.text('Your password needs at least 8 characters.'), findsOneWidget);
  });

  testWidgets('AiBuilderIntroScreen renders ThinkingOrb and trade examples', (tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: AiBuilderIntroScreen()));
    await settle(tester);

    expect(find.byType(ThinkingOrb), findsOneWidget);
    expect(find.text('Describe the business you run.'), findsOneWidget);
    expect(find.text('Build my workspace'), findsOneWidget);
    expect(find.text('Grocery Store'), findsOneWidget);
  });

  for (final entry in <String, Widget Function()>{
    "WelcomeScreen": () => const WelcomeScreen(),
    "SignInScreen": () => const SignInScreen(),
    "RegisterScreen": () => const RegisterScreen(),
    "AiBuilderIntroScreen": () => const AiBuilderIntroScreen(),
  }.entries) {
    testWidgets("${entry.key} fits a narrow phone with large text", (tester) async {
      tester.view.physicalSize = const Size(280, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(size: Size(280, 640), textScaler: TextScaler.linear(1.35)),
            child: entry.value(),
          ),
        ),
      );
      await settle(tester);

      // A layout overflow is reported as an exception and fails the test.
      expect(tester.takeException(), isNull);
    });
  }
}
