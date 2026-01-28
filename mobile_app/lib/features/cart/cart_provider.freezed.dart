// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'cart_provider.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$CartItem {

 Product get product; int get quantity; double get unitPriceUsd; double get unitPriceCdf;
/// Create a copy of CartItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CartItemCopyWith<CartItem> get copyWith => _$CartItemCopyWithImpl<CartItem>(this as CartItem, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CartItem&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.unitPriceUsd, unitPriceUsd) || other.unitPriceUsd == unitPriceUsd)&&(identical(other.unitPriceCdf, unitPriceCdf) || other.unitPriceCdf == unitPriceCdf));
}


@override
int get hashCode => Object.hash(runtimeType,product,quantity,unitPriceUsd,unitPriceCdf);

@override
String toString() {
  return 'CartItem(product: $product, quantity: $quantity, unitPriceUsd: $unitPriceUsd, unitPriceCdf: $unitPriceCdf)';
}


}

/// @nodoc
abstract mixin class $CartItemCopyWith<$Res>  {
  factory $CartItemCopyWith(CartItem value, $Res Function(CartItem) _then) = _$CartItemCopyWithImpl;
@useResult
$Res call({
 Product product, int quantity, double unitPriceUsd, double unitPriceCdf
});


$ProductCopyWith<$Res> get product;

}
/// @nodoc
class _$CartItemCopyWithImpl<$Res>
    implements $CartItemCopyWith<$Res> {
  _$CartItemCopyWithImpl(this._self, this._then);

  final CartItem _self;
  final $Res Function(CartItem) _then;

/// Create a copy of CartItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? product = null,Object? quantity = null,Object? unitPriceUsd = null,Object? unitPriceCdf = null,}) {
  return _then(_self.copyWith(
product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as Product,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,unitPriceUsd: null == unitPriceUsd ? _self.unitPriceUsd : unitPriceUsd // ignore: cast_nullable_to_non_nullable
as double,unitPriceCdf: null == unitPriceCdf ? _self.unitPriceCdf : unitPriceCdf // ignore: cast_nullable_to_non_nullable
as double,
  ));
}
/// Create a copy of CartItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductCopyWith<$Res> get product {
  
  return $ProductCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// Adds pattern-matching-related methods to [CartItem].
extension CartItemPatterns on CartItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CartItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CartItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CartItem value)  $default,){
final _that = this;
switch (_that) {
case _CartItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CartItem value)?  $default,){
final _that = this;
switch (_that) {
case _CartItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Product product,  int quantity,  double unitPriceUsd,  double unitPriceCdf)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CartItem() when $default != null:
return $default(_that.product,_that.quantity,_that.unitPriceUsd,_that.unitPriceCdf);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Product product,  int quantity,  double unitPriceUsd,  double unitPriceCdf)  $default,) {final _that = this;
switch (_that) {
case _CartItem():
return $default(_that.product,_that.quantity,_that.unitPriceUsd,_that.unitPriceCdf);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Product product,  int quantity,  double unitPriceUsd,  double unitPriceCdf)?  $default,) {final _that = this;
switch (_that) {
case _CartItem() when $default != null:
return $default(_that.product,_that.quantity,_that.unitPriceUsd,_that.unitPriceCdf);case _:
  return null;

}
}

}

/// @nodoc


class _CartItem extends CartItem {
  const _CartItem({required this.product, required this.quantity, required this.unitPriceUsd, required this.unitPriceCdf}): super._();
  

@override final  Product product;
@override final  int quantity;
@override final  double unitPriceUsd;
@override final  double unitPriceCdf;

/// Create a copy of CartItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CartItemCopyWith<_CartItem> get copyWith => __$CartItemCopyWithImpl<_CartItem>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CartItem&&(identical(other.product, product) || other.product == product)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.unitPriceUsd, unitPriceUsd) || other.unitPriceUsd == unitPriceUsd)&&(identical(other.unitPriceCdf, unitPriceCdf) || other.unitPriceCdf == unitPriceCdf));
}


@override
int get hashCode => Object.hash(runtimeType,product,quantity,unitPriceUsd,unitPriceCdf);

@override
String toString() {
  return 'CartItem(product: $product, quantity: $quantity, unitPriceUsd: $unitPriceUsd, unitPriceCdf: $unitPriceCdf)';
}


}

