import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../theme/app_colors.dart';
import 'about_app_screen.dart';
import 'security_tips_screen.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & security')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.pine,
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.shield_outlined,
                  color: AppColors.tealBright,
                  size: 30,
                ),
                SizedBox(height: 18),
                Text(
                  'Business pilot',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'This version connects to your existing VenQore workspace. Customer shopping mode will be added later.',
                  style: TextStyle(color: Color(0xFFD8ECE7), height: 1.45),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          const _HelpTile(
            icon: Icons.lock_outline_rounded,
            title: 'Signing in',
            body:
                'Use the same email, password, cashier PIN and verification steps as the VenQore website.',
          ),
          const _HelpTile(
            icon: Icons.store_outlined,
            title: 'Store access',
            body:
                'The app only shows stores and actions permitted for your account.',
          ),
          const _HelpTile(
            icon: Icons.public_off_outlined,
            title: 'Protected navigation',
            body:
                'Marketing pages, unknown websites and unsupported external links are blocked inside the app.',
          ),
          const _HelpTile(
            icon: Icons.cloud_off_outlined,
            title: 'Internet required',
            body:
                'The pilot needs a connection. Offline sales and background sync are not included yet.',
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const SecurityTipsScreen(),
              ),
            ),
            icon: const Icon(Icons.shield_outlined),
            label: const Text('Open security guidance'),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const AboutAppScreen()),
            ),
            icon: const Icon(Icons.info_outline_rounded),
            label: const Text('About this app'),
          ),
          const SizedBox(height: 18),
          Center(
            child: Text(
              'Connected to ${AppConfig.baseUri.host}',
              style: const TextStyle(color: AppColors.inkMuted, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _HelpTile extends StatelessWidget {
  const _HelpTile({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.teal, size: 23),
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
