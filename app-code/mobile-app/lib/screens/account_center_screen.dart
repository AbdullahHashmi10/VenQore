import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class AccountCenterScreen extends StatelessWidget {
  const AccountCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Account & business',
    introduction:
        'Manage your own account and the business options available to you.',
    icon: Icons.manage_accounts_outlined,
    actions: [
      MobilePageAction(
        title: 'My profile',
        subtitle: 'Personal details and account security.',
        icon: Icons.person_outline_rounded,
        path: '/profile',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Business settings',
        subtitle: 'Store details, preferences, and configuration.',
        icon: Icons.settings_outlined,
        path: '/settings',
      ),
      MobilePageAction(
        title: 'Team',
        subtitle: 'Staff members, roles, and access.',
        icon: Icons.badge_outlined,
        path: '/staff',
      ),
      MobilePageAction(
        title: 'Switch business',
        subtitle: 'Return to your business and store selection.',
        icon: Icons.storefront_outlined,
        path: '/hub',
      ),
    ],
  );
}
