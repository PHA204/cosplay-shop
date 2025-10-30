// lib/providers/theme_provider.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  static const String _themeKey = 'theme_mode';
  
  ThemeMode _themeMode = ThemeMode.system;
  bool _isLoading = true;

  ThemeMode get themeMode => _themeMode;
  bool get isLoading => _isLoading;
  
  bool get isDarkMode {
    if (_themeMode == ThemeMode.system) {
      // Lấy theme từ system
      return WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark;
    }
    return _themeMode == ThemeMode.dark;
  }

  ThemeProvider() {
    _loadThemeFromPrefs();
  }

  // Load theme từ SharedPreferences
  Future<void> _loadThemeFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeModeString = prefs.getString(_themeKey);
      
      if (themeModeString != null) {
        _themeMode = ThemeMode.values.firstWhere(
          (mode) => mode.toString() == themeModeString,
          orElse: () => ThemeMode.system,
        );
      }
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      print('❌ Error loading theme: $e');
      _isLoading = false;
      notifyListeners();
    }
  }

  // Đổi theme mode
  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    
    _themeMode = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, mode.toString());
      print('✅ Theme saved: $mode');
    } catch (e) {
      print('❌ Error saving theme: $e');
    }
  }

  // Toggle dark mode on/off
  Future<void> toggleDarkMode() async {
    if (_themeMode == ThemeMode.dark) {
      await setThemeMode(ThemeMode.light);
    } else {
      await setThemeMode(ThemeMode.dark);
    }
  }

  // Đặt theme theo system
  Future<void> setSystemTheme() async {
    await setThemeMode(ThemeMode.system);
  }
}