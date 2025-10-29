// lib/screens/rental_checkout_screen.dart
//import 'package:cosplay_shop_app/models/product.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../providers/rental_provider.dart';
import '../providers/auth_provider.dart';
import 'rental_orders_screen.dart';

class RentalCheckoutScreen extends StatefulWidget {
  const RentalCheckoutScreen({super.key});

  @override
  State<RentalCheckoutScreen> createState() => _RentalCheckoutScreenState();
}

class _RentalCheckoutScreenState extends State<RentalCheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _noteController = TextEditingController();
  
  String _paymentMethod = 'cod';
  String _deliveryMethod = 'delivery';
  bool _isProcessing = false;

  // Rental dates
  DateTime? _startDate;
  DateTime? _endDate;
  int _rentalDays = 1;

  @override
  void initState() {
    super.initState();
    // Pre-fill user info
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _addressController.text = user.address ?? '';
    }

    // Set default dates: tomorrow to day after
    _startDate = DateTime.now().add(const Duration(days: 1));
    _endDate = DateTime.now().add(const Duration(days: 2));
    _calculateRentalDays();
  }

  void _calculateRentalDays() {
    if (_startDate != null && _endDate != null) {
      setState(() {
        _rentalDays = _endDate!.difference(_startDate!).inDays + 1;
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cartProvider = context.watch<CartProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thuê trang phục'),
      ),
      body: cartProvider.items.isEmpty
          ? _buildEmptyCart(theme)
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Rental Period
                  _buildSection(
                    theme,
                    title: 'Thời gian thuê',
                    icon: Icons.calendar_today,
                    child: Column(
                      children: [
                        _buildDatePicker(
                          theme,
                          label: 'Ngày bắt đầu',
                          date: _startDate,
                          onTap: () => _selectStartDate(context),
                        ),
                        const SizedBox(height: 12),
                        _buildDatePicker(
                          theme,
                          label: 'Ngày trả',
                          date: _endDate,
                          onTap: () => _selectEndDate(context),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.timer, 
                                color: theme.colorScheme.onPrimaryContainer),
                              const SizedBox(width: 8),
                              Text(
                                'Thuê $_rentalDays ngày',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: theme.colorScheme.onPrimaryContainer,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Shipping Info
                  _buildSection(
                    theme,
                    title: 'Thông tin nhận hàng',
                    icon: Icons.location_on,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Họ và tên',
                              prefixIcon: Icon(Icons.person),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Vui lòng nhập họ tên';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _phoneController,
                            decoration: const InputDecoration(
                              labelText: 'Số điện thoại',
                              prefixIcon: Icon(Icons.phone),
                            ),
                            keyboardType: TextInputType.phone,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Vui lòng nhập số điện thoại';
                              }
                              if (value.length < 10) {
                                return 'Số điện thoại không hợp lệ';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _addressController,
                            decoration: const InputDecoration(
                              labelText: 'Địa chỉ nhận hàng',
                              prefixIcon: Icon(Icons.home),
                            ),
                            maxLines: 3,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Vui lòng nhập địa chỉ';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _noteController,
                            decoration: const InputDecoration(
                              labelText: 'Ghi chú (không bắt buộc)',
                              prefixIcon: Icon(Icons.note),
                            ),
                            maxLines: 2,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Delivery Method
                  _buildSection(
                    theme,
                    title: 'Hình thức nhận hàng',
                    icon: Icons.local_shipping,
                    child: Column(
                      children: [
                        RadioListTile<String>(
                          value: 'delivery',
                          groupValue: _deliveryMethod,
                          onChanged: (val) {
                            setState(() => _deliveryMethod = val!);
                          },
                          title: const Text('Giao hàng tận nơi'),
                          subtitle: const Text('Phí giao hàng: Miễn phí'),
                          contentPadding: EdgeInsets.zero,
                        ),
                        RadioListTile<String>(
                          value: 'pickup',
                          groupValue: _deliveryMethod,
                          onChanged: (val) {
                            setState(() => _deliveryMethod = val!);
                          },
                          title: const Text('Nhận tại cửa hàng'),
                          subtitle: const Text('123 Đường ABC, Quận 1, TP.HCM'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                  ),

                  // Payment Method
                  _buildSection(
                    theme,
                    title: 'Phương thức thanh toán',
                    icon: Icons.payment,
                    child: Column(
                      children: [
                        _buildPaymentOption(
                          theme,
                          value: 'cod',
                          title: 'Thanh toán khi nhận hàng (COD)',
                          subtitle: 'Thanh toán tiền thuê + tiền cọc khi nhận hàng',
                          icon: Icons.money,
                        ),
                        const Divider(),
                        _buildPaymentOption(
                          theme,
                          value: 'bank_transfer',
                          title: 'Chuyển khoản ngân hàng',
                          subtitle: 'Chuyển khoản trước khi nhận hàng',
                          icon: Icons.account_balance,
                        ),
                      ],
                    ),
                  ),

                  // Order Summary
                  _buildSection(
                    theme,
                    title: 'Thông tin đơn hàng',
                    icon: Icons.shopping_cart,
                    child: Column(
                      children: [
                        ...cartProvider.items.map((item) => _buildCartItem(theme, item)),
                        const Divider(height: 24),
                        _buildPriceRow(theme, 'Tiền thuê ($_rentalDays ngày)', 
                          _calculateSubtotal(cartProvider)),
                        const SizedBox(height: 8),
                        _buildPriceRow(theme, 'Tiền đặt cọc', 
                          _calculateDeposit(cartProvider)),
                        const SizedBox(height: 8),
                        _buildPriceRow(theme, 'Phí giao hàng', 0, isGreen: true),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Tổng thanh toán',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${_formatPrice(_calculateTotal(cartProvider))} ₫',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  '(Bao gồm tiền cọc)',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, 
                                size: 20,
                                color: theme.colorScheme.primary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Tiền cọc sẽ được hoàn lại sau khi bạn trả trang phục trong tình trạng tốt',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
      bottomNavigationBar: cartProvider.items.isNotEmpty
          ? _buildBottomBar(theme)
          : null,
    );
  }

  Widget _buildCartItem(ThemeData theme, item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 60,
              height: 60,
              color: theme.colorScheme.surfaceContainerHighest,
              child: item.images.isNotEmpty
                  ? Image.network(
                      item.images[0],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          const Icon(Icons.broken_image),
                    )
                  : const Icon(Icons.image),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: theme.textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'x${item.quantity} • ${_formatPrice(item.price)} ₫/ngày',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${_formatPrice(item.price * _rentalDays * item.quantity)} ₫',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCart(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_cart_outlined,
            size: 100,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Giỏ hàng trống',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Quay lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    ThemeData theme, {
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildPaymentOption(
    ThemeData theme, {
    required String value,
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    return RadioListTile<String>(
      value: value,
      groupValue: _paymentMethod,
      onChanged: (val) {
        setState(() {
          _paymentMethod = val!;
        });
      },
      title: Row(
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium,
                ),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildPriceRow(ThemeData theme, String label, double amount,
      {bool isGreen = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.bodyLarge),
        Text(
          amount == 0 ? 'Miễn phí' : '${_formatPrice(amount)} ₫',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: isGreen ? Colors.green : null,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(ThemeData theme) {
    return Container(
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
        child: SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _isProcessing ? null : _handleCheckout,
            icon: _isProcessing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.check_circle),
            label: Text(_isProcessing ? 'Đang xử lý...' : 'Đặt thuê'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDatePicker(ThemeData theme, {
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.calendar_today),
          border: const OutlineInputBorder(),
        ),
        child: Text(
          date != null 
              ? '${date.day}/${date.month}/${date.year}'
              : 'Chọn ngày',
          style: theme.textTheme.bodyLarge,
        ),
      ),
    );
  }

  Future<void> _selectStartDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
        // Auto adjust end date if needed
        if (_endDate == null || _endDate!.isBefore(_startDate!)) {
          _endDate = _startDate!.add(const Duration(days: 1));
        }
        _calculateRentalDays();
      });
    }
  }

  Future<void> _selectEndDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? (_startDate?.add(const Duration(days: 1)) ?? 
        DateTime.now().add(const Duration(days: 2))),
      firstDate: _startDate ?? DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _endDate = picked;
        _calculateRentalDays();
      });
    }
  }

  Future<void> _handleCheckout() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn thời gian thuê'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    final shippingAddress = '''
${_nameController.text}
${_phoneController.text}
${_addressController.text}
${_noteController.text.isNotEmpty ? 'Ghi chú: ${_noteController.text}' : ''}
    '''.trim();

    final rentalProvider = context.read<RentalProvider>();
    final cartProvider = context.read<CartProvider>();

    final order = await rentalProvider.createRentalOrder(
      paymentMethod: _paymentMethod,
      shippingAddress: shippingAddress,
      rentalStartDate: _startDate!.toIso8601String().split('T')[0],
      rentalEndDate: _endDate!.toIso8601String().split('T')[0],
      deliveryMethod: _deliveryMethod,
      notes: _noteController.text.isNotEmpty ? _noteController.text : null,
    );

    setState(() => _isProcessing = false);

    if (!mounted) return;

    if (order != null) {
      // Clear cart
      await cartProvider.clearCart();

      // Show success dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          icon: const Icon(
            Icons.check_circle,
            color: Colors.green,
            size: 64,
          ),
          title: const Text('Đặt thuê thành công!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Mã đơn: ${order.orderNumber}'),
              const SizedBox(height: 8),
              Text(
                'Thời gian thuê: ${_startDate!.day}/${_startDate!.month} - ${_endDate!.day}/${_endDate!.month}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Cảm ơn bạn đã đặt thuê. Chúng tôi sẽ liên hệ với bạn sớm nhất!',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Close checkout
              },
              child: const Text('Về trang chủ'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Close checkout
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RentalOrdersScreen()),
                );
              },
              child: const Text('Xem đơn thuê'),
            ),
          ],
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(rentalProvider.error ?? 'Có lỗi xảy ra'),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  double _calculateSubtotal(CartProvider cartProvider) {
    return cartProvider.items.fold(0.0, (sum, item) => 
      sum + (item.price * _rentalDays * item.quantity));
  }

 double _calculateDeposit(CartProvider cartProvider) {
  return cartProvider.items.fold(0.0, (sum, item) =>
      sum + item.totalDeposit);
}


  double _calculateTotal(CartProvider cartProvider) {
    return _calculateSubtotal(cartProvider) + _calculateDeposit(cartProvider);
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}