import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/services/printer_service.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  List<BluetoothInfo> _devices = [];
  BluetoothInfo? _selectedDevice;
  bool _isLoading = false;
  bool _isConnected = false;

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    setState(() => _isLoading = true);
    final devices = await ref
        .read(printerServiceProvider.notifier)
        .getBondedDevices();
    setState(() {
      _devices = devices;
      _isLoading = false;
    });
  }

  Future<void> _connect(BluetoothInfo device) async {
    setState(() => _isLoading = true);
    final success = await ref
        .read(printerServiceProvider.notifier)
        .connect(device);
    setState(() {
      _isConnected = success;
      _selectedDevice = device;
      _isLoading = false;
    });

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Connecté à l'imprimante")),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Echec de connexion")));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Paramètres")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Imprimante Ticket",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Status
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _isConnected ? Colors.green[50] : Colors.orange[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _isConnected ? Colors.green : Colors.orange,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _isConnected ? Icons.check_circle : Icons.warning,
                    color: _isConnected ? Colors.green : Colors.orange,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _isConnected
                        ? "Connecté à ${_selectedDevice?.name}"
                        : "Non connecté",
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Device List
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Appareils associés",
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                IconButton(
                  onPressed: _loadDevices,
                  icon: const Icon(Icons.refresh),
                ),
              ],
            ),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      itemCount: _devices.length,
                      itemBuilder: (context, index) {
                        final device = _devices[index];
                        return ListTile(
                          leading: const Icon(Icons.print),
                          title: Text(device.name),
                          subtitle: Text(device.macAdress),
                          trailing: ElevatedButton(
                            onPressed: () => _connect(device),
                            child: const Text("Connecter"),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
