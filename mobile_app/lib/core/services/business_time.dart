/// Mellia runs on Kinshasa time (UTC+1, no daylight saving), whatever time zone the
/// terminal is set to: a Sunmi left on another zone must not shift receipts or the day.
const kinshasaOffset = Duration(hours: 1);

/// Kinshasa wall-clock time of [d], ready for DateFormat (fields are Kinshasa's).
DateTime toKinshasa(DateTime d) => d.toUtc().add(kinshasaOffset);

/// Parses a server timestamp and returns it in Kinshasa time (now if missing).
DateTime kinshasaFrom(Object? iso) {
  final d = DateTime.tryParse(iso?.toString() ?? '');
  return toKinshasa(d ?? DateTime.now());
}

DateTime nowKinshasa() => toKinshasa(DateTime.now());

/// The Kinshasa calendar day [day] (only its date is used) as a [start, end] instant range.
(DateTime, DateTime) kinshasaDayBounds(DateTime day) {
  final start = DateTime.utc(
    day.year,
    day.month,
    day.day,
  ).subtract(kinshasaOffset);
  return (
    start,
    start
        .add(const Duration(days: 1))
        .subtract(const Duration(milliseconds: 1)),
  );
}
