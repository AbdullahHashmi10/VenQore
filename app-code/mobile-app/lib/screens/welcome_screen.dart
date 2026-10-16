import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../theme/app_colors.dart';
import '../widgets/brand_logo.dart';
import '../widgets/motion.dart';
import 'business_web_screen.dart';
import 'help_screen.dart';
import 'register_screen.dart';
import 'sign_in_screen.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  void _openMarketplace(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => const BusinessWebScreen(
          initialPath: '/shop',
          initialTitle: 'Explore Stores',
        ),
      ),
    );
  }

  void _openSignIn(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const SignInScreen()));
  }

  void _openRegister(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const RegisterScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with logo & Help icon
              Row(
                children: [
                  const BrandLogo(size: 44, borderRadius: 14),
                  const SizedBox(width: 12),
                  Flexible(
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

              const SizedBox(height: 28),

              // Mint brand bar indicator: grows in from the left.
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0, end: 52),
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOutCubic,
                builder: (context, w, _) => Container(
                  width: w,
                  height: 5,
                  decoration: BoxDecoration(
                    color: AppColors.tealBright,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),

              const SizedBox(height: 18),

              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: Text(
                  'Welcome to\nVenQore.',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontSize: 38,
                    height: 1.08,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                    letterSpacing: -0.8,
                  ),
                ),
              ),

              const SizedBox(height: 10),

              const Text(
                'Order online from your favourite local stores, or manage your business workspace.',
                style: TextStyle(
                  color: AppColors.inkMuted,
                  fontSize: 15,
                  height: 1.45,
                ),
              ),

              const SizedBox(height: 26),

              // Option 1: Customer Marketplace
              FadeSlideIn(
                delay: const Duration(milliseconds: 160),
                child: _EntryOptionCard(
                  icon: Icons.shopping_bag_outlined,
                  iconColor: AppColors.teal,
                  iconBackground: AppColors.teal50,
                  title: 'Order from stores',
                  subtitle:
                      'Discover local restaurants, cafes, supermarkets and shops. Browse catalogues and order for delivery or collection.',
                  badgeText: 'Customers',
                  onTap: () => _openMarketplace(context),
                ),
              ),

              const SizedBox(height: 14),

              // Option 2: Staff, managers, riders (one sign-in, no role question)
              FadeSlideIn(
                delay: const Duration(milliseconds: 230),
                child: _EntryOptionCard(
                  icon: Icons.badge_outlined,
                  iconColor: AppColors.pine,
                  iconBackground: const Color(0xFFE4F6EC),
                  title: 'I work at a store',
                  subtitle:
                      'Sign in as a manager, cashier, waiter or rider. VenQore opens the right place for your role.',
                  badgeText: 'Staff · Riders',
                  onTap: () => _openSignIn(context),
                ),
              ),

              const SizedBox(height: 14),

              // Option 3: Owners starting or running a business
              FadeSlideIn(
                delay: const Duration(milliseconds: 300),
                child: _EntryOptionCard(
                  icon: Icons.storefront_rounded,
                  iconColor: AppColors.teal700,
                  iconBackground: AppColors.teal100,
                  title: 'Run my business',
                  subtitle:
                      'Start a new business workspace in minutes. Let AI set it up from a few words about what you do.',
                  badgeText: 'Owners',
                  onTap: () => _openRegister(context),
                ),
              ),

              const SizedBox(height: 10),

              FadeSlideIn(
                delay: const Duration(milliseconds: 360),
                child: Center(
                  child: TextButton(
                    onPressed: () => _openSignIn(context),
                    child: const Text(
                      'Already have an account? Sign in',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.teal600,
                        fontSize: 14.5,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 4),

              Center(
                child: Text(
                  AppConfig.baseUri.host,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.inkFaint,
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

class _EntryOptionCard extends StatelessWidget {
  const _EntryOptionCard({
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.title,
    required this.subtitle,
    required this.badgeText,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String title;
  final String subtitle;
  final String badgeText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: onTap,
      borderRadius: 20,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
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
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: iconBackground,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, color: iconColor, size: 26),
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
                          badgeText,
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
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 8),
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
                fontSize: 14,
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
