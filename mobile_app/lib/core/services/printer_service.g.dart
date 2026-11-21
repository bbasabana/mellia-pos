// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'printer_service.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$printerServiceHash() => r'5ccd79726c8b9697e533d8dfbad83bb4992cac98';

/// The receipt printer of this device.
///
/// On a Sunmi POS terminal the built-in printer is driven directly through Sunmi's printer
/// service (native bridge "mellia/printer", same approach as the Mihos POS app): no pairing,
/// accents print, the paper width is read from the printer.
/// On any other phone or tablet, a Bluetooth thermal printer paired in Android settings is used.
///
/// Copied from [PrinterService].
@ProviderFor(PrinterService)
final printerServiceProvider =
    AsyncNotifierProvider<PrinterService, void>.internal(
      PrinterService.new,
      name: r'printerServiceProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$printerServiceHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$PrinterService = AsyncNotifier<void>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
