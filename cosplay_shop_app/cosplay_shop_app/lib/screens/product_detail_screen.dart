// lib/screens/product_detail_screen.dart - UPDATED VERSION
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/product_service.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/review_section.dart';
import 'login_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  
  const ProductDetailScreen({
    required this.productId,
    super.key,
  });
  
  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ProductService _service = ProductService();
  Product? product;
  bool loading = true;
  String? error;
  int _currentImageIndex = 0;
  int _quantity = 1;
  
  // NEW: Size & Color Selection
  String? _selectedSize;
  String? _selectedColor;
  final List<String> _availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  final List<Map<String, dynamic>> _availableColors = [
    {'name': 'Đỏ', 'color': Colors.red},
    {'name': 'Xanh', 'color': Colors.blue},
    {'name': 'Đen', 'color': Colors.black},
    {'name': 'Trắng', 'color': Colors.white},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      product = await _service.fetchProductById(widget.productId);
      // Set default size
      if (_availableSizes.isNotEmpty) {
        _selectedSize = _availableSizes[2]; // Default to L
      }
    } catch (e) {
      error = e.toString();
    } finally {
      setState(() { loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final wishlistProvider = context.watch<WishlistProvider>();
    final isInWishlist = product != null && wishlistProvider.isInWishlist(product!.id);
    
    if (loading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            color: theme.colorScheme.primary,
          ),
        ),
      );
    }
    
    if (error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text('Lỗi: $error'),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () {
                  setState(() {
                    loading = true;
                    error = null;
                  });
                  _load();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with Image
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (product!.images.isNotEmpty)
                    Hero(
                      tag: 'product-${product!.id}',
                      child: PageView.builder(
                        itemCount: product!.images.length,
                        onPageChanged: (index) {
                          setState(() {
                            _currentImageIndex = index;
                          });
                        },
                        itemBuilder: (context, index) {
                          return Image.network(
                            product!.images[index],
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: theme.colorScheme.surfaceContainerHighest,
                                child: const Icon(Icons.broken_image, size: 64),
                              );
                            },
                          );
                        },
                      ),
                    ),
                  
                  // Gradient Overlay
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 100,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.7),
                          ],
                        ),
                      ),
                    ),
                  ),
                  
                  // Image Indicators
                  if (product!.images.length > 1)
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          product!.images.length,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: _currentImageIndex == index ? 24 : 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: _currentImageIndex == index
                                  ? Colors.white
                                  : Colors.white.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  isInWishlist ? Icons.favorite : Icons.favorite_border,
                  color: isInWishlist ? Colors.red : null,
                ),
                onPressed: () => _handleToggleWishlist(context),
              ),
              IconButton(
                icon: const Icon(Icons.share),
                onPressed: () {
                  // Share product
                },
              ),
            ],
          ),
          
          // Product Details
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Name
                  Text(
                    product!.name,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Character Name
                  if (product!.characterName.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.secondaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        product!.characterName,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSecondaryContainer,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  
                  const SizedBox(height: 16),
                  
                  // Price
                  Text(
                    '${_formatPrice(product!.dailyPrice)} ₫',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  
                  // Size Selection
                  Text(
                    'Chọn kích thước',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableSizes.map((size) {
                      final isSelected = _selectedSize == size;
                      return ChoiceChip(
                        label: Text(size),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _selectedSize = selected ? size : null;
                          });
                        },
                        selectedColor: theme.colorScheme.primaryContainer,
                        labelStyle: TextStyle(
                          color: isSelected
                              ? theme.colorScheme.onPrimaryContainer
                              : theme.colorScheme.onSurface,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      );
                    }).toList(),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Color Selection
                  Text(
                    'Chọn màu sắc',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: _availableColors.map((colorData) {
                      final isSelected = _selectedColor == colorData['name'];
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedColor = colorData['name'];
                          });
                        },
                        child: Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: colorData['color'],
                            border: Border.all(
                              color: isSelected
                                  ? theme.colorScheme.primary
                                  : theme.colorScheme.outline,
                              width: isSelected ? 3 : 1,
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: isSelected
                              ? Icon(
                                  Icons.check,
                                  color: colorData['color'] == Colors.white ||
                                          colorData['color'] == Colors.yellow
                                      ? Colors.black
                                      : Colors.white,
                                )
                              : null,
                        ),
                      );
                    }).toList(),
                  ),
                  
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  
                  // Quantity Selector
                  Text(
                    'Số lượng',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      IconButton.outlined(
                        icon: const Icon(Icons.remove),
                        onPressed: _quantity > 1
                            ? () => setState(() => _quantity--)
                            : null,
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          '$_quantity',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      IconButton.outlined(
                        icon: const Icon(Icons.add),
                        onPressed: () => setState(() => _quantity++),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),
                  
                  // Description Section
                  Text(
                    'Mô tả sản phẩm',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Bộ cosplay chất lượng cao, thiết kế tinh xảo theo đúng nguyên mẫu nhân vật. Chất liệu cao cấp, thoải mái khi mặc.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      height: 1.5,
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  const Divider(),
                  
                  // Reviews Section
                  ReviewSection(productId: product!.id),
                  
                  const SizedBox(height: 100), // Space for bottom bar
                ],
              ),
            ),
          ),
        ],
      ),
      
      // Bottom Action Bar
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Add to Cart Button
              Expanded(
                child: FilledButton.tonalIcon(
                  onPressed: () => _handleAddToCart(context),
                  icon: const Icon(Icons.shopping_cart_outlined),
                  label: const Text('Thêm vào giỏ'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Buy Now Button
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _handleBuyNow(context),
                  icon: const Icon(Icons.bolt),
                  label: const Text('Mua ngay'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
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
    final isInWishlist = wishlistProvider.isInWishlist(widget.productId);
    
    final success = await wishlistProvider.toggleWishlist(widget.productId);
    
    if (context.mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isInWishlist 
                ? 'Đã xóa khỏi yêu thích' 
                : 'Đã thêm vào yêu thích'
          ),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
          backgroundColor: isInWishlist ? null : Colors.green,
        ),
      );
    }
  }

  Future<void> _handleAddToCart(BuildContext context) async {
    // Validate selections
    if (_selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn kích thước'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();
    
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Vui lòng đăng nhập để thêm vào giỏ hàng'),
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

    final cartProvider = context.read<CartProvider>();
    final success = await cartProvider.addToCart(
      widget.productId,
      quantity: _quantity,
    );
    
    if (context.mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã thêm $_quantity sản phẩm (Size: $_selectedSize${_selectedColor != null ? ', Màu: $_selectedColor' : ''}) vào giỏ hàng'),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(cartProvider.error ?? 'Có lỗi xảy ra'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<void> _handleBuyNow(BuildContext context) async {
    // Validate selections
    if (_selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn kích thước'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();
    
    if (!authProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Vui lòng đăng nhập để mua hàng'),
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

    // Add to cart first
    final cartProvider = context.read<CartProvider>();
    await cartProvider.addToCart(widget.productId, quantity: _quantity);
    
    // Navigate to checkout
    if (context.mounted) {
      Navigator.pushNamed(context, '/checkout'); // Or use MaterialPageRoute
    }
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}