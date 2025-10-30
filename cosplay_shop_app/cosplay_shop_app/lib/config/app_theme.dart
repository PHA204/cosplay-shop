// lib/config/app_theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  // ============================================
  // LIGHT THEME
  // ============================================
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    
    colorScheme: ColorScheme.fromSeed(
      seedColor: Colors.deepPurple,
      brightness: Brightness.light,
    ),
    
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 2,
    ),
    
    // ← SỬA DÒNG NÀY: CardTheme → CardThemeData
    cardTheme: const CardThemeData(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
    ),
    
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        borderSide: BorderSide.none,
      ),
      contentPadding: EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
    ),
  );

  // ============================================
  // DARK THEME
  // ============================================
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    
    colorScheme: ColorScheme.fromSeed(
      seedColor: Colors.deepPurple,
      brightness: Brightness.dark,
    ),
    
    appBarTheme: const AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 2,
      backgroundColor: Color(0xFF1E1E1E),
    ),
    
    // ← SỬA DÒNG NÀY: CardTheme → CardThemeData
    cardTheme: const CardThemeData(
      elevation: 2,
      color: Color(0xFF1E1E1E),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
    ),
    
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: Color(0xFF2C2C2C),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        borderSide: BorderSide.none,
      ),
      contentPadding: EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
    ),

    // Bottom navigation
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xFF1E1E1E),
      indicatorColor: Colors.deepPurpleAccent.withOpacity(0.3),
    ),

    // Dark mode specific
    scaffoldBackgroundColor: const Color(0xFF121212),
  );
} 