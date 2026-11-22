import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mellia_pos_mobile/core/theme/app_theme.dart';

/// Fades a widget in while sliding it up a few pixels. `index` staggers lists:
/// each item starts 40 ms after the previous one (capped, so long lists stay fast).
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration delay;
  final double offset;

  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.delay = Duration.zero,
    this.offset = 12,
  });

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: AppTheme.medium,
  );
  late final Animation<double> _t = CurvedAnimation(
    parent: _c,
    curve: AppTheme.curve,
  );

  @override
  void initState() {
    super.initState();
    final stagger = Duration(milliseconds: 40 * widget.index.clamp(0, 10));
    Future.delayed(widget.delay + stagger, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      child: widget.child,
      builder: (context, child) => Opacity(
        opacity: _t.value,
        child: Transform.translate(
          offset: Offset(0, widget.offset * (1 - _t.value)),
          child: child,
        ),
      ),
    );
  }
}

/// Shrinks slightly while pressed, like a button on macOS / iOS, with a light haptic tick.
class Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double scale;

  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.scale = 0.96,
  });

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null || widget.onLongPress != null;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: enabled ? (_) => _set(true) : null,
      onTapUp: enabled ? (_) => _set(false) : null,
      onTapCancel: enabled ? () => _set(false) : null,
      onTap: widget.onTap == null
          ? null
          : () {
              HapticFeedback.selectionClick();
              widget.onTap!();
            },
      onLongPress: widget.onLongPress,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: AppTheme.fast,
        curve: AppTheme.curve,
        child: AnimatedOpacity(
          opacity: _down ? 0.85 : 1,
          duration: AppTheme.fast,
          child: widget.child,
        ),
      ),
    );
  }
}

/// Text painted with a gradient of the three logo colours that slowly drifts.
class ShimmerText extends StatefulWidget {
  final String text;
  final TextStyle style;
  final TextAlign textAlign;

  const ShimmerText(
    this.text, {
    super.key,
    required this.style,
    this.textAlign = TextAlign.center,
  });

  @override
  State<ShimmerText> createState() => _ShimmerTextState();
}

class _ShimmerTextState extends State<ShimmerText>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 6),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, child) {
        final shift = Curves.easeInOut.transform(_c.value) * 2 - 1; // -1 .. 1
        return ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (rect) => LinearGradient(
            begin: Alignment(-1 - shift * 1.5, 0),
            end: Alignment(2 - shift * 1.5, 0),
            colors: const [
              Color(0xFF00B3DB),
              Color(0xFF5CBF00),
              AppTheme.brandOrange,
              Color(0xFF00B3DB),
            ],
          ).createShader(rect),
          child: child,
        );
      },
      child: Text(
        widget.text,
        style: widget.style,
        textAlign: widget.textAlign,
      ),
    );
  }
}

/// White rounded card with the soft shadow used everywhere.
class SoftCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color color;

  const SoftCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 18,
    this.color = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppTheme.line.withValues(alpha: 0.7)),
        boxShadow: AppTheme.softShadow,
      ),
      child: child,
    );
  }
}

/// Opens a bottom sheet / dialog content with the standard eased motion.
Future<T?> showSoftDialog<T>(
  BuildContext context, {
  required WidgetBuilder builder,
  bool dismissible = true,
}) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: dismissible,
    barrierLabel: 'Fermer',
    barrierColor: AppTheme.ink.withValues(alpha: 0.35),
    transitionDuration: AppTheme.medium,
    pageBuilder: (ctx, _, __) => builder(ctx),
    transitionBuilder: (ctx, anim, _, child) {
      final t = CurvedAnimation(
        parent: anim,
        curve: AppTheme.curve,
        reverseCurve: Curves.easeInCubic,
      );
      return FadeTransition(
        opacity: t,
        child: ScaleTransition(
          scale: Tween(begin: 0.94, end: 1.0).animate(t),
          child: child,
        ),
      );
    },
  );
}
