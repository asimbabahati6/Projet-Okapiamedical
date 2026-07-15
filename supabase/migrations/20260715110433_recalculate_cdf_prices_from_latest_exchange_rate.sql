/*
# Recalculate CDF prices for medical acts

1. Changes
  - Updates all medical_acts_pricing rows where price_cdf = 0 and price_usd > 0
  - Uses the most recent exchange rate from exchange_rates table
  - Sets price_cdf = ROUND(price_usd * usd_to_cdf)

2. Important Notes
  - Only affects acts with price_cdf = 0 (does not overwrite manually set CDF prices)
  - Uses the latest exchange rate regardless of is_active status
*/

UPDATE medical_acts_pricing
SET price_cdf = ROUND(price_usd * (
  SELECT usd_to_cdf FROM exchange_rates ORDER BY rate_date DESC LIMIT 1
))
WHERE price_usd > 0
  AND (price_cdf IS NULL OR price_cdf = 0)
  AND EXISTS (SELECT 1 FROM exchange_rates);
