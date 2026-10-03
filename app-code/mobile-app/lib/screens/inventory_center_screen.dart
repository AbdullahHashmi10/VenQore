import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class InventoryCenterScreen extends StatelessWidget {
  const InventoryCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Inventory',
    introduction:
        'Keep products, quantities, movement, and stock checks together.',
    icon: Icons.inventory_2_rounded,
    actions: [
      MobilePageAction(
        title: 'Stock overview',
        subtitle: 'See current stock levels and alerts.',
        icon: Icons.inventory_2_outlined,
        path: '/inventory',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Products',
        subtitle: 'Search and maintain sellable items.',
        icon: Icons.category_outlined,
        path: '/inventory/list',
      ),
      MobilePageAction(
        title: 'Add product',
        subtitle: 'Create a product, price, and stock setup.',
        icon: Icons.add_box_outlined,
        path: '/products/create',
        badge: 'NEW',
      ),
      MobilePageAction(
        title: 'Stock movement',
        subtitle: 'Review adjustments, receipts, and transfers.',
        icon: Icons.swap_horiz_rounded,
        path: '/reports/movement-history',
      ),
      MobilePageAction(
        title: 'Stock operations',
        subtitle: 'Adjust, transfer, or audit stock where allowed.',
        icon: Icons.tune_rounded,
        path: '/stock-operations',
      ),
      MobilePageAction(
        title: 'Low stock',
        subtitle: 'Find products that need attention.',
        icon: Icons.warning_amber_rounded,
        path: '/reports/low-stock',
      ),
      MobilePageAction(
        title: 'Stock audit',
        subtitle: 'Count stock and record verified differences.',
        icon: Icons.fact_check_outlined,
        path: '/stock-audit',
      ),
    ],
  );
}
