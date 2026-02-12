import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/services.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'printer_service.g.dart';

@Riverpod(keepAlive: true)
class PrinterService extends _$PrinterService {
  @override
  Future<void> build() async {
    // Initial setup if needed
  }

  Future<List<BluetoothInfo>> getBondedDevices() async {
    try {
      return await PrintBluetoothThermal.pairedBluetooths;
    } catch (e) {
      return [];
    }
  }

  Future<bool> connect(BluetoothInfo device) async {
    try {
      final bool result = await PrintBluetoothThermal.connect(
        macPrinterAddress: device.macAdress,
      );
      return result;
    } catch (e) {
      return false;
    }
  }

  Future<String?> autoConnectAndTest() async {
    try {
      final devices = await getBondedDevices();
      if (devices.isEmpty) return "Aucune imprimante jumelée";

      // Common names for internal/standard POS printers
      final commonNames = [
        'inner',
        'pos',
        'printer',
        'sunmi',
        'imin',
        'mpt',
        'xp-',
        'bluetooth',
      ];
      BluetoothInfo? target;

      for (var d in devices) {
        final name = d.name.toLowerCase();
        if (commonNames.any((cn) => name.contains(cn))) {
          target = d;
          break;
        }
      }

      // If no obvious name, take the first one
      target ??= devices.first;

      final connected = await connect(target);
      if (!connected) return "Échec de connexion à ${target.name}";

      // Test Print
      await printTicket(
        saleData: {
          'ticketNum': 'TEST-001',
          'createdAt': DateTime.now().toIso8601String(),
          'totalNet': 0.0,
          'totalCdf': 0.0,
          'items': [
            {
              'product': {'name': 'TEST IMPRESSION'},
              'quantity': 1,
              'unitPrice': 0.0,
              'unitPriceCdf': 0,
            },
          ],
        },
        cashierName: "Système",
      );

      return "Connecté et Test imprimé: ${target.name}";
    } catch (e) {
      return "Erreur auto-connect: $e";
    }
  }

  Future<void> printTicket({
    required Map<String, dynamic> saleData,
    String? cashierName,
  }) async {
    final bool isConnected = await PrintBluetoothThermal.connectionStatus;
    if (isConnected != true) {
      throw Exception("Imprimante non connectée");
    }

    final ticketNum = saleData['ticketNum'] ?? "N/A";
    final items = saleData['items'] as List? ?? [];
    final totalUsd =
        double.tryParse(saleData['totalNet']?.toString() ?? "0") ?? 0.0;
    final totalCdf =
        double.tryParse(saleData['totalCdf']?.toString() ?? "0") ?? 0.0;
    final clientName = saleData['client']?['name'] ?? "Passant";
    final createdAtStr = saleData['createdAt'] ?? "";

    // Generate ESC/POS Bytes
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);

    List<int> bytes = [];

    // Header
    bytes += generator.text(
      "MELLIA RESTO",
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );
    bytes += generator.text(
      "10, Bypass, Mont-ngafula, Kinshasa",
      styles: const PosStyles(align: PosAlign.center),
    );
    bytes += generator.hr();

    // Info
    bytes += generator.text("Ticket: #$ticketNum");
    bytes += generator.text("Date: $createdAtStr");
    if (cashierName != null) {
      bytes += generator.text("Caissier: $cashierName");
    }
    bytes += generator.text("Client: $clientName");
    bytes += generator.hr();

    // Items
    bytes += generator.row([
      PosColumn(text: 'Qt', width: 2),
      PosColumn(text: 'Article', width: 7),
      PosColumn(
        text: 'Total',
        width: 3,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);

    for (final item in items) {
      final product = item['product'] ?? {};
      final name = product['name'] ?? "Inconnu";
      final qty = (double.tryParse(item['quantity'].toString()) ?? 1.0)
          .toInt()
          .toString();
      final priceCdf =
          double.tryParse(item['unitPriceCdf']?.toString() ?? "0") ?? 0.0;
      final totalRowCdf = (int.tryParse(qty) ?? 1) * priceCdf;

      bytes += generator.row([
        PosColumn(text: qty, width: 2),
        PosColumn(
          text: name.toString().substring(
            0,
            name.toString().length > 15 ? 15 : name.toString().length,
          ),
          width: 7,
        ),
        PosColumn(
          text: totalRowCdf.toInt().toString(),
          width: 3,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }

    bytes += generator.hr();

    // Totals
    bytes += generator.text(
      "TOTAL: ${totalCdf.toInt()} FC",
      styles: const PosStyles(
        align: PosAlign.right,
        height: PosTextSize.size2,
        bold: true,
      ),
    );
    bytes += generator.text(
      "TOTAL USD: \$${totalUsd.toStringAsFixed(2)}",
      styles: const PosStyles(align: PosAlign.right, bold: true),
    );

    bytes += generator.hr();
    bytes += generator.text(
      "Merci de votre visite !",
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.text(
      "Mangez comme chez vous",
      styles: const PosStyles(align: PosAlign.center),
    );
    bytes += generator.feed(2);
    bytes += generator.cut();

    // Print
    await PrintBluetoothThermal.writeBytes(bytes);
  }
}
