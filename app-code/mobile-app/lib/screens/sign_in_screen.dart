import 'package:flutter/material.dart';

import '../core/app_side.dart';
import '../core/google_sign_in_service.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import '../theme/vq.dart';
import '../widgets/google_mark.dart';
import '../widgets/motion.dart';
import '../widgets/vq_widgets.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'recover_access_screen.dart';
import 'register_screen.dart';

/// Native VenQore sign-in, for both sides of the app.
///
/// Store side: one form for everyone (owner, manager, cashier, waiter, rider). Nobody is asked which one
/// they are; the server knows their role and opens the right home. Customer side: the same form, and the
/// person lands on their own customer dashboard.
/// What is typed here is handed once to VenQore's own sign-in page, which still does the emailed
/// code and any two-step check.
class SignInScreen extends StatefulWidget {
  const SignInScreen({
    super.key,
    this.initialEmail = '',
    this.googleService,
    this.side = AppSide.store,
  });

  final String initialEmail;

  /// Which side of the app this sign-in belongs to (wording and the links it offers).
  final AppSide side;

  /// Replaceable in tests.
  final GoogleSignInService? googleService;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  late final TextEditingController _emailController;
  final _passwordController = TextEditingController();
  final _passwordFocus = FocusNode();
  late final GoogleSignInService _google;

  bool _obscure = true;
  bool _googleBusy = false;
  String? _error;

