// lib/screens/rental_order_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/rental_provider.dart';
import '../models/rental_order.dart';

class RentalOrderDetailScreen extends StatefulWidget {
  final String orderId;

  const RentalOrderDetailScreen({
    super.key,
    required this.orderId,
  });

  @override
  State<RentalOrderDetailScreen> createState() => _RentalOrderDetailScreenState();
}

class _RentalOrderDetailScreenState extends State<RentalOrderDetailScreen> {
  bool _isLoading = true;
  RentalOrder? _order;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrderDetail();
  }

  Future<void> _loadOrderDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load all orders first, then find the specific one
      await context.read<RentalProvider>().loadRentalOrders();
      final orders = context.read<RentalProvider>().orders;
      final order = orders.firstWhere(
        (o) => o.id == widget.orderId,
        orElse: () => throw Exception('Không tìm thấy đơn hàng'),
      );
      
      if (mounted) {
        setState(() {
          _order = order;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết đơn thuê'),
        actions: [
          if (_order != null)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadOrderDetail,
              tooltip: 'Làm mới',
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError(theme)
              : _order == null
                  ? _buildNotFound(theme)
                  : RefreshIndicator(
                      onRefresh: _loadOrderDetail,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Column(
                          children: [
                            _buildStatusHeader(theme),
                            _buildOrderInfo(theme),
                            _buildRentalPeriod(theme),
                            _buildShippingInfo(theme),
                            _buildPaymentInfo(theme),
                            _buildProductList(theme),
                            _buildPriceBreakdown(theme),
                            if (_order!.status == 'pending' || _order!.status == 'confirmed')
                              _buildActions(theme),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildError(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
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
              'Không thể tải đơn hàng',
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Đã xảy ra lỗi',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _loadOrderDetail,
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotFound(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Không tìm thấy đơn hàng',
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

  Widget _buildStatusHeader(ThemeData theme) {
    final status = _order!.status;
    final statusInfo = _getStatusInfo(status);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: statusInfo['colors'] as List<Color>,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Icon(
              statusInfo['icon'] as IconData,
              size: 64,
              color: Colors.white,
            ),
            const SizedBox(height: 16),
            Text(
              statusInfo['title'] as String,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              statusInfo['subtitle'] as String,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white.withOpacity(0.9),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Text(
                _order!.orderNumber,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderInfo(ThemeData theme) {
    return _buildSection(
      theme,
      title: 'Thông tin đơn hàng',
      icon: Icons.receipt_long,
      child: Column(
        children: [
          _buildInfoRow(
            theme,
            'Mã đơn',
            _order!.orderNumber,
            trailing: IconButton(
              icon: const Icon(Icons.copy, size: 20),
              onPressed: () {
                Clipboard.setData(ClipboardData(text: _order!.orderNumber));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Đã sao chép mã đơn'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              tooltip: 'Sao chép',
            ),
          ),
          const Divider(),
          _buildInfoRow(theme, 'Ngày đặt', _formatDateTime(_order!.createdAt)),
          const Divider(),
          _buildInfoRow(
            theme,
            'Trạng thái',
            _order!.statusText,
            valueStyle: TextStyle(
              color: _getStatusColor(_order!.status),
              fontWeight: FontWeight.bold,
            ),
          ),
          const Divider(),
          _buildInfoRow(
            theme,
            'Thanh toán',
            _order!.paymentStatusText,
            valueStyle: TextStyle(
              color: _getPaymentStatusColor(_order!.paymentStatus),
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRentalPeriod(ThemeData theme) {
    return _buildSection(
      theme,
      title: 'Thời gian thuê',
      icon: Icons.calendar_today,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildDateCard(
                  theme,
                  label: 'Ngày bắt đầu',
                  date: _order!.rentalStartDate,
                  icon: Icons.play_circle_outline,
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Icon(Icons.arrow_forward, color: theme.colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDateCard(
                  theme,
                  label: 'Ngày trả',
                  date: _order!.rentalEndDate,
                  icon: Icons.stop_circle_outlined,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.timer,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
                const SizedBox(width: 12),
                Text(
                  'Thuê ${_order!.rentalDays} ngày',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          if (_order!.actualReturnDate != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.tertiaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle,
                    color: theme.colorScheme.onTertiaryContainer,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Đã trả ngày: ${_formatDate(_order!.actualReturnDate!)}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onTertiaryContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_order!.isOverdue) ...[
            const SizedBox(height: 12),
            Container(
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
                      'Đơn thuê đã quá hạn! Vui lòng trả sớm để tránh phí phạt.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.red.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else if (_order!.isActive) ...[
            const SizedBox(height: 12),
            Container(
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
                    'Còn ${_order!.daysUntilReturn} ngày nữa đến hạn trả',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onTertiaryContainer,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDateCard(
    ThemeData theme, {
    required String label,
    required DateTime date,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _formatDate(date),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShippingInfo(ThemeData theme) {
    return _buildSection(
      theme,
      title: 'Thông tin giao nhận',
      icon: Icons.local_shipping,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.location_on,
              color: theme.colorScheme.onSurfaceVariant,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _order!.shippingAddress,
                style: theme.textTheme.bodyMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfo(ThemeData theme) {
    final paymentMethodText = _getPaymentMethodText(_order!.paymentMethod);

    return _buildSection(
      theme,
      title: 'Thông tin thanh toán',
      icon: Icons.payment,
      child: Column(
        children: [
          _buildInfoRow(theme, 'Phương thức', paymentMethodText),
          const Divider(),
          _buildInfoRow(
            theme,
            'Trạng thái',
            _order!.paymentStatusText,
            valueStyle: TextStyle(
              color: _getPaymentStatusColor(_order!.paymentStatus),
              fontWeight: FontWeight.bold,
            ),
          ),
          if (_order!.lateFee != null && _order!.lateFee! > 0) ...[
            const Divider(),
            _buildInfoRow(
              theme,
              'Phí trễ hạn',
              '${_formatPrice(_order!.lateFee!)} ₫',
              valueStyle: const TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
          if (_order!.damageFee != null && _order!.damageFee! > 0) ...[
            const Divider(),
            _buildInfoRow(
              theme,
              'Phí hư hỏng',
              '${_formatPrice(_order!.damageFee!)} ₫',
              valueStyle: const TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
          if (_order!.refundAmount != null && _order!.refundAmount! > 0) ...[
            const Divider(),
            _buildInfoRow(
              theme,
              'Đã hoàn tiền',
              '${_formatPrice(_order!.refundAmount!)} ₫',
              valueStyle: const TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProductList(ThemeData theme) {
    return _buildSection(
      theme,
      title: 'Sản phẩm (${_order!.items.length})',
      icon: Icons.inventory_2,
      child: Column(
        children: _order!.items.map((item) => _buildProductItem(theme, item)).toList(),
      ),
    );
  }

  Widget _buildProductItem(ThemeData theme, RentalOrderItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 80,
              height: 80,
              color: theme.colorScheme.surface,
              child: item.images.isNotEmpty
                  ? Image.network(
                      item.images[0].toString(),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
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
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Số lượng: x${item.quantity}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatPrice(item.dailyPrice)} ₫/ngày × ${item.rentalDays} ngày',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Tiền thuê:',
                      style: theme.textTheme.bodyMedium,
                    ),
                    Text(
                      '${_formatPrice(item.subtotal)} ₫',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
                if (item.deposit > 0) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tiền cọc:',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      Text(
                        '${_formatPrice(item.deposit)} ₫',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.secondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceBreakdown(ThemeData theme) {
    return _buildSection(
      theme,
      title: 'Tổng thanh toán',
      icon: Icons.calculate,
      child: Column(
        children: [
          _buildPriceRow(theme, 'Tiền thuê', _order!.subtotal),
          const SizedBox(height: 8),
          _buildPriceRow(theme, 'Tiền đặt cọc', _order!.depositTotal),
          if (_order!.lateFee != null && _order!.lateFee! > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow(theme, 'Phí trễ hạn', _order!.lateFee!,
                valueColor: Colors.red),
          ],
          if (_order!.damageFee != null && _order!.damageFee! > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow(theme, 'Phí hư hỏng', _order!.damageFee!,
                valueColor: Colors.red),
          ],
          if (_order!.refundAmount != null && _order!.refundAmount! > 0) ...[
            const SizedBox(height: 8),
            _buildPriceRow(theme, 'Đã hoàn tiền', -_order!.refundAmount!,
                valueColor: Colors.green),
          ],
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tổng cộng',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_formatPrice(_order!.totalAmount)} ₫',
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          if (_order!.depositTotal > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 20,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tiền cọc sẽ được hoàn lại sau khi trả trang phục',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActions(ThemeData theme) {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_order!.canCancel)
            SizedBox(
              width: double.infinity,
              child: FilledButton.tonalIcon(
                onPressed: () => _showCancelDialog(context),
                icon: const Icon(Icons.cancel),
                label: const Text('Hủy đơn hàng'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.red.shade50,
                  foregroundColor: Colors.red.shade700,
                ),
              ),
            ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Liên hệ: 1900 xxxx'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              icon: const Icon(Icons.support_agent),
              label: const Text('Liên hệ hỗ trợ'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
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
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
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

  Widget _buildInfoRow(
    ThemeData theme,
    String label,
    String value, {
    TextStyle? valueStyle,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          if (trailing != null)
            Row(
              children: [
                Text(
                  value,
                  style: valueStyle ??
                      theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
                trailing,
              ],
            )
          else
            Flexible(
              child: Text(
                value,
                style: valueStyle ??
                    theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                textAlign: TextAlign.end,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(
    ThemeData theme,
    String label,
    double amount, {
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.bodyLarge),
        Text(
          '${amount < 0 ? '-' : ''}${_formatPrice(amount.abs())} ₫',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: valueColor,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy đơn hàng'),
        content: const Text(
          'Bạn có chắc chắn muốn hủy đơn hàng này không? '
          'Thao tác này không thể hoàn tác.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Không'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              await _cancelOrder();
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Hủy đơn'),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelOrder() async {
    try {
      final success = await context.read<RentalProvider>().cancelRentalOrder(_order!.id);

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã hủy đơn hàng thành công'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _loadOrderDetail(); // Reload
      } else {
        final error = context.read<RentalProvider>().error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? 'Không thể hủy đơn hàng'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi: ${e.toString()}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  // Helper methods
  Map<String, dynamic> _getStatusInfo(String status) {
    switch (status) {
      case 'pending':
        return {
          'icon': Icons.schedule,
          'title': 'Chờ xác nhận',
          'subtitle': 'Đơn hàng đang chờ xác nhận từ cửa hàng',
          'colors': [Colors.orange.shade400, Colors.orange.shade600],
        };
      case 'confirmed':
        return {
          'icon': Icons.check_circle,
          'title': 'Đã xác nhận',
          'subtitle': 'Đơn hàng đã được xác nhận',
          'colors': [Colors.blue.shade400, Colors.blue.shade600],
        };
      case 'preparing':
        return {
          'icon': Icons.inventory,
          'title': 'Đang chuẩn bị',
          'subtitle': 'Chúng tôi đang chuẩn bị trang phục cho bạn',
          'colors': [Colors.cyan.shade400, Colors.cyan.shade600],
        };
      case 'delivering':
        return {
          'icon': Icons.local_shipping,
          'title': 'Đang giao hàng',
          'subtitle': 'Trang phục đang được giao đến bạn',
          'colors': [Colors.purple.shade400, Colors.purple.shade600],
        };
      case 'rented':
        return {
          'icon': Icons.event_available,
          'title': 'Đang thuê',
          'subtitle': 'Bạn đang sử dụng trang phục',
          'colors': [Colors.green.shade400, Colors.green.shade600],
        };
      case 'returning':
        return {
          'icon': Icons.assignment_return,
          'title': 'Đang trả hàng',
          'subtitle': 'Trang phục đang được trả lại',
          'colors': [Colors.teal.shade400, Colors.teal.shade600],
        };
      case 'completed':
        return {
          'icon': Icons.done_all,
          'title': 'Hoàn thành',
          'subtitle': 'Đơn thuê đã hoàn tất',
          'colors': [Colors.green.shade600, Colors.green.shade800],
        };
      case 'cancelled':
        return {
          'icon': Icons.cancel,
          'title': 'Đã hủy',
          'subtitle': 'Đơn hàng đã bị hủy',
          'colors': [Colors.red.shade400, Colors.red.shade600],
        };
      case 'overdue':
        return {
          'icon': Icons.warning,
          'title': 'Quá hạn',
          'subtitle': 'Đơn hàng đã quá hạn trả',
          'colors': [Colors.red.shade600, Colors.red.shade800],
        };
      default:
        return {
          'icon': Icons.help_outline,
          'title': 'Không xác định',
          'subtitle': '',
          'colors': [Colors.grey.shade400, Colors.grey.shade600],
        };
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'preparing':
        return Colors.cyan;
      case 'delivering':
        return Colors.purple;
      case 'rented':
        return Colors.green;
      case 'returning':
        return Colors.teal;
      case 'completed':
        return Colors.green.shade700;
      case 'cancelled':
        return Colors.red;
      case 'overdue':
        return Colors.red.shade700;
      default:
        return Colors.grey;
    }
  }

  Color _getPaymentStatusColor(String status) {
    switch (status) {
      case 'unpaid':
        return Colors.red;
      case 'deposit_paid':
        return Colors.orange;
      case 'fully_paid':
        return Colors.green;
      case 'refunded':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _getPaymentMethodText(String method) {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng';
      case 'momo':
        return 'Ví MoMo';
      case 'vnpay':
        return 'VNPay';
      default:
        return method;
    }
  }

  String _formatPrice(double price) {
    return price.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  String _formatDateTime(DateTime dateTime) {
    return '${_formatDate(dateTime)} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}