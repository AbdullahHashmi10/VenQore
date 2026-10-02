import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'auth_entry_screen.dart';

class FeatureOverviewScreen extends StatelessWidget {
  const FeatureOverviewScreen({super.key});

  static const _features = <({IconData icon, String title, String body})>[
    (
      icon: Icons.point_of_sale_rounded,
      title: 'Sales & POS',
      body: 'Open your existing checkout and sales workflows.',
    ),
    (
      icon: Icons.inventory_2_outlined,
      title: 'Products & stock',
      body: 'Manage products, inventory and stock movements.',
    ),
    (
      icon: Icons.people_outline_rounded,
      title: 'Customers & khata',
      body: 'View customer records, balances and allowed ledger actions.',
    ),
    (
      icon: Icons.receipt_long_outlined,
      title: 'Purchases & expenses',
      body: 'Use the purchasing and expense tools enabled for your store.',
    ),
    (
      icon: Icons.bar_chart_rounded,
      title: 'Reports',
      body: 'Open the reports your role and subscription permit.',
    ),
    (
      icon: Icons.auto_awesome_rounded,
      title: 'AI workspace builder',
      body: 'New businesses receive a setup shaped around how they operate.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('What’s in the pilot')),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  Text(
                    'Your main business tools, in one contained app.',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontSize: 32,
                      height: 1.08,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'The pilot wraps your live VenQore workspace with native sign-in, navigation, recovery and setup screens.',
                    style: TextStyle(
                      color: AppColors.inkMuted,
                      fontSize: 16,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ..._features.map(
                    (feature) => Container(
                      margin: const EdgeInsets.only(bottom: 11),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        border: Border.all(color: AppColors.line),
                        borderRadius: BorderRadius.circular(17),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 43,
                            height: 43,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE6F8F3),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              feature.icon,
                              color: AppColors.teal,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  feature.title,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.ink,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  feature.body,
                                  style: const TextStyle(
                                    color: AppColors.inkMuted,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.line)),
              ),
              child: FilledButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) =>
                        const AuthEntryScreen(mode: AuthEntryMode.signIn),
                  ),
                ),
                child: const Text('Continue to sign in'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
