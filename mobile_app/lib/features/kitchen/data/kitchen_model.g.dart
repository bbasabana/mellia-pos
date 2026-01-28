// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'kitchen_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_KitchenOrder _$KitchenOrderFromJson(Map<String, dynamic> json) =>
    _KitchenOrder(
      id: json['id'] as String,
      orderType: json['orderType'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      priority: (json['priority'] as num).toInt(),
      sale: KitchenSale.fromJson(json['sale'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$KitchenOrderToJson(_KitchenOrder instance) =>
    <String, dynamic>{
      'id': instance.id,
      'orderType': instance.orderType,
      'status': instance.status,
      'createdAt': instance.createdAt.toIso8601String(),
      'priority': instance.priority,
      'sale': instance.sale,
    };

_KitchenSale _$KitchenSaleFromJson(Map<String, dynamic> json) => _KitchenSale(
  ticketNum: json['ticketNum'] as String,
  items: (json['items'] as List<dynamic>)
      .map((e) => KitchenItem.fromJson(e as Map<String, dynamic>))
      .toList(),
  client: json['client'] == null
      ? null
      : KitchenClient.fromJson(json['client'] as Map<String, dynamic>),
);

Map<String, dynamic> _$KitchenSaleToJson(_KitchenSale instance) =>
    <String, dynamic>{
      'ticketNum': instance.ticketNum,
      'items': instance.items,
      'client': instance.client,
    };

_KitchenItem _$KitchenItemFromJson(Map<String, dynamic> json) => _KitchenItem(
  id: json['id'] as String,
  product: KitchenProduct.fromJson(json['product'] as Map<String, dynamic>),
  quantity: (json['quantity'] as num).toDouble(),
);

Map<String, dynamic> _$KitchenItemToJson(_KitchenItem instance) =>
    <String, dynamic>{
      'id': instance.id,
      'product': instance.product,
      'quantity': instance.quantity,
    };

_KitchenProduct _$KitchenProductFromJson(Map<String, dynamic> json) =>
    _KitchenProduct(name: json['name'] as String, type: json['type'] as String);

Map<String, dynamic> _$KitchenProductToJson(_KitchenProduct instance) =>
    <String, dynamic>{'name': instance.name, 'type': instance.type};

_KitchenClient _$KitchenClientFromJson(Map<String, dynamic> json) =>
    _KitchenClient(name: json['name'] as String);

Map<String, dynamic> _$KitchenClientToJson(_KitchenClient instance) =>
    <String, dynamic>{'name': instance.name};