/// @nodoc
abstract mixin class _$CartItemCopyWith<$Res> implements $CartItemCopyWith<$Res> {
  factory _$CartItemCopyWith(_CartItem value, $Res Function(_CartItem) _then) = __$CartItemCopyWithImpl;
@override @useResult
$Res call({
 Product product, int quantity, double unitPriceUsd, double unitPriceCdf
});


@override $ProductCopyWith<$Res> get product;

}
/// @nodoc
class __$CartItemCopyWithImpl<$Res>
    implements _$CartItemCopyWith<$Res> {
  __$CartItemCopyWithImpl(this._self, this._then);

  final _CartItem _self;
  final $Res Function(_CartItem) _then;

/// Create a copy of CartItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? product = null,Object? quantity = null,Object? unitPriceUsd = null,Object? unitPriceCdf = null,}) {
  return _then(_CartItem(
product: null == product ? _self.product : product // ignore: cast_nullable_to_non_nullable
as Product,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as int,unitPriceUsd: null == unitPriceUsd ? _self.unitPriceUsd : unitPriceUsd // ignore: cast_nullable_to_non_nullable
as double,unitPriceCdf: null == unitPriceCdf ? _self.unitPriceCdf : unitPriceCdf // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

/// Create a copy of CartItem
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductCopyWith<$Res> get product {
  
  return $ProductCopyWith<$Res>(_self.product, (value) {
    return _then(_self.copyWith(product: value));
  });
}
}


/// @nodoc
mixin _$DeliveryInfo {

 String get address; String get phone; String? get instructions;
/// Create a copy of DeliveryInfo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DeliveryInfoCopyWith<DeliveryInfo> get copyWith => _$DeliveryInfoCopyWithImpl<DeliveryInfo>(this as DeliveryInfo, _$identity);

  /// Serializes this DeliveryInfo to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DeliveryInfo&&(identical(other.address, address) || other.address == address)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.instructions, instructions) || other.instructions == instructions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,address,phone,instructions);

@override
String toString() {
  return 'DeliveryInfo(address: $address, phone: $phone, instructions: $instructions)';
}


}

/// @nodoc
abstract mixin class $DeliveryInfoCopyWith<$Res>  {
  factory $DeliveryInfoCopyWith(DeliveryInfo value, $Res Function(DeliveryInfo) _then) = _$DeliveryInfoCopyWithImpl;
@useResult
$Res call({
 String address, String phone, String? instructions
});




}
/// @nodoc
class _$DeliveryInfoCopyWithImpl<$Res>
    implements $DeliveryInfoCopyWith<$Res> {
  _$DeliveryInfoCopyWithImpl(this._self, this._then);

  final DeliveryInfo _self;
  final $Res Function(DeliveryInfo) _then;

/// Create a copy of DeliveryInfo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? address = null,Object? phone = null,Object? instructions = freezed,}) {
  return _then(_self.copyWith(
address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,instructions: freezed == instructions ? _self.instructions : instructions // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [DeliveryInfo].
extension DeliveryInfoPatterns on DeliveryInfo {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DeliveryInfo value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DeliveryInfo() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DeliveryInfo value)  $default,){
final _that = this;
switch (_that) {
case _DeliveryInfo():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DeliveryInfo value)?  $default,){
final _that = this;
switch (_that) {
case _DeliveryInfo() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String address,  String phone,  String? instructions)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DeliveryInfo() when $default != null:
return $default(_that.address,_that.phone,_that.instructions);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String address,  String phone,  String? instructions)  $default,) {final _that = this;
switch (_that) {
case _DeliveryInfo():
return $default(_that.address,_that.phone,_that.instructions);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String address,  String phone,  String? instructions)?  $default,) {final _that = this;
switch (_that) {
case _DeliveryInfo() when $default != null:
return $default(_that.address,_that.phone,_that.instructions);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DeliveryInfo implements DeliveryInfo {
  const _DeliveryInfo({required this.address, required this.phone, this.instructions});
  factory _DeliveryInfo.fromJson(Map<String, dynamic> json) => _$DeliveryInfoFromJson(json);

@override final  String address;
@override final  String phone;
@override final  String? instructions;

/// Create a copy of DeliveryInfo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DeliveryInfoCopyWith<_DeliveryInfo> get copyWith => __$DeliveryInfoCopyWithImpl<_DeliveryInfo>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DeliveryInfoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DeliveryInfo&&(identical(other.address, address) || other.address == address)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.instructions, instructions) || other.instructions == instructions));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,address,phone,instructions);

@override
String toString() {
  return 'DeliveryInfo(address: $address, phone: $phone, instructions: $instructions)';
}


}

/// @nodoc
abstract mixin class _$DeliveryInfoCopyWith<$Res> implements $DeliveryInfoCopyWith<$Res> {
  factory _$DeliveryInfoCopyWith(_DeliveryInfo value, $Res Function(_DeliveryInfo) _then) = __$DeliveryInfoCopyWithImpl;
@override @useResult
$Res call({
 String address, String phone, String? instructions
});




}
/// @nodoc
class __$DeliveryInfoCopyWithImpl<$Res>
    implements _$DeliveryInfoCopyWith<$Res> {
  __$DeliveryInfoCopyWithImpl(this._self, this._then);

  final _DeliveryInfo _self;
  final $Res Function(_DeliveryInfo) _then;

/// Create a copy of DeliveryInfo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? address = null,Object? phone = null,Object? instructions = freezed,}) {
  return _then(_DeliveryInfo(
address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,instructions: freezed == instructions ? _self.instructions : instructions // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

/// @nodoc
mixin _$CartState {

 Map<String, CartItem> get items; Client? get selectedClient; bool get isLoading; String? get activeDraftId; String get orderType;// DINE_IN, TAKEAWAY, DELIVERY
 DeliveryInfo? get deliveryInfo;
/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CartStateCopyWith<CartState> get copyWith => _$CartStateCopyWithImpl<CartState>(this as CartState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CartState&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.selectedClient, selectedClient) || other.selectedClient == selectedClient)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.activeDraftId, activeDraftId) || other.activeDraftId == activeDraftId)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryInfo, deliveryInfo) || other.deliveryInfo == deliveryInfo));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(items),selectedClient,isLoading,activeDraftId,orderType,deliveryInfo);

@override
String toString() {
  return 'CartState(items: $items, selectedClient: $selectedClient, isLoading: $isLoading, activeDraftId: $activeDraftId, orderType: $orderType, deliveryInfo: $deliveryInfo)';
}


}

/// @nodoc
abstract mixin class $CartStateCopyWith<$Res>  {
  factory $CartStateCopyWith(CartState value, $Res Function(CartState) _then) = _$CartStateCopyWithImpl;
@useResult
$Res call({
 Map<String, CartItem> items, Client? selectedClient, bool isLoading, String? activeDraftId, String orderType, DeliveryInfo? deliveryInfo
});


$ClientCopyWith<$Res>? get selectedClient;$DeliveryInfoCopyWith<$Res>? get deliveryInfo;

}
/// @nodoc
class _$CartStateCopyWithImpl<$Res>
    implements $CartStateCopyWith<$Res> {
  _$CartStateCopyWithImpl(this._self, this._then);

  final CartState _self;
  final $Res Function(CartState) _then;

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? items = null,Object? selectedClient = freezed,Object? isLoading = null,Object? activeDraftId = freezed,Object? orderType = null,Object? deliveryInfo = freezed,}) {
  return _then(_self.copyWith(
items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as Map<String, CartItem>,selectedClient: freezed == selectedClient ? _self.selectedClient : selectedClient // ignore: cast_nullable_to_non_nullable
as Client?,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,activeDraftId: freezed == activeDraftId ? _self.activeDraftId : activeDraftId // ignore: cast_nullable_to_non_nullable
as String?,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as String,deliveryInfo: freezed == deliveryInfo ? _self.deliveryInfo : deliveryInfo // ignore: cast_nullable_to_non_nullable
as DeliveryInfo?,
  ));
}
/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ClientCopyWith<$Res>? get selectedClient {
    if (_self.selectedClient == null) {
    return null;
  }

  return $ClientCopyWith<$Res>(_self.selectedClient!, (value) {
    return _then(_self.copyWith(selectedClient: value));
  });
}/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DeliveryInfoCopyWith<$Res>? get deliveryInfo {
    if (_self.deliveryInfo == null) {
    return null;
  }

  return $DeliveryInfoCopyWith<$Res>(_self.deliveryInfo!, (value) {
    return _then(_self.copyWith(deliveryInfo: value));
  });
}
}


