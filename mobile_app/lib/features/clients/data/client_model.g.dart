// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'client_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Client _$ClientFromJson(Map<String, dynamic> json) => _Client(
  id: json['id'] as String,
  name: json['name'] as String,
  phone: json['phone'] as String?,
  email: json['email'] as String?,
  points: (json['points'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$ClientToJson(_Client instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'phone': instance.phone,
  'email': instance.email,
  'points': instance.points,
};
