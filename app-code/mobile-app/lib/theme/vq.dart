import 'package:flutter/material.dart';

import 'app_colors.dart';

/// VenQore v6 type and extra tokens, ported from the approved marketplace prototype.
///
///  * display: Bricolage Grotesque (headlines)
///  * sans: Plus Jakarta Sans (body, buttons)
///  * num: Space Grotesk, tabular (money, counts, eyebrows)
class Vq {
  Vq._();

  static const String displayFamily = 'Bricolage';
  static const String sansFamily = 'Jakarta';
  static const String numFamily = 'SpaceGrotesk';

  // Extra palette from the prototype.
  static const Color lime400 = Color(0xFFA9E34B);
  static const Color coral400 = Color(0xFFFF8A6B);
  static const Color coral500 = Color(0xFFF26A47);
  static const Color butter400 = Color(0xFFFFCD5B);
  static const Color butter500 = Color(0xFFF5B32E);
  static const Color sky400 = Color(0xFF55C4EC);
  static const Color inkDeep = Color(0xFF0D1412);
  static const Color meshBase = Color(0xFF0A0F0E);

  static const double rSm = 12;
  static const double rMd = 14;
  static const double rLg = 20;
  static const double rXl = 28;
  static const double r2xl = 36;

  static TextStyle display(
    double size, {
    Color color = AppColors.ink,
    double weight = 600,
    double? height,
  }) => TextStyle(
    fontFamily: displayFamily,
    fontSize: size,
    height: height ?? 1.08,
    color: color,
    fontWeight: _w(weight),
    fontVariations: [FontVariation('wght', weight)],
    letterSpacing: -0.028 * size,
  );

  static TextStyle sans(
    double size, {
    Color color = AppColors.ink,
    double weight = 500,
    double? height,
  }) => TextStyle(
    fontFamily: sansFamily,
    fontSize: size,
    height: height,
    color: color,
    fontWeight: _w(weight),
    fontVariations: [FontVariation('wght', weight)],
    // Plus Jakarta ships a 0.17em word space; the V6 system corrects it by +0.08em.
    wordSpacing: size * 0.08,
  );

  static TextStyle num(
    double size, {
    Color color = AppColors.ink,
    double weight = 600,
  }) => TextStyle(
    fontFamily: numFamily,
    fontSize: size,
    color: color,
    fontWeight: _w(weight),
    fontVariations: [FontVariation('wght', weight)],
    fontFeatures: const [FontFeature.tabularFigures()],
  );

  static TextStyle eyebrow({Color color = AppColors.inkMuted}) => TextStyle(
    fontFamily: numFamily,
    fontSize: 12,
    height: 1.2,
    letterSpacing: 1.44,
    color: color,
    fontWeight: FontWeight.w600,
    fontVariations: const [FontVariation('wght', 600)],
  );

  static FontWeight _w(double w) {
    final i = ((w / 100).round().clamp(1, 9)) - 1;
    return FontWeight.values[i];
  }

  /// The signature dark mesh: midnight pine with teal and sky glows.
  static const List<BoxShadow> glow = [
    BoxShadow(
      color: Color(0x8C0BAA8F),
      blurRadius: 20,
      spreadRadius: -6,
      offset: Offset(0, 6),
    ),
  ];
  static const List<BoxShadow> glowStrong = [
    BoxShadow(
      color: Color(0xB30BAA8F),
      blurRadius: 32,
      spreadRadius: -8,
      offset: Offset(0, 10),
    ),
  ];
  static const List<BoxShadow> elev1 = [
    BoxShadow(color: Color(0x0D0D1412), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(
      color: Color(0x0F0D1412),
      blurRadius: 8,
      spreadRadius: -4,
      offset: Offset(0, 2),
    ),
  ];
  static const List<BoxShadow> elev2 = [
    BoxShadow(color: Color(0x0D0D1412), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(
      color: Color(0x1F0D1412),
      blurRadius: 24,
      spreadRadius: -10,
      offset: Offset(0, 10),
    ),
  ];
  static const List<BoxShadow> elev3 = [
    BoxShadow(color: Color(0x0F0D1412), blurRadius: 4, offset: Offset(0, 2)),
    BoxShadow(
      color: Color(0x330D1412),
      blurRadius: 56,
      spreadRadius: -16,
      offset: Offset(0, 24),
    ),
  ];

  static const LinearGradient warm = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [butter500, coral500],
  );

  static const LinearGradient hero = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    stops: [0, 0.38, 0.78, 1],
    colors: [
      AppColors.teal950,
      AppColors.teal800,
      AppColors.teal500,
      AppColors.teal300,
    ],
  );
}
