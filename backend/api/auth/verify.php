<?php
/** GET /api/auth/verify — Verify JWT token */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/response.php';

$decoded = requireAuth();

sendSuccess([
    'user_id' => $decoded['user_id'],
    'email'   => $decoded['email'],
    'role'    => $decoded['role']
], 'Token is valid');
