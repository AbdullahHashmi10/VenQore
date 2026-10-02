import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'business_web_screen.dart';
import 'recover_access_screen.dart';

class AccessTypeScreen extends StatelessWidget {
  const AccessTypeScreen({super.key});

  void _open(BuildContext context, String path, String title) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            BusinessWebScreen(initialPath: path, initialTitle: title),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Choose how you sign in')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
          children: [
            Text(
              'Which account do you use?',
              style: Theme.of(
                context,
              ).textTheme.headlineLarge?.copyWith(fontSize: 34, height: 1.08),
            ),
            const SizedBox(height: 12),
            const Text(
              'This helps us take you to the right secure sign-in. Your role and permissions are still checked by VenQore.',
              style: TextStyle(
                color: AppColors.inkMuted,
                fontSize: 16,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 28),
            _AccessCard(
              icon: Icons.storefront_rounded,
              title: 'Owner or manager',
              body:
                  'Use your work email, password, Google account or configured passcode.',
              details: const [
                'Manage one or more stores',
                'Access allowed reports and settings',
              ],
              onTap: () => _open(context, '/login', 'Owner sign in'),
            ),
            const SizedBox(height: 14),
            _AccessCard(
              icon: Icons.badge_outlined,
              title: 'Employee or cashier',
              body:
                  'Use the staff access provided by your business owner or manager.',
              details: const [
                'Role-based store access',
                'Only approved actions are shown',
              ],
              onTap: () => _open(context, '/staff-login', 'Staff sign in'),
            ),
            const SizedBox(height: 22),
            TextButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const RecoverAccessScreen(),
                ),
              ),
              icon: const Icon(Icons.key_rounded),
              label: const Text('I cannot access my account'),
            ),
          ],
        ),
      ),
    );
  }
}

class _AccessCard extends StatelessWidget {
  const _AccessCard({
    required this.icon,
    required this.title,
    required this.body,
    required this.details,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String body;
  final List<String> details;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE6F8F3),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: AppColors.teal),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppColors.teal,
                  ),
                ],
              ),
              const SizedBox(height: 15),
              Text(
                body,
                style: const TextStyle(color: AppColors.inkMuted, height: 1.4),
              ),
              const SizedBox(height: 13),
              ...details.map(
                (detail) => Padding(
                  padding: const EdgeInsets.only(top: 7),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        size: 17,
                        color: AppColors.teal,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          detail,
                          style: const TextStyle(
                            color: AppColors.ink,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
