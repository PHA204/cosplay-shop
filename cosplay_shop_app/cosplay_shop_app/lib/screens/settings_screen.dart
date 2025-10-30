// lib/screens/settings_screen.dart
import 'package:cosplay_shop_app/providers/theme_provider.dart';
import 'package:cosplay_shop_app/screens/change_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotifications = false;  
  String _language = 'vi';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeProvider = context.watch<ThemeProvider>();
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cài đặt'),
      ),
      body: ListView(
        children: [
          // ============================================
          // 1. THÔNG BÁO
          // ============================================
          _buildSectionHeader('Thông báo'),
          
          SwitchListTile(
            secondary: const Icon(Icons.notifications_outlined),
            title: const Text('Thông báo đẩy'),
            subtitle: const Text('Nhận thông báo về đơn hàng, khuyến mãi'),
            value: _notificationsEnabled,
            onChanged: (value) {
              setState(() => _notificationsEnabled = value);
              // TODO: Lưu vào SharedPreferences
            },
          ),
          
          SwitchListTile(
            secondary: const Icon(Icons.email_outlined),
            title: const Text('Email thông báo'),
            subtitle: const Text('Nhận email về đơn hàng và ưu đãi'),
            value: _emailNotifications,
            onChanged: (value) {
              setState(() => _emailNotifications = value);
            },
          ),

          const Divider(),

          // ============================================
          // 2. GIAO DIỆN
          // ============================================
           _buildSectionHeader('Giao diện'),          
            SwitchListTile(
              secondary: Icon(
                themeProvider.isDarkMode 
                    ? Icons.dark_mode 
                    : Icons.light_mode,
              ),
              title: const Text('Chế độ tối'),
              subtitle: Text(
                themeProvider.isDarkMode
                    ? 'Đang bật chế độ tối'
                    : 'Đang bật chế độ sáng',
              ),
              value: themeProvider.isDarkMode,
              onChanged: (value) async {
                await themeProvider.toggleDarkMode();
              },
            ),

            ListTile(
              leading: const Icon(Icons.brightness_auto),
              title: const Text('Theo hệ thống'),
              subtitle: Text(
                themeProvider.themeMode == ThemeMode.system
                    ? 'Đang sử dụng theme hệ thống'
                    : 'Chạm để sử dụng theme hệ thống',
              ),
              trailing: themeProvider.themeMode == ThemeMode.system
                  ? Icon(Icons.check, color: theme.colorScheme.primary)
                  : null,
              onTap: () async {
                await themeProvider.setSystemTheme();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Đã đặt theme theo hệ thống'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              },
            ),

          ListTile(
            leading: const Icon(Icons.language_outlined),
            title: const Text('Ngôn ngữ'),
            subtitle: Text(_language == 'vi' ? 'Tiếng Việt' : 'English'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showLanguageDialog(),
          ),

          const Divider(),

          // ============================================
          // 3. BẢO MẬT
          // ============================================
          _buildSectionHeader('Bảo mật & Quyền riêng tư'),
          
          ListTile(
            leading: const Icon(Icons.lock_outlined),
            title: const Text('Đổi mật khẩu'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ChangePasswordScreen(),
                ),
              );              
            },
          ),

          ListTile(
            leading: const Icon(Icons.fingerprint),
            title: const Text('Xác thực sinh trắc học'),
            subtitle: const Text('Dùng vân tay/Face ID để đăng nhập'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tính năng đang phát triển')),
              );
            },
          ),

          const Divider(),

          // ============================================
          // 4. VỀ ỨNG DỤNG
          // ============================================
          _buildSectionHeader('Về ứng dụng'),
          
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('Phiên bản'),
            subtitle: const Text('1.0.0'),
          ),

          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Chính sách bảo mật'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // TODO: Show privacy policy
            },
          ),

          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Điều khoản sử dụng'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // TODO: Show terms of service
            },
          ),

          const Divider(),

          // ============================================
          // 5. HỖ TRỢ
          // ============================================
          _buildSectionHeader('Hỗ trợ'),
          
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('Trung tâm trợ giúp'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // TODO: Navigate to help center
            },
          ),

          ListTile(
            leading: const Icon(Icons.chat_outlined),
            title: const Text('Liên hệ hỗ trợ'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // TODO: Open contact support
            },
          ),

          const Divider(),

          // ============================================
          // 6. CACHE & DỮ LIỆU
          // ============================================
          _buildSectionHeader('Dữ liệu & Bộ nhớ'),
          
          ListTile(
            leading: const Icon(Icons.cleaning_services_outlined),
            title: const Text('Xóa bộ nhớ cache'),
            subtitle: const Text('Giải phóng không gian lưu trữ'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showClearCacheDialog(),
          ),

          const SizedBox(height: 16),

          // ============================================
          // 7. NGUY HIỂM
          // ============================================
          _buildSectionHeader('Vùng nguy hiểm', color: Colors.red),
          
          ListTile(
            leading: Icon(Icons.delete_outline, color: theme.colorScheme.error),
            title: Text(
              'Xóa tài khoản',
              style: TextStyle(color: theme.colorScheme.error),
            ),
            subtitle: const Text('Xóa vĩnh viễn tài khoản và dữ liệu'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showDeleteAccountDialog(),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color ?? Theme.of(context).colorScheme.primary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chọn ngôn ngữ'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('Tiếng Việt'),
              value: 'vi',
              groupValue: _language,
              onChanged: (value) {
                setState(() => _language = value!);
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('English'),
              value: 'en',
              groupValue: _language,
              onChanged: (value) {
                setState(() => _language = value!);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bộ nhớ cache?'),
        content: const Text(
          'Thao tác này sẽ xóa tất cả ảnh và dữ liệu tạm thời. '
          'Ứng dụng có thể chậm hơn trong lần sử dụng tiếp theo.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () {
              // TODO: Clear cache
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã xóa cache thành công')),
              );
            },
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa tài khoản?'),
        content: const Text(
          'CẢNH BÁO: Thao tác này không thể hoàn tác!\n\n'
          'Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn bao gồm:\n'
          '• Thông tin cá nhân\n'
          '• Lịch sử đơn hàng\n'
          '• Danh sách yêu thích\n'
          '• Điểm tích lũy (nếu có)',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () {
              // TODO: Delete account API call
              Navigator.pop(context);
              context.read<AuthProvider>().logout();
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Xóa tài khoản'),
          ),
        ],
      ),
    );
  }
}