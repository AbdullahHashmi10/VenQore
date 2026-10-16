import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../theme/app_colors.dart';
import '../widgets/brand_logo.dart';

class AboutAppScreen extends StatelessWidget {
  const AboutAppScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About this app')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 32),
          children: [
            const Center(
              child: BrandLogo(size: 76, borderRadius: 23),
            ),
            const SizedBox(height: 18),
            const Text(
              'VenQore',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Version 1.1.4',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.inkMuted),
            ),
            const SizedBox(height: 30),
            const _InfoRow(
              label: 'Audience',
              value: 'Customers, business owners and staff',
            ),
            const _InfoRow(
              label: 'Customer mode',
              value: 'Online marketplace & store ordering',
            ),
            _InfoRow(label: 'Connected service', value: AppConfig.baseUri.host),
            const _InfoRow(
              label: 'Platform',
              value: 'Android & Web',
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(17),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F8F3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text(
                'VenQore unites online marketplace ordering for customers with comprehensive sales, inventory and POS management for businesses.',
                style: TextStyle(color: AppColors.ink, height: 1.45),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.inkMuted),
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: AppColors.ink,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
