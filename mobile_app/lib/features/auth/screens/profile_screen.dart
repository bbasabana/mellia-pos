import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mellia_pos_mobile/core/services/notification_service.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/auth/data/auth_repository.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/shared/widgets/custom_text_field.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';

const _roles = {
  'ADMIN': 'Administrateur',
  'MANAGER': 'Gérant',
  'CASHIER': 'Caissier',
  'KITCHEN': 'Cuisine',
};

/// « Mon profil »: the signed-in user edits their name, phone, email and password.
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _current = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  Map<String, dynamic>? _loaded;
  String? _loadError;
  bool _saving = false;
  bool _showPasswords = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _current, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loadError = null);
    try {
      final repo = await ref.read(authRepositoryProvider.future);
      final p = await repo.getProfile();
      if (!mounted) return;
      setState(() {
        _loaded = p;
        _name.text = p['name']?.toString() ?? '';
        _phone.text = p['phone']?.toString() ?? '';
        _email.text = p['email']?.toString() ?? '';
      });
    } catch (e) {
      if (mounted) {
        setState(
          () => _loadError = 'Profil indisponible, vérifiez la connexion',
        );
      }
    }
  }

  Future<void> _save() async {
    if (!(_form.currentState?.validate() ?? false)) return;
    final loaded = _loaded!;
    final data = <String, dynamic>{};
    final name = _name.text.trim();
    final phone = _phone.text.trim();
    final email = _email.text.trim().toLowerCase();
    if (name != (loaded['name'] ?? '')) data['name'] = name;
    if (phone != (loaded['phone'] ?? '')) data['phone'] = phone;
    if (email != (loaded['email'] ?? '')) data['email'] = email;
    if (_password.text.isNotEmpty) {
      data['currentPassword'] = _current.text;
      data['password'] = _password.text;
    }
    if (data.isEmpty) {
      NotificationService.showInfo(context, 'Aucune modification');
      return;
    }

    setState(() => _saving = true);
    try {
      final repo = await ref.read(authRepositoryProvider.future);
      final p = await repo.updateProfile(data);
      ref.read(authNotifierProvider.notifier).applyProfile(p);
      if (!mounted) return;
      setState(() {
        _loaded = p;
        _current.clear();
        _password.clear();
        _confirm.clear();
      });
      NotificationService.showSuccess(
        context,
        data.containsKey('password')
            ? 'Profil et mot de passe enregistrés'
            : 'Profil enregistré',
      );
    } catch (e) {
      if (mounted) {
        NotificationService.showError(
          context,
          e.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.canvas,
      appBar: AppBar(title: const Text('Mon profil')),
      body: _loaded == null
          ? Center(
              child: _loadError == null
                  ? const CircularProgressIndicator()
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_loadError!),
                        TextButton(
                          onPressed: _load,
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
            )
          : Form(
              key: _form,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                children: [
                  _identity(),
                  const SizedBox(height: 16),
                  SoftCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        CustomTextField(
                          label: 'Nom',
                          controller: _name,
                          prefixIcon: Icons.person_outline_rounded,
                          validator: (v) => (v ?? '').trim().length < 2
                              ? 'Au moins 2 caractères'
                              : null,
                        ),
                        const SizedBox(height: 14),
                        CustomTextField(
                          label: 'Téléphone',
                          hint: 'Ex : 0812345678',
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          prefixIcon: Icons.phone_outlined,
                          validator: (v) {
                            final t = (v ?? '').trim();
                            if (t.isEmpty) return null;
                            return RegExp(r'^\+?[0-9 ]{6,20}$').hasMatch(t)
                                ? null
                                : 'Numéro invalide';
                          },
                        ),
                        const SizedBox(height: 14),
                        CustomTextField(
                          label: 'Email (sert à se connecter)',
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          prefixIcon: Icons.alternate_email_rounded,
                          validator: (v) =>
                              RegExp(
                                r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                              ).hasMatch((v ?? '').trim())
                              ? null
                              : 'Email invalide',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SoftCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Text(
                                'Changer le mot de passe',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            IconButton(
                              tooltip: _showPasswords ? 'Masquer' : 'Afficher',
                              onPressed: () => setState(
                                () => _showPasswords = !_showPasswords,
                              ),
                              icon: Icon(
                                _showPasswords
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                              ),
                            ),
                          ],
                        ),
                        const Text(
                          'Laissez vide pour garder le mot de passe actuel.',
                          style: TextStyle(
                            color: AppTheme.muted,
                            fontSize: 12.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        CustomTextField(
                          label: 'Mot de passe actuel',
                          controller: _current,
                          isPassword: !_showPasswords,
                          prefixIcon: Icons.lock_outline_rounded,
                          validator: (v) =>
                              _password.text.isNotEmpty && (v ?? '').isEmpty
                              ? 'Requis pour changer le mot de passe'
                              : null,
                        ),
                        const SizedBox(height: 14),
                        CustomTextField(
                          label: 'Nouveau mot de passe',
                          controller: _password,
                          isPassword: !_showPasswords,
                          prefixIcon: Icons.lock_reset_rounded,
                          validator: (v) =>
                              (v ?? '').isNotEmpty && v!.length < 8
                              ? 'Au moins 8 caractères'
                              : null,
                        ),
                        const SizedBox(height: 14),
                        CustomTextField(
                          label: 'Confirmer le nouveau mot de passe',
                          controller: _confirm,
                          isPassword: !_showPasswords,
                          prefixIcon: Icons.lock_reset_rounded,
                          validator: (v) => (v ?? '') != _password.text
                              ? 'Les deux mots de passe ne correspondent pas'
                              : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: _saving ? null : _save,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.ink,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    icon: _saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.check_rounded),
                    label: const Text(
                      'Enregistrer',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _identity() {
    final name = _loaded?['name']?.toString() ?? '';
    final role = _loaded?['role']?.toString();
    return Row(
      children: [
        Container(
          width: 64,
          height: 64,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppTheme.cyan, AppTheme.cyanDark],
            ),
          ),
          child: Text(
            name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 28,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                _roles[role] ?? role ?? '',
                style: const TextStyle(color: AppTheme.muted, fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
