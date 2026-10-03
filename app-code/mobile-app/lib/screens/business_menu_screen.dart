import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'account_center_screen.dart';
import 'activity_center_screen.dart';
import 'customers_center_screen.dart';
import 'finance_center_screen.dart';
import 'inventory_center_screen.dart';
import 'pos_center_screen.dart';
import 'purchases_center_screen.dart';
import 'quick_actions_screen.dart';
import 'reports_center_screen.dart';
import 'sales_center_screen.dart';
import 'settings_center_screen.dart';
import 'team_center_screen.dart';

class BusinessMenuScreen extends StatelessWidget {
  const BusinessMenuScreen({super.key});

  Future<void> _open(BuildContext context, Widget page) async {
    final path = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute<String>(builder: (_) => page));
    if (context.mounted && path != null) Navigator.pop(context, path);
  }

  @override
  Widget build(BuildContext context) {
    final items = <_MenuItem>[
      _MenuItem(
        'Quick actions',
        'Start common work',
        Icons.bolt_rounded,
        const QuickActionsScreen(),
        true,
      ),
      _MenuItem(
        'Sales',
        'Invoices and orders',
        Icons.receipt_long_rounded,
        const SalesCenterScreen(),
        true,
      ),
      _MenuItem(
        'Point of sale',
        'Checkout and registers',
        Icons.point_of_sale_rounded,
        const PosCenterScreen(),
        false,
      ),
      _MenuItem(
        'Inventory',
        'Products and stock',
        Icons.inventory_2_rounded,
        const InventoryCenterScreen(),
        false,
      ),
      _MenuItem(
        'Purchases',
        'Buying and suppliers',
        Icons.local_shipping_rounded,
        const PurchasesCenterScreen(),
        false,
      ),
      _MenuItem(
        'Customers',
        'People and balances',
        Icons.people_alt_rounded,
        const CustomersCenterScreen(),
        false,
      ),
      _MenuItem(
        'Money',
        'Payments and accounts',
        Icons.account_balance_rounded,
        const FinanceCenterScreen(),
        false,
      ),
      _MenuItem(
        'Reports',
        'Performance and detail',
        Icons.query_stats_rounded,
        const ReportsCenterScreen(),
        false,
      ),
      _MenuItem(
        'Activity',
        'Updates and approvals',
        Icons.notifications_active_rounded,
        const ActivityCenterScreen(),
        false,
      ),
      _MenuItem(
        'Team',
        'People and permissions',
        Icons.badge_rounded,
        const TeamCenterScreen(),
        false,
      ),
      _MenuItem(
        'Settings',
        'Business configuration',
        Icons.settings_suggest_rounded,
        const SettingsCenterScreen(),
        false,
      ),
      _MenuItem(
        'My account',
        'Profile and businesses',
        Icons.manage_accounts_rounded,
        const AccountCenterScreen(),
        false,
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Business tools')),
      body: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: CustomScrollView(
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                  sliver: SliverToBoxAdapter(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.pine, AppColors.pineRaised],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'YOUR WORKSPACE',
                            style: TextStyle(
                              color: AppColors.tealBright,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.4,
                            ),
                          ),
                          SizedBox(height: 10),
                          Text(
                            'Everything your role allows.',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              height: 1.12,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -.5,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Choose an area. VenQore will continue inside the secure app window.',
                            style: TextStyle(
                              color: Color(0xFFD8E9E4),
                              fontSize: 14,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                  sliver: SliverLayoutBuilder(
                    builder: (context, constraints) {
                      final width = constraints.crossAxisExtent;
                      final columns = width >= 620 ? 3 : 2;
                      return SliverGrid(
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: columns,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          mainAxisExtent: width < 400 ? 184 : 168,
                        ),
                        delegate: SliverChildBuilderDelegate((context, index) {
                          final item = items[index];
                          return _MenuCard(
                            item: item,
                            onTap: () => _open(context, item.page),
                          );
                        }, childCount: items.length),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MenuItem {
  const _MenuItem(
    this.title,
    this.subtitle,
    this.icon,
    this.page,
    this.emphasized,
  );
  final String title;
  final String subtitle;
  final IconData icon;
  final Widget page;
  final bool emphasized;
}

class _MenuCard extends StatelessWidget {
  const _MenuCard({required this.item, required this.onTap});
  final _MenuItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: item.emphasized ? AppColors.pine : AppColors.surface,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(20),
      side: BorderSide(
        color: item.emphasized ? AppColors.pine : AppColors.line,
      ),
    ),
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: item.emphasized
                    ? AppColors.tealBright.withValues(alpha: .16)
                    : AppColors.canvas,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(
                item.icon,
                color: item.emphasized ? AppColors.tealBright : AppColors.teal,
                size: 22,
              ),
            ),
            const Spacer(),
            Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: item.emphasized ? Colors.white : AppColors.ink,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              item.subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: item.emphasized
                    ? const Color(0xFFB8D0CA)
                    : AppColors.inkMuted,
                fontSize: 12,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
