import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class PurchasesCenterScreen extends StatelessWidget {
  const PurchasesCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Purchases',
    introduction: 'Manage supplier buying, receiving, and purchase documents.',
    icon: Icons.local_shipping_rounded,
    actions: [
      MobilePageAction(
        title: 'New purchase',
        subtitle: 'Record stock or services received from a supplier.',
        icon: Icons.add_shopping_cart_rounded,
        path: '/purchases/create',
        emphasized: true,
        badge: 'QUICK',
      ),
      MobilePageAction(
        title: 'All purchases',
        subtitle: 'Search purchase documents and payment status.',
        icon: Icons.shopping_bag_outlined,
        path: '/purchases',
      ),
      MobilePageAction(
        title: 'Purchase orders',
        subtitle: 'Prepare and track supplier orders.',
        icon: Icons.assignment_outlined,
        path: '/purchase-orders',
      ),
      MobilePageAction(
        title: 'Purchase returns',
        subtitle: 'Review goods returned to suppliers.',
        icon: Icons.keyboard_return_rounded,
        path: '/reports/purchase-returns',
      ),
      MobilePageAction(
        title: 'Suppliers',
        subtitle: 'Open supplier contacts and balances.',
        icon: Icons.factory_outlined,
        path: '/suppliers',
      ),
      MobilePageAction(
        title: 'Goods receiving',
        subtitle: 'Confirm ordered stock as it arrives.',
        icon: Icons.move_to_inbox_outlined,
        path: '/purchases-goods-in',
      ),
    ],
  );
}
