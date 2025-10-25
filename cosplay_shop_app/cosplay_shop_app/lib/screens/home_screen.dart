import 'package:cosplay_shop_app/screens/profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/product_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/product_card.dart';
import 'product_detail_screen.dart';
import 'login_screen.dart';
import 'dart:async';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'all';
  Timer? _debounce;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ProductProvider>(context, listen: false).loadProducts();
    });
     _searchController.addListener(_onSearchChanged);
  }
 
 void _onSearchChanged() {
  // Hủy timer cũ nếu có
  if (_debounce?.isActive ?? false) _debounce!.cancel();
  
  // Tạo timer mới, chờ 500ms sau khi user ngừng gõ
  _debounce = Timer(const Duration(milliseconds: 500), () {
    final query = _searchController.text.trim();
    
    print('🔍 Searching for: $query');
    
    if (query.isEmpty) {
      // Nếu xóa hết text, load lại toàn bộ sản phẩm
      Provider.of<ProductProvider>(context, listen: false).loadProducts();
    } else {
      // Tìm kiếm với từ khóa
      Provider.of<ProductProvider>(context, listen: false)
          .loadProducts(search: query);
    }
  });
}
  @override
  void dispose() {
    _searchController.dispose();
     _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final prov = Provider.of<ProductProvider>(context);
    final theme = Theme.of(context);
    
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            floating: true,
            snap: true,
            elevation: 0,
            backgroundColor: theme.colorScheme.primaryContainer,
            expandedHeight: 120,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(
                      children: [
                        Icon(
                          Icons.shopping_bag_outlined,
                          color: theme.colorScheme.onPrimary,
                          size: 32,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Cosplay Shop',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            color: theme.colorScheme.onPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                        icon: Icon(
                          Icons.person_outline,
                          color: theme.colorScheme.onPrimary,
                        ),
                        onPressed: () {
                          final authProvider = context.read<AuthProvider>();
                          
                          if (authProvider.isAuthenticated) {
                            // Nếu đã đăng nhập, chuyển đến tab Profile
                            // Cần truy cập MainNavigation để đổi tab
                            final navigator = Navigator.of(context);
                            // Pop về root nếu đang ở screen khác
                            navigator.popUntil((route) => route.isFirst);
                            
                            // Sau đó trigger đổi tab (cần implement callback từ MainNavigation)
                            // Tạm thời dùng cách đơn giản: push ProfileScreen
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ProfileScreen()),
                            );
                          } else {
                            // Nếu chưa đăng nhập, hiện màn hình đăng nhập
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                          }
                        },
                      ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

         // Search Bar
          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Consumer<ProductProvider>(
                builder: (context, productProvider, _) {
                  return TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm cosplay...',
                      prefixIcon: productProvider.loading 
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            )
                          : const Icon(Icons.search),
                      suffixIcon: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_searchController.text.isNotEmpty)
                            IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                              },
                            ),
                          IconButton(
                            icon: const Icon(Icons.filter_list),
                            onPressed: () {
                              _showFilterSheet(context);
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Categories
          SliverToBoxAdapter(
            child: SizedBox(
              height: 50,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildCategoryChip(context, 'Tất cả', 'all'),
                  _buildCategoryChip(context, 'Anime', 'anime'),
                  _buildCategoryChip(context, 'Game', 'game'),
                  _buildCategoryChip(context, 'Movie', 'movie'),
                  _buildCategoryChip(context, 'Phụ kiện', 'accessories'),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // Products Grid
          // Products Grid
          if (prov.loading)
            SliverToBoxAdapter(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 16),
                      Text(
                        _searchController.text.isNotEmpty 
                            ? 'Đang tìm kiếm "${_searchController.text}"...'
                            : 'Đang tải sản phẩm...',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (prov.error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Có lỗi xảy ra',
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        prov.error!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: () => prov.loadProducts(),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Thử lại'),
                    ),
                  ],
                ),
              ),
            )
          else if (prov.products.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      size: 64,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Không có sản phẩm',
                      style: theme.textTheme.titleLarge,
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.7,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    final p = prov.products[i];
                    return ProductCard(
                      product: p,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductDetailScreen(productId: p.id),
                        ),
                      ),
                      onAddToCart: () => _handleAddToCart(context, p.id),
                    );
                  },
                  childCount: prov.products.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    final selected = _selectedCategory == value;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (isSelected) {
       _handleCategoryFilter(value);
       },
        backgroundColor: theme.colorScheme.surface,
        selectedColor: theme.colorScheme.primaryContainer,
        labelStyle: TextStyle(
          color: selected
              ? theme.colorScheme.onPrimaryContainer
              : theme.colorScheme.onSurface,
          fontWeight: selected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
      }
    void _handleCategoryFilter(String category) {
      setState(() {
        _selectedCategory = category;
      });
      
      final provider = Provider.of<ProductProvider>(context, listen: false);
      
      if (category == 'all') {
        provider.loadProducts(search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null);
      } else {
        // Cần thêm mapping category name -> ID từ database
        // Tạm thời dùng search theo tên category
        provider.loadProducts(
          search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null,
          // categoryId: category, // Uncomment khi có category ID
        );
      }
    }
  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Bộ lọc',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.sort),
              title: const Text('Sắp xếp theo'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Show sort options
              },
            ),
            ListTile(
              leading: const Icon(Icons.attach_money),
              title: const Text('Khoảng giá'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Show price range
              },
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Áp dụng'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleAddToCart(BuildContext context, String productId) async {
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
    final success = await cartProvider.addToCart(productId);
    
    if (context.mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã thêm vào giỏ hàng'),
            behavior: SnackBarBehavior.floating,
            duration: Duration(seconds: 2),
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
}