import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:mellia_pos_mobile/core/services/receipt_name.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';
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
      backgroundColor: AppTheme.canvas,
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
          _ReceiptNameTile(accountName: name),
          _buildSettingTile(
            icon: Icons.print_outlined,
            title: "Configuration de l'imprimante",
            subtitle: "Sunmi intégrée / Bluetooth",
            onTap: () => _showPrinterConfig(context, ref),
          ),
          // Only French exists: shown as information, nothing to open.
          const Card(
            margin: EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Icon(
                Icons.language_outlined,
                color: AppTheme.primaryBlue,
              ),
              title: Text(
                "Langue",
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              trailing: Text(
                "Français",
                style: TextStyle(
                  color: AppTheme.muted,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const _NotificationsTile(),
          const SizedBox(height: 24),

          // Support & About
          _buildSectionHeader("SUPPORT"),
          _buildSettingTile(
            icon: Icons.help_outline_rounded,
            title: "Aide",
            subtitle: "Encaisser, mettre en attente, imprimer",
            onTap: () => _showHelp(context),
          ),
          _buildSettingTile(
            icon: Icons.info_outline_rounded,
            title: "À propos de Mellia POS",
            subtitle: "Version 1.0.0",
            onTap: () => showAboutDialog(
              context: context,
              applicationName: "Mellia POS",
              applicationVersion: "Version 1.0.0",
              applicationIcon: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  'assets/icon/app_icon.png',
                  width: 52,
                  height: 52,
                ),
              ),
              applicationLegalese:
                  "© ${DateTime.now().year} Mellia Restaurant Rapide\n10, Bypass, Mont-Ngafula, Kinshasa",
            ),
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

  void _showHelp(BuildContext context) {
    const steps = [
      (
        Icons.add_shopping_cart_rounded,
        "Vendre",
        "Touchez les produits, puis « Voir le panier ».",
      ),
      (
        Icons.payments_outlined,
        "Encaisser",
        "Choisissez le mode de paiement, indiquez le montant reçu en FC ou en \$, puis « Valider le paiement ».",
      ),
      (
        Icons.hourglass_bottom_rounded,
        "Mettre en attente",
        "« Attente » garde la commande dans Brouillons pour l'encaisser plus tard.",
      ),
      (
        Icons.print_outlined,
        "Imprimer",
        "Le ticket sort tout seul après chaque vente. « Réimprimer » sur l'écran du reçu.",
      ),
      (
        Icons.badge_outlined,
        "Nom sur le ticket",
        "Paramètres › Nom sur le ticket : le nom du caissier imprimé sur les factures.",
      ),
      (
        Icons.restaurant_menu_rounded,
        "Cuisine",
        "Suivez les commandes, filtrez par caissier, supprimez une ou toutes les commandes.",
      ),
    ];
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Aide",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              for (final (icon, title, text) in steps)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(icon, color: AppTheme.primaryBlue),
                  title: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(text),
                ),
            ],
          ),
        ),
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
    await ref.read(printerServiceProvider.future);
    final list = await ref
        .read(printerServiceProvider.notifier)
        .getBondedDevices();
    if (!mounted) return;
    setState(() {
      devices = list;
      isLoading = false;
    });
  }

  void _snack(String text, {bool ok = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text),
        backgroundColor: ok ? AppTheme.limeDark : AppTheme.error,
      ),
    );
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
                "Imprimante",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              IconButton(onPressed: _scan, icon: const Icon(Icons.refresh)),
            ],
          ),
          Builder(
            builder: (context) {
              final printer = ref.read(printerServiceProvider.notifier);
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Actuelle : ${printer.printerName}",
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  if (printer.sunmiAvailable)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.print),
                      title: const Text("Imprimante intégrée Sunmi"),
                      subtitle: Text(
                        "Terminal POS - ${printer.paperColumns == 48 ? '80' : '58'} mm",
                      ),
                      trailing: printer.kind == PrinterKind.sunmi
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : null,
                      onTap: () async {
                        try {
                          await printer.useSunmi();
                          if (mounted) setState(() {});
                          _snack("Imprimante intégrée Sunmi sélectionnée");
                        } catch (e) {
                          _snack(
                            e.toString().replaceFirst('Exception: ', ''),
                            ok: false,
                          );
                        }
                      },
                    ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text(
                      "Imprimer automatiquement après chaque vente",
                    ),
                    subtitle: const Text(
                      "Désactivé : le ticket s'imprime avec le bouton « Imprimer »",
                    ),
                    value: printer.autoPrint,
                    onChanged: (v) async {
                      await printer.setAutoPrint(v);
                      if (mounted) setState(() {});
                    },
                  ),
                  const Divider(),
                  const Text(
                    "Imprimantes Bluetooth jumelées",
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 8),
          if (isLoading)
            const Center(child: CircularProgressIndicator())
          else if (devices.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text("Aucune imprimante Bluetooth jumelée"),
            )
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
              child: const Text("DÉTECTER & IMPRIMER UN TEST"),
            ),
          ),
        ],
      ),
    );
  }
}

