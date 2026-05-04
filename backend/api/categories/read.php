<?php
/** GET /api/categories — Get all categories */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Category.php';
require_once __DIR__ . '/../../utils/response.php';

$db = (new Database())->getConnection();
$category = new Category($db);

$activeOnly = !isset($_GET['all']);
$categories = $category->getAll($activeOnly);

sendSuccess($categories);
