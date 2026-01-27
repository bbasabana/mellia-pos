// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_provider.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_UserState _$UserStateFromJson(Map<String, dynamic> json) => _UserState(
  id: json['id'] as String?,
  name: json['name'] as String?,
  email: json['email'] as String?,
  role: json['role'] as String?,
);

Map<String, dynamic> _$UserStateToJson(_UserState instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
    };

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$authNotifierHash() => r'4568c0c4f400452aba40d921cb79ba311e41e19f';

/// See also [AuthNotifier].
@ProviderFor(AuthNotifier)
final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, UserState?>.internal(
      AuthNotifier.new,
      name: r'authNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$authNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$AuthNotifier = AsyncNotifier<UserState?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