  bool get _isCustomer => widget.side == AppSide.customer;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
    _google = widget.googleService ?? GoogleSignInService();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _openWeb(String path, String title, {WebAutofill? autofill}) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BusinessWebScreen(
          initialPath: path,
          initialTitle: title,
          autofill: autofill,
        ),
      ),
    );
  }

  void _submit() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || !email.contains('@') || !email.contains('.')) {
      setState(() => _error = 'Enter the email address you sign in with.');
      return;
    }
    if (password.isEmpty) {
      setState(() => _error = 'Enter your password.');
      _passwordFocus.requestFocus();
      return;
    }
    setState(() => _error = null);
    FocusScope.of(context).unfocus();

    _openWeb(
      '/login',
      'Sign in',
      autofill: WebAutofill(
        path: '/login',
        fields: {'email': email, 'password': password},
        submitSelector: 'form button[type="submit"]',
      ),
    );
    // The page now holds it; do not leave a password sitting in this screen.
    _passwordController.clear();
  }

  void _openCashierPin() {
    _openWeb(
      '/login',
      'Cashier PIN',
      autofill: const WebAutofill(
        path: '/login',
        clickButtonText: 'cashier pin',
      ),
    );
  }

  Future<void> _signInWithGoogle() async {
    if (_googleBusy) return;
    setState(() {
      _googleBusy = true;
      _error = null;
    });

    final result = await _google.signIn();
    if (!mounted) return;
    setState(() => _googleBusy = false);

    switch (result.outcome) {
      case GoogleSignInOutcome.ready:
        _openWeb(result.ticketPath!, 'Signing you in');
      case GoogleSignInOutcome.cancelled:
        break;
      case GoogleSignInOutcome.linkRequired:
        // The one case that needs the browser: proving, once, that this email is yours.
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'This email already has a VenQore account. We will confirm it is yours once with an emailed code.',
            ),
          ),
        );
        _openWeb('/auth/google', 'Confirm your account');
      case GoogleSignInOutcome.unavailable:
        // Never fall back to a Google web page asking for a password: say so and offer email sign-in.
        setState(
          () => _error =
              'Google sign-in is not ready on this phone yet. Use your email and password for now.',
        );
      case GoogleSignInOutcome.failed:
        setState(
          () => _error =
              result.message ??
              'Google sign-in did not complete. Please try again.',
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Column(
          children: [
            VqAuthHeader(
              badge: _isCustomer ? 'Marketplace customer' : 'Partner',
              title: _isCustomer
                  ? 'Welcome back to VenQore'
                  : 'Sign in to your workspace',
              subtitle: _isCustomer
                  ? 'Sign in to see your orders, saved addresses and favourites.'
                  : 'No role questions. VenQore knows if you are an owner, staff or a rider and opens your own place.',
              tabs: _isCustomer
                  ? const ['Customer sign in', 'New customer']
                  : const ['Existing store', 'New store owner'],
              onTab: (i) {
                if (i == 1) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute<void>(
                      builder: (_) => RegisterScreen(side: widget.side),
                    ),
                  );
                }
              },
              onHelp: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const HelpScreen()),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimatedSize(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOut,
                    alignment: Alignment.topCenter,
                    child: _error == null
                        ? const SizedBox(width: double.infinity)
                        : Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: _ErrorBanner(message: _error!),
                          ),
                  ),
                  FadeSlideIn(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        VqField(
                          fieldKey: const Key('signin-email'),
                          label: _isCustomer ? 'Email address' : 'Work email',
                          controller: _emailController,
                          icon: Icons.mail_outline_rounded,
                          hint: _isCustomer
                              ? 'you@email.com'
                              : 'you@business.com',
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [
                            AutofillHints.username,
                            AutofillHints.email,
                          ],
                          onSubmitted: (_) => _passwordFocus.requestFocus(),
                        ),
                        const SizedBox(height: 12),
                        VqField(
                          fieldKey: const Key('signin-password'),
                          label: 'Password',
                          controller: _passwordController,
                          focusNode: _passwordFocus,
                          icon: Icons.lock_outline_rounded,
                          hint: 'Your password',
                          obscure: _obscure,
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.password],
                          onSubmitted: (_) => _submit(),
                          suffix: GestureDetector(
                            onTap: () => setState(() => _obscure = !_obscure),
                            child: Icon(
                              _obscure
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: AppColors.inkFaint,
                              size: 19,
                            ),
                          ),
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const RecoverAccessScreen(),
                              ),
                            ),
                            child: Text(
                              'Forgot password?',
                              style: Vq.sans(
                                14.5,
                                color: AppColors.teal700,
                                weight: 700,
                              ),
                            ),
                          ),
                        ),
                        VqButton(
                          key: const Key('signin-submit'),
                          label: _isCustomer
                              ? 'Sign in'
                              : 'Sign in to my workspace',
                          trailing: Icons.arrow_forward_rounded,
                          height: 48,
                          onTap: _submit,
                        ),
                        const SizedBox(height: 8),
                        Center(
                          child: Text(
                            'For your security we may email you a one-time code.',
                            textAlign: TextAlign.center,
                            style: Vq.sans(13.5, color: AppColors.inkFaint),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 100),
                    child: Column(
                      children: [
                        const _OrDivider(),
                        const SizedBox(height: 14),
                        GoogleContinueButton(
                          key: const Key('signin-google'),
                          busy: _googleBusy,
                          onTap: _signInWithGoogle,
                        ),
                        if (!_isCustomer) ...[
                          const SizedBox(height: 6),
                          TextButton.icon(
                            key: const Key('signin-pin'),
                            onPressed: _openCashierPin,
                            icon: const Icon(
                              Icons.dialpad_rounded,
                              size: 17,
                              color: AppColors.inkMuted,
                            ),
                            label: Text(
                              'Use a cashier PIN',
                              style: Vq.sans(
                                14,
                                color: AppColors.inkMuted,
                                weight: 700,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "Continue with Google": the phone's own account picker, no password and no browser.
/// Shared by sign-in and register.
class GoogleContinueButton extends StatelessWidget {
  const GoogleContinueButton({
    required this.busy,
    required this.onTap,
    super.key,
  });

  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: busy ? null : onTap,
      borderRadius: 999,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.line),
          boxShadow: Vq.elev1,
        ),
        child: Center(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: busy
                ? const SizedBox(
                    key: ValueKey('busy'),
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: AppColors.teal500,
                    ),
                  )
                : Row(
                    key: const ValueKey('idle'),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const GoogleMark(size: 20),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Text(
                          'Continue with Google',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Vq.sans(15, weight: 700),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.line, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('or', style: Vq.eyebrow(color: AppColors.inkFaint)),
        ),
        const Expanded(child: Divider(color: AppColors.line, height: 1)),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.dangerBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 1),
            child: Icon(
              Icons.error_outline_rounded,
              size: 18,
              color: AppColors.danger,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Vq.sans(
                14,
                color: AppColors.danger,
                weight: 600,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