/// Adds pattern-matching-related methods to [CartState].
extension CartStatePatterns on CartState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CartState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CartState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CartState value)  $default,){
final _that = this;
switch (_that) {
case _CartState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CartState value)?  $default,){
final _that = this;
switch (_that) {
case _CartState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Map<String, CartItem> items,  Client? selectedClient,  bool isLoading,  String? activeDraftId,  String orderType,  DeliveryInfo? deliveryInfo)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CartState() when $default != null:
return $default(_that.items,_that.selectedClient,_that.isLoading,_that.activeDraftId,_that.orderType,_that.deliveryInfo);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Map<String, CartItem> items,  Client? selectedClient,  bool isLoading,  String? activeDraftId,  String orderType,  DeliveryInfo? deliveryInfo)  $default,) {final _that = this;
switch (_that) {
case _CartState():
return $default(_that.items,_that.selectedClient,_that.isLoading,_that.activeDraftId,_that.orderType,_that.deliveryInfo);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Map<String, CartItem> items,  Client? selectedClient,  bool isLoading,  String? activeDraftId,  String orderType,  DeliveryInfo? deliveryInfo)?  $default,) {final _that = this;
switch (_that) {
case _CartState() when $default != null:
return $default(_that.items,_that.selectedClient,_that.isLoading,_that.activeDraftId,_that.orderType,_that.deliveryInfo);case _:
  return null;

}
}

}

