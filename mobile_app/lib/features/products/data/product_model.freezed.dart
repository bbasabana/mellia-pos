// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'product_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Product {

 String get id; String get name; String get type;// BEVERAGE, FOOD, etc.
 String? get imageUrl; String? get description;// Category (can be null if not set)
 String? get beverageCategory; String? get foodCategory;// Sizes & Units
 String get size; String get saleUnit;// BOTTLE, PLATE...
// Status
 bool get active; bool get vendable;// Virtual Fields (computed by API usually, or frontend logic)
// The API /api/products returns `prices` array. We will map it.
 List<ProductPrice> get prices;// Flattened price for Grid (optional, helper)
@JsonKey(fromJson: toDouble) double? get priceUsd;@JsonKey(fromJson: toDouble) double? get priceCdf;// Stock (from API /api/products/stock or embedded)
// If API returns stockItems
 List<StockItem> get stockItems;
/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProductCopyWith<Product> get copyWith => _$ProductCopyWithImpl<Product>(this as Product, _$identity);

  /// Serializes this Product to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Product&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.description, description) || other.description == description)&&(identical(other.beverageCategory, beverageCategory) || other.beverageCategory == beverageCategory)&&(identical(other.foodCategory, foodCategory) || other.foodCategory == foodCategory)&&(identical(other.size, size) || other.size == size)&&(identical(other.saleUnit, saleUnit) || other.saleUnit == saleUnit)&&(identical(other.active, active) || other.active == active)&&(identical(other.vendable, vendable) || other.vendable == vendable)&&const DeepCollectionEquality().equals(other.prices, prices)&&(identical(other.priceUsd, priceUsd) || other.priceUsd == priceUsd)&&(identical(other.priceCdf, priceCdf) || other.priceCdf == priceCdf)&&const DeepCollectionEquality().equals(other.stockItems, stockItems));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,type,imageUrl,description,beverageCategory,foodCategory,size,saleUnit,active,vendable,const DeepCollectionEquality().hash(prices),priceUsd,priceCdf,const DeepCollectionEquality().hash(stockItems));

@override
String toString() {
  return 'Product(id: $id, name: $name, type: $type, imageUrl: $imageUrl, description: $description, beverageCategory: $beverageCategory, foodCategory: $foodCategory, size: $size, saleUnit: $saleUnit, active: $active, vendable: $vendable, prices: $prices, priceUsd: $priceUsd, priceCdf: $priceCdf, stockItems: $stockItems)';
}


}

/// @nodoc
abstract mixin class $ProductCopyWith<$Res>  {
  factory $ProductCopyWith(Product value, $Res Function(Product) _then) = _$ProductCopyWithImpl;
@useResult
$Res call({
 String id, String name, String type, String? imageUrl, String? description, String? beverageCategory, String? foodCategory, String size, String saleUnit, bool active, bool vendable, List<ProductPrice> prices,@JsonKey(fromJson: toDouble) double? priceUsd,@JsonKey(fromJson: toDouble) double? priceCdf, List<StockItem> stockItems
});




}
/// @nodoc
class _$ProductCopyWithImpl<$Res>
    implements $ProductCopyWith<$Res> {
  _$ProductCopyWithImpl(this._self, this._then);

  final Product _self;
  final $Res Function(Product) _then;

/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? type = null,Object? imageUrl = freezed,Object? description = freezed,Object? beverageCategory = freezed,Object? foodCategory = freezed,Object? size = null,Object? saleUnit = null,Object? active = null,Object? vendable = null,Object? prices = null,Object? priceUsd = freezed,Object? priceCdf = freezed,Object? stockItems = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,beverageCategory: freezed == beverageCategory ? _self.beverageCategory : beverageCategory // ignore: cast_nullable_to_non_nullable
as String?,foodCategory: freezed == foodCategory ? _self.foodCategory : foodCategory // ignore: cast_nullable_to_non_nullable
as String?,size: null == size ? _self.size : size // ignore: cast_nullable_to_non_nullable
as String,saleUnit: null == saleUnit ? _self.saleUnit : saleUnit // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,vendable: null == vendable ? _self.vendable : vendable // ignore: cast_nullable_to_non_nullable
as bool,prices: null == prices ? _self.prices : prices // ignore: cast_nullable_to_non_nullable
as List<ProductPrice>,priceUsd: freezed == priceUsd ? _self.priceUsd : priceUsd // ignore: cast_nullable_to_non_nullable
as double?,priceCdf: freezed == priceCdf ? _self.priceCdf : priceCdf // ignore: cast_nullable_to_non_nullable
as double?,stockItems: null == stockItems ? _self.stockItems : stockItems // ignore: cast_nullable_to_non_nullable
as List<StockItem>,
  ));
}

}


