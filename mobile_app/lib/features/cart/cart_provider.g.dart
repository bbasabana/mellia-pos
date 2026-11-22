// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cart_provider.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_DeliveryInfo _$DeliveryInfoFromJson(Map<String, dynamic> json) =>
    _DeliveryInfo(
      address: json['address'] as String,
      phone: json['phone'] as String,
      instructions: json['instructions'] as String?,
    );

Map<String, dynamic> _$DeliveryInfoToJson(_DeliveryInfo instance) =>
    <String, dynamic>{
      'address': instance.address,
      'phone': instance.phone,
      'instructions': instance.instructions,
    };

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$cartNotifierHash() => r'4d921484b8e377ba6a8639e9063c2549bfd03f8a';

/// See also [CartNotifier].
@ProviderFor(CartNotifier)
final cartNotifierProvider = NotifierProvider<CartNotifier, CartState>.internal(
  CartNotifier.new,
  name: r'cartNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$cartNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$CartNotifier = Notifier<CartState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
