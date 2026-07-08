<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

header('Content-Type: application/json');

$response = [
    'status' => 'ok',
    'php' => PHP_VERSION,
    'database' => 'unavailable',
];

try {
    db()->query('SELECT 1');
    $response['database'] = 'connected';
} catch (PDOException $e) {
    http_response_code(503);
    $response['status'] = 'degraded';
}

echo json_encode($response);
