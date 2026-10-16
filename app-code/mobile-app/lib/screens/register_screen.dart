import 'package:flutter/material.dart';

import '../core/app_side.dart';
import '../core/google_sign_in_service.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import '../widgets/brand_logo.dart';
import '../widgets/google_mark.dart';
import '../widgets/motion.dart';
import '../widgets/thinking_orb.dart';
import 'ai_builder_intro_screen.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'sign_in_screen.dart';

/// Native VenQore V6 account creation.
///
/// Asks only what the server's register page asks (name, email, password, terms). What is typed
/// is handed once to that page, which sends the emailed code and then lets the person create or
/// join a business. The business itself (name, trade, modules) is set up by the AI workspace
/// builder, which is why that is offered first.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    this.googleService,
    this.side = AppSide.store,
  });

  /// Customer: a plain account for ordering. Store: the business workspace sign-up.
  final AppSide side;

  /// Replaceable in tests.
  final GoogleSignInService? googleService;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  late final GoogleSignInService _google;

  bool _obscure = true;
  bool _agreed = false;
  bool _googleBusy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _google = widget.googleService ?? GoogleSignInService();
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _emailFocus.dispose();
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
    final name = _name.text.trim();
    final email = _email.text.trim();
    final password = _password.text;

    if (name.isEmpty) {
      setState(() => _error = 'Enter your name.');
      return;
    }
    if (email.isEmpty || !email.contains('@') || !email.contains('.')) {
      setState(
        () => _error = 'Enter a valid email. We send your sign-in code there.',
      );
      _emailFocus.requestFocus();
      return;
    }
    if (password.length < 8) {
      setState(() => _error = 'Your password needs at least 8 characters.');
      _passwordFocus.requestFocus();
      return;
    }
    if (!_agreed) {
      setState(
        () => _error =
            'Please agree to the Terms and Privacy Policy to continue.',
      );
      return;
    }
    setState(() => _error = null);
    FocusScope.of(context).unfocus();

    _openWeb(
      '/register',
      'Create account',
      autofill: WebAutofill(
        path: '/register',
        fields: {
          'name': name,
          'email': email,
          'password': password,
          'password_confirmation': password,
        },
        checkboxId: 'terms-checkbox',
        submitSelector: '#register-submit',
      ),
    );
    _password.clear();
  }

  Future<void> _signUpWithGoogle() async {
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
              'This email already has a VenQore account. Sign in to continue.',
            ),
          ),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute<void>(
            builder: (_) => SignInScreen(side: widget.side),
          ),
        );
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
              const SizedBox(height: 24),
              FadeSlideIn(
                delay: const Duration(milliseconds: 70),
                child: Text(
                  widget.side == AppSide.customer
                      ? 'Create your account'
                      : 'Start your business workspace',
                  style: const TextStyle(
                    fontSize: 30,
                    height: 1.1,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                    letterSpacing: -0.8,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: Text(
                  widget.side == AppSide.customer
                      ? 'Order from any store and follow every order in one place. Free.'
                      : '14 days, the full product. Cancel anytime.',
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    color: AppColors.inkMuted,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              if (widget.side == AppSide.store)
                FadeSlideIn(
                  delay: const Duration(milliseconds: 170),
                  child: PressableScale(
                    borderRadius: 20,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const AiBuilderIntroScreen(),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.teal950, AppColors.teal900],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.tealBright.withValues(alpha: 0.3),
                        ),
                      ),
                      child: const Row(
                        children: [
                          ThinkingOrb(
                            size: 52,
                            state: OrbState.solving,
                            speed: 1.0,
                            accentColor: AppColors.tealBright,
                            showCore: true,
                          ),
                          SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Want AI to set it up for you?',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15.5,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(height: 3),
                                Text(
                                  'Describe your business and review the workspace before you create anything.',
                                  style: TextStyle(
                                    color: Color(0xFFC6F5E9),
                                    fontSize: 12.5,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(
                            Icons.arrow_forward_rounded,
                            color: AppColors.tealBright,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 18),
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOut,
                alignment: Alignment.topCenter,
                child: _error == null
                    ? const SizedBox(width: double.infinity)
                    : Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _Banner(message: _error!),
                      ),
              ),
              FadeSlideIn(
                delay: const Duration(milliseconds: 230),
                child: Container(
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
                    children: [
                      const _FieldLabel('Your name'),
                      const SizedBox(height: 8),
                      TextField(
                        key: const Key('register-name'),
                        controller: _name,
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.name],
                        onSubmitted: (_) => _emailFocus.requestFocus(),
                        decoration: const InputDecoration(
                          hintText: 'Full name',
                          prefixIcon: Icon(
                            Icons.person_outline_rounded,
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
                      const _FieldLabel('Work email'),
                      const SizedBox(height: 8),
                      TextField(
                        key: const Key('register-email'),
                        controller: _email,
                        focusNode: _emailFocus,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        onSubmitted: (_) => _passwordFocus.requestFocus(),
                        decoration: const InputDecoration(
                          hintText: 'you@business.com',
                          prefixIcon: Icon(
                            Icons.mail_outline_rounded,
                            color: AppColors.inkMuted,
                            size: 20,
                          ),
                          helperText: 'We email your sign-in code here.',
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 15,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const _FieldLabel('Password'),
                      const SizedBox(height: 8),
                      TextField(
                        key: const Key('register-password'),
                        controller: _password,
                        focusNode: _passwordFocus,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.newPassword],
                        onSubmitted: (_) => FocusScope.of(context).unfocus(),
                        decoration: InputDecoration(
                          hintText: 'At least 8 characters',
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
                            tooltip: _obscure
                                ? 'Show password'
                                : 'Hide password',
                            icon: Icon(
                              _obscure
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: AppColors.inkMuted,
                              size: 20,
                            ),
                            onPressed: () =>
                                setState(() => _obscure = !_obscure),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      InkWell(
                        key: const Key('register-terms'),
                        onTap: () => setState(() => _agreed = !_agreed),
                        borderRadius: BorderRadius.circular(10),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 140),
                                width: 22,
                                height: 22,
                                margin: const EdgeInsets.only(top: 1),
                                decoration: BoxDecoration(
                                  color: _agreed
                                      ? AppColors.teal
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(7),
                                  border: Border.all(
                                    color: _agreed
                                        ? AppColors.teal
                                        : AppColors.lineStrong,
                                    width: 1.5,
                                  ),
                                ),
                                child: _agreed
                                    ? const Icon(
                                        Icons.check_rounded,
                                        size: 16,
                                        color: Colors.white,
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Text(
                                  'I agree to the Terms and the Privacy Policy.',
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    height: 1.35,
                                    color: AppColors.inkMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Wrap(
                        spacing: 4,
                        children: [
                          TextButton(
                            style: TextButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                              ),
                            ),
                            onPressed: () => _openWeb('/terms', 'Terms'),
                            child: const Text(
                              'Read the Terms',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.teal600,
                              ),
                            ),
                          ),
                          TextButton(
                            style: TextButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                              ),
                            ),
                            onPressed: () =>
                                _openWeb('/privacy', 'Privacy Policy'),
                            child: const Text(
                              'Privacy Policy',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.teal600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      FilledButton(
                        key: const Key('register-submit'),
                        onPressed: _submit,
                        child: const Text('Create account'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                delay: const Duration(milliseconds: 290),
                child: Column(
                  children: [
                    const Row(
                      children: [
                        Expanded(
                          child: Divider(color: AppColors.line, height: 1),
                        ),
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
                        Expanded(
                          child: Divider(color: AppColors.line, height: 1),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton(
                      key: const Key('register-google'),
                      onPressed: _googleBusy ? null : _signUpWithGoogle,
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
                    const SizedBox(height: 6),
                    Wrap(
                      alignment: WrapAlignment.center,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text(
                          'Already have an account?',
                          style: TextStyle(
                            color: AppColors.inkMuted,
                            fontSize: 14,
                          ),
                        ),
                        TextButton(
                          onPressed: () =>
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute<void>(
                                  builder: (_) =>
                                      SignInScreen(side: widget.side),
                                ),
                              ),
                          child: const Text(
                            'Sign in',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.teal600,
                            ),
                          ),
                        ),
                      ],
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

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

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

class _Banner extends StatelessWidget {
  const _Banner({required this.message});

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
