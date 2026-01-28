import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authNotifierProvider).asData?.value;
    final name = user?.name;
    final email = user?.email;
    final role = user?.role;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text("Paramètres"), elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Section
          _buildSectionHeader("PROFIL"),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppTheme.primaryBlue.withOpacity(0.1),
                    child: Text(
                      (name != null && name.isNotEmpty)
                          ? name[0].toUpperCase()
                          : "U",
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name ?? "Utilisateur",
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          email ?? "",
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            role ?? "ROLE",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // App Settings
          _buildSectionHeader("CONFIGURATION"),
          _buildSettingTile(
            icon: Icons.print_outlined,
            title: "Configuration de l'imprimante",
            subtitle: "Bluetooth / Réseau / USB",
            onTap: () => _showPrinterConfig(context, ref),
          ),
          _buildSettingTile(
            icon: Icons.language_outlined,
            title: "Langue de l'application",
            subtitle: "Français",
            onTap: () {},
          ),
          _buildSettingTile(
            icon: Icons.notifications_none_outlined,
            title: "Notifications",
            subtitle: "Activées",
            onTap: () {},
          ),
          const SizedBox(height: 24),

          // Support & About
          _buildSectionHeader("SUPPORT"),
          _buildSettingTile(
            icon: Icons.help_outline_rounded,
            title: "Centre d'aide",
            onTap: () {},
          ),
          _buildSettingTile(
            icon: Icons.info_outline_rounded,
            title: "À propos de Mellia POS",
            subtitle: "Version 1.0.2",
            onTap: () {},
          ),

          const SizedBox(height: 40),
          Center(
            child: Text(
              "Mellia POS • Made with ❤️ in Kinshasa",
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _showPrinterConfig(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PrinterConfigModal(),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          color: Colors.grey[600],
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primaryBlue),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: subtitle != null ? Text(subtitle) : null,
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: onTap,
      ),
    );
  }
}

class _PrinterConfigModal extends ConsumerStatefulWidget {
  @override
  ConsumerState<_PrinterConfigModal> createState() =>
      _PrinterConfigModalState();
}

class _PrinterConfigModalState extends ConsumerState<_PrinterConfigModal> {
  List<BluetoothInfo> devices = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _scan();
  }

  Future<void> _scan() async {
    setState(() => isLoading = true);
    final list = await ref
        .read(printerServiceProvider.notifier)
        .getBondedDevices();
    setState(() {
      devices = list;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Imprimantes Jumelées",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              IconButton(onPressed: _scan, icon: const Icon(Icons.refresh)),
            ],
          ),
          const SizedBox(height: 16),
          if (isLoading)
            const Center(child: CircularProgressIndicator())
          else if (devices.isEmpty)
            const Center(child: Text("Aucune imprimante Bluetooth trouvée"))
          else
            Expanded(
              child: ListView.builder(
                itemCount: devices.length,
                itemBuilder: (context, index) {
                  final d = devices[index];
                  return ListTile(
                    leading: const Icon(Icons.bluetooth),
                    title: Text(d.name),
                    subtitle: Text(d.macAdress),
                    onTap: () async {
                      final success = await ref
                          .read(printerServiceProvider.notifier)
                          .connect(d);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              success
                                  ? "Connecté à ${d.name}"
                                  : "Échec de connexion",
                            ),
                            backgroundColor: success
                                ? Colors.green
                                : Colors.red,
                          ),
                        );
                        if (success) Navigator.pop(context);
                      }
                    },
                  );
                },
              ),
            ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                final result = await ref
                    .read(printerServiceProvider.notifier)
                    .autoConnectAndTest();
                if (mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(result ?? "Erreur")));
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text("AUTO-CONNECT & TEST"),
            ),
          ),
        ],
      ),
    );
  }
}
