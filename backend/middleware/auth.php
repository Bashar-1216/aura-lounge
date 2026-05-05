<?php
/**
 * JWT Authentication Middleware
 * Simple JWT implementation without external dependencies
 */

define('JWT_SECRET', 'aura_lounge_secret_key_2024_change_in_production');
define('JWT_EXPIRY', 86400); // 24 hours

/**
 * Generate a JWT token
 */
function generateToken($userId, $email, $role) {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode([
        'user_id' => $userId,
        'email'   => $email,
        'role'    => $role,
        'iat'     => time(),
        'exp'     => time() + JWT_EXPIRY
    ]));
    $signature = base64UrlEncode(
        hash_hmac('sha256', "{$header}.{$payload}", JWT_SECRET, true)
    );
    return "{$header}.{$payload}.{$signature}";
}

/**
 * Verify and decode a JWT token
 */
function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    list($header, $payload, $signature) = $parts;

    // Verify signature
    $expectedSig = base64UrlEncode(
        hash_hmac('sha256', "{$header}.{$payload}", JWT_SECRET, true)
    );

    if (!hash_equals($expectedSig, $signature)) {
        return null;
    }

    // Decode payload
    $decoded = json_decode(base64UrlDecode($payload), true);

    // Check expiry
    if (isset($decoded['exp']) && $decoded['exp'] < time()) {
        return null;
    }

    return $decoded;
}

/**
 * Middleware: Require authentication
 * Call this at the top of protected endpoints
 */
function requireAuth($allowedRoles = ['admin', 'kitchen']) {
    require_once __DIR__ . '/../utils/response.php';

    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        sendUnauthorized('No token provided');
    }

    $token = substr($authHeader, 7);
    $decoded = verifyToken($token);

    if (!$decoded) {
        sendUnauthorized('Invalid or expired token');
    }

    if (!in_array($decoded['role'], $allowedRoles)) {
        sendError('Insufficient permissions', 403);
    }

    return $decoded;
}

/**
 * Base64 URL-safe encoding
 */
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL-safe decoding
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}
