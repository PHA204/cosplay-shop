// lib/screens/rental_orders_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/rental_provider.dart';
import '../providers/auth_provider.dart';
import '../models/rental_order.dart';
import 'login_screen.dart';
import 'rental_order_detail_screen.dart';

class RentalOrdersScreen extends StatefulWidget {
  const RentalOrdersScreen({super.key});

  @override
  State<RentalOrdersScreen> createState() => _RentalOrdersScreenState();
}

class _RentalOrdersScreenState extends State<RentalOrdersScreen> {
  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      await context.read<RentalProvider>().loadRentalOrders();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final rentalProvider = context.watch<RentalProvider>();
    final authProvider = context.watch<AuthProvider>();

    if (!authProvider.isAuthenticated) {
      return _buildNotLoggedIn(context, theme);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đơn thuê của tôi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: rentalProvider.loading
          ? const Center(child: CircularProgressIndicator())
          : rentalProvider.orders.isEmpty
              ? _buildEmptyOrders(theme)
              : RefreshIndicator(
                  onRefresh: _loadOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: rentalProvider.orders.length,
                    itemBuilder: (context, index) {
                      final order = rentalProvider.orders[index];
                      return _buildOrderCard(context, theme, order);
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
              Icons.receipt_long_outlined,
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
              'Đăng nhập để xem đơn thuê của bạn',
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

  Widget _buildEmptyOrders(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inventory_2_outlined,
            size: 120,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
          ),
          const SizedBox(height: 24),
          Text(
            'Chưa có đơn thuê nào',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Hãy thuê trang phục để trải nghiệm!',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, ThemeData theme, RentalOrder order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => RentalOrderDetailScreen(orderId: order.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.orderNumber,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatDate(order.createdAt),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusChip(theme, order.status, order.statusText),
                ],
              ),

              const SizedBox(height: 12),

              // Rental Period
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: theme.colorScheme.primary.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.calendar_month,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${_formatShortDate(order.rentalStartDate)} - ${_formatShortDate(order.rentalEndDate)} (${order.rentalDays} ngày)',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(height: 24),

              // Items Preview
              ...order.items.take(2).map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            width: 50,
                            height: 50,
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
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                'x${item.quantity} • ${item.rentalDays} ngày',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '${_formatPrice(item.subtotal)} ₫',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  )),

              if (order.items.length > 2)
                Text(
                  '+ ${order.items.length - 2} sản phẩm khác',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),

              const Divider(height: 24),

              // Footer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tổng thanh toán',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        '${_formatPrice(order.totalAmount)} ₫',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '(Bao gồm cọc: ${_formatPrice(order.depositTotal)} ₫)',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  if (order.canCancel)
                    OutlinedButton(
                      onPressed: () => _showCancelDialog(context, order.id),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.colorScheme.error,
                      ),
                      child: const Text('Hủy đơn'),
                    )
                  else
                    FilledButton.tonal(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => RentalOrderDetailScreen(orderId: order.id),
                          ),
                        );
                      },
                      child: const Text('Chi tiết'),
                    ),
                ],
              ),

              // Overdue warning
              if (order.isOverdue)
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning, color: Colors.red.shade700, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Đơn thuê đã quá hạn. Vui lòng trả sớm để tránh phí phạt!',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.red.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Days until return
              if (order.isActive && !order.isOverdue)
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.tertiaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        color: theme.colorScheme.onTertiaryContainer,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Còn ${order.daysUntilReturn} ngày nữa đến hạn trả',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onTertiaryContainer,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(ThemeData theme, String status, String text) {
    Color bgColor;
    Color textColor;

    switch (status) {
      case 'pending':
        bgColor = Colors.orange.withOpacity(0.2);
        textColor = Colors.orange.shade700;
        break;
      case 'confirmed':
        bgColor = Colors.blue.withOpacity(0.2);
        textColor = Colors.blue.shade700;
        break;
      case 'preparing':
        bgColor = Colors.purple.withOpacity(0.2);
        textColor = Colors.purple.shade700;
        break;
      case 'delivering':
        bgColor = Colors.indigo.withOpacity(0.2);
        textColor = Colors.indigo.shade700;
        break;
      case 'rented':
        bgColor = Colors.teal.withOpacity(0.2);
        textColor = Colors.teal.shade700;
        break;
      case 'returning':
        bgColor = Colors.amber.withOpacity(0.2);
        textColor = Colors.amber.shade700;
        break;
      case 'completed':
        bgColor = Colors.green.withOpacity(0.2);
        textColor = Colors.green.shade700;
        break;
      case 'cancelled':
        bgColor = Colors.red.withOpacity(0.2);
        textColor = Colors.red.shade700;
        break;
      case 'overdue':
        bgColor = Colors.red.withOpacity(0.3);
        textColor = Colors.red.shade900;
        break;
      default:
        bgColor = theme.colorScheme.surfaceContainerHighest;
        textColor = theme.colorScheme.onSurface;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: theme.textTheme.labelSmall?.copyWith(
          color: textColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context, String orderId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy đơn thuê'),
        content: const Text('Bạn có chắc muốn hủy đơn thuê này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Không'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await context.read<RentalProvider>().cancelRentalOrder(orderId);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Đã hủy đơn thuê' : 'Không thể hủy đơn thuê'),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: success ? Colors.green : Colors.red,
                  ),
                );
              }
            },
            child: const Text('Hủy đơn'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatShortDate(DateTime date) {
    return '${date.day}/${date.month}';
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }
}