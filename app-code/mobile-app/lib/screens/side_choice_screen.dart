import 'package:flutter/material.dart';

import '../core/app_side.dart';
import '../theme/app_colors.dart';
import '../widgets/brand_logo.dart';
import '../widgets/motion.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'welcome_screen.dart';

/// The first choice, after the splash: are you here to buy, or to run a store?
///
/// The two sides never mix. Customers only see stores, orders and their customer account; store people
/// only see their business. Switching later is an explicit button in the account sheet.
class SideChoiceScreen extends StatelessWidget {
  const SideChoiceScreen({super.key});

  /// Opens the chosen side (used here, and by the splash for someone who already chose).
  static Route<void> routeFor(AppSide side) {
    return MaterialPageRoute<void>(
      builder: (_) => side == AppSide.customer
          ? const BusinessWebScreen(
              initialPath: '/shop',
              initialTitle: 'Explore stores',
            )
          : const WelcomeScreen(),
    );
  }

  Future<void> _choose(BuildContext context, AppSide side) async {
    await AppSideStore.set(side);
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(routeFor(side));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const BrandLogo(size: 44, borderRadius: 14),
                  const SizedBox(width: 12),
                  const Flexible(
                    child: Text(
                      'VenQore',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Help',
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const HelpScreen(),
                      ),
                    ),
                    icon: const Icon(
                      Icons.help_outline_rounded,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 34),
              const FadeSlideIn(
                child: Text(
                  'Who are you\nhere as?',
                  style: TextStyle(
                    fontSize: 38,
                    height: 1.08,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                    letterSpacing: -0.8,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              const FadeSlideIn(
                delay: Duration(milliseconds: 80),
                child: Text(
                  'Pick one. You can change sides later from your account.',
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.45,
                    color: AppColors.inkMuted,
                  ),
                ),
              ),
              const SizedBox(height: 26),
              FadeSlideIn(
                delay: const Duration(milliseconds: 160),
                child: _SideCard(
                  icon: Icons.shopping_bag_outlined,
                  iconColor: AppColors.teal600,
                  iconBackground: AppColors.teal50,
                  badge: 'Customer',
                  title: 'I want to order',
                  subtitle:
                      'Find local restaurants, cafes and shops. Order for delivery or collection and follow every order.',
                  onTap: () => _choose(context, AppSide.customer),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 240),
                child: _SideCard(
                  icon: Icons.storefront_rounded,
                  iconColor: AppColors.pine,
                  iconBackground: const Color(0xFFE4F6EC),
                  badge: 'Store',
                  title: 'I run a store',
                  subtitle:
                      'Owners, managers, cashiers and riders: sign in to your business, or start one in minutes.',
                  onTap: () => _choose(context, AppSide.store),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SideCard extends StatelessWidget {
  const _SideCard({
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.badge,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String badge;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: onTap,
      borderRadius: 22,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.line),
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: iconBackground,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(icon, color: iconColor, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 3.5,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.sunken,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.inkMuted,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 15,
                    color: AppColors.inkFaint,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 14.5,
                color: AppColors.inkMuted,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
