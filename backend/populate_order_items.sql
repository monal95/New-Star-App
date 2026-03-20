-- Populate order_items table with item quantities from orders
DELETE FROM order_items;

INSERT INTO order_items (order_id, item_type, total_qty, createdAt, updatedAt)
SELECT id, 'Shirt', COALESCE(noOfSets, 1), datetime('now'), datetime('now')
FROM orders;

INSERT INTO order_items (order_id, item_type, total_qty, createdAt, updatedAt)
SELECT id, 'Pant', COALESCE(noOfSets, 1), datetime('now'), datetime('now')
FROM orders;

INSERT INTO order_items (order_id, item_type, total_qty, createdAt, updatedAt)
SELECT id, 'Ironing', COALESCE(noOfSets, 1), datetime('now'), datetime('now')
FROM orders;

INSERT INTO order_items (order_id, item_type, total_qty, createdAt, updatedAt)
SELECT id, 'Embroidery', COALESCE(noOfSets, 1), datetime('now'), datetime('now')
FROM orders;

-- Verify data was inserted
SELECT 'Order items populated successfully. Current counts:' as status;
SELECT item_type, COUNT(*) as count FROM order_items GROUP BY item_type;
