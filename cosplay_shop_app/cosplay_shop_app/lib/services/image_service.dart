// lib/services/image_service.dart
import 'dart:io';

class CustomHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
    // Set user agent
    client.connectionTimeout = const Duration(seconds: 30);
    return client;
  }
}