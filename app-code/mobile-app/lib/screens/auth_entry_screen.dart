import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'access_type_screen.dart';
import 'ai_builder_intro_screen.dart';
import 'help_screen.dart';

enum AuthEntryMode { signIn, createAccount }

class AuthEntryScreen extends StatelessWidget {
  const AuthEntryScreen({required this.mode, super.key});

  final AuthEntryMode mode;

  bool get _isSignIn => mode == AuthEntryMode.signIn;

  void _continue(BuildContext context) {
    if (!_isSignIn) {
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const AiBuilderIntroScreen()),
      );
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const AccessTypeScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final title = _isSignIn
        ? 'Welcome back.'
        : 'Start your business workspace.';
    final description = _isSignIn
        ? 'Use your owner, manager or employee account. Your store access and permissions stay exactly as configured in VenQore.'
        : 'Tell VenQore how your business works first. You will review the workspace it proposes before creating your account.';

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(_isSignIn ? 'Sign in' : 'Create account'),
        actions: [
          IconButton(
            tooltip: 'Help',
            onPressed: () => Navigator.of(
              context,
            ).push(MaterialPageRoute<void>(builder: (_) => const HelpScreen())),
            icon: const Icon(Icons.help_outline_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: AppColors.pine,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                _isSignIn ? Icons.lock_open_rounded : Icons.storefront_rounded,
                color: AppColors.tealBright,
                size: 29,
              ),
            ),
            const SizedBox(height: 28),
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.headlineLarge?.copyWith(fontSize: 36, height: 1.08),
            ),
            const SizedBox(height: 14),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.inkMuted,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 32),
            _AssuranceRow(
              icon: Icons.verified_user_outlined,
              title: _isSignIn
                  ? 'Your existing security stays active'
                  : 'Designed around your business',
              body: _isSignIn
                  ? 'OTP, MFA and store permissions continue to apply.'
                  : 'The builder recommends modules from your description and answers.',
            ),
            const SizedBox(height: 18),
            const _AssuranceRow(
              icon: Icons.language_rounded,
              title: 'Contained inside VenQore',
              body: 'The app permits account and business pages only.',
            ),
            const SizedBox(height: 18),
            const _AssuranceRow(
              icon: Icons.sync_rounded,
              title: 'Your current data is ready',
              body:
                  'No separate mobile database or duplicate setup is required.',
            ),
            const SizedBox(height: 38),
            FilledButton.icon(
              onPressed: () => _continue(context),
              icon: Icon(
                _isSignIn ? Icons.login_rounded : Icons.arrow_forward_rounded,
              ),
              label: Text(
                _isSignIn ? 'Open secure sign in' : 'Describe my business',
              ),
            ),
            const SizedBox(height: 14),
            TextButton(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute<void>(
                    builder: (_) => AuthEntryScreen(
                      mode: _isSignIn
                          ? AuthEntryMode.createAccount
                          : AuthEntryMode.signIn,
                    ),
                  ),
                );
              },
              child: Text(
                _isSignIn
                    ? 'Create a new business account'
                    : 'I already have an account',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AssuranceRow extends StatelessWidget {
  const _AssuranceRow({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: const Color(0xFFE6F8F3),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.teal, size: 21),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                body,
                style: const TextStyle(color: AppColors.inkMuted, height: 1.35),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
