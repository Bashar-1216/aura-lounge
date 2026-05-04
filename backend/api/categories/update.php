<?php
/** PUT /api/categories/{id} — Update category (Admin only) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Category.php';
require_once __DIR__ . '/../../utils/response.php';

requireAuth(['admin']);

$id = $_GET['id'] ?? null;
if (!$id) sendError('Category ID is required', 400);

$data = getRequestBody();
if (empty($data)) sendError('No data provided', 400);

$db = (new Database())->getConnection();
$category = new Category($db);

$existing = $category->getById($id);
if (!$existing) sendNotFound('Category not found');

$category->update($id, $data);
sendSuccess($category->getById($id), 'Category updated successfully');