/// "Nom sur le ticket": the name printed as cashier on receipts. By default it is the name of the
/// account that is logged in (e.g. "Admin"); here it can be replaced by the real cashier's name.
/// The value is live: the receipt screen and the next printed ticket use it at once.
class _ReceiptNameTile extends ConsumerWidget {
  final String? accountName;
  const _ReceiptNameTile({required this.accountName});

  Future<void> _edit(
    BuildContext context,
    WidgetRef ref,
    String current,
  ) async {
    final controller = TextEditingController(
      text: current.isNotEmpty ? current : (accountName ?? ''),
    );
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Nom sur le ticket"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Nom imprimé comme caissier sur les factures de cet appareil.",
              style: TextStyle(color: AppTheme.muted, fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              autofocus: true,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                hintText: "Prénom et nom du caissier",
                prefixIcon: Icon(Icons.badge_outlined),
              ),
            ),
          ],
        ),
        actions: [
          if (current.isNotEmpty)
            TextButton(
              onPressed: () => Navigator.pop(ctx, ''),
              child: const Text("Nom du compte"),
            ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Annuler"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text("Enregistrer"),
          ),
        ],
      ),
    );
    if (result == null) return;
    await ref.read(receiptNameProvider.notifier).set(result);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.isEmpty
                ? "Les tickets afficheront le nom du compte."
                : "Les tickets afficheront « $result ».",
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(receiptNameProvider);
    final shown = value.isNotEmpty ? value : (accountName ?? '—');
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.badge_outlined, color: AppTheme.primaryBlue),
        title: const Text(
          "Nom sur le ticket",
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: AnimatedSwitcher(
          duration: AppTheme.fast,
          child: Text(
            value.isNotEmpty ? shown : "$shown (nom du compte)",
            key: ValueKey(shown),
          ),
        ),
        trailing: const Icon(Icons.edit_outlined, size: 20),
        onTap: () => _edit(context, ref, value),
      ),
    );
  }
}

/// Turns the pop-up confirmations (sale saved, printer found...) on or off. Errors always show.
class _NotificationsTile extends StatefulWidget {
  const _NotificationsTile();

  @override
  State<_NotificationsTile> createState() => _NotificationsTileState();
}

class _NotificationsTileState extends State<_NotificationsTile> {
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: SwitchListTile(
        secondary: const Icon(
          Icons.notifications_none_outlined,
          color: AppTheme.primaryBlue,
        ),
        title: const Text(
          "Notifications",
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          NotificationService.enabled
              ? "Confirmations affichées"
              : "Seules les erreurs s'affichent",
        ),
        value: NotificationService.enabled,
        onChanged: (v) async {
          await NotificationService.setEnabled(v);
          if (mounted) setState(() {});
        },
      ),
    );
  }
}
