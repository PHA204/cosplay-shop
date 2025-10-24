import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wishlist_provider.dart';
import '../providers/auth_provider.dart';
import '../models/product.dart';
import 'product_detail_screen.dart';
import 'login_screen.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  Future<void> _loadWishlist() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      await context.read<WishlistProvider>().loadWishlist();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wishlistProvider = context.watch<WishlistProvider>();
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Danh sách yêu thích${wishlistProvider.items.isNotEmpty ? ' (${wishlistProvider.itemCount})' : ''}'),
        actions: [
          if (wishlistProvider.items.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadWishlist,
            ),
        ],
      ),
      body: !authProvider.isAuthenticated
          ? _buildNotLoggedIn(context, theme)
          : wishlistProvider.loading
              ? const Center(child: CircularProgressIndicator())
              : wishlistProvider.items.isEmpty
                  ? _buildEmptyWishlist(theme)
                  : RefreshIndicator(
                      onRefresh: _loadWishlist,
                      child: GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.7,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: wishlistProvider.items.length,
                        itemBuilder: (context, index) {
                          final product = wishlistProvider.items[index];
                          return _buildWishlistCard(theme, product);
                        },
                      ),
                    ),
    );
  }

  Widget _buildNotLoggedIn(BuildContext context, ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.favorite_border,
              size: 100,
              color: theme.colorScheme.primary.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            Text(
              'Bạn chưa đăng nhập',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Đăng nhập để xem danh sách yêu thích',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              icon: const Icon(Icons.login),
              label: const Text('Đăng nhập'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyWishlist(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.favorite_border,
            size: 120,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
          ),
          const SizedBox(height: 24),
          Text(
            'Chưa có sản phẩm yêu thích',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Thêm sản phẩm vào danh sách yêu thích',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 32),
          FilledButton.icon(
            onPressed: () {
              // Navigate to home tab
              // You can use a controller or key to switch tabs
            },
            icon: const Icon(Icons.shopping_bag_outlined),
            label: const Text('Khám phá sản phẩm'),
          ),
        ],
      ),
    );
  }

  Widget _buildWishlistCard(ThemeData theme, Product product) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: product.id),
          ),
        );
      },
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: Container(
                    color: theme.colorScheme.surfaceContainerHighest,
                    width: double.infinity,
                    child: product.images.isNotEmpty
                        ? Image.network(
                            product.images[0],
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(Icons.broken_image, size: 40);
                            },
                          )
                        : const Icon(Icons.image, size: 40),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: theme.textTheme.titleSmall,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Spacer(),
                        Text(
                          '${_formatPrice(product.dailyPrice)} ₫',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            // Remove button
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.9),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.favorite),
                  iconSize: 20,
                  color: theme.colorScheme.error,
                  padding: const EdgeInsets.all(8),
                  constraints: const BoxConstraints(),
                  onPressed: () async {
                    final success = await context
                        .read<WishlistProvider>()
                        .removeFromWishlist(product.id);
                    
                    if (context.mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Đã xóa khỏi yêu thích'),
                          behavior: SnackBarBehavior.floating,
                          duration: Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}