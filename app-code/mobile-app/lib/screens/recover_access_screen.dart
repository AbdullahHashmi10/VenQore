import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'business_web_screen.dart';

class RecoverAccessScreen extends StatelessWidget {
  const RecoverAccessScreen({super.key});

  void _openRecovery(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => const BusinessWebScreen(
          initialPath: '/forgot-password',
          initialTitle: 'Recover your account',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recover access')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 26, 22, 32),
          children: [
            Container(
              width: 60,
              height: 60,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.pine,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(
                Icons.key_rounded,
                color: AppColors.tealBright,
                size: 30,
              ),
            ),
            const SizedBox(height: 26),
            Text(
              'Let’s get you back in.',
              style: Theme.of(
                context,
              ).textTheme.headlineLarge?.copyWith(fontSize: 35),
            ),
            const SizedBox(height: 12),
            const Text(
              'Use the email address connected to your VenQore account. We will send the recovery instructions there.',
              style: TextStyle(
                color: AppColors.inkMuted,
                fontSize: 16,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 28),
            const _RecoveryNote(
              icon: Icons.email_outlined,
              title: 'Check the correct inbox',
              body:
                  'For employees, this may be the work email used in your staff invitation.',
            ),
            const _RecoveryNote(
              icon: Icons.schedule_rounded,
              title: 'Recovery links expire',
              body: 'Request a fresh link if an older one no longer works.',
            ),
            const _RecoveryNote(
              icon: Icons.admin_panel_settings_outlined,
              title: 'Cashier access',
              body:
                  'If your business uses a staff PIN, ask an owner or manager to verify or reset your access.',
            ),
            const SizedBox(height: 26),
            FilledButton.icon(
              onPressed: () => _openRecovery(context),
              icon: const Icon(Icons.mail_outline_rounded),
              label: const Text('Send recovery instructions'),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecoveryNote extends StatelessWidget {
  const _RecoveryNote({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.teal, size: 23),
          const SizedBox(width: 13),
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
                const SizedBox(height: 4),
                Text(
                  body,
                  style: const TextStyle(
                    color: AppColors.inkMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
