import 'package:flutter/material.dart';

import 'mobile_section_page.dart';

class ReportsCenterScreen extends StatelessWidget {
  const ReportsCenterScreen({super.key});

  @override
  Widget build(BuildContext context) => const MobileSectionPage(
    title: 'Reports',
    introduction: 'Open the business reports permitted for your role and plan.',
    icon: Icons.query_stats_rounded,
    actions: [
      MobilePageAction(
        title: 'All reports',
        subtitle: 'Browse the complete report directory.',
        icon: Icons.grid_view_rounded,
        path: '/reports',
        emphasized: true,
      ),
      MobilePageAction(
        title: 'Daily sales',
        subtitle: 'Review today or another day at a glance.',
        icon: Icons.today_rounded,
        path: '/reports/daily-sales',
      ),
      MobilePageAction(
        title: 'Profit and loss',
        subtitle: 'Understand income, costs, and profit.',
        icon: Icons.trending_up_rounded,
        path: '/reports/profit-loss',
      ),
      MobilePageAction(
        title: 'Stock summary',
        subtitle: 'Review quantities and inventory value.',
        icon: Icons.inventory_outlined,
        path: '/reports/stock-summary-by-category',
      ),
      MobilePageAction(
        title: 'Cash flow',
        subtitle: 'Follow money movement across a period.',
        icon: Icons.waterfall_chart_rounded,
        path: '/reports/cash-flow',
      ),
      MobilePageAction(
        title: 'Customer statement',
        subtitle: 'Review transactions for a selected party.',
        icon: Icons.summarize_outlined,
        path: '/reports/party-statement',
      ),
      MobilePageAction(
        title: 'Tax report',
        subtitle: 'Open available tax figures and detail.',
        icon: Icons.percent_rounded,
        path: '/reports/tax',
      ),
    ],
  );
}
