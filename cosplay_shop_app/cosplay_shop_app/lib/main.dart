// lib/main.dart - UPDATED
import 'dart:io';
import 'package:cosplay_shop_app/providers/theme_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/product_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/wishlist_provider.dart';
import 'providers/rental_provider.dart'; // NEW
import 'screens/main_navigation.dart';
import 'services/image_service.dart';
import 'config/app_theme.dart';

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
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
        ChangeNotifierProvider(create: (_) => RentalProvider()), 
      ],
      child: Consumer2<AuthProvider,ThemeProvider>(
        builder: (context, auth,theme , _) {
          if (!auth.isAuthenticated && !auth.loading) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              auth.checkAuthStatus();
            });
          }

          if (theme.isLoading) {
            return const MaterialApp(
              debugShowCheckedModeBanner: false,
              home: Scaffold(
                body: Center(
                  child: CircularProgressIndicator(),
                ),
              ),
            );
          }

          return MaterialApp(
            title: 'Cosplay Shop',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: theme.themeMode,             
            home: const MainNavigation(),
          );
        },
      ),
    );
  }
}