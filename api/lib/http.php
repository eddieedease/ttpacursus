<?php

declare(strict_types=1);

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400): never
{
    json_response(['error' => $message], $status);
}

function read_json(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw !== false ? $raw : 'null', true);

    return is_array($data) ? $data : [];
}
