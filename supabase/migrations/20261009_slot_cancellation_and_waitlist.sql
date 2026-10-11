-- =====================================================================
-- KISAN MITRA MIGRATION: SLOT CANCELLATION & WAITLIST / QUEUE REASSIGNMENT
-- =====================================================================

-- 1. Modify slot_bookings status constraint to include 'waitlisted'
ALTER TABLE slot_bookings DROP CONSTRAINT IF EXISTS slot_bookings_status_check;
ALTER TABLE slot_bookings 
  ADD CONSTRAINT slot_bookings_status_check 
  CHECK (status IN ('waiting', 'active', 'completed', 'no-show', 'cancelled', 'waitlisted'));

-- 2. Add queue/waitlist and cancellation tracking columns
ALTER TABLE slot_bookings 
  ADD COLUMN IF NOT EXISTS waitlist_position INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Composite Index for fast waitlist promotion queries
CREATE INDEX IF NOT EXISTS idx_slot_bookings_waitlist 
  ON slot_bookings (mandi_id, booking_date, slot_start_time, status, created_at);

-- 4. Function: Promote the next waitlisted farmer when a slot is freed
CREATE OR REPLACE FUNCTION promote_next_waitlisted_farmer(
  p_mandi_id UUID,
  p_booking_date DATE,
  p_slot_start_time TIME
)
RETURNS UUID AS $$
DECLARE
  v_promoted_id UUID;
BEGIN
  -- Select the earliest waitlisted farmer for this exact mandi, date, and 30-min window
  SELECT id INTO v_promoted_id
  FROM slot_bookings
  WHERE mandi_id = p_mandi_id
    AND booking_date = p_booking_date
    AND slot_start_time = p_slot_start_time
    AND status = 'waitlisted'
  ORDER BY waitlist_position ASC NULLS LAST, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_promoted_id IS NOT NULL THEN
    -- Promote the waitlisted farmer to confirmed 'waiting' status
    UPDATE slot_bookings
    SET status = 'waiting',
        waitlist_position = NULL
    WHERE id = v_promoted_id;
  END IF;

  RETURN v_promoted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger Handler: Auto-reassign slot whenever a booking is cancelled or marked no-show
CREATE OR REPLACE FUNCTION handle_slot_freed()
RETURNS TRIGGER AS $$
BEGIN
  -- When an active or waiting slot is vacated (by cancellation or no-show)
  IF (OLD.status IN ('waiting', 'active') AND NEW.status IN ('cancelled', 'no-show')) THEN
    PERFORM promote_next_waitlisted_farmer(NEW.mandi_id, NEW.booking_date, NEW.slot_start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reassign_freed_slot ON slot_bookings;
CREATE TRIGGER trigger_reassign_freed_slot
  AFTER UPDATE OF status ON slot_bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_slot_freed();

-- 6. RPC Function: Farmer Slot Cancellation (with strict 1-day advance notice rule)
CREATE OR REPLACE FUNCTION cancel_farmer_slot(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by farmer'
)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_promoted_id UUID;
BEGIN
  SELECT * INTO v_booking
  FROM slot_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found with ID %', p_booking_id;
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'This booking has already been cancelled.';
  END IF;

  IF v_booking.status IN ('completed', 'active') THEN
    RAISE EXCEPTION 'Active or completed slots cannot be cancelled.';
  END IF;

  -- 1-Day Rule: Must cancel strictly at least 1 day before the scheduled slot date
  IF v_booking.booking_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Cancellations are only allowed up to 1 day before the scheduled slot date. Cancellations on or after the slot date are locked to protect mandi gate operations.';
  END IF;

  -- Update booking to cancelled
  UPDATE slot_bookings
  SET status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_at = now()
  WHERE id = p_booking_id;

  -- Check and promote next waitlisted farmer
  v_promoted_id := promote_next_waitlisted_farmer(
    v_booking.mandi_id, 
    v_booking.booking_date, 
    v_booking.slot_start_time
  );

  RETURN jsonb_build_object(
    'success', true,
    'cancelled_booking_id', p_booking_id,
    'promoted_farmer_booking_id', v_promoted_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
