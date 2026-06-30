#!/bin/sh
# Tests for the BusyBox branch of date_add_days/date_add_months/date_add_years/
# is_valid_date, plus detect_date_flavor's 3-way fallthrough.
#
# The BusyBox branch only uses the GNU-compatible `date -u -d "@N"` /
# `date -u -d "YYYY-MM-DD"` subset, so forcing DATE_FLAVOR=busybox and calling
# the helpers directly exercises the real arithmetic even under this
# environment's GNU `date` - no real BusyBox binary required.

set -eu

cd "$(dirname "$0")/.."
. tests/helpers.sh
setup_sandbox

HEADWAY_LIB_ONLY=true
. ./headway.sh

# --- date_add_days, forced busybox flavor -----------------------------------

DATE_FLAVOR=busybox

assert_eq "2026-01-16" "$(date_add_days "2026-01-15" 1)" "busybox days: positive offset"
assert_eq "2026-01-14" "$(date_add_days "2026-01-15" -1)" "busybox days: negative offset"
assert_eq "2026-02-01" "$(date_add_days "2026-01-31" 1)" "busybox days: month boundary"
assert_eq "2027-01-01" "$(date_add_days "2026-12-31" 1)" "busybox days: year boundary"

# --- date_add_months, forced busybox flavor ----------------------------------

assert_eq "2026-09-15" "$(date_add_months "2026-01-15" 8)" "busybox months: leading-zero month, crosses to double-digit"
assert_eq "2027-01-15" "$(date_add_months "2026-09-15" 4)" "busybox months: crosses year boundary forward"
assert_eq "2025-11-15" "$(date_add_months "2026-01-15" -2)" "busybox months: negative offset wraps to prior year"
assert_eq "2026-01-15" "$(date_add_months "2026-01-15" 0)" "busybox months: zero offset"

# --- date_add_years, forced busybox flavor -----------------------------------

assert_eq "2027-03-05" "$(date_add_years "2026-03-05" 1)" "busybox years: leading-zero month/day base, positive offset"
assert_eq "2025-03-05" "$(date_add_years "2026-03-05" -1)" "busybox years: negative offset"

# --- is_valid_date, forced busybox flavor ------------------------------------

if is_valid_date "2026-03-05"; then
	pass
else
	fail "busybox is_valid_date: expected 2026-03-05 to be valid"
fi

if is_valid_date "not-a-date"; then
	fail "busybox is_valid_date: expected not-a-date to be invalid"
else
	pass
fi

# --- detect_date_flavor fallthrough to busybox -------------------------------
# A fake `date` shim that rejects GNU's "-d 1 day" and BSD's "-v+1d" probes
# but delegates everything else to the real `date`, proving the 3-way
# fallthrough in detect_date_flavor lands on "busybox" when neither earlier
# probe matches.

FAKE_DATE_DIR="$SANDBOX/fakebin"
mkdir -p "$FAKE_DATE_DIR"
cat >"$FAKE_DATE_DIR/date" <<'EOF'
#!/bin/sh
case "$*" in
"-d 1 day "*) exit 1 ;;
"-v+1d "*) exit 1 ;;
esac
exec /usr/bin/date "$@"
EOF
chmod +x "$FAKE_DATE_DIR/date"

PATH="$FAKE_DATE_DIR:$PATH"
DATE_FLAVOR=""
detect_date_flavor
assert_eq "busybox" "$DATE_FLAVOR" "detect_date_flavor: falls through to busybox when GNU/BSD probes fail"

teardown_sandbox
report_and_exit