/// @nodoc


class _CartState extends CartState {
  const _CartState({final  Map<String, CartItem> items = const {}, this.selectedClient, this.isLoading = false, this.activeDraftId, this.orderType = "DINE_IN", this.deliveryInfo}): _items = items,super._();
  

 final  Map<String, CartItem> _items;
@override@JsonKey() Map<String, CartItem> get items {
  if (_items is EqualUnmodifiableMapView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_items);
}

@override final  Client? selectedClient;
@override@JsonKey() final  bool isLoading;
@override final  String? activeDraftId;
@override@JsonKey() final  String orderType;
// DINE_IN, TAKEAWAY, DELIVERY
@override final  DeliveryInfo? deliveryInfo;

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CartStateCopyWith<_CartState> get copyWith => __$CartStateCopyWithImpl<_CartState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CartState&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.selectedClient, selectedClient) || other.selectedClient == selectedClient)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.activeDraftId, activeDraftId) || other.activeDraftId == activeDraftId)&&(identical(other.orderType, orderType) || other.orderType == orderType)&&(identical(other.deliveryInfo, deliveryInfo) || other.deliveryInfo == deliveryInfo));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_items),selectedClient,isLoading,activeDraftId,orderType,deliveryInfo);

@override
String toString() {
  return 'CartState(items: $items, selectedClient: $selectedClient, isLoading: $isLoading, activeDraftId: $activeDraftId, orderType: $orderType, deliveryInfo: $deliveryInfo)';
}


}

/// @nodoc
abstract mixin class _$CartStateCopyWith<$Res> implements $CartStateCopyWith<$Res> {
  factory _$CartStateCopyWith(_CartState value, $Res Function(_CartState) _then) = __$CartStateCopyWithImpl;
@override @useResult
$Res call({
 Map<String, CartItem> items, Client? selectedClient, bool isLoading, String? activeDraftId, String orderType, DeliveryInfo? deliveryInfo
});


@override $ClientCopyWith<$Res>? get selectedClient;@override $DeliveryInfoCopyWith<$Res>? get deliveryInfo;

}
/// @nodoc
class __$CartStateCopyWithImpl<$Res>
    implements _$CartStateCopyWith<$Res> {
  __$CartStateCopyWithImpl(this._self, this._then);

  final _CartState _self;
  final $Res Function(_CartState) _then;

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? items = null,Object? selectedClient = freezed,Object? isLoading = null,Object? activeDraftId = freezed,Object? orderType = null,Object? deliveryInfo = freezed,}) {
  return _then(_CartState(
items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as Map<String, CartItem>,selectedClient: freezed == selectedClient ? _self.selectedClient : selectedClient // ignore: cast_nullable_to_non_nullable
as Client?,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,activeDraftId: freezed == activeDraftId ? _self.activeDraftId : activeDraftId // ignore: cast_nullable_to_non_nullable
as String?,orderType: null == orderType ? _self.orderType : orderType // ignore: cast_nullable_to_non_nullable
as String,deliveryInfo: freezed == deliveryInfo ? _self.deliveryInfo : deliveryInfo // ignore: cast_nullable_to_non_nullable
as DeliveryInfo?,
  ));
}

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ClientCopyWith<$Res>? get selectedClient {
    if (_self.selectedClient == null) {
    return null;
  }

  return $ClientCopyWith<$Res>(_self.selectedClient!, (value) {
    return _then(_self.copyWith(selectedClient: value));
  });
}/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DeliveryInfoCopyWith<$Res>? get deliveryInfo {
    if (_self.deliveryInfo == null) {
    return null;
  }

  return $DeliveryInfoCopyWith<$Res>(_self.deliveryInfo!, (value) {
    return _then(_self.copyWith(deliveryInfo: value));
  });
}
}

// dart format on
