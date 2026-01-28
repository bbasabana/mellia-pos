// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'kitchen_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$KitchenOrder {

 String get id; String get orderType; String get status;// PENDING, IN_PREPARATION, READY, DELIVERED
 DateTime get createdAt; int get priority; KitchenSale get sale;
/// Create a copy of KitchenOrder
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KitchenOrderCopyWith<KitchenOrder> get copyWith => _$KitchenOrderCopyWithImpl<KitchenOrder>(this as KitchenOrder, _$identity);

  /// Serializes this KitchenOrder to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KitchenOrder&&(identical(other.id, id) || other.id == id)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.status, status) || other.status == status)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.sale, sale) || other.sale == sale));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,orderType,status,createdAt,priority,sale);

@override
String toString() {
  return 'KitchenOrder(id: $id, orderType: $orderType, status: $status, createdAt: $createdAt, priority: $priority, sale: $sale)';
}


}

/// @nodoc
abstract mixin class $KitchenOrderCopyWith<$Res>  {
  factory $KitchenOrderCopyWith(KitchenOrder value, $Res Function(KitchenOrder) _then) = _$KitchenOrderCopyWithImpl;
@useResult
$Res call({
 String id, String orderType, String status, DateTime createdAt, int priority, KitchenSale sale
});


$KitchenSaleCopyWith<$Res> get sale;

}
/// @nodoc
class _$KitchenOrderCopyWithImpl<$Res>
    implements $KitchenOrderCopyWith<$Res> {
  _$KitchenOrderCopyWithImpl(this._self, this._then);

  final KitchenOrder _self;
  final $Res Function(KitchenOrder) _then;

/// Create a copy of KitchenOrder
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? orderType = null,Object? status = null,Object? createdAt = null,Object? priority = null,Object? sale = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as int,sale: null == sale ? _self.sale : sale // ignore: cast_nullable_to_non_nullable
as KitchenSale,
  ));
}
/// Create a copy of KitchenOrder
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KitchenSaleCopyWith<$Res> get sale {
  
  return $KitchenSaleCopyWith<$Res>(_self.sale, (value) {
    return _then(_self.copyWith(sale: value));
  });
}
}


/// Adds pattern-matching-related methods to [KitchenOrder].
extension KitchenOrderPatterns on KitchenOrder {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KitchenOrder value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KitchenOrder() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KitchenOrder value)  $default,){
final _that = this;
switch (_that) {
case _KitchenOrder():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KitchenOrder value)?  $default,){
final _that = this;
switch (_that) {
case _KitchenOrder() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String orderType,  String status,  DateTime createdAt,  int priority,  KitchenSale sale)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KitchenOrder() when $default != null:
return $default(_that.id,_that.orderType,_that.status,_that.createdAt,_that.priority,_that.sale);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String orderType,  String status,  DateTime createdAt,  int priority,  KitchenSale sale)  $default,) {final _that = this;
switch (_that) {
case _KitchenOrder():
return $default(_that.id,_that.orderType,_that.status,_that.createdAt,_that.priority,_that.sale);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String orderType,  String status,  DateTime createdAt,  int priority,  KitchenSale sale)?  $default,) {final _that = this;
switch (_that) {
case _KitchenOrder() when $default != null:
return $default(_that.id,_that.orderType,_that.status,_that.createdAt,_that.priority,_that.sale);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KitchenOrder implements KitchenOrder {
  const _KitchenOrder({required this.id, required this.orderType, required this.status, required this.createdAt, required this.priority, required this.sale});
  factory _KitchenOrder.fromJson(Map<String, dynamic> json) => _$KitchenOrderFromJson(json);

@override final  String id;
@override final  String orderType;
@override final  String status;
// PENDING, IN_PREPARATION, READY, DELIVERED
@override final  DateTime createdAt;
@override final  int priority;
@override final  KitchenSale sale;

/// Create a copy of KitchenOrder
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KitchenOrderCopyWith<_KitchenOrder> get copyWith => __$KitchenOrderCopyWithImpl<_KitchenOrder>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KitchenOrderToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _KitchenOrder&&(identical(other.id, id) || other.id == id)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.status, status) || other.status == status)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.priority, priority) || other.priority == priority)&&(identical(other.sale, sale) || other.sale == sale));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,orderType,status,createdAt,priority,sale);

