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

  Future<void> printTicket({
    required String ticketNum,
    required List<dynamic> items, // CartItems
    required double totalUsd,
    required double totalCdf,
    String? clientName,
    DateTime? date,
  }) async {
    final bool? isConnected = await PrintBluetoothThermal.connectionStatus;
    if (isConnected != true) {
      throw Exception("Imprimante non connectée");
    }

    // Generate ESC/POS Bytes
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);

    List<int> bytes = [];

    // Header
    bytes += generator.text(
      "MELLIA POS",
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );
    bytes += generator.text(
      "Restaurant & Bar",
      styles: const PosStyles(align: PosAlign.center),
    );
    bytes += generator.hr();

    // Info
    bytes += generator.text("Ticket: $ticketNum");
    bytes += generator.text("Date: ${date ?? DateTime.now()}");
    if (clientName != null) {
      bytes += generator.text("Client: $clientName");
    }
    bytes += generator.hr();

    // Items
    bytes += generator.row([
      PosColumn(text: 'Qte', width: 2),
      PosColumn(text: 'Article', width: 7),
      PosColumn(
        text: 'Prix',
        width: 3,
        styles: const PosStyles(align: PosAlign.right),
      ),
    ]);

    for (final item in items) {
      // Adapt usage depending on if passed CartItem or direct object
      final name = item.product.name;
      final qty = item.quantity.toString();
      final price = item.totalCdf
          .toInt()
          .toString(); // Printing in CDF usuallly tailored for locals

      bytes += generator.row([
        PosColumn(text: qty, width: 2),
        PosColumn(text: name, width: 7),
        PosColumn(
          text: price,
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
      "USD: \$${totalUsd.toStringAsFixed(2)}",
      styles: const PosStyles(align: PosAlign.right),
    );

    bytes += generator.hr();
    bytes += generator.text(
      "Merci de votre visite !",
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.feed(2);
    bytes += generator.cut();

    // Print
    await PrintBluetoothThermal.writeBytes(bytes);
  }
}
