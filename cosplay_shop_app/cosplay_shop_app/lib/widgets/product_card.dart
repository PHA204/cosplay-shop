import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/wishlist_provider.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  
  const ProductCard({
    required this.product,
    this.onTap,
    this.onAddToCart,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final imageUrl = product.images.isNotEmpty ? product.images[0].toString() : null;
    final wishlistProvider = context.watch<WishlistProvider>();
    final isInWishlist = wishlistProvider.isInWishlist(product.id);
    
    return GestureDetector(
      onTap: onTap,
      child: Card(
        clipBehavior: Clip.antiAlias,
        elevation: 2,
        shadowColor: theme.colorScheme.shadow.withOpacity(0.3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Container
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  if (imageUrl != null)
                    Hero(
                      tag: 'product-${product.id}',
                      child: Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            color: theme.colorScheme.surfaceContainerHighest,
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  CircularProgressIndicator(
                                    value: loadingProgress.expectedTotalBytes != null
                                        ? loadingProgress.cumulativeBytesLoaded /
                                            loadingProgress.expectedTotalBytes!
                                        : null,
                                    strokeWidth: 2,
                                    color: theme.colorScheme.primary,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Đang tải...',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: theme.colorScheme.errorContainer,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.broken_image_outlined,
                                  color: theme.colorScheme.onErrorContainer,
                                  size: 40,
                                ),
                                const SizedBox(height: 8),
                                Padding(
                                  padding: const EdgeInsets.all(8.0),
                                  child: Text(
                                    'Lỗi tải ảnh',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onErrorContainer,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    )
                  else
                    Container(
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.image_outlined,
                              color: theme.colorScheme.onSurfaceVariant,
                              size: 40,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Chưa có ảnh',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  
                  // Favorite Button
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface.withOpacity(0.9),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: Icon(
                          isInWishlist ? Icons.favorite : Icons.favorite_border,
                          color: isInWishlist ? Colors.red : theme.colorScheme.primary,
                        ),
                        iconSize: 20,
                        padding: const EdgeInsets.all(8),
                        constraints: const BoxConstraints(),
                        onPressed: () => _handleToggleWishlist(context),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Product Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Name
                    Text(
                      product.name,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    
                    // Character Name
                    if (product.characterName.isNotEmpty)
                      Text(
                        product.characterName,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    
                    const Spacer(),
                    
                    // Price and Cart Button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${_formatPrice(product.dailyPrice)} ₫',
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: IconButton(
                            icon: Icon(
                              Icons.add_shopping_cart,
                              size: 20,
                              color: theme.colorScheme.onPrimaryContainer,
                            ),
                            padding: const EdgeInsets.all(6),
                            constraints: const BoxConstraints(),
                            onPressed: onAddToCart,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleToggleWishlist(BuildContext context) async {
    final authProvider = context.read<AuthProvider>();
    
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Vui lòng đăng nhập để thêm vào yêu thích'),
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Đăng nhập',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
          ),
        ),
      );
      return;
    }

    final wishlistProvider = context.read<WishlistProvider>();
    final isInWishlist = wishlistProvider.isInWishlist(product.id);
    
    final success = await wishlistProvider.toggleWishlist(product.id);
    
    if (context.mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isInWishlist 
                ? 'Đã xóa khỏi yêu thích' 
                : 'Đã thêm vào yêu thích'
          ),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 1),
          backgroundColor: isInWishlist ? null : Colors.green,
        ),
      );
    }
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}