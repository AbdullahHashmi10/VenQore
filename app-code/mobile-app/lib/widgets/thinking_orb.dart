import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum OrbState { working, solving, breathing, searching, shaping }

/// Native Flutter port of the VenQore 3D dotted ThinkingOrb engine.
/// Computes 3D projected orbital trajectories, depth-sorted particle nodes,
/// and smooth continuous rotational kinematics in pure hardware-accelerated Dart.
class ThinkingOrb extends StatefulWidget {
  const ThinkingOrb({
    super.key,
    this.size = 80,
    this.state = OrbState.solving,
    this.speed = 1.0,
    this.accentColor = AppColors.tealBright,
    this.ghostColor,
    this.showCore = true,
  });

  final double size;
  final OrbState state;
  final double speed;
  final Color accentColor;
  final Color? ghostColor;
  final bool showCore;

  @override
  State<ThinkingOrb> createState() => _ThinkingOrbState();
}

class _ThinkingOrbState extends State<ThinkingOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          // Time in seconds multiplied by base speed
          final t = _controller.value * 12.0 * widget.speed;
          return CustomPaint(
            size: Size(widget.size, widget.size),
            painter: _OrbPainter(
              size: widget.size,
              time: t,
              state: widget.state,
              accentColor: widget.accentColor,
              ghostColor:
                  widget.ghostColor ??
                  widget.accentColor.withValues(alpha: 0.35),
              showCore: widget.showCore,
            ),
          );
        },
      ),
    );
  }
}

class _OrbDot {
  _OrbDot({
    required this.x,
    required this.y,
    required this.z,
    required this.radius,
    required this.color,
    this.isParticle = false,
  });

  final double x;
  final double y;
  final double z;
  final double radius;
  final Color color;
  final bool isParticle;
}

class _OrbPainter extends CustomPainter {
  _OrbPainter({
    required this.size,
    required this.time,
    required this.state,
    required this.accentColor,
    required this.ghostColor,
    required this.showCore,
  });

  final double size;
  final double time;
  final OrbState state;
  final Color accentColor;
  final Color ghostColor;
  final bool showCore;

  static double _hashD(double a, double b) {
    final h = math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return h - h.floorToDouble();
  }

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final cx = size / 2;
    final cy = size / 2;
    final r = (size / 2) * 0.84;
    final rs = math.pow(size / 240, 0.6).toDouble();

    // 3D camera projection rotation
    final yaw = time * 0.22;
    const tilt = 0.32;
    final cosY = math.cos(yaw);
    final sinY = math.sin(yaw);
    final cosT = math.cos(tilt);
    final sinT = math.sin(tilt);

    // Inner core ambient glow
    if (showCore) {
      final pulse = (math.sin(time * 1.5) + 1.0) / 2.0;
      final corePaint = Paint()
        ..shader =
            RadialGradient(
              colors: [
                accentColor.withValues(alpha: 0.22 + 0.12 * pulse),
                accentColor.withValues(alpha: 0.05),
                Colors.transparent,
              ],
              stops: const [0.0, 0.55, 1.0],
            ).createShader(
              Rect.fromCircle(center: Offset(cx, cy), radius: r * 0.7),
            );
      canvas.drawCircle(Offset(cx, cy), r * 0.7, corePaint);
    }

    final dots = <_OrbDot>[];
    final int orbitCount = switch (state) {
      OrbState.solving => 14,
      OrbState.working => 11,
      OrbState.breathing => 8,
      OrbState.searching => 12,
      OrbState.shaping => 16,
    };
    final int ghostN = size > 90 ? 30 : 20;
    final int particlesPerOrbit = state == OrbState.solving ? 3 : 2;

