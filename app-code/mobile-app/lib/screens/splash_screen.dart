import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_colors.dart';
import '../widgets/brand_logo.dart';
import '../widgets/thinking_orb.dart';
import 'welcome_screen.dart';

/// Motion graphics animated splash screen featuring the canonical VenQore logo,
/// 3D orbital particle resonance, and smooth spring-driven typography entrance.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _introController;
  late final AnimationController _pulseController;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoOpacity;
  late final Animation<double> _textOpacity;
  late final Animation<Offset> _textSlide;
  late final Animation<double> _subtitleOpacity;

  Timer? _transitionTimer;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();

    // Dark sleek system bars for the splash entrance
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: AppColors.darkCanvas,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );

    _introController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1750),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    // Motion curves
    _logoScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.65, end: 1.08)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 65,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.08, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 35,
      ),
    ]).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.12, 0.68),
      ),
    );

    _logoOpacity = CurvedAnimation(
      parent: _introController,
      curve: const Interval(0.08, 0.40, curve: Curves.easeIn),
    );

    _textOpacity = CurvedAnimation(
      parent: _introController,
      curve: const Interval(0.38, 0.72, curve: Curves.easeOut),
    );

    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.28),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _introController,
        curve: const Interval(0.38, 0.78, curve: Curves.easeOutCubic),
      ),
    );

    _subtitleOpacity = CurvedAnimation(
      parent: _introController,
      curve: const Interval(0.55, 0.90, curve: Curves.easeOut),
    );

    _introController.forward();

    // Automatically transition to WelcomeScreen after 1800ms
    _transitionTimer = Timer(const Duration(milliseconds: 1850), _proceed);
  }

  void _proceed() {
    _transitionTimer?.cancel();
    if (!mounted || _navigated) return;
    _navigated = true;

    // Reset status bars for the standard app theme
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.canvas,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );

    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const WelcomeScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 320),
      ),
    );
  }

  @override
  void dispose() {
    _transitionTimer?.cancel();
    _introController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkCanvas,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _proceed, // Tap to skip if desired
        child: Stack(
          children: [
            // Ambient Radial Gradient Mesh
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final pulse =
                      (math.sin(_pulseController.value * 2 * math.pi) + 1.0) /
                          2.0;
                  return CustomPaint(
                    painter: _SplashBackgroundPainter(pulse: pulse),
                  );
                },
              ),
            ),

            // Foreground Motion Graphics Content
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo + Orbital Resonance Stack
                  SizedBox(
                    width: 140,
                    height: 140,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Background animated 3D particle orb
                        const ThinkingOrb(
                          size: 136,
                          state: OrbState.solving,
                          speed: 1.3,
                          accentColor: AppColors.tealBright,
                          showCore: true,
                        ),

                        // Luminous Expanding Pulse Rings
                        AnimatedBuilder(
                          animation: _pulseController,
                          builder: (context, child) {
                            final v = _pulseController.value;
                            return Container(
                              width: 72 + (v * 48),
                              height: 72 + (v * 48),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.tealBright.withValues(
                                    alpha: (1.0 - v) * 0.45,
                                  ),
                                  width: 1.4,
                                ),
                              ),
                            );
                          },
                        ),

                        // Brand Vector Mark
                        ScaleTransition(
                          scale: _logoScale,
                          child: FadeTransition(
                            opacity: _logoOpacity,
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Color(0x660BAA8F),
                                    blurRadius: 28,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: const BrandLogo(
                                size: 66,
                                borderRadius: 20,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Brand Typography Reveal
                  SlideTransition(
                    position: _textSlide,
                    child: FadeTransition(
                      opacity: _textOpacity,
                      child: const Column(
                        children: [
                          Text(
                            'VenQore',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: AppColors.darkText,
                              letterSpacing: -0.6,
                              height: 1.0,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'COMMERCE & OPERATIONS',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.tealBright,
                              letterSpacing: 2.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 22),

                  // Mint shimmer loading pill
                  FadeTransition(
                    opacity: _subtitleOpacity,
                    child: Container(
                      width: 120,
                      height: 3.5,
                      decoration: BoxDecoration(
                        color: AppColors.darkLine,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          final v = _pulseController.value;
                          return FractionallySizedBox(
                            alignment: Alignment(
                              -1.0 + (v * 2.0),
                              0.0,
                            ),
                            widthFactor: 0.35,
                            child: Container(
                              decoration: BoxDecoration(
                                color: AppColors.tealBright,
                                borderRadius: BorderRadius.circular(999),
                                boxShadow: const [
                                  BoxShadow(
                                    color: AppColors.tealBright,
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SplashBackgroundPainter extends CustomPainter {
  const _SplashBackgroundPainter({required this.pulse});

  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;

    // Deep spot glow behind the logo
    final spotRadius = size.width * (0.65 + 0.08 * pulse);
    final spotPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.teal500.withValues(alpha: 0.18 + 0.05 * pulse),
          AppColors.teal800.withValues(alpha: 0.08),
          Colors.transparent,
        ],
        stops: const [0.0, 0.45, 1.0],
      ).createShader(
        Rect.fromCircle(center: Offset(cx, cy), radius: spotRadius),
      );

    canvas.drawCircle(Offset(cx, cy), spotRadius, spotPaint);

    // Subtle corner accent mesh
    final cornerRadius = size.width * 0.7;
    final cornerPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.teal900.withValues(alpha: 0.12),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromCircle(center: Offset(size.width, 0), radius: cornerRadius),
      );
    canvas.drawCircle(Offset(size.width, 0), cornerRadius, cornerPaint);
  }

  @override
  bool shouldRepaint(covariant _SplashBackgroundPainter oldDelegate) {
    return oldDelegate.pulse != pulse;
  }
}