@override
String toString() {
  return 'KitchenOrder(id: $id, orderType: $orderType, status: $status, createdAt: $createdAt, priority: $priority, sale: $sale)';
}


}

/// @nodoc
abstract mixin class _$KitchenOrderCopyWith<$Res> implements $KitchenOrderCopyWith<$Res> {
  factory _$KitchenOrderCopyWith(_KitchenOrder value, $Res Function(_KitchenOrder) _then) = __$KitchenOrderCopyWithImpl;
@override @useResult
$Res call({
 String id, String orderType, String status, DateTime createdAt, int priority, KitchenSale sale
});


@override $KitchenSaleCopyWith<$Res> get sale;

}
/// @nodoc
class __$KitchenOrderCopyWithImpl<$Res>
    implements _$KitchenOrderCopyWith<$Res> {
  __$KitchenOrderCopyWithImpl(this._self, this._then);

  final _KitchenOrder _self;
  final $Res Function(_KitchenOrder) _then;

/// Create a copy of KitchenOrder
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? orderType = null,Object? status = null,Object? createdAt = null,Object? priority = null,Object? sale = null,}) {
  return _then(_KitchenOrder(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as int,sale: null == sale ? _self.sale : sale // ignore: cast_nullable_to_non_nullable
as KitchenSale,
  ));
}

/// Create a copy of KitchenOrder
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KitchenSaleCopyWith<$Res> get sale {
  
  return $KitchenSaleCopyWith<$Res>(_self.sale, (value) {
    return _then(_self.copyWith(sale: value));
  });
}
}


/// @nodoc
mixin _$KitchenSale {

 String get ticketNum; List<KitchenItem> get items; KitchenClient? get client;
/// Create a copy of KitchenSale
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KitchenSaleCopyWith<KitchenSale> get copyWith => _$KitchenSaleCopyWithImpl<KitchenSale>(this as KitchenSale, _$identity);

  /// Serializes this KitchenSale to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KitchenSale&&(identical(other.ticketNum, ticketNum) || other.ticketNum == ticketNum)&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.client, client) || other.client == client));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,ticketNum,const DeepCollectionEquality().hash(items),client);

@override
String toString() {
  return 'KitchenSale(ticketNum: $ticketNum, items: $items, client: $client)';
}


}

/// @nodoc
abstract mixin class $KitchenSaleCopyWith<$Res>  {
  factory $KitchenSaleCopyWith(KitchenSale value, $Res Function(KitchenSale) _then) = _$KitchenSaleCopyWithImpl;
@useResult
$Res call({
 String ticketNum, List<KitchenItem> items, KitchenClient? client
});


$KitchenClientCopyWith<$Res>? get client;

}
/// @nodoc
class _$KitchenSaleCopyWithImpl<$Res>
    implements $KitchenSaleCopyWith<$Res> {
  _$KitchenSaleCopyWithImpl(this._self, this._then);

  final KitchenSale _self;
  final $Res Function(KitchenSale) _then;

/// Create a copy of KitchenSale
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? ticketNum = null,Object? items = null,Object? client = freezed,}) {
  return _then(_self.copyWith(
ticketNum: null == ticketNum ? _self.ticketNum : ticketNum // ignore: cast_nullable_to_non_nullable
as String,items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<KitchenItem>,client: freezed == client ? _self.client : client // ignore: cast_nullable_to_non_nullable
as KitchenClient?,
  ));
}
/// Create a copy of KitchenSale
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KitchenClientCopyWith<$Res>? get client {
    if (_self.client == null) {
    return null;
  }

  return $KitchenClientCopyWith<$Res>(_self.client!, (value) {
    return _then(_self.copyWith(client: value));
  });
}
}


