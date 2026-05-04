<?php
/** POST /api/categories — Create category (Admin only) */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/Category.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validator.php';

requireAuth(['admin']);

$data = getRequestBody();
$validator = new Validator($data);
$validator->required('name', 'Category name')->validate();

$db = (new Database())->getConnection();
$category = new Category($db);
$id = $category->create($data);

sendSuccess(['id' => $id], 'Category created successfully', 201);
