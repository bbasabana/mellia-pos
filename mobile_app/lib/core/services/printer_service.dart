import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'printer_service.g.dart';

/// Where the receipts go.
enum PrinterKind { none, sunmi, bluetooth }

/// The receipt printer of this device.
///
/// On a Sunmi POS terminal the built-in printer is driven directly through Sunmi's printer
/// service (native bridge "mellia/printer", same approach as the Mihos POS app): no pairing,
/// accents print, the paper width is read from the printer.
/// On any other phone or tablet, a Bluetooth thermal printer paired in Android settings is used.
@Riverpod(keepAlive: true)
class PrinterService extends _$PrinterService {
  static const _channel = MethodChannel('mellia/printer');
  static const _prefKey = 'mellia_printer';
  static const _prefAutoPrint = 'mellia_auto_print';

  PrinterKind kind = PrinterKind.none;
  String? _btMac;
  String _btName = '';

  /// 32 characters on 58 mm paper, 48 on 80 mm.
  int paperColumns = 32;

  /// Print the receipt as soon as a sale is paid.
  bool autoPrint = true;

  bool sunmiAvailable = false;
  bool _loaded = false;

  /// Why the last print failed, in words the cashier can act on.
  String? lastError;

  @override
  Future<void> build() async {
    await _load();
  }

  String get printerName => switch (kind) {
        PrinterKind.sunmi => 'Imprimante intégrée Sunmi',
        PrinterKind.bluetooth => _btName.isEmpty ? 'Imprimante Bluetooth' : _btName,
        PrinterKind.none => 'Aucune imprimante',
      };

  // ---------------------------------------------------------------- setup

  Future<void> _load() async {
    if (_loaded) return;
    _loaded = true;
    final prefs = await SharedPreferences.getInstance();
    autoPrint = prefs.getBool(_prefAutoPrint) ?? true;
    final saved = prefs.getString(_prefKey) ?? 'auto';

    sunmiAvailable = await _sunmiBind();

    if (saved.startsWith('bt:')) {
      final parts = saved.substring(3).split('|');
      _btMac = parts.first;
      _btName = parts.length > 1 ? parts[1] : '';
      kind = PrinterKind.bluetooth;
    } else if (saved == 'none') {
      kind = PrinterKind.none;
    } else if (sunmiAvailable) {
      kind = PrinterKind.sunmi;
    } else {
      kind = PrinterKind.none;
    }
  }

  /// True on a Sunmi terminal whose printer service answered. Reads the paper width too.
  Future<bool> _sunmiBind() async {
    if (!Platform.isAndroid) return false;
    try {
      final info = await _channel
          .invokeMapMethod<String, dynamic>('bind')
          .timeout(const Duration(seconds: 6));
      final bound = info?['bound'] == true;
      if (bound) {
        final paper = info?['paper'];
        if (paper == 2) paperColumns = 48;
        if (paper == 1) paperColumns = 32;
      }
      return bound;
    } catch (_) {
      return false;
    }
  }