/// Adds pattern-matching-related methods to [Product].
extension ProductPatterns on Product {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Product value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Product() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Product value)  $default,){
final _that = this;
switch (_that) {
case _Product():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Product value)?  $default,){
final _that = this;
switch (_that) {
case _Product() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String type,  String? imageUrl,  String? description,  String? beverageCategory,  String? foodCategory,  String size,  String saleUnit,  bool active,  bool vendable,  List<ProductPrice> prices, @JsonKey(fromJson: toDouble)  double? priceUsd, @JsonKey(fromJson: toDouble)  double? priceCdf,  List<StockItem> stockItems)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Product() when $default != null:
return $default(_that.id,_that.name,_that.type,_that.imageUrl,_that.description,_that.beverageCategory,_that.foodCategory,_that.size,_that.saleUnit,_that.active,_that.vendable,_that.prices,_that.priceUsd,_that.priceCdf,_that.stockItems);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String type,  String? imageUrl,  String? description,  String? beverageCategory,  String? foodCategory,  String size,  String saleUnit,  bool active,  bool vendable,  List<ProductPrice> prices, @JsonKey(fromJson: toDouble)  double? priceUsd, @JsonKey(fromJson: toDouble)  double? priceCdf,  List<StockItem> stockItems)  $default,) {final _that = this;
switch (_that) {
case _Product():
return $default(_that.id,_that.name,_that.type,_that.imageUrl,_that.description,_that.beverageCategory,_that.foodCategory,_that.size,_that.saleUnit,_that.active,_that.vendable,_that.prices,_that.priceUsd,_that.priceCdf,_that.stockItems);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String type,  String? imageUrl,  String? description,  String? beverageCategory,  String? foodCategory,  String size,  String saleUnit,  bool active,  bool vendable,  List<ProductPrice> prices, @JsonKey(fromJson: toDouble)  double? priceUsd, @JsonKey(fromJson: toDouble)  double? priceCdf,  List<StockItem> stockItems)?  $default,) {final _that = this;
switch (_that) {
case _Product() when $default != null:
return $default(_that.id,_that.name,_that.type,_that.imageUrl,_that.description,_that.beverageCategory,_that.foodCategory,_that.size,_that.saleUnit,_that.active,_that.vendable,_that.prices,_that.priceUsd,_that.priceCdf,_that.stockItems);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Product extends Product {
  const _Product({required this.id, required this.name, required this.type, this.imageUrl, this.description, this.beverageCategory, this.foodCategory, this.size = 'STANDARD', required this.saleUnit, this.active = true, this.vendable = true, final  List<ProductPrice> prices = const [], @JsonKey(fromJson: toDouble) this.priceUsd, @JsonKey(fromJson: toDouble) this.priceCdf, final  List<StockItem> stockItems = const []}): _prices = prices,_stockItems = stockItems,super._();
  factory _Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);

@override final  String id;
@override final  String name;
@override final  String type;
// BEVERAGE, FOOD, etc.
@override final  String? imageUrl;
@override final  String? description;
// Category (can be null if not set)
@override final  String? beverageCategory;
@override final  String? foodCategory;
// Sizes & Units
@override@JsonKey() final  String size;
@override final  String saleUnit;
// BOTTLE, PLATE...
// Status
@override@JsonKey() final  bool active;
@override@JsonKey() final  bool vendable;
// Virtual Fields (computed by API usually, or frontend logic)
// The API /api/products returns `prices` array. We will map it.
 final  List<ProductPrice> _prices;
// Virtual Fields (computed by API usually, or frontend logic)
// The API /api/products returns `prices` array. We will map it.
@override@JsonKey() List<ProductPrice> get prices {
  if (_prices is EqualUnmodifiableListView) return _prices;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_prices);
}

// Flattened price for Grid (optional, helper)
@override@JsonKey(fromJson: toDouble) final  double? priceUsd;
@override@JsonKey(fromJson: toDouble) final  double? priceCdf;
// Stock (from API /api/products/stock or embedded)
// If API returns stockItems
 final  List<StockItem> _stockItems;
// Stock (from API /api/products/stock or embedded)
// If API returns stockItems
@override@JsonKey() List<StockItem> get stockItems {
  if (_stockItems is EqualUnmodifiableListView) return _stockItems;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_stockItems);
}


