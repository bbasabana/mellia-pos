// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Product _$ProductFromJson(Map<String, dynamic> json) => _Product(
  id: json['id'] as String,
  name: json['name'] as String,
  type: json['type'] as String,
  imageUrl: json['imageUrl'] as String?,
  description: json['description'] as String?,
  beverageCategory: json['beverageCategory'] as String?,
  foodCategory: json['foodCategory'] as String?,
  size: json['size'] as String? ?? 'STANDARD',
  saleUnit: json['saleUnit'] as String,
  purchaseUnit: json['purchaseUnit'] as String?,
  packingQuantity: (json['packingQuantity'] as num?)?.toInt() ?? 1,
  active: json['active'] as bool? ?? true,
  vendable: json['vendable'] as bool? ?? true,
  prices:
      (json['prices'] as List<dynamic>?)
          ?.map((e) => ProductPrice.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  priceUsd: toDouble(json['priceUsd']),
  priceCdf: toDouble(json['priceCdf']),
  stockItems:
      (json['stockItems'] as List<dynamic>?)
          ?.map((e) => StockItem.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$ProductToJson(_Product instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'type': instance.type,
  'imageUrl': instance.imageUrl,
  'description': instance.description,
  'beverageCategory': instance.beverageCategory,
  'foodCategory': instance.foodCategory,
  'size': instance.size,
  'saleUnit': instance.saleUnit,
  'purchaseUnit': instance.purchaseUnit,
  'packingQuantity': instance.packingQuantity,
  'active': instance.active,
  'vendable': instance.vendable,
  'prices': instance.prices,
  'priceUsd': instance.priceUsd,
  'priceCdf': instance.priceCdf,
  'stockItems': instance.stockItems,
};

_ProductPrice _$ProductPriceFromJson(Map<String, dynamic> json) =>
    _ProductPrice(
      id: json['id'] as String,
      spaceId: json['spaceId'] as String,
      priceUsd: toDouble(json['priceUsd']),
      priceCdf: toDouble(json['priceCdf']),
      forUnit: json['forUnit'] as String? ?? 'BOTTLE',
    );

Map<String, dynamic> _$ProductPriceToJson(_ProductPrice instance) =>
    <String, dynamic>{
      'id': instance.id,
      'spaceId': instance.spaceId,
      'priceUsd': instance.priceUsd,
      'priceCdf': instance.priceCdf,
      'forUnit': instance.forUnit,
    };

_StockItem _$StockItemFromJson(Map<String, dynamic> json) => _StockItem(
  location: json['location'] as String,
  quantity: toDouble(json['quantity']),
);

Map<String, dynamic> _$StockItemToJson(_StockItem instance) =>
    <String, dynamic>{
      'location': instance.location,
      'quantity': instance.quantity,
    };
