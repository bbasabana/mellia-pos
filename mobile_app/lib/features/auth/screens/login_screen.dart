import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mellia_pos_mobile/core/constants/app_assets.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';
import 'package:mellia_pos_mobile/features/auth/providers/auth_provider.dart';
import 'package:mellia_pos_mobile/shared/widgets/custom_text_field.dart';
import 'package:mellia_pos_mobile/shared/widgets/motion.dart';
import 'package:mellia_pos_mobile/shared/widgets/primary_button.dart';

/// One centred form on a light grey canvas, the logo and the slogan above it (same as the web).
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (_formKey.currentState!.validate()) {
      await ref
          .read(authNotifierProvider.notifier)
          .login(_emailController.text.trim(), _passwordController.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authNotifierProvider, (previous, next) {
      if (next is AsyncError) {
        setState(
          () => _error = next.error.toString().replaceFirst('Exception: ', ''),
        );
      }
    });

    final isLoading = ref.watch(authNotifierProvider) is AsyncLoading;

    return Scaffold(
      backgroundColor: AppTheme.canvas,
      body: Stack(
        children: [
          // Soft halos in the logo colours
          const Positioned(
            left: -120,
            top: -100,
            child: _Halo(color: AppTheme.cyan, size: 320, alpha: 0.16),
          ),
          const Positioned(
            right: -110,
            top: 220,
            child: _Halo(color: AppTheme.lime, size: 280, alpha: 0.14),
          ),
          const Positioned(
            left: 40,
            bottom: -140,
            child: _Halo(color: AppTheme.brandOrange, size: 300, alpha: 0.09),
          ),
          SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 22,
                        vertical: 24,
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 420),
                        child: Column(
                          children: [
                            FadeSlideIn(
                              child: Image.asset(AppAssets.logo, height: 76),
                            ),
                            const SizedBox(height: 16),
                            FadeSlideIn(
                              index: 1,
                              child: Column(
                                children: [
                                  const Text(
                                    'Mangez comme chez vous,',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF232B38),
                                    ),
                                  ),
                                  ShimmerText(
                                    'gérez comme un pro.',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 26),
                            FadeSlideIn(
                              index: 3,
                              offset: 20,
                              child: SoftCard(
                                padding: const EdgeInsets.fromLTRB(
                                  22,
                                  24,
                                  22,
                                  22,
                                ),
                                radius: 22,
                                child: Form(
                                  key: _formKey,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      const Text(
                                        'Connexion',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      const Text(
                                        'Connectez-vous pour ouvrir la caisse.',
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          color: AppTheme.muted,
                                        ),
                                      ),
                                      AnimatedSize(
                                        duration: AppTheme.medium,
                                        curve: AppTheme.curve,
                                        child: _error == null
                                            ? const SizedBox(height: 22)
                                            : Padding(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      vertical: 16,
                                                    ),
                                                child: Container(
                                                  padding: const EdgeInsets.all(
                                                    12,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFFFF1F1,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          12,
                                                        ),
                                                    border: Border.all(
                                                      color: const Color(
                                                        0xFFFFD9D9,
                                                      ),
                                                    ),
                                                  ),
                                                  child: Row(
                                                    children: [
                                                      const Icon(
                                                        Icons
                                                            .error_outline_rounded,
                                                        color: AppTheme.error,
                                                        size: 20,
                                                      ),
                                                      const SizedBox(width: 10),
                                                      Expanded(
                                                        child: Text(
                                                          _error!,
                                                          style:
                                                              const TextStyle(
                                                                color: Color(
                                                                  0xFFB4232A,
                                                                ),
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                                fontSize: 13.5,
                                                              ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                      ),
                                      CustomTextField(
                                        label: 'Email',
                                        hint: 'votre@email.com',
                                        controller: _emailController,
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        prefixIcon:
                                            Icons.alternate_email_rounded,
                                        validator: (v) =>
                                            (v == null || v.isEmpty)
                                            ? 'Email requis'
                                            : null,
                                      ),
                                      const SizedBox(height: 16),
                                      CustomTextField(
                                        label: 'Mot de passe',
                                        hint: '••••••••',
                                        controller: _passwordController,
                                        isPassword: _obscurePassword,
                                        prefixIcon: Icons.lock_outline_rounded,
                                        suffixIcon: IconButton(
                                          icon: Icon(
                                            _obscurePassword
                                                ? Icons.visibility_off_outlined
                                                : Icons.visibility_outlined,
                                            color: AppTheme.subtle,
                                          ),
                                          onPressed: () => setState(
                                            () => _obscurePassword =
                                                !_obscurePassword,
                                          ),
                                        ),
                                        validator: (v) =>
                                            (v == null || v.isEmpty)
                                            ? 'Mot de passe requis'
                                            : null,
                                      ),
                                      const SizedBox(height: 24),
                                      PrimaryButton(
                                        text: 'Se connecter',
                                        onPressed: _handleLogin,
                                        isLoading: isLoading,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                // Grey footer
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 12,
                    horizontal: 16,
                  ),
                  decoration: const BoxDecoration(
                    color: Color(0xFFE3E8EE),
                    border: Border(top: BorderSide(color: Color(0xFFD5DCE4))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (final c in const [
                        AppTheme.cyan,
                        AppTheme.lime,
                        AppTheme.brandOrange,
                      ])
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(right: 4),
                          decoration: BoxDecoration(
                            color: c,
                            shape: BoxShape.circle,
                          ),
                        ),
                      const SizedBox(width: 6),
                      Text(
                        '© ${DateTime.now().year} Mellia Restaurant Rapide · Kinshasa',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppTheme.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Halo extends StatelessWidget {
  final Color color;
  final double size;
  final double alpha;

  const _Halo({required this.color, required this.size, required this.alpha});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: alpha),
              color.withValues(alpha: 0),
            ],
          ),
        ),
      ),
    );
  }
}
