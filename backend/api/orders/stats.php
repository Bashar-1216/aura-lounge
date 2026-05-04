<?php
/** GET /api/orders/stats — Get daily order statistics (Admin) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Order.php';
require_once __DIR__ . '/../../utils/response.php';

requireAuth(['admin']);

$db = (new Database())->getConnection();
$order = new Order($db);
$stats = $order->getDailyStats();

sendSuccess($stats);
