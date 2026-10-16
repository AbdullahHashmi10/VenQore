import 'package:flutter/material.dart';

/// VenQore Design System v6 semantic tokens and color palette.
class AppColors {
  AppColors._();

  // ── Brand: Qore Teal ────────────────────────────────────────────────────────
  static const Color teal50 = Color(0xFFE6FBF5);
  static const Color teal100 = Color(0xFFC6F5E9);
  static const Color teal200 = Color(0xFF93EBD6);
  static const Color teal300 = Color(0xFF59DBC0);
  static const Color teal400 = Color(0xFF23C4A6); // Mint accent
  static const Color teal500 = Color(0xFF0BAA8F); // Primary brand teal
  static const Color teal600 = Color(0xFF088975); // Solid fill
  static const Color teal700 = Color(0xFF076B5E); // Deep teal
  static const Color teal800 = Color(0xFF0A5049); // Dark pine
  static const Color teal900 = Color(0xFF0B3A35);
  static const Color teal950 = Color(0xFF062421); // Midnight pine

  // Synonyms for backward compatibility
  static const Color teal = teal500;
  static const Color tealBright = teal400;
  static const Color pine = teal950;
  static const Color pineRaised = Color(0xFF0A3934);

  // ── Light Theme Surfaces & Lines ───────────────────────────────────────────
  static const Color canvas = Color(0xFFF1F5F2); // Page bg (never pure white)
  static const Color surface = Colors.white; // Floating card surface
  static const Color surface2 = Color(0xFFF8FAF8);
  static const Color sunken = Color(0xFFE6ECE8);
  static const Color line = Color(0xFFD3DCD7); // Standard card border
  static const Color lineSoft = Color(0xFFE6ECE8);
  static const Color lineStrong = Color(0xFFB4C0BA);

  // ── Dark Theme Surfaces & Lines ────────────────────────────────────────────
  static const Color darkCanvas = Color(0xFF0C1211);
  static const Color darkBgAlt = Color(0xFF080D0C);
  static const Color darkSurface = Color(0xFF141B19);
  static const Color darkSurface2 = Color(0xFF1A2220);
  static const Color darkSunken = Color(0xFF0A0F0E);
  static const Color darkRaised = Color(0xFF1D2624);
  static const Color darkLine = Color(0xFF24332D);
  static const Color darkLineSoft = Color(0x1FFFFFFF);

  // ── Ink (Typography) ───────────────────────────────────────────────────────
  static const Color ink = Color(0xFF17201B); // High contrast text
  static const Color inkMuted = Color(0xFF536159); // Secondary text
  static const Color inkFaint = Color(0xFF8B9A93); // Placeholder / captions
  static const Color inkInverted = Colors.white;

  // Dark text
  static const Color darkText = Color(0xFFEDF2EF);
  static const Color darkText2 = Color(0xFFA8B4AE);
  static const Color darkText3 = Color(0xFF8B9A93);

  // ── Semantic Feedback ──────────────────────────────────────────────────────
  static const Color danger = Color(0xFFC4443A);
  static const Color dangerBg = Color(0xFFFDEAE7);
  static const Color warning = Color(0xFFA6690A);
  static const Color warningBg = Color(0xFFFFF3D6);
  static const Color success = Color(0xFF12855C);
  static const Color successBg = Color(0xFFE4F6EC);
  static const Color info = Color(0xFF1B7096);
  static const Color infoBg = Color(0xFFDDF2FB);

  // ── Gradients ──────────────────────────────────────────────────────────────
  static const LinearGradient mintGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [teal400, teal500, teal700],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [teal950, teal800, teal400, teal50],
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [darkSurface, darkSurface2],
  );

  static const List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0x0A0D1412),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> accentGlow = [
    BoxShadow(
      color: Color(0x440BAA8F),
      blurRadius: 20,
      offset: Offset(0, 6),
    ),
  ];
}