/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProductCopyWith<_Product> get copyWith => __$ProductCopyWithImpl<_Product>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProductToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Product&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.description, description) || other.description == description)&&(identical(other.beverageCategory, beverageCategory) || other.beverageCategory == beverageCategory)&&(identical(other.foodCategory, foodCategory) || other.foodCategory == foodCategory)&&(identical(other.size, size) || other.size == size)&&(identical(other.saleUnit, saleUnit) || other.saleUnit == saleUnit)&&(identical(other.active, active) || other.active == active)&&(identical(other.vendable, vendable) || other.vendable == vendable)&&const DeepCollectionEquality().equals(other._prices, _prices)&&(identical(other.priceUsd, priceUsd) || other.priceUsd == priceUsd)&&(identical(other.priceCdf, priceCdf) || other.priceCdf == priceCdf)&&const DeepCollectionEquality().equals(other._stockItems, _stockItems));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,type,imageUrl,description,beverageCategory,foodCategory,size,saleUnit,active,vendable,const DeepCollectionEquality().hash(_prices),priceUsd,priceCdf,const DeepCollectionEquality().hash(_stockItems));

@override
String toString() {
  return 'Product(id: $id, name: $name, type: $type, imageUrl: $imageUrl, description: $description, beverageCategory: $beverageCategory, foodCategory: $foodCategory, size: $size, saleUnit: $saleUnit, active: $active, vendable: $vendable, prices: $prices, priceUsd: $priceUsd, priceCdf: $priceCdf, stockItems: $stockItems)';
}


}

/// @nodoc
abstract mixin class _$ProductCopyWith<$Res> implements $ProductCopyWith<$Res> {
  factory _$ProductCopyWith(_Product value, $Res Function(_Product) _then) = __$ProductCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String type, String? imageUrl, String? description, String? beverageCategory, String? foodCategory, String size, String saleUnit, bool active, bool vendable, List<ProductPrice> prices,@JsonKey(fromJson: toDouble) double? priceUsd,@JsonKey(fromJson: toDouble) double? priceCdf, List<StockItem> stockItems
});




}
/// @nodoc
class __$ProductCopyWithImpl<$Res>
    implements _$ProductCopyWith<$Res> {
  __$ProductCopyWithImpl(this._self, this._then);

  final _Product _self;
  final $Res Function(_Product) _then;

/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? type = null,Object? imageUrl = freezed,Object? description = freezed,Object? beverageCategory = freezed,Object? foodCategory = freezed,Object? size = null,Object? saleUnit = null,Object? active = null,Object? vendable = null,Object? prices = null,Object? priceUsd = freezed,Object? priceCdf = freezed,Object? stockItems = null,}) {
  return _then(_Product(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,imageUrl: freezed == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,beverageCategory: freezed == beverageCategory ? _self.beverageCategory : beverageCategory // ignore: cast_nullable_to_non_nullable
as String?,foodCategory: freezed == foodCategory ? _self.foodCategory : foodCategory // ignore: cast_nullable_to_non_nullable
as String?,size: null == size ? _self.size : size // ignore: cast_nullable_to_non_nullable
as String,saleUnit: null == saleUnit ? _self.saleUnit : saleUnit // ignore: cast_nullable_to_non_nullable
as String,active: null == active ? _self.active : active // ignore: cast_nullable_to_non_nullable
as bool,vendable: null == vendable ? _self.vendable : vendable // ignore: cast_nullable_to_non_nullable
as bool,prices: null == prices ? _self._prices : prices // ignore: cast_nullable_to_non_nullable
as List<ProductPrice>,priceUsd: freezed == priceUsd ? _self.priceUsd : priceUsd // ignore: cast_nullable_to_non_nullable
as double?,priceCdf: freezed == priceCdf ? _self.priceCdf : priceCdf // ignore: cast_nullable_to_non_nullable
as double?,stockItems: null == stockItems ? _self._stockItems : stockItems // ignore: cast_nullable_to_non_nullable
as List<StockItem>,
  ));
}


}


/// @nodoc
mixin _$ProductPrice {

 String get id; String get spaceId;@JsonKey(fromJson: toDouble) double get priceUsd;@JsonKey(fromJson: toDouble) double get priceCdf; String get forUnit;
/// Create a copy of ProductPrice
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProductPriceCopyWith<ProductPrice> get copyWith => _$ProductPriceCopyWithImpl<ProductPrice>(this as ProductPrice, _$identity);

  /// Serializes this ProductPrice to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProductPrice&&(identical(other.id, id) || other.id == id)&&(identical(other.spaceId, spaceId) || other.spaceId == spaceId)&&(identical(other.priceUsd, priceUsd) || other.priceUsd == priceUsd)&&(identical(other.priceCdf, priceCdf) || other.priceCdf == priceCdf)&&(identical(other.forUnit, forUnit) || other.forUnit == forUnit));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,spaceId,priceUsd,priceCdf,forUnit);

@override
String toString() {
  return 'ProductPrice(id: $id, spaceId: $spaceId, priceUsd: $priceUsd, priceCdf: $priceCdf, forUnit: $forUnit)';
}


}

/// @nodoc
abstract mixin class $ProductPriceCopyWith<$Res>  {
  factory $ProductPriceCopyWith(ProductPrice value, $Res Function(ProductPrice) _then) = _$ProductPriceCopyWithImpl;
@useResult
$Res call({
 String id, String spaceId,@JsonKey(fromJson: toDouble) double priceUsd,@JsonKey(fromJson: toDouble) double priceCdf, String forUnit
});




}
/// @nodoc
class _$ProductPriceCopyWithImpl<$Res>
    implements $ProductPriceCopyWith<$Res> {
  _$ProductPriceCopyWithImpl(this._self, this._then);

  final ProductPrice _self;
  final $Res Function(ProductPrice) _then;

/// Create a copy of ProductPrice
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? spaceId = null,Object? priceUsd = null,Object? priceCdf = null,Object? forUnit = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,spaceId: null == spaceId ? _self.spaceId : spaceId // ignore: cast_nullable_to_non_nullable
as String,priceUsd: null == priceUsd ? _self.priceUsd : priceUsd // ignore: cast_nullable_to_non_nullable
as double,priceCdf: null == priceCdf ? _self.priceCdf : priceCdf // ignore: cast_nullable_to_non_nullable
as double,forUnit: null == forUnit ? _self.forUnit : forUnit // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ProductPrice].
extension ProductPricePatterns on ProductPrice {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProductPrice value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProductPrice() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProductPrice value)  $default,){
final _that = this;
switch (_that) {
case _ProductPrice():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProductPrice value)?  $default,){
final _that = this;
switch (_that) {
case _ProductPrice() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String spaceId, @JsonKey(fromJson: toDouble)  double priceUsd, @JsonKey(fromJson: toDouble)  double priceCdf,  String forUnit)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProductPrice() when $default != null:
return $default(_that.id,_that.spaceId,_that.priceUsd,_that.priceCdf,_that.forUnit);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String spaceId, @JsonKey(fromJson: toDouble)  double priceUsd, @JsonKey(fromJson: toDouble)  double priceCdf,  String forUnit)  $default,) {final _that = this;
switch (_that) {
case _ProductPrice():
return $default(_that.id,_that.spaceId,_that.priceUsd,_that.priceCdf,_that.forUnit);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String spaceId, @JsonKey(fromJson: toDouble)  double priceUsd, @JsonKey(fromJson: toDouble)  double priceCdf,  String forUnit)?  $default,) {final _that = this;
switch (_that) {
case _ProductPrice() when $default != null:
return $default(_that.id,_that.spaceId,_that.priceUsd,_that.priceCdf,_that.forUnit);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProductPrice implements ProductPrice {
  const _ProductPrice({required this.id, required this.spaceId, @JsonKey(fromJson: toDouble) required this.priceUsd, @JsonKey(fromJson: toDouble) required this.priceCdf, this.forUnit = 'BOTTLE'});
  factory _ProductPrice.fromJson(Map<String, dynamic> json) => _$ProductPriceFromJson(json);

@override final  String id;
@override final  String spaceId;
@override@JsonKey(fromJson: toDouble) final  double priceUsd;
@override@JsonKey(fromJson: toDouble) final  double priceCdf;
@override@JsonKey() final  String forUnit;

/// Create a copy of ProductPrice
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProductPriceCopyWith<_ProductPrice> get copyWith => __$ProductPriceCopyWithImpl<_ProductPrice>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProductPriceToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProductPrice&&(identical(other.id, id) || other.id == id)&&(identical(other.spaceId, spaceId) || other.spaceId == spaceId)&&(identical(other.priceUsd, priceUsd) || other.priceUsd == priceUsd)&&(identical(other.priceCdf, priceCdf) || other.priceCdf == priceCdf)&&(identical(other.forUnit, forUnit) || other.forUnit == forUnit));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,spaceId,priceUsd,priceCdf,forUnit);

@override
String toString() {
  return 'ProductPrice(id: $id, spaceId: $spaceId, priceUsd: $priceUsd, priceCdf: $priceCdf, forUnit: $forUnit)';
}


}

/// @nodoc
abstract mixin class _$ProductPriceCopyWith<$Res> implements $ProductPriceCopyWith<$Res> {
  factory _$ProductPriceCopyWith(_ProductPrice value, $Res Function(_ProductPrice) _then) = __$ProductPriceCopyWithImpl;
@override @useResult
$Res call({
 String id, String spaceId,@JsonKey(fromJson: toDouble) double priceUsd,@JsonKey(fromJson: toDouble) double priceCdf, String forUnit
});




}
/// @nodoc
class __$ProductPriceCopyWithImpl<$Res>
    implements _$ProductPriceCopyWith<$Res> {
  __$ProductPriceCopyWithImpl(this._self, this._then);

  final _ProductPrice _self;
  final $Res Function(_ProductPrice) _then;

/// Create a copy of ProductPrice
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? spaceId = null,Object? priceUsd = null,Object? priceCdf = null,Object? forUnit = null,}) {
  return _then(_ProductPrice(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,spaceId: null == spaceId ? _self.spaceId : spaceId // ignore: cast_nullable_to_non_nullable
as String,priceUsd: null == priceUsd ? _self.priceUsd : priceUsd // ignore: cast_nullable_to_non_nullable
as double,priceCdf: null == priceCdf ? _self.priceCdf : priceCdf // ignore: cast_nullable_to_non_nullable
as double,forUnit: null == forUnit ? _self.forUnit : forUnit // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$StockItem {

 String get location;@JsonKey(fromJson: toDouble) double get quantity;
/// Create a copy of StockItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StockItemCopyWith<StockItem> get copyWith => _$StockItemCopyWithImpl<StockItem>(this as StockItem, _$identity);

  /// Serializes this StockItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StockItem&&(identical(other.location, location) || other.location == location)&&(identical(other.quantity, quantity) || other.quantity == quantity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,location,quantity);

@override
String toString() {
  return 'StockItem(location: $location, quantity: $quantity)';
}


}

/// @nodoc
abstract mixin class $StockItemCopyWith<$Res>  {
  factory $StockItemCopyWith(StockItem value, $Res Function(StockItem) _then) = _$StockItemCopyWithImpl;
@useResult
$Res call({
 String location,@JsonKey(fromJson: toDouble) double quantity
});




}
/// @nodoc
class _$StockItemCopyWithImpl<$Res>
    implements $StockItemCopyWith<$Res> {
  _$StockItemCopyWithImpl(this._self, this._then);

  final StockItem _self;
  final $Res Function(StockItem) _then;

/// Create a copy of StockItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? location = null,Object? quantity = null,}) {
  return _then(_self.copyWith(
location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [StockItem].
extension StockItemPatterns on StockItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StockItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StockItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StockItem value)  $default,){
final _that = this;
switch (_that) {
case _StockItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StockItem value)?  $default,){
final _that = this;
switch (_that) {
case _StockItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String location, @JsonKey(fromJson: toDouble)  double quantity)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StockItem() when $default != null:
return $default(_that.location,_that.quantity);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String location, @JsonKey(fromJson: toDouble)  double quantity)  $default,) {final _that = this;
switch (_that) {
case _StockItem():
return $default(_that.location,_that.quantity);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String location, @JsonKey(fromJson: toDouble)  double quantity)?  $default,) {final _that = this;
switch (_that) {
case _StockItem() when $default != null:
return $default(_that.location,_that.quantity);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StockItem implements StockItem {
  const _StockItem({required this.location, @JsonKey(fromJson: toDouble) required this.quantity});
  factory _StockItem.fromJson(Map<String, dynamic> json) => _$StockItemFromJson(json);

@override final  String location;
@override@JsonKey(fromJson: toDouble) final  double quantity;

/// Create a copy of StockItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StockItemCopyWith<_StockItem> get copyWith => __$StockItemCopyWithImpl<_StockItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StockItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _StockItem&&(identical(other.location, location) || other.location == location)&&(identical(other.quantity, quantity) || other.quantity == quantity));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,location,quantity);

@override
String toString() {
  return 'StockItem(location: $location, quantity: $quantity)';
}


}

/// @nodoc
abstract mixin class _$StockItemCopyWith<$Res> implements $StockItemCopyWith<$Res> {
  factory _$StockItemCopyWith(_StockItem value, $Res Function(_StockItem) _then) = __$StockItemCopyWithImpl;
@override @useResult
$Res call({
 String location,@JsonKey(fromJson: toDouble) double quantity
});




}
/// @nodoc
class __$StockItemCopyWithImpl<$Res>
    implements _$StockItemCopyWith<$Res> {
  __$StockItemCopyWithImpl(this._self, this._then);

  final _StockItem _self;
  final $Res Function(_StockItem) _then;

/// Create a copy of StockItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? location = null,Object? quantity = null,}) {
  return _then(_StockItem(
location: null == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}

// dart format on
