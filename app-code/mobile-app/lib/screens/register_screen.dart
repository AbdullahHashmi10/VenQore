import 'package:flutter/material.dart';

import '../core/app_side.dart';
import '../core/google_sign_in_service.dart';
import '../core/web_autofill.dart';
import '../theme/app_colors.dart';
import '../theme/vq.dart';
import '../widgets/motion.dart';
import '../widgets/thinking_orb.dart';
import '../widgets/vq_widgets.dart';
import 'ai_builder_intro_screen.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'sign_in_screen.dart' show SignInScreen, GoogleContinueButton;

/// Native VenQore account creation, for both sides of the app.
///
/// Asks only what the server's register page asks (name, email, password, terms). What is typed
/// is handed once to that page, which sends the emailed code. The side chosen on the front door decides
/// what the account becomes: a store owner (then the AI builder makes the workspace) or a customer.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    this.googleService,
    this.side = AppSide.store,
  });

  /// Customer: a plain account for ordering. Store: the business owner sign-up.
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

  bool get _isCustomer => widget.side == AppSide.customer;

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
        setState(
          () => _error =
              'Google sign-in is not ready on this phone yet. Create the account with your email instead.',
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
                  ? 'Create your account'
                  : 'Register as a store owner',
              subtitle: _isCustomer
                  ? 'Order from any store and follow every order in one place. Free.'
                  : 'You entered through the store door, so this account becomes a store owner and opens the AI store builder. 14 days, the full product.',
              tabs: _isCustomer
                  ? const ['Customer sign in', 'New customer']
                  : const ['Existing store', 'New store owner'],
              tabIndex: 1,
              onTab: (i) {
                if (i == 0) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute<void>(
                      builder: (_) => SignInScreen(side: widget.side),
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
                  if (!_isCustomer)
                    FadeSlideIn(
                      child: PressableScale(
                        borderRadius: 20,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const AiBuilderIntroScreen(),
                          ),
                        ),
                        child: VqMesh(
                          borderRadius: BorderRadius.circular(Vq.rLg),
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              const ThinkingOrb(
                                size: 48,
                                state: OrbState.solving,
                                speed: 1.0,
                                accentColor: AppColors.tealBright,
                                showCore: true,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Want AI to set it up for you?',
                                      style: Vq.display(
                                        15,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      'Describe your business and review the workspace before you create anything.',
                                      style: Vq.sans(
                                        13.5,
                                        color: AppColors.teal100,
                                        height: 1.35,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                color: AppColors.tealBright,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  if (!_isCustomer) const SizedBox(height: 14),
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
                    delay: const Duration(milliseconds: 100),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        VqField(
                          fieldKey: const Key('register-name'),
                          label: _isCustomer ? 'Full name' : 'Owner full name',
                          controller: _name,
                          icon: Icons.person_outline_rounded,
                          hint: 'Your name',
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.name],
                          onSubmitted: (_) => _emailFocus.requestFocus(),
                        ),
                        const SizedBox(height: 12),
                        VqField(
                          fieldKey: const Key('register-email'),
                          label: _isCustomer
                              ? 'Email address'
                              : 'Business email',
                          controller: _email,
                          focusNode: _emailFocus,
                          icon: Icons.mail_outline_rounded,
                          hint: 'We email your sign-in code here',
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.email],
                          onSubmitted: (_) => _passwordFocus.requestFocus(),
                        ),
                        const SizedBox(height: 12),
                        VqField(
                          fieldKey: const Key('register-password'),
                          label: 'Create password',
                          controller: _password,
                          focusNode: _passwordFocus,
                          icon: Icons.lock_outline_rounded,
                          hint: 'At least 8 characters',
                          obscure: _obscure,
                          textInputAction: TextInputAction.done,
                          autofillHints: const [AutofillHints.newPassword],
                          onSubmitted: (_) => FocusScope.of(context).unfocus(),
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
                        const SizedBox(height: 12),
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
                                        ? AppColors.teal600
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(7),
                                    border: Border.all(
                                      color: _agreed
                                          ? AppColors.teal600
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
                                Expanded(
                                  child: Text(
                                    'I agree to the Terms and the Privacy Policy.',
                                    style: Vq.sans(
                                      14,
                                      color: AppColors.inkMuted,
                                      height: 1.35,
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
                              child: Text(
                                'Read the Terms',
                                style: Vq.sans(
                                  14.5,
                                  color: AppColors.teal700,
                                  weight: 700,
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
                              child: Text(
                                'Privacy Policy',
                                style: Vq.sans(
                                  14.5,
                                  color: AppColors.teal700,
                                  weight: 700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        VqButton(
                          key: const Key('register-submit'),
                          label: _isCustomer
                              ? 'Create account'
                              : 'Create owner account',
                          icon: _isCustomer ? null : Icons.auto_awesome_rounded,
                          trailing: Icons.arrow_forward_rounded,
                          height: 48,
                          onTap: _submit,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 180),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Divider(color: AppColors.line, height: 1),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                              ),
                              child: Text(
                                'or',
                                style: Vq.eyebrow(color: AppColors.inkFaint),
                              ),
                            ),
                            const Expanded(
                              child: Divider(color: AppColors.line, height: 1),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        GoogleContinueButton(
                          key: const Key('register-google'),
                          busy: _googleBusy,
                          onTap: _signUpWithGoogle,
                        ),
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
