import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../providers/auth_provider.dart';
import '../screens/home_screen.dart';
import '../screens/cart_screen.dart';
import '../screens/profile_screen.dart';
import 'wishlist_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    WishlistScreen(),
    CartScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    
    // Setup listener cho auth state changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      
      // Set callback để load cart và wishlist khi auth state thay đổi
      authProvider.onAuthStateChanged = () {
        _loadDataIfAuthenticated();
      };
      
      // Load data ngay nếu đã đăng nhập
      _loadDataIfAuthenticated();
    });
  }

  void _loadDataIfAuthenticated() {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      // Load cart
      context.read<CartProvider>().loadCart().catchError((e) {
        print('❌ Error loading cart: $e');
      });
      
      // Load wishlist
      context.read<WishlistProvider>().loadWishlist().catchError((e) {
        print('❌ Error loading wishlist: $e');
      });
      
      print('✅ Loaded cart and wishlist for authenticated user');
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    final wishlistProvider = context.watch<WishlistProvider>();

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
          
          // Load dữ liệu khi chuyển tab
          final authProvider = context.read<AuthProvider>();
          if (authProvider.isAuthenticated) {
            // Load cart khi chuyển sang tab giỏ hàng
            if (index == 2) {
              context.read<CartProvider>().loadCart();
            }
            // Load wishlist khi chuyển sang tab yêu thích
            else if (index == 1) {
              context.read<WishlistProvider>().loadWishlist();
            }
          }
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          NavigationDestination(
            icon: Badge(
              label: Text('${wishlistProvider.itemCount}'),
              isLabelVisible: wishlistProvider.itemCount > 0,
              child: const Icon(Icons.favorite_border),
            ),
            selectedIcon: Badge(
              label: Text('${wishlistProvider.itemCount}'),
              isLabelVisible: wishlistProvider.itemCount > 0,
              child: const Icon(Icons.favorite),
            ),
            label: 'Yêu thích',
          ),
          NavigationDestination(
            icon: Badge(
              label: Text('${cartProvider.itemCount}'),
              isLabelVisible: cartProvider.itemCount > 0,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            selectedIcon: Badge(
              label: Text('${cartProvider.itemCount}'),
              isLabelVisible: cartProvider.itemCount > 0,
              child: const Icon(Icons.shopping_cart),
            ),
            label: 'Giỏ hàng',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }
}