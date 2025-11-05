document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const mensajeDiv = document.getElementById('mensaje');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtiene el valor del campo de entrada con el id 'id_paciente'
        const numeroDocumento = document.getElementById('id_paciente').value.trim();

        if (numeroDocumento === '') {
            mostrarMensaje('Por favor, ingrese su número de documento.', 'error');
            return;
        }

        mostrarMensaje('Iniciando sesión...', 'info');

        try {
            // Envía la solicitud al backend usando el parametro correcto 'numero_documento'
            const response = await fetch(`./../api/get_paciente.php?numero_documento=${numeroDocumento}`);
            const paciente = await response.json();

            if (response.ok) { // Status code 200 OK
                // Almacena el ID y nombre del paciente en sessionStorage
                sessionStorage.setItem('id_paciente', paciente.id_paciente);
                sessionStorage.setItem('nombre_paciente', `${paciente.nombre} ${paciente.apellido}`);
                
                // Redirige al usuario
                window.location.href = './../html/citas.html';
            } else { // Status code 404
                mostrarMensaje(paciente.message, 'error');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            mostrarMensaje('Error de conexión con el servidor. Intente de nuevo más tarde.', 'error');
        }
    });

    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
    }
});