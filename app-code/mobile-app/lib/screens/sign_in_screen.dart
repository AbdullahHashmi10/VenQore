import 'package:flutter/material.dart';

import '../core/google_sign_in_service.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import '../widgets/brand_logo.dart';
import '../widgets/google_mark.dart';
import '../widgets/motion.dart';
import 'ai_builder_intro_screen.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'recover_access_screen.dart';
import 'register_screen.dart';

/// Native VenQore V6 sign-in.
///
/// One form for everyone: owner, manager, cashier, waiter or rider. Nobody is asked which one they
/// are; the server knows their role and opens the right home (dashboard, POS, or My rides).
/// What is typed here is handed once to VenQore's own sign-in page, which still does the emailed
/// code and any two-step check.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, this.initialEmail = '', this.googleService});

  final String initialEmail;

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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'This email already has a VenQore account. We will confirm it is yours once with an emailed code.',
            ),
          ),
        );
        _openWeb('/auth/google', 'Sign in with Google');
      case GoogleSignInOutcome.unavailable:
        _openWeb('/auth/google', 'Sign in with Google');
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: const BackButton(color: AppColors.ink),
        actions: [
          IconButton(
            tooltip: 'Help',
            icon: const Icon(
              Icons.help_outline_rounded,
              color: AppColors.inkMuted,
            ),
            onPressed: () => Navigator.of(
              context,
            ).push(MaterialPageRoute<void>(builder: (_) => const HelpScreen())),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const FadeSlideIn(
                child: Row(
                  children: [
                    BrandLogo(size: 46, borderRadius: 14),
                    SizedBox(width: 12),
                    Flexible(
                      child: Text(
                        'VenQore',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 26),
              const FadeSlideIn(
                delay: Duration(milliseconds: 70),
                child: Text(
                  'Welcome back.',
                  style: TextStyle(
                    fontSize: 32,
                    height: 1.1,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                    letterSpacing: -0.8,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const FadeSlideIn(
                delay: Duration(milliseconds: 120),
                child: Text(
                  'Sign in once. VenQore opens the right place for you: your dashboard, the till, or your rides.',
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    color: AppColors.inkMuted,
                  ),
                ),
              ),
              const SizedBox(height: 22),
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
                delay: const Duration(milliseconds: 170),
                child: _FormCard(
                  children: [
                    const _Label('Email'),
                    const SizedBox(height: 8),
                    TextField(
                      key: const Key('signin-email'),
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [
                        AutofillHints.username,
                        AutofillHints.email,
                      ],
                      onSubmitted: (_) => _passwordFocus.requestFocus(),
                      decoration: const InputDecoration(
                        hintText: 'you@business.com',
                        prefixIcon: Icon(
                          Icons.mail_outline_rounded,
                          color: AppColors.inkMuted,
                          size: 20,
                        ),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 15,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Expanded(child: _Label('Password')),
                        Flexible(
                          child: InkWell(
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const RecoverAccessScreen(),
                              ),
                            ),
                            borderRadius: BorderRadius.circular(6),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(
                                vertical: 2,
                                horizontal: 2,
                              ),
                              child: Text(
                                'Forgot password?',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.teal600,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      key: const Key('signin-password'),
                      controller: _passwordController,
                      focusNode: _passwordFocus,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      onSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        hintText: 'Your password',
                        prefixIcon: const Icon(
                          Icons.lock_outline_rounded,
                          color: AppColors.inkMuted,
                          size: 20,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 15,
                        ),
                        suffixIcon: IconButton(
                          tooltip: _obscure ? 'Show password' : 'Hide password',
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.inkMuted,
                            size: 20,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      key: const Key('signin-submit'),
                      onPressed: _submit,
                      child: const Text('Sign in'),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'For your security we may email you a one-time code.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: AppColors.inkFaint),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              FadeSlideIn(
                delay: const Duration(milliseconds: 230),
                child: Column(
                  children: [
                    const _OrDivider(),
                    const SizedBox(height: 14),
                    OutlinedButton(
                      key: const Key('signin-google'),
                      onPressed: _googleBusy ? null : _signInWithGoogle,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(54),
                        backgroundColor: AppColors.surface,
                        side: const BorderSide(color: AppColors.line),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: _googleBusy
                            ? const SizedBox(
                                key: ValueKey('busy'),
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.4,
                                  color: AppColors.teal,
                                ),
                              )
                            : const Row(
                                key: ValueKey('idle'),
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  GoogleMark(size: 22),
                                  SizedBox(width: 12),
                                  Flexible(
                                    child: Text(
                                      'Continue with Google',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 15.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.ink,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      key: const Key('signin-pin'),
                      onPressed: _openCashierPin,
                      icon: const Icon(
                        Icons.dialpad_rounded,
                        size: 18,
                        color: AppColors.inkMuted,
                      ),
                      label: const Text(
                        'Use a cashier PIN',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 290),
                child: Column(
                  children: [
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text(
                          'New to VenQore?',
                          style: TextStyle(
                            color: AppColors.inkMuted,
                            fontSize: 14,
                          ),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const RegisterScreen(),
                            ),
                          ),
                          child: const Text(
                            'Create an account',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.teal600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    TextButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const AiBuilderIntroScreen(),
                        ),
                      ),
                      icon: const Icon(
                        Icons.auto_awesome_rounded,
                        size: 16,
                        color: AppColors.teal,
                      ),
                      label: const Text(
                        'Let AI build my workspace',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.teal600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FormCard extends StatelessWidget {
  const _FormCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.line),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: Divider(color: AppColors.line, height: 1)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            'or',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.inkFaint,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(child: Divider(color: AppColors.line, height: 1)),
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
              style: const TextStyle(
                fontSize: 13.5,
                height: 1.35,
                color: AppColors.danger,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
