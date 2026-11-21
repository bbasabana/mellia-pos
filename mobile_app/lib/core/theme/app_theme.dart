import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Mellia look: light grey canvas, white cards, the three logo colours as accents,
/// soft shadows and calm "desktop" motion (fade + slight scale, no bouncing).
class AppTheme {
  // Logo colours
  static const Color cyan = Color(0xFF00D3FA);
  static const Color lime = Color(0xFF71DE00);
  static const Color brandOrange = Color(0xFFFF4900);
  static const Color ink = Color(0xFF0F172A);

  // Readable shades of the logo colours (text, buttons, icons on white)
  static const Color cyanDark = Color(0xFF0089AD);
  static const Color limeDark = Color(0xFF3F8A00);

  /// Accent used across the app (kept under its historical name).
  static const Color primaryBlue = cyanDark;
  static const Color orange500 = brandOrange;
  static const Color orange600 = Color(0xFFE03D00);
  static const Color orange50 = Color(0xFFFFF4ED);
  static const Color orange200 = Color(0xFFFFC9AA);

  // Neutrals (slightly cool)
  static const Color canvas = Color(0xFFF0F3F6);
  static const Color line = Color(0xFFE3E8EE);
  static const Color muted = Color(0xFF6B7789);
  static const Color subtle = Color(0xFF98A3B3);

  // Status
  static const Color error = Color(0xFFE5484D);
  static const Color success = Color(0xFF3F8A00);
  static const Color warning = Color(0xFFF59E0B);

  /// Standard motion: short, eased, like macOS sheets and windows.
  static const Duration fast = Duration(milliseconds: 180);
  static const Duration medium = Duration(milliseconds: 320);
  static const Curve curve = Curves.easeOutCubic;

  static List<BoxShadow> get softShadow => [
    BoxShadow(
      color: ink.withValues(alpha: 0.05),
      blurRadius: 2,
      offset: const Offset(0, 1),
    ),
    BoxShadow(
      color: ink.withValues(alpha: 0.06),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];

  static ThemeData get lightTheme {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light);
    final text = GoogleFonts.interTextTheme(
      base.textTheme,
    ).apply(bodyColor: ink, displayColor: ink);

    OutlineInputBorder border(Color c, [double w = 1]) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: c, width: w),
    );

    return base.copyWith(
      colorScheme: ColorScheme.fromSeed(
        seedColor: cyan,
        primary: primaryBlue,
        onPrimary: Colors.white,
        secondary: brandOrange,
        tertiary: limeDark,
        surface: Colors.white,
        onSurface: ink,
        error: error,
      ),
      scaffoldBackgroundColor: canvas,
      textTheme: text,
      splashFactory: InkSparkle.splashFactory,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: DesktopFadeTransitionsBuilder(),
          TargetPlatform.iOS: DesktopFadeTransitionsBuilder(),
          TargetPlatform.macOS: DesktopFadeTransitionsBuilder(),
        },
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: canvas,
        surfaceTintColor: Colors.transparent,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: ink,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: line),
        ),
      ),
      dividerTheme: const DividerThemeData(color: line, thickness: 1, space: 1),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: Colors.white,
          disabledBackgroundColor: ink.withValues(alpha: 0.25),
          disabledForegroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 22),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ink,
          side: const BorderSide(color: line),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          textStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryBlue,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF7F9FB),
        hintStyle: const TextStyle(color: subtle),
        border: border(line),
        enabledBorder: border(line),
        focusedBorder: border(cyan, 2),
        errorBorder: border(error),
        focusedErrorBorder: border(error, 2),
        contentPadding: const EdgeInsets.symmetric(
          vertical: 16,
          horizontal: 16,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: ink,
        side: const BorderSide(color: line),
        shape: const StadiumBorder(),
        labelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: ink,
        ),
        secondaryLabelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 24,
        shadowColor: ink.withValues(alpha: 0.25),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        showDragHandle: false,
        dragHandleColor: line,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: ink,
        contentTextStyle: GoogleFonts.inter(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      listTileTheme: const ListTileThemeData(
        iconColor: muted,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.all(Colors.white),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? limeDark
              : const Color(0xFFCFD6DF),
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: cyanDark),
      tabBarTheme: TabBarThemeData(
        labelColor: ink,
        unselectedLabelColor: muted,
        indicatorColor: ink,
        dividerColor: Colors.transparent,
        labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w700),
        unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500),
      ),
    );
  }

  static InputDecoration inputDecoration({
    required String label,
    IconData? prefixIcon,
    String? hint,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: subtle) : null,
    );
  }
}

/// Page transition like a macOS window: the new page fades in while growing from 97 %,
/// the old one fades slightly back.
class DesktopFadeTransitionsBuilder extends PageTransitionsBuilder {
  const DesktopFadeTransitionsBuilder();

  @override
  Duration get transitionDuration => AppTheme.medium;

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final inCurve = CurvedAnimation(
      parent: animation,
      curve: AppTheme.curve,
      reverseCurve: Curves.easeInCubic,
    );
    final outCurve = CurvedAnimation(
      parent: secondaryAnimation,
      curve: AppTheme.curve,
    );
    return FadeTransition(
      opacity: Tween(begin: 1.0, end: 0.6).animate(outCurve),
      child: ScaleTransition(
        scale: Tween(begin: 1.0, end: 0.985).animate(outCurve),
        child: FadeTransition(
          opacity: inCurve,
          child: ScaleTransition(
            scale: Tween(begin: 0.97, end: 1.0).animate(inCurve),
            child: child,
          ),
        ),
      ),
    );
  }
}
