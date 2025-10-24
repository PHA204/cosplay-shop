// lib/screens/search_screen.dart
import 'package:flutter/material.dart';
import '../services/product_service.dart';
import '../models/product.dart';
import '../widgets/product_card.dart';
import 'product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ProductService _productService = ProductService();
  
  List<Product> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;
  
  // Filter options
  String? _selectedCategory;
  double _minPrice = 0;
  double _maxPrice = 1000000;
  String _sortBy = 'newest'; // newest, price_low, price_high
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch() async {
    if (_searchController.text.trim().isEmpty) return;
    
    setState(() {
      _isSearching = true;
      _hasSearched = true;
    });

    try {
      final results = await _productService.fetchProducts(
        search: _searchController.text.trim(),
        categoryId: _selectedCategory,
      );
      
      // Apply filters
      var filteredResults = results.where((product) {
        final priceInRange = product.dailyPrice >= _minPrice && 
                             product.dailyPrice <= _maxPrice;
        return priceInRange;
      }).toList();
      
      // Apply sorting
      filteredResults.sort((a, b) {
        switch (_sortBy) {
          case 'price_low':
            return a.dailyPrice.compareTo(b.dailyPrice);
          case 'price_high':
            return b.dailyPrice.compareTo(a.dailyPrice);
          default: // newest
            return 0;
        }
      });
      
      setState(() {
        _searchResults = filteredResults;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tìm kiếm: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Tìm kiếm cosplay...',
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _searchResults = [];
                        _hasSearched = false;
                      });
                    },
                  )
                : null,
          ),
          onSubmitted: (_) => _performSearch(),
          autofocus: true,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: _performSearch,
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterSheet(context),
          ),
        ],
      ),
      body: _isSearching
          ? const Center(child: CircularProgressIndicator())
          : !_hasSearched
              ? _buildSearchSuggestions(theme)
              : _searchResults.isEmpty
                  ? _buildNoResults(theme)
                  : _buildSearchResults(),
    );
  }

  Widget _buildSearchSuggestions(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search,
            size: 100,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Tìm kiếm trang phục cosplay',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Nhập tên nhân vật hoặc tên trang phục',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoResults(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 100,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Không tìm thấy kết quả',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Thử tìm kiếm với từ khóa khác',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return Column(
      children: [
        // Results header
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Text(
                'Tìm thấy ${_searchResults.length} kết quả',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _showFilterSheet(context),
                icon: const Icon(Icons.tune, size: 20),
                label: const Text('Lọc'),
              ),
            ],
          ),
        ),
        
        // Results grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.7,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final product = _searchResults[index];
              return ProductCard(
                product: product,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProductDetailScreen(productId: product.id),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return StatefulBuilder(
            builder: (context, setModalState) {
              return Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(
                          'Bộ lọc',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () {
                            setModalState(() {
                              _selectedCategory = null;
                              _minPrice = 0;
                              _maxPrice = 1000000;
                              _sortBy = 'newest';
                            });
                          },
                          child: const Text('Đặt lại'),
                        ),
                      ],
                    ),
                  ),
                  
                  // Filter content
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.all(16),
                      children: [
                        // Sort by
                        Text(
                          'Sắp xếp theo',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text('Mới nhất'),
                              selected: _sortBy == 'newest',
                              onSelected: (selected) {
                                setModalState(() {
                                  _sortBy = 'newest';
                                });
                              },
                            ),
                            ChoiceChip(
                              label: const Text('Giá thấp đến cao'),
                              selected: _sortBy == 'price_low',
                              onSelected: (selected) {
                                setModalState(() {
                                  _sortBy = 'price_low';
                                });
                              },
                            ),
                            ChoiceChip(
                              label: const Text('Giá cao đến thấp'),
                              selected: _sortBy == 'price_high',
                              onSelected: (selected) {
                                setModalState(() {
                                  _sortBy = 'price_high';
                                });
                              },
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Price range
                        Text(
                          'Khoảng giá',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        RangeSlider(
                          values: RangeValues(_minPrice, _maxPrice),
                          min: 0,
                          max: 1000000,
                          divisions: 20,
                          labels: RangeLabels(
                            '${(_minPrice / 1000).toStringAsFixed(0)}k',
                            '${(_maxPrice / 1000).toStringAsFixed(0)}k',
                          ),
                          onChanged: (values) {
                            setModalState(() {
                              _minPrice = values.start;
                              _maxPrice = values.end;
                            });
                          },
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${(_minPrice / 1000).toStringAsFixed(0)}k ₫'),
                            Text('${(_maxPrice / 1000).toStringAsFixed(0)}k ₫'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  // Apply button
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(
                          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                    ),
                    child: SafeArea(
                      child: SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: () {
                            setState(() {});
                            Navigator.pop(context);
                            _performSearch();
                          },
                          child: const Text('Áp dụng'),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}