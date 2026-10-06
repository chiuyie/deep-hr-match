-- Unlock pricing is SGD (PayNow + card). Align DB default with app constants.
ALTER TABLE payments
  ALTER COLUMN currency SET DEFAULT 'sgd';