    for (int orb = 0; orb < orbitCount; orb++) {
      final h1 = _hashD(orb.toDouble(), 1.7);
      final h2 = _hashD(orb.toDouble(), 5.2);
      final h3 = _hashD(orb.toDouble(), 8.9);

      final ro = r * (0.42 + 0.55 * h1);
      final th = h1 * 2 * math.pi;
      final phi = math.acos(2 * h2 - 1);

      // Normal vector of the orbital plane
      final nx = math.sin(phi) * math.cos(th);
      final ny = math.cos(phi);
      final nz = math.sin(phi) * math.sin(th);

      // Basis vectors u, v
      double ux = -ny;
      double uy = nx;
      const double uz = 0.0;
      final ul = math.max(1e-6, math.sqrt(ux * ux + uy * uy));
      ux /= ul;
      uy /= ul;

      final vx = ny * uz - nz * uy;
      final vy = nz * ux - nx * uz;
      final vz = nx * uy - ny * ux;

      final speed = (0.4 + 0.65 * h3) * (h3 > 0.5 ? 1.0 : -1.0);

      // Orbit ghost trail
      for (int k = 0; k < ghostN; k++) {
        final a = (k / ghostN) * 2 * math.pi;
        final lx = (ux * math.cos(a) + vx * math.sin(a)) * ro;
        final ly = (uy * math.cos(a) + vy * math.sin(a)) * ro;
        final lz = (uz * math.cos(a) + vz * math.sin(a)) * ro;

        // Rotate yaw & tilt
        final x1 = lx * cosY + lz * sinY;
        final z1 = -lx * sinY + lz * cosY;
        final y1 = ly * cosT - z1 * sinT;
        final z2 = ly * sinT + z1 * cosT;

        final px = cx + x1;
        final py = cy - y1;
        final depth = ((z2 / ro) + 1.0) / 2.0;
        final clampedDepth = depth.clamp(0.0, 1.0);

        final dotRadius = math.max(0.75, 1.0 * rs * (0.6 + 0.5 * clampedDepth));
        final alpha = (0.15 + 0.45 * clampedDepth).clamp(0.0, 1.0);

        dots.add(
          _OrbDot(
            x: px,
            y: py,
            z: z2,
            radius: dotRadius,
            color: ghostColor.withValues(alpha: alpha),
          ),
        );
      }

      // Active traveling energy particles
      for (int m = 0; m < particlesPerOrbit; m++) {
        final a =
            time * speed + (m / particlesPerOrbit) * 2 * math.pi + h2 * 6.0;
        final lx = (ux * math.cos(a) + vx * math.sin(a)) * ro;
        final ly = (uy * math.cos(a) + vy * math.sin(a)) * ro;
        final lz = (uz * math.cos(a) + vz * math.sin(a)) * ro;

        final x1 = lx * cosY + lz * sinY;
        final z1 = -lx * sinY + lz * cosY;
        final y1 = ly * cosT - z1 * sinT;
        final z2 = ly * sinT + z1 * cosT;

        final px = cx + x1;
        final py = cy - y1;
        final depth = ((z2 / ro) + 1.0) / 2.0;
        final clampedDepth = depth.clamp(0.0, 1.0);

        final partRadius = math.max(1.5, (1.8 + 2.8 * clampedDepth) * rs);
        final alpha = (0.45 + 0.55 * clampedDepth).clamp(0.0, 1.0);

        dots.add(
          _OrbDot(
            x: px,
            y: py,
            z: z2,
            radius: partRadius,
            color: Color.lerp(
              accentColor.withValues(alpha: alpha),
              Colors.white.withValues(alpha: alpha),
              clampedDepth * 0.45,
            )!,
            isParticle: true,
          ),
        );
      }
    }

    // Z-Sort: render farthest dots first, closest dots last
    dots.sort((a, b) => a.z.compareTo(b.z));

    final paintDot = Paint()..style = PaintingStyle.fill;
    final glowPaint = Paint()..style = PaintingStyle.fill;

    for (final dot in dots) {
      if (dot.isParticle) {
        // Subtle glow halo for front-facing particles
        if (dot.z > 0) {
          glowPaint.color = accentColor.withValues(alpha: 0.22);
          canvas.drawCircle(Offset(dot.x, dot.y), dot.radius * 2.2, glowPaint);
        }
      }
      paintDot.color = dot.color;
      canvas.drawCircle(Offset(dot.x, dot.y), dot.radius, paintDot);
    }
  }

  @override
  bool shouldRepaint(covariant _OrbPainter oldDelegate) {
    return oldDelegate.time != time ||
        oldDelegate.state != state ||
        oldDelegate.accentColor != accentColor ||
        oldDelegate.ghostColor != ghostColor;
  }
}
