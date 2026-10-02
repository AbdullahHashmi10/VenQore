import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class WorkspaceScreen extends StatelessWidget {
  const WorkspaceScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Workspace',
    introduction:
        'Open the main areas of your business. Access still follows your role.',
    icon: Icons.apps_rounded,
    actions: [
      MobilePageAction(
        title: 'Inventory',
        subtitle: 'Stock levels, products, and inventory movement.',
        icon: Icons.inventory_2_outlined,
        path: '/inventory',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Purchases',
        subtitle: 'Supplier purchases, receiving, and history.',
        icon: Icons.local_shipping_outlined,
        path: '/purchases',
      ),
      MobilePageAction(
        title: 'Customers',
        subtitle: 'Customer records, balances, and contact details.',
        icon: Icons.people_outline_rounded,
        path: '/customers',
      ),
      MobilePageAction(
        title: 'Reports',
        subtitle: 'Open the reports available to your account.',
        icon: Icons.query_stats_rounded,
        path: '/reports',
      ),
    ],
  );
}