/// Adds pattern-matching-related methods to [KitchenSale].
extension KitchenSalePatterns on KitchenSale {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KitchenSale value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KitchenSale() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KitchenSale value)  $default,){
final _that = this;
switch (_that) {
case _KitchenSale():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KitchenSale value)?  $default,){
final _that = this;
switch (_that) {
case _KitchenSale() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String ticketNum,  List<KitchenItem> items,  KitchenClient? client)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KitchenSale() when $default != null:
return $default(_that.ticketNum,_that.items,_that.client);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String ticketNum,  List<KitchenItem> items,  KitchenClient? client)  $default,) {final _that = this;
switch (_that) {
case _KitchenSale():
return $default(_that.ticketNum,_that.items,_that.client);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String ticketNum,  List<KitchenItem> items,  KitchenClient? client)?  $default,) {final _that = this;
switch (_that) {
case _KitchenSale() when $default != null:
return $default(_that.ticketNum,_that.items,_that.client);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KitchenSale implements KitchenSale {
  const _KitchenSale({required this.ticketNum, required final  List<KitchenItem> items, this.client}): _items = items;
  factory _KitchenSale.fromJson(Map<String, dynamic> json) => _$KitchenSaleFromJson(json);

@override final  String ticketNum;
 final  List<KitchenItem> _items;
@override List<KitchenItem> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override final  KitchenClient? client;

/// Create a copy of KitchenSale
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KitchenSaleCopyWith<_KitchenSale> get copyWith => __$KitchenSaleCopyWithImpl<_KitchenSale>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KitchenSaleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _KitchenSale&&(identical(other.ticketNum, ticketNum) || other.ticketNum == ticketNum)&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.client, client) || other.client == client));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,ticketNum,const DeepCollectionEquality().hash(_items),client);

@override
String toString() {
  return 'KitchenSale(ticketNum: $ticketNum, items: $items, client: $client)';
}


}

/// @nodoc
abstract mixin class _$KitchenSaleCopyWith<$Res> implements $KitchenSaleCopyWith<$Res> {
  factory _$KitchenSaleCopyWith(_KitchenSale value, $Res Function(_KitchenSale) _then) = __$KitchenSaleCopyWithImpl;
@override @useResult
$Res call({
 String ticketNum, List<KitchenItem> items, KitchenClient? client
});


@override $KitchenClientCopyWith<$Res>? get client;

}
/// @nodoc
class __$KitchenSaleCopyWithImpl<$Res>
    implements _$KitchenSaleCopyWith<$Res> {
  __$KitchenSaleCopyWithImpl(this._self, this._then);

  final _KitchenSale _self;
  final $Res Function(_KitchenSale) _then;

/// Create a copy of KitchenSale
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? ticketNum = null,Object? items = null,Object? client = freezed,}) {
  return _then(_KitchenSale(
ticketNum: null == ticketNum ? _self.ticketNum : ticketNum // ignore: cast_nullable_to_non_nullable
as String,items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<KitchenItem>,client: freezed == client ? _self.client : client // ignore: cast_nullable_to_non_nullable
as KitchenClient?,
  ));
}

/// Create a copy of KitchenSale
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KitchenClientCopyWith<$Res>? get client {
    if (_self.client == null) {
    return null;
  }

  return $KitchenClientCopyWith<$Res>(_self.client!, (value) {
    return _then(_self.copyWith(client: value));
  });
}
}


/// @nodoc
mixin _$KitchenItem {

 String get id; KitchenProduct get product; double get quantity;
/// Create a copy of KitchenItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KitchenItemCopyWith<KitchenItem> get copyWith => _$KitchenItemCopyWithImpl<KitchenItem>(this as KitchenItem, _$identity);

  /// Serializes this KitchenItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KitchenItem&&(identical(other.id, id) || other.id == id)&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,product,quantity);

@override
String toString() {
  return 'KitchenItem(id: $id, product: $product, quantity: $quantity)';
}


}

/// @nodoc
abstract mixin class $KitchenItemCopyWith<$Res>  {
  factory $KitchenItemCopyWith(KitchenItem value, $Res Function(KitchenItem) _then) = _$KitchenItemCopyWithImpl;
@useResult
$Res call({
 String id, KitchenProduct product, double quantity
});


$KitchenProductCopyWith<$Res> get product;

}
/// @nodoc
class _$KitchenItemCopyWithImpl<$Res>
    implements $KitchenItemCopyWith<$Res> {
  _$KitchenItemCopyWithImpl(this._self, this._then);

  final KitchenItem _self;
  final $Res Function(KitchenItem) _then;

/// Create a copy of KitchenItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? product = null,Object? quantity = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as KitchenProduct,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as double,
  ));
}
/// Create a copy of KitchenItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KitchenProductCopyWith<$Res> get product {
  
  return $KitchenProductCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// Adds pattern-matching-related methods to [KitchenItem].
