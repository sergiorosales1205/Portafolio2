<?php
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function responder(int $codigo, string $mensaje): void
{
    http_response_code($codigo);
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $codigo === 201, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    } else {
        header('Content-Type: text/html; charset=UTF-8');
        echo '<!doctype html><html lang="es"><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>Contactos | Portafolio</title><link rel="stylesheet" href="estilos.css">'
            . '<main class="wrap section"><h1>Contactos</h1><p class="intro">'
            . htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8')
            . '</p><a class="button" href="index.html#contactos">Volver al formulario</a></main></html>';
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, 'Envía tu mensaje desde el formulario de contactos.');
}

function campo(string $nombre): string
{
    $valor = $_POST[$nombre] ?? '';
    return is_string($valor) ? trim($valor) : '';
}

function longitudValida(string $valor, int $limite): bool
{
    return preg_match('/\A.{1,' . $limite . '}\z/us', $valor) === 1;
}

$nombre = campo('nombre');
$correo = campo('correo');
$mensaje = campo('mensaje');

if (campo('sitio') !== '') {
    responder(422, 'No se pudo validar el formulario.');
}
if (!longitudValida($nombre, 100)
    || strlen($correo) > 254
    || !filter_var($correo, FILTER_VALIDATE_EMAIL)
    || !longitudValida($mensaje, 2000)) {
    responder(422, 'Revisa el nombre, el correo y el mensaje antes de enviarlo.');
}

try {
    $ruta = __DIR__ . '/privado/config.php';
    if (!is_file($ruta)) {
        responder(503, 'El formulario todavía no está disponible.');
    }

    $config = require $ruta;
    $dsn = 'mysql:host=' . $config['host'] . ';dbname=' . $config['base'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $config['usuario'], $config['clave'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $insertar = $pdo->prepare(
        'INSERT INTO mensajes (nombre, correo, mensaje) VALUES (:nombre, :correo, :mensaje)'
    );
    $insertar->execute(['nombre' => $nombre, 'correo' => $correo, 'mensaje' => $mensaje]);
    responder(201, 'Tu mensaje se guardó correctamente. Gracias por escribirme.');
} catch (Throwable $error) {
    error_log('Portafolio: error al guardar un mensaje (' . get_class($error) . ').');
    responder(500, 'No se pudo guardar el mensaje. Inténtalo más tarde.');
}
