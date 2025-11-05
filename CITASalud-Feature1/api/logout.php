<?php
// Asegúrate de que este script no devuelva NADA antes de llamar a session_start()
session_start();

// 1. Destruir TODAS las variables de sesión
$_SESSION = array();

// 2. Destruir la cookie de sesión (opcional pero recomendado)
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 3. Finalmente, destruir la sesión
session_destroy();

// 4. Devolver una respuesta exitosa (aunque no se use en JS, es buena práctica)
http_response_code(200);
echo json_encode(["message" => "Sesión cerrada correctamente"]);
exit;
?>