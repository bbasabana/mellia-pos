// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'drafts_provider.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$DraftOrder {

 String get id; String get ticketNum; DateTime get createdAt; Map<String, dynamic> get rawData;
/// Create a copy of DraftOrder
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DraftOrderCopyWith<DraftOrder> get copyWith => _$DraftOrderCopyWithImpl<DraftOrder>(this as DraftOrder, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DraftOrder&&(identical(other.id, id) || other.id == id)&&(identical(other.ticketNum, ticketNum) || other.ticketNum == ticketNum)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&const DeepCollectionEquality().equals(other.rawData, rawData));
}


@override
int get hashCode => Object.hash(runtimeType,id,ticketNum,createdAt,const DeepCollectionEquality().hash(rawData));

@override
String toString() {
  return 'DraftOrder(id: $id, ticketNum: $ticketNum, createdAt: $createdAt, rawData: $rawData)';
}


}

/// @nodoc
abstract mixin class $DraftOrderCopyWith<$Res>  {
  factory $DraftOrderCopyWith(DraftOrder value, $Res Function(DraftOrder) _then) = _$DraftOrderCopyWithImpl;
@useResult
$Res call({
 String id, String ticketNum, DateTime createdAt, Map<String, dynamic> rawData
});




}
/// @nodoc
class _$DraftOrderCopyWithImpl<$Res>
    implements $DraftOrderCopyWith<$Res> {
  _$DraftOrderCopyWithImpl(this._self, this._then);

  final DraftOrder _self;
  final $Res Function(DraftOrder) _then;

/// Create a copy of DraftOrder
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? ticketNum = null,Object? createdAt = null,Object? rawData = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,ticketNum: null == ticketNum ? _self.ticketNum : ticketNum // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,rawData: null == rawData ? _self.rawData : rawData // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,
  ));
}

}


/// Adds pattern-matching-related methods to [DraftOrder].
extension DraftOrderPatterns on DraftOrder {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DraftOrder value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DraftOrder() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DraftOrder value)  $default,){
final _that = this;
switch (_that) {
case _DraftOrder():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DraftOrder value)?  $default,){
final _that = this;
switch (_that) {
case _DraftOrder() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String ticketNum,  DateTime createdAt,  Map<String, dynamic> rawData)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DraftOrder() when $default != null:
return $default(_that.id,_that.ticketNum,_that.createdAt,_that.rawData);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String ticketNum,  DateTime createdAt,  Map<String, dynamic> rawData)  $default,) {final _that = this;
switch (_that) {
case _DraftOrder():
return $default(_that.id,_that.ticketNum,_that.createdAt,_that.rawData);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String ticketNum,  DateTime createdAt,  Map<String, dynamic> rawData)?  $default,) {final _that = this;
switch (_that) {
case _DraftOrder() when $default != null:
return $default(_that.id,_that.ticketNum,_that.createdAt,_that.rawData);case _:
  return null;

}
}

}

/// @nodoc


class _DraftOrder implements DraftOrder {
  const _DraftOrder({required this.id, required this.ticketNum, required this.createdAt, required final  Map<String, dynamic> rawData}): _rawData = rawData;
  

@override final  String id;
@override final  String ticketNum;
@override final  DateTime createdAt;
 final  Map<String, dynamic> _rawData;
@override Map<String, dynamic> get rawData {
  if (_rawData is EqualUnmodifiableMapView) return _rawData;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_rawData);
}


/// Create a copy of DraftOrder
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DraftOrderCopyWith<_DraftOrder> get copyWith => __$DraftOrderCopyWithImpl<_DraftOrder>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DraftOrder&&(identical(other.id, id) || other.id == id)&&(identical(other.ticketNum, ticketNum) || other.ticketNum == ticketNum)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&const DeepCollectionEquality().equals(other._rawData, _rawData));
}


@override
int get hashCode => Object.hash(runtimeType,id,ticketNum,createdAt,const DeepCollectionEquality().hash(_rawData));

@override
String toString() {
  return 'DraftOrder(id: $id, ticketNum: $ticketNum, createdAt: $createdAt, rawData: $rawData)';
}


}

/// @nodoc
abstract mixin class _$DraftOrderCopyWith<$Res> implements $DraftOrderCopyWith<$Res> {
  factory _$DraftOrderCopyWith(_DraftOrder value, $Res Function(_DraftOrder) _then) = __$DraftOrderCopyWithImpl;
@override @useResult
$Res call({
 String id, String ticketNum, DateTime createdAt, Map<String, dynamic> rawData
});




}
/// @nodoc
class __$DraftOrderCopyWithImpl<$Res>
    implements _$DraftOrderCopyWith<$Res> {
  __$DraftOrderCopyWithImpl(this._self, this._then);

  final _DraftOrder _self;
  final $Res Function(_DraftOrder) _then;

/// Create a copy of DraftOrder
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? ticketNum = null,Object? createdAt = null,Object? rawData = null,}) {
  return _then(_DraftOrder(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,ticketNum: null == ticketNum ? _self.ticketNum : ticketNum // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,rawData: null == rawData ? _self._rawData : rawData // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,
  ));
}


}

// dart format on
