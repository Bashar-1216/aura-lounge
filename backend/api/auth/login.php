<?php
/** POST /api/auth/login — Authenticate user and return JWT */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validator.php';

$data = getRequestBody();

$validator = new Validator($data);
$validator->required('email', 'Email')
          ->email('email', 'Email')
          ->required('password', 'Password')
          ->validate();

$db = (new Database())->getConnection();
$userModel = new User($db);

$user = $userModel->authenticate($data['email'], $data['password']);
if (!$user) {
    sendError('Invalid email or password', 401);
}

$token = generateToken($user['id'], $user['email'], $user['role']);

sendSuccess([
    'token' => $token,
    'user'  => $user
], 'Login successful');