extension KitchenItemPatterns on KitchenItem {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KitchenItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KitchenItem() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KitchenItem value)  $default,){
final _that = this;
switch (_that) {
case _KitchenItem():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KitchenItem value)?  $default,){
final _that = this;
switch (_that) {
case _KitchenItem() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  KitchenProduct product,  double quantity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KitchenItem() when $default != null:
return $default(_that.id,_that.product,_that.quantity);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  KitchenProduct product,  double quantity)  $default,) {final _that = this;
switch (_that) {
case _KitchenItem():
return $default(_that.id,_that.product,_that.quantity);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  KitchenProduct product,  double quantity)?  $default,) {final _that = this;
switch (_that) {
case _KitchenItem() when $default != null:
return $default(_that.id,_that.product,_that.quantity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KitchenItem implements KitchenItem {
  const _KitchenItem({required this.id, required this.product, required this.quantity});
  factory _KitchenItem.fromJson(Map<String, dynamic> json) => _$KitchenItemFromJson(json);

@override final  String id;
@override final  KitchenProduct product;
@override final  double quantity;

/// Create a copy of KitchenItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KitchenItemCopyWith<_KitchenItem> get copyWith => __$KitchenItemCopyWithImpl<_KitchenItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KitchenItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _KitchenItem&&(identical(other.id, id) || other.id == id)&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,product,quantity);

@override
String toString() {
  return 'KitchenItem(id: $id, product: $product, quantity: $quantity)';
}


}

/// @nodoc
abstract mixin class _$KitchenItemCopyWith<$Res> implements $KitchenItemCopyWith<$Res> {
  factory _$KitchenItemCopyWith(_KitchenItem value, $Res Function(_KitchenItem) _then) = __$KitchenItemCopyWithImpl;
@override @useResult
$Res call({
 String id, KitchenProduct product, double quantity
});


@override $KitchenProductCopyWith<$Res> get product;

}
/// @nodoc
class __$KitchenItemCopyWithImpl<$Res>
    implements _$KitchenItemCopyWith<$Res> {
  __$KitchenItemCopyWithImpl(this._self, this._then);

  final _KitchenItem _self;
  final $Res Function(_KitchenItem) _then;

/// Create a copy of KitchenItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? product = null,Object? quantity = null,}) {
  return _then(_KitchenItem(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as KitchenProduct,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

/// Create a copy of KitchenItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KitchenProductCopyWith<$Res> get product {
  
  return $KitchenProductCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// @nodoc
mixin _$KitchenProduct {

 String get name; String get type;
/// Create a copy of KitchenProduct
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KitchenProductCopyWith<KitchenProduct> get copyWith => _$KitchenProductCopyWithImpl<KitchenProduct>(this as KitchenProduct, _$identity);

  /// Serializes this KitchenProduct to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KitchenProduct&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,type);

@override
String toString() {
  return 'KitchenProduct(name: $name, type: $type)';
}


}

/// @nodoc
abstract mixin class $KitchenProductCopyWith<$Res>  {
  factory $KitchenProductCopyWith(KitchenProduct value, $Res Function(KitchenProduct) _then) = _$KitchenProductCopyWithImpl;
@useResult
$Res call({
 String name, String type
});




}
/// @nodoc
class _$KitchenProductCopyWithImpl<$Res>
    implements $KitchenProductCopyWith<$Res> {
  _$KitchenProductCopyWithImpl(this._self, this._then);

  final KitchenProduct _self;
  final $Res Function(KitchenProduct) _then;

/// Create a copy of KitchenProduct
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? type = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [KitchenProduct].
extension KitchenProductPatterns on KitchenProduct {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KitchenProduct value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KitchenProduct() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KitchenProduct value)  $default,){
final _that = this;
switch (_that) {
case _KitchenProduct():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KitchenProduct value)?  $default,){
final _that = this;
switch (_that) {
case _KitchenProduct() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  String type)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KitchenProduct() when $default != null:
return $default(_that.name,_that.type);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  String type)  $default,) {final _that = this;
switch (_that) {
case _KitchenProduct():
return $default(_that.name,_that.type);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  String type)?  $default,) {final _that = this;
switch (_that) {
case _KitchenProduct() when $default != null:
return $default(_that.name,_that.type);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KitchenProduct implements KitchenProduct {
  const _KitchenProduct({required this.name, required this.type});
  factory _KitchenProduct.fromJson(Map<String, dynamic> json) => _$KitchenProductFromJson(json);

@override final  String name;
@override final  String type;

/// Create a copy of KitchenProduct
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KitchenProductCopyWith<_KitchenProduct> get copyWith => __$KitchenProductCopyWithImpl<_KitchenProduct>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KitchenProductToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _KitchenProduct&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,type);

@override
String toString() {
  return 'KitchenProduct(name: $name, type: $type)';
}


}

/// @nodoc
abstract mixin class _$KitchenProductCopyWith<$Res> implements $KitchenProductCopyWith<$Res> {
  factory _$KitchenProductCopyWith(_KitchenProduct value, $Res Function(_KitchenProduct) _then) = __$KitchenProductCopyWithImpl;
@override @useResult
$Res call({
 String name, String type
});




}
/// @nodoc
class __$KitchenProductCopyWithImpl<$Res>
    implements _$KitchenProductCopyWith<$Res> {
  __$KitchenProductCopyWithImpl(this._self, this._then);

  final _KitchenProduct _self;
  final $Res Function(_KitchenProduct) _then;

/// Create a copy of KitchenProduct
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? type = null,}) {
  return _then(_KitchenProduct(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$KitchenClient {

 String get name;
/// Create a copy of KitchenClient
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KitchenClientCopyWith<KitchenClient> get copyWith => _$KitchenClientCopyWithImpl<KitchenClient>(this as KitchenClient, _$identity);

  /// Serializes this KitchenClient to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KitchenClient&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name);

@override
String toString() {
  return 'KitchenClient(name: $name)';
}


}

/// @nodoc
abstract mixin class $KitchenClientCopyWith<$Res>  {
  factory $KitchenClientCopyWith(KitchenClient value, $Res Function(KitchenClient) _then) = _$KitchenClientCopyWithImpl;
@useResult
$Res call({
 String name
});




}
/// @nodoc
class _$KitchenClientCopyWithImpl<$Res>
    implements $KitchenClientCopyWith<$Res> {
  _$KitchenClientCopyWithImpl(this._self, this._then);

  final KitchenClient _self;
  final $Res Function(KitchenClient) _then;

/// Create a copy of KitchenClient
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [KitchenClient].
extension KitchenClientPatterns on KitchenClient {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KitchenClient value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KitchenClient() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KitchenClient value)  $default,){
final _that = this;
switch (_that) {
case _KitchenClient():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KitchenClient value)?  $default,){
final _that = this;
switch (_that) {
case _KitchenClient() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _KitchenClient() when $default != null:
return $default(_that.name);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name)  $default,) {final _that = this;
switch (_that) {
case _KitchenClient():
return $default(_that.name);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name)?  $default,) {final _that = this;
switch (_that) {
case _KitchenClient() when $default != null:
return $default(_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _KitchenClient implements KitchenClient {
  const _KitchenClient({required this.name});
  factory _KitchenClient.fromJson(Map<String, dynamic> json) => _$KitchenClientFromJson(json);

@override final  String name;

/// Create a copy of KitchenClient
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KitchenClientCopyWith<_KitchenClient> get copyWith => __$KitchenClientCopyWithImpl<_KitchenClient>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KitchenClientToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _KitchenClient&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name);

@override
String toString() {
  return 'KitchenClient(name: $name)';
}


}

/// @nodoc
abstract mixin class _$KitchenClientCopyWith<$Res> implements $KitchenClientCopyWith<$Res> {
  factory _$KitchenClientCopyWith(_KitchenClient value, $Res Function(_KitchenClient) _then) = __$KitchenClientCopyWithImpl;
@override @useResult
$Res call({
 String name
});




}
/// @nodoc
class __$KitchenClientCopyWithImpl<$Res>
    implements _$KitchenClientCopyWith<$Res> {
  __$KitchenClientCopyWithImpl(this._self, this._then);

  final _KitchenClient _self;
  final $Res Function(_KitchenClient) _then;

/// Create a copy of KitchenClient
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,}) {
  return _then(_KitchenClient(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