  Future<void> setAutoPrint(bool value) async {
    autoPrint = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefAutoPrint, value);
  }

  Future<void> useSunmi() async {
    await _load();
    if (!sunmiAvailable) sunmiAvailable = await _sunmiBind();
    if (!sunmiAvailable) {
      throw Exception("Pas d'imprimante Sunmi intégrée sur cet appareil");
    }
    kind = PrinterKind.sunmi;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, 'sunmi');
  }

  Future<bool> _bluetoothPermission() async {
    if (!Platform.isAndroid) return true;
    final statuses = await [Permission.bluetoothConnect, Permission.bluetoothScan].request();
    // On Android 11 and older these permissions do not exist and come back as granted.
    return statuses.values.every((s) => s.isGranted || s.isLimited);
  }

  Future<List<BluetoothInfo>> getBondedDevices() async {
    try {
      if (!await _bluetoothPermission()) return [];
      return await PrintBluetoothThermal.pairedBluetooths;
    } catch (e) {
      return [];
    }
  }

  /// Connects to a paired Bluetooth printer and remembers it for the next launches.
  Future<bool> connect(BluetoothInfo device) async {
    try {
      if (!await _bluetoothPermission()) return false;
      final ok = await PrintBluetoothThermal.connect(macPrinterAddress: device.macAdress)
          .timeout(const Duration(seconds: 10));
      if (ok) {
        kind = PrinterKind.bluetooth;
        _btMac = device.macAdress;
        _btName = device.name;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefKey, 'bt:${device.macAdress}|${device.name}');
      }
      return ok;
    } catch (e) {
      return false;
    }
  }

  /// Finds a printer without printing anything: the Sunmi one first, then the saved
  /// Bluetooth printer, then a paired device whose name looks like a printer.
  Future<String?> autoConnect() async {
    await _load();
    if (kind == PrinterKind.sunmi) return 'Imprimante intégrée Sunmi prête';
    if (kind == PrinterKind.bluetooth) {
      return await _bluetoothReady() ? 'Connecté à $printerName' : null;
    }
    if (sunmiAvailable) {
      await useSunmi();
      return 'Imprimante intégrée Sunmi prête';
    }
    final devices = await getBondedDevices();
    if (devices.isEmpty) return null;
    const printerNames = ['inner', 'pos', 'printer', 'imin', 'mpt', 'xp-', 'rpp', 'thermal'];
    BluetoothInfo? target;
    for (final d in devices) {
      final name = d.name.toLowerCase();
      if (printerNames.any(name.contains)) {
        target = d;
        break;
      }
    }
    if (target == null) return null;
    return await connect(target) ? 'Connecté à ${target.name}' : null;
  }

  /// Finds a printer and prints a short test page (settings screen).
  Future<String?> autoConnectAndTest() async {
    try {
      await autoConnect();
      if (kind == PrinterKind.none) {
        return "Échec : aucune imprimante trouvée (ni Sunmi intégrée, ni Bluetooth jumelée)";
      }
      final ok = await _send(_testBytes());
      return ok ? 'Test imprimé sur $printerName' : 'Échec : ${lastError ?? "impression impossible"}';
    } catch (e) {
      return 'Erreur auto-connect: $e';
    }
  }

  Future<bool> _bluetoothReady() async {
    final mac = _btMac;
    if (mac == null) return false;
    try {
      if (!await _bluetoothPermission()) return false;
      if (!await PrintBluetoothThermal.bluetoothEnabled) {
        lastError = 'Le Bluetooth est désactivé';
        return false;
      }
      if (await PrintBluetoothThermal.connectionStatus) return true;
      return await PrintBluetoothThermal.connect(macPrinterAddress: mac)
          .timeout(const Duration(seconds: 8));
    } catch (_) {
      return false;
    }
  }

  // -------------------------------------------------------------- printing

  /// Prints the receipt of a sale. Throws with a readable message when nothing came out.
  Future<void> printTicket({
    required Map<String, dynamic> saleData,
    String? cashierName,
    String? paymentMethod,
    double? amountPaid,
  }) async {
    await _load();
    if (kind == PrinterKind.none) await autoConnect();
    if (kind == PrinterKind.none) {
      throw Exception('Aucune imprimante configurée (Paramètres > Imprimante)');
    }
    final bytes = _receiptBytes(
      saleData: saleData,
      cashierName: cashierName,
      paymentMethod: paymentMethod,
      amountPaid: amountPaid,
    );
    if (!await _send(bytes)) {
      throw Exception(lastError ?? 'Impression impossible');
    }
  }

  Future<bool> _send(List<int> bytes) async {
    lastError = null;
    switch (kind) {
      case PrinterKind.sunmi:
        try {
          final reply = await _channel.invokeMapMethod<String, dynamic>(
            'raw',
            {'bytes': Uint8List.fromList(bytes)},
          ).timeout(const Duration(seconds: 12));
          if (reply?['ok'] == true) return true;
          lastError = _sunmiState(reply?['state'] ?? reply?['code']) ??
              'Impression refusée (${reply?['code']} ${reply?['message'] ?? ''})';
          return false;
        } catch (e) {
          lastError = 'Imprimante Sunmi : $e';
          return false;
        }
      case PrinterKind.bluetooth:
        if (!await _bluetoothReady()) {
          lastError ??= "L'imprimante Bluetooth ne répond pas : allumée et jumelée ?";
          return false;
        }
        try {
          final ok = await PrintBluetoothThermal.writeBytes(bytes);
          if (!ok) lastError = "L'imprimante Bluetooth n'a pas reçu le ticket";
          return ok;
        } catch (e) {
          lastError = 'Bluetooth : $e';
          return false;
        }
      case PrinterKind.none:
        lastError = 'Aucune imprimante configurée';
        return false;
    }
  }

  static String? _sunmiState(Object? state) => switch (state) {
        2 => "L'imprimante démarre, réessayez dans un instant.",
        3 => "L'imprimante signale une erreur.",
        4 => 'Plus de papier : remettez un rouleau.',
        5 => "L'imprimante a trop chauffé, attendez un peu.",
        6 => "Le capot de l'imprimante est ouvert : refermez-le.",
        7 => 'Le massicot est bloqué.',
        505 => 'Aucune imprimante sur ce terminal.',
        _ => null,
      };

  // ------------------------------------------------------------ ESC/POS

  bool get _utf8 => kind == PrinterKind.sunmi;

  /// Sunmi printers take UTF-8 (FS C 0xFF); other thermal printers take Windows-1252 (ESC t 16).
  List<int> get _init => [0x1B, 0x40, ...(_utf8 ? const [0x1C, 0x43, 0xFF] : const [0x1B, 0x74, 0x10])];

  List<int> _encode(String text) {
    final clean = text.replaceAll(' ', ' ').replaceAll(' ', ' ');
    if (_utf8) return utf8.encode(clean);
    return clean.runes.map((r) => r > 0xFF ? 0x3F : r).toList();
  }

  static const _center = [0x1B, 0x61, 0x01];
  static const _left = [0x1B, 0x61, 0x00];
  static const _boldOn = [0x1B, 0x45, 0x01];
  static const _boldOff = [0x1B, 0x45, 0x00];
  static const _bigOn = [0x1D, 0x21, 0x11];
  static const _tallOn = [0x1D, 0x21, 0x01];
  static const _sizeOff = [0x1D, 0x21, 0x00];
  static const _cut = [0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x42, 0x00];

  List<int> _testBytes() {
    final rule = '-' * paperColumns;
    return [
      ..._init,
      ..._center,
      ..._boldOn,
      ..._encode('MELLIA RESTO\n'),
      ..._boldOff,
      ..._encode('$rule\nTest d\'impression\nAccents : é è à ç ô\n'),
      ..._encode('${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}\n'),
      ..._encode('$printerName - $paperColumns colonnes\n$rule\n'),
      ..._left,
      ..._cut,
    ];
  }

  static String _fc(num value) {
    final digits = value.round().abs().toString();
    final grouped = digits.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ' ');
    return '${value < 0 ? '-' : ''}$grouped FC';
  }

  static String _usd(num value) => '\$${value.toStringAsFixed(2)}';

  static String _qty(double q) => q == q.roundToDouble() ? q.toInt().toString() : q.toStringAsFixed(1);

  static const _methods = {
    'CASH': 'Espèces',
    'CARD': 'Carte',
    'MOBILE_MONEY': 'Mobile Money',
    'TRANSFER': 'Virement',
  };

  String _row(String left, String right) {
    final width = paperColumns;
    final space = width - right.length - 1;
    final cut = left.length > space ? left.substring(0, space < 0 ? 0 : space) : left;
    return '$cut${' ' * (width - cut.length - right.length).clamp(1, width)}$right';
  }

  /// A long product name goes to the next line between words.
  List<String> _wrap(String text) {
    final width = paperColumns;
    final out = <String>[];
    var current = '';
    for (final word in text.split(RegExp(r'\s+'))) {
      final next = current.isEmpty ? word : '$current $word';
      if (next.length <= width) {
        current = next;
        continue;
      }
      if (current.isNotEmpty) out.add(current);
      current = word.length > width ? word.substring(0, width) : word;
    }
    if (current.isNotEmpty) out.add(current);
    return out;
  }

  List<int> _receiptBytes({
    required Map<String, dynamic> saleData,
    String? cashierName,
    String? paymentMethod,
    double? amountPaid,
  }) {
    double num0(Object? v) => double.tryParse(v?.toString() ?? '') ?? 0.0;

    final ticketNum = saleData['ticketNum'] ?? 'N/A';
    final items = saleData['items'] as List? ?? [];
    final totalUsd = num0(saleData['totalNet']);
    var totalCdf = num0(saleData['totalCdf']);
    final clientName = saleData['client']?['name'] ?? 'Passant';
    final created = DateTime.tryParse(saleData['createdAt']?.toString() ?? '')?.toLocal() ?? DateTime.now();
    final method = paymentMethod ?? saleData['paymentMethod']?.toString();
    final rule = '-' * paperColumns;

    final bytes = <int>[..._init];
    void line(String text) => bytes
      ..addAll(_encode(text))
      ..add(0x0A);

    // Header
    bytes.addAll([..._center, ..._boldOn, ..._bigOn]);
    line('MELLIA RESTO');
    bytes.addAll([..._sizeOff, ..._boldOff]);
    for (final l in _wrap('10, Bypass, Mont-Ngafula, Kinshasa')) {
      line(l);
    }
    bytes.addAll(_left);
    line(rule);

    // Info
    line('Ticket : #$ticketNum');
    line(_row('Date', DateFormat('dd/MM/yyyy HH:mm').format(created)));
    if (cashierName != null && cashierName.isNotEmpty) line('Caissier : $cashierName');
    line('Client : $clientName');
    line(rule);

    // Items
    var computedCdf = 0.0;
    for (final item in items) {
      final product = item['product'] ?? {};
      final name = (product['name'] ?? 'Article').toString();
      final qty = num0(item['quantity']);
      final unitCdf = num0(item['unitPriceCdf']);
      final lineCdf = unitCdf * qty;
      computedCdf += lineCdf;
      for (final l in _wrap(name)) {
        line(l);
      }
      line(_row('  ${_qty(qty)} x ${_fc(unitCdf)}', _fc(lineCdf)));
    }
    if (totalCdf <= 0) totalCdf = computedCdf;
    line(rule);

    // Totals
    bytes.addAll([..._boldOn, ..._tallOn]);
    line(_row('TOTAL', _fc(totalCdf)));
    bytes.addAll([..._sizeOff, ..._boldOff]);
    if (totalUsd > 0) line(_row('Soit', _usd(totalUsd)));
    if (method != null && method.isNotEmpty) line(_row('Paiement', _methods[method] ?? method));
    if (amountPaid != null && amountPaid > totalUsd + 0.004) {
      line(_row('Reçu', _usd(amountPaid)));
      line(_row('Rendu', _usd(amountPaid - totalUsd)));
    }
    line(rule);

    // Footer
    bytes.addAll([..._center, ..._boldOn]);
    line('Merci de votre visite !');
    bytes.addAll(_boldOff);
    line('Mangez comme chez vous');
    bytes.addAll(_left);
    bytes.addAll(_cut);
    return bytes;
  }
}
