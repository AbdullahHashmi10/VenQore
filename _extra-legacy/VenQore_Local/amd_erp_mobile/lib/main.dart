import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/dashboard_screen.dart';
import 'theme/app_colors.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const AmdErpApp());
}

class AmdErpApp extends StatelessWidget {
  const AmdErpApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VenQore ERP Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Colors.black,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.indigoOrb,
          brightness: Brightness.dark,
          surface: AppColors.voidBase,
          background: Colors.black,
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: AppColors.textPrimary),
          bodyMedium: TextStyle(color: AppColors.textSecondary),
        ),
        fontFamily: 'Roboto', // Defaulting to Roboto, can be changed later
      ),
      home: const DashboardScreen(),
    );
  }
}
