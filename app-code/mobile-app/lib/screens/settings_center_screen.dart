import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class SettingsCenterScreen extends StatelessWidget {
  const SettingsCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Business settings',
    introduction:
        'Keep your business identity, selling preferences, and connected tools current.',
    icon: Icons.settings_suggest_rounded,
    actions: [
      MobilePageAction(
        title: 'Business profile',
        subtitle: 'Update business identity and contact information.',
        icon: Icons.storefront_outlined,
        path: '/settings',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Online store',
        subtitle: 'Manage the business online storefront.',
        icon: Icons.store_mall_directory_outlined,
        path: '/online-store-manager',
      ),
      MobilePageAction(
        title: 'Connections',
        subtitle: 'Review connected commerce services.',
        icon: Icons.extension_outlined,
        path: '/connections',
      ),
      MobilePageAction(
        title: 'E-invoicing',
        subtitle: 'Open available electronic invoicing controls.',
        icon: Icons.receipt_long_outlined,
        path: '/e-invoicing',
      ),
      MobilePageAction(
        title: 'Labels',
        subtitle: 'Prepare barcode and product labels.',
        icon: Icons.qr_code_2_rounded,
        path: '/labels',
      ),
      MobilePageAction(
        title: 'AI usage',
        subtitle: 'Review the business AI usage available to you.',
        icon: Icons.auto_awesome_outlined,
        path: '/ai-usage',
      ),
      MobilePageAction(
        title: 'My profile',
        subtitle: 'Update personal and account information.',
        icon: Icons.person_outline_rounded,
        path: '/profile',
      ),
    ],
  );
}
