import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class QuickActionsScreen extends StatelessWidget {
  const QuickActionsScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Quick actions',
    introduction:
        'Start common work without searching through the full business menu.',
    icon: Icons.bolt_rounded,
    actions: [
      MobilePageAction(
        title: 'Create a sale',
        subtitle: 'Prepare a new invoice for a customer.',
        icon: Icons.receipt_long_rounded,
        path: '/sales/create',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Record an expense',
        subtitle: 'Add a business cost and its payment details.',
        icon: Icons.payments_outlined,
        path: '/expenses/create',
      ),
      MobilePageAction(
        title: 'Create a purchase',
        subtitle: 'Record stock or services bought from a supplier.',
        icon: Icons.shopping_bag_outlined,
        path: '/purchases/create',
      ),
      MobilePageAction(
        title: 'Add a product',
        subtitle: 'Create a product for inventory and selling.',
        icon: Icons.add_box_outlined,
        path: '/products/create',
      ),
    ],
  );
}
