import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/product_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/main_navigation.dart';
import 'services/image_service.dart';
import 'providers/wishlist_provider.dart';

void main() {
  HttpOverrides.global = CustomHttpOverrides();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
         ChangeNotifierProvider(create: (_) => WishlistProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          // Check auth status when app starts
          if (!auth.isAuthenticated && !auth.loading) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              auth.checkAuthStatus();
            });
          }

          return MaterialApp(
            title: 'Cosplay Shop',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepPurple,
                brightness: Brightness.light,
              ),
              appBarTheme: const AppBarTheme(
                centerTitle: true,
                elevation: 0,
                scrolledUnderElevation: 2,
              ),
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
            ),
            home: const MainNavigation(), // ✅ Đổi từ HomeScreen sang MainNavigation
          );
        },
      ),
    );
  }
}