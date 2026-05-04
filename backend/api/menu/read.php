<?php
/** GET /api/menu — Get all menu items grouped by category */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/MenuItem.php';
require_once __DIR__ . '/../../utils/response.php';

$db = (new Database())->getConnection();
$menuItem = new MenuItem($db);

$categoryId = $_GET['category_id'] ?? null;

if ($categoryId) {
    $items = $menuItem->getAll($categoryId);
    sendSuccess($items);
} else {
    $grouped = $menuItem->getAllGrouped();
    sendSuccess(['categories' => $grouped]);
}
