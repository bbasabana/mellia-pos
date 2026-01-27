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
mixin _$CartState {

 Map<String, CartItem> get items; Client? get selectedClient;
/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CartStateCopyWith<CartState> get copyWith => _$CartStateCopyWithImpl<CartState>(this as CartState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CartState&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.selectedClient, selectedClient) || other.selectedClient == selectedClient));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(items),selectedClient);

@override
String toString() {
  return 'CartState(items: $items, selectedClient: $selectedClient)';
}


}

/// @nodoc
abstract mixin class $CartStateCopyWith<$Res>  {
  factory $CartStateCopyWith(CartState value, $Res Function(CartState) _then) = _$CartStateCopyWithImpl;
@useResult
$Res call({
 Map<String, CartItem> items, Client? selectedClient
});


$ClientCopyWith<$Res>? get selectedClient;

}
/// @nodoc
class _$CartStateCopyWithImpl<$Res>
    implements $CartStateCopyWith<$Res> {
  _$CartStateCopyWithImpl(this._self, this._then);

  final CartState _self;
  final $Res Function(CartState) _then;

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? items = null,Object? selectedClient = freezed,}) {
  return _then(_self.copyWith(
items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as Map<String, CartItem>,selectedClient: freezed == selectedClient ? _self.selectedClient : selectedClient // ignore: cast_nullable_to_non_nullable
as Client?,
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Map<String, CartItem> items,  Client? selectedClient)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CartState() when $default != null:
return $default(_that.items,_that.selectedClient);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Map<String, CartItem> items,  Client? selectedClient)  $default,) {final _that = this;
switch (_that) {
case _CartState():
return $default(_that.items,_that.selectedClient);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Map<String, CartItem> items,  Client? selectedClient)?  $default,) {final _that = this;
switch (_that) {
case _CartState() when $default != null:
return $default(_that.items,_that.selectedClient);case _:
  return null;

}
}

}

/// @nodoc


class _CartState extends CartState {
  const _CartState({final  Map<String, CartItem> items = const {}, this.selectedClient}): _items = items,super._();
  

 final  Map<String, CartItem> _items;
@override@JsonKey() Map<String, CartItem> get items {
  if (_items is EqualUnmodifiableMapView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_items);
}

@override final  Client? selectedClient;

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CartStateCopyWith<_CartState> get copyWith => __$CartStateCopyWithImpl<_CartState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CartState&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.selectedClient, selectedClient) || other.selectedClient == selectedClient));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_items),selectedClient);

@override
String toString() {
  return 'CartState(items: $items, selectedClient: $selectedClient)';
}


}

/// @nodoc
abstract mixin class _$CartStateCopyWith<$Res> implements $CartStateCopyWith<$Res> {
  factory _$CartStateCopyWith(_CartState value, $Res Function(_CartState) _then) = __$CartStateCopyWithImpl;
@override @useResult
$Res call({
 Map<String, CartItem> items, Client? selectedClient
});


@override $ClientCopyWith<$Res>? get selectedClient;

}
/// @nodoc
class __$CartStateCopyWithImpl<$Res>
    implements _$CartStateCopyWith<$Res> {
  __$CartStateCopyWithImpl(this._self, this._then);

  final _CartState _self;
  final $Res Function(_CartState) _then;

/// Create a copy of CartState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? items = null,Object? selectedClient = freezed,}) {
  return _then(_CartState(
items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as Map<String, CartItem>,selectedClient: freezed == selectedClient ? _self.selectedClient : selectedClient // ignore: cast_nullable_to_non_nullable
as Client?,
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
}
}

// dart format on
