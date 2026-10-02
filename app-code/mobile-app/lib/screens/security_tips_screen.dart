import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class SecurityTipsScreen extends StatelessWidget {
  const SecurityTipsScreen({super.key});

  static const _tips = <({IconData icon, String title, String body})>[
    (
      icon: Icons.password_rounded,
      title: 'Use your own account',
      body:
          'Owners should invite each employee instead of sharing one password.',
    ),
    (
      icon: Icons.phonelink_lock_rounded,
      title: 'Complete every security check',
      body:
          'Email codes and two-factor prompts protect your store and financial records.',
    ),
    (
      icon: Icons.visibility_off_outlined,
      title: 'Keep cashier PINs private',
      body:
          'Do not write a PIN beside the register or share it outside the assigned team.',
    ),
    (
      icon: Icons.logout_rounded,
      title: 'Sign out on shared phones',
      body:
          'Use the app’s More menu so cookies and local workspace data are cleared.',
    ),
    (
      icon: Icons.system_update_alt_rounded,
      title: 'Install trusted builds only',
      body: 'Pilot APKs should come directly from the VenQore team.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security guidance')),
      body: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        itemCount: _tips.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final tip = _tips[index];
          return Container(
            padding: const EdgeInsets.all(17),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(17),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(tip.icon, color: AppColors.teal, size: 24),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tip.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        tip.body,
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
        },
      ),
    );
  }
}
