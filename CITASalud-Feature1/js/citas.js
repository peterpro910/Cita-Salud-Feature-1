// /js/citas.js
document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------------
    // 1. CONFIGURACIÓN Y GLOBALIZACIÓN
    // -----------------------------------------------------------

    const idPaciente = sessionStorage.getItem('id_paciente');
    if (!idPaciente) {
        alert('Por favor, inicie sesión primero.');
        window.location.href = './../html/login.html';
        return;
    }
    
    // **GLOBALIZACIÓN (Correcta):** Exponer el ID del paciente.
    window.idPaciente = idPaciente; 

    const citasContainer = document.getElementById('citas-container');
    const mensajeDiv = document.getElementById('mensaje');
    const modal = document.getElementById('modal-detalle-cita');
    const modalContent = document.getElementById('modal-info-body');
    const btnCerrarModal = document.querySelector('#modal-detalle-cita .close-modal-btn');
    
    // Asumimos que los modales de mensajes están en el HTML principal:
    const modalMensaje = document.getElementById('modal-mensaje');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalTexto = document.getElementById('modal-texto');
    const btnCerrarMensaje = document.getElementById('modal-cerrar-btn'); // Botón del modal de mensaje
    

    // Función auxiliar para mostrar mensajes en el DIV superior
    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        mensajeDiv.setAttribute('aria-live', 'polite');
    }
    
    // **GLOBALIZACIÓN (Correcta):** Función para mostrar el modal de mensajes.
    // Esta función la usarán cancelacion.js y modificar_cita.js
    window.mostrarModalMensaje = function(titulo, texto, type = 'info', callback = null) {
        if (modalMensaje && modalTitulo && modalTexto && btnCerrarMensaje) {
            modalTitulo.innerHTML = titulo;
            modalTexto.innerHTML = texto;
            // Aplicar clase de tipo (ej: .modal-error, .modal-success)
            modalMensaje.className = `modal modal-${type}`; 
            modalMensaje.style.display = 'flex';

            // Manejador de cierre con callback
            const closeHandler = () => {
                modalMensaje.style.display = 'none';
                btnCerrarMensaje.removeEventListener('click', closeHandler);
                if (callback) {
                    callback();
                }
            };
            
            // Asegurarse de que el listener esté limpio antes de añadirlo
            btnCerrarMensaje.removeEventListener('click', closeHandler);
            btnCerrarMensaje.addEventListener('click', closeHandler);

        } else {
             // Fallback si no existen los modales de mensajes
            alert(titulo + "\n" + texto);
            if (callback) callback();
        }
    };
    
    // **GLOBALIZACIÓN (Correcta):** Función de Recarga
    window.cargarCitas = cargarCitas; 
    
    // --- Resto de funciones de utilidad ---
    function getEstadoClass(id_estado) {
        switch (parseInt(id_estado)) { // Asegurarse de que sea un número
            case 1: return 'estado-agendada'; 
            case 2: return 'estado-modificada'; 
            case 3: return 'estado-cancelada'; 
            case 4: return 'estado-asistida'; 
            case 5: return 'estado-sin-asistencia'; 
            default: return 'estado-pasada';
        }
    }

    function getTiempoRestante(fechaHora) {
        const ahora = new Date();
        const cita = new Date(fechaHora);
        const diff = cita.getTime() - ahora.getTime();

        if (diff < 0) return null;

        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${dias}d ${horas}h ${minutos}m`;
    }

    // **GLOBALIZACIÓN (NUEVO):** Hacemos global formatDateTime para que modificar_cita.js la use
    window.formatDateTime = function(dateStr, timeStr, locale = 'es-CO') {
        if (!dateStr || !timeStr) return { fecha: '', hora: '', fechaHora: '' };
        const dateObj = new Date(`${dateStr}T${timeStr}`);
        const fechaTexto = dateObj.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
        const horaTexto = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });
        return { fecha: fechaTexto, hora: horaTexto, fechaHora: `${dateStr} ${timeStr}` };
    }


    // -----------------------------------------------------------
    // 2. LÓGICA PRINCIPAL: Cargar y Renderizar Citas
    // -----------------------------------------------------------

    async function cargarCitas() {
        mostrarMensaje('Cargando tus citas...', 'info');
        citasContainer.innerHTML = '';

        try {
            // Usamos la API de get_citas_paciente.php que ya incluye la columna id_horario_original
            const response = await fetch(`./../api/get_citas_paciente.php?id_paciente=${idPaciente}`);
            const data = await response.json();

            if (!response.ok || data.message) {
                throw new Error(data.message || 'Error desconocido al obtener las citas.');
            }

            if (data.length === 0) {
                mostrarMensaje('No tienes citas agendadas actualmente.', 'warning');
                return;
            }

            // Ordenar por fecha (la consulta SQL ya debería hacerlo, pero es una buena práctica)
            data.sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora));

            data.forEach(cita => {
                // Desestructuración de los datos (asegúrate que la API los devuelva)
                const { id_cita, fecha, hora, nombre_estado, nombre_especialidad, id_estado, nombre_profesional, apellido_profesional, nombre_sede, id_horario_original, id_horario, id_especialidad,  id_sede, id_profesional } = cita;
                
                // Usamos la función global
                const { fecha: fechaTexto, hora: horaTexto, fechaHora } = window.formatDateTime(fecha, hora);
                console.log(`Cita ID: ${id_cita}, Estado: ${id_estado}, Fecha: ${fecha}`);

                const estadoClass = getEstadoClass(id_estado);

                const card = document.createElement('div');
                card.className = `cita-card ${estadoClass}`;
                card.setAttribute('tabindex', '0'); 

                const tiempoRestante = (id_estado == 1 || id_estado == 2) ? getTiempoRestante(fechaHora) : null;
                let contadorHTML = tiempoRestante ? `<p class="contador" aria-live="polite">Restante: <strong>${tiempoRestante}</strong></p>` : '';

                // Habilitación de botones
                const esAgendada = parseInt(id_estado) === 1;
                const esModificada = parseInt(id_estado) === 2;

                const cancelarDisabled = !esAgendada && !esModificada; // Se puede cancelar Agendada o Modificada
                const modificarDisabled = !esAgendada; // HU-08 dice: Solo se puede modificar una cita Agendada (no una ya modificada)

                card.innerHTML = `
                    <h3>${nombre_especialidad}</h3>
                    <p>Fecha: <strong>${fechaTexto}</strong></p>
                    <p>Hora: <strong>${horaTexto}</strong></p>
                    <p>Estado: <span class="estado-label ${estadoClass}">${nombre_estado}</span></p>
                    ${contadorHTML}
                    <div class="card-actions">
                        <button class="btn-accion btn-ver-mas" aria-label="Ver más detalles de la cita">Ver más</button>
                        
                        <button class="btn-accion btn-modificar" 
                            data-id-cita="${id_cita}"
                            data-id-horario-original="${id_horario_original}" 
                            data-id-especialidad="${id_especialidad}"
                            data-especialidad-nombre="${nombre_especialidad}"
                            data-fecha="${fecha}"
                            data-hora="${hora}"
                            data-id-sede="${id_sede}"
                            data-sede-nombre="${nombre_sede}"
                            data-id-profesional="${id_profesional}"
                            data-profesional-nombre="${nombre_profesional} ${apellido_profesional}"
                            ${modificarDisabled ? 'disabled' : ''} 
                            aria-label="${modificarDisabled ? 'Modificar cita (deshabilitado)' : 'Modificar cita'}">Modificar</button>


                        
                        <button class="btn-accion btn-cancelar" 
                            data-cita-id="${id_cita}" 
                            data-especialidad="${nombre_especialidad}" 
                            data-fecha="${fecha}" 
                            data-hora="${hora}"
                            data-profesional="${nombre_profesional} ${apellido_profesional}"
                            data-sede="${nombre_sede}"
                            ${cancelarDisabled ? 'disabled' : ''} 
                            aria-label="${cancelarDisabled ? 'Cancelar cita (deshabilitado)' : 'Cancelar cita'}">Cancelar</button>
                    </div>
                `;

                // --- Asignación de Eventos ---

                // Evento Ver Más
                card.querySelector('.btn-ver-mas').addEventListener('click', () => mostrarDetallesCita(cita));

                // Evento Modificar
                const btnModificar = card.querySelector('.btn-modificar');

                if (!modificarDisabled && btnModificar) {
                    btnModificar.addEventListener('click', (e) => {
                        const dataset = e.currentTarget.dataset;

                        const idCita = dataset.idCita;
                        const idHorarioOriginal = dataset.idHorarioOriginal;
                        const especialidadId = dataset.idEspecialidad;
                        const especialidadNombre = dataset.especialidadNombre;
                        const fecha = dataset.fecha;
                        const hora = dataset.hora;
                        const sedeId = dataset.idSede;
                        const sedeNombre = dataset.sedeNombre;
                        const profesionalId = dataset.idProfesional;
                        const profesionalNombre = dataset.profesionalNombre;

                        // Depuración: mostrar todos los valores
                        console.log("[Depuración] Datos del botón Modificar:", {
                            idCita,
                            idHorarioOriginal,
                            especialidadId,
                            especialidadNombre,
                            fecha,
                            hora,
                            sedeId,
                            sedeNombre,
                            profesionalId,
                            profesionalNombre
                        });

                        // Validación de campos clave
                        const campos = {
                            idCita,
                            idHorarioOriginal,
                            especialidadId,
                            fecha,
                            hora,
                            sedeId,
                            profesionalId
                        };

                        const camposFaltantes = Object.entries(campos)
                            .filter(([key, value]) => !value || value === "undefined")
                            .map(([key]) => key);

                        if (camposFaltantes.length > 0) {
                            console.warn("[Depuración] Faltan campos en el botón Modificar:", camposFaltantes);
                            window.mostrarModalMensaje(
                                "Error de datos",
                                `No se puede modificar la cita porque faltan los siguientes campos: ${camposFaltantes.join(", ")}`,
                                "error"
                            );
                            return;
                        }

                        closeModal(); // Cierra el modal "Ver Más" si está abierto

                        if (typeof window.inicializarModificacion === 'function') {
                            window.inicializarModificacion(
                                idCita,
                                idHorarioOriginal,
                                especialidadId,
                                especialidadNombre,
                                fecha,
                                hora,
                                sedeId,
                                sedeNombre,
                                profesionalId,
                                profesionalNombre
                            );
                        } else {
                            window.mostrarModalMensaje(
                                'Error de Script',
                                'La funcionalidad de modificación no se ha cargado (falta modificar_cita.js).',
                                'error'
                            );
                        }
                    });
                }



                // Evento Cancelar (Lógica original, se mantiene)
                const btnCancelar = card.querySelector('.btn-cancelar');
                if (!cancelarDisabled) {
                    btnCancelar.addEventListener('click', (e) => {
                        // Llama a la función global del script cancelacion.js
                        if (typeof window.iniciarProcesoCancelacion === 'function') {
                            window.iniciarProcesoCancelacion(e); // Pasa el evento (para leer dataset)
                        } else {
                            window.mostrarModalMensaje('Error de Script', `La lógica de cancelación no se ha cargado (falta cancelacion.js).`, 'error');
                        }
                    });
                }

                citasContainer.appendChild(card);
            });

            mostrarMensaje('', '', ''); // Limpiar mensaje de carga

            // Lógica de recarga del contador (mantenida)
            if (window.citaInterval) {
                clearInterval(window.citaInterval);
            }
            // Recargar citas cada 60 segundos para actualizar el contador
            window.citaInterval = setInterval(window.cargarCitas, 60000); 

        } catch (error) {
            console.error('Error al cargar las citas:', error);
            mostrarMensaje('Error al obtener las citas. Intente de nuevo más tarde.', 'error');
        }
    }

    // -----------------------------------------------------------
    // 3. LÓGICA DE MODAL "Ver Más" y Eventos de Cierre (Mantenida)
    // -----------------------------------------------------------

    function mostrarDetallesCita(cita) {
        // Asegurarse de que los datos de la API (cita) se manejen correctamente
        const { fecha, hora, nombre_especialidad, nombre_profesional, apellido_profesional, nombre_sede, direccion_sede, nombre_ciudad, nombre_estado, id_estado } = cita;
        
        // Usamos la función global
        const { fecha: fechaTexto, hora: horaTexto } = window.formatDateTime(fecha, hora);
        
        // Manejo de 'undefined' (causa de tu error anterior)
        const profesionalCompleto = (nombre_profesional && apellido_profesional) ? `${nombre_profesional} ${apellido_profesional}` : 'No asignado';
        const sedeTexto = nombre_sede || 'No asignada';
        const direccionTexto = (direccion_sede && nombre_ciudad) ? `${direccion_sede}, ${nombre_ciudad}` : 'Dirección no disponible';
        const especialidadTexto = nombre_especialidad || 'Especialidad no definida';

        const estadoClass = getEstadoClass(id_estado);

        let detallesAdicionales = '';

        // Detalle de Cancelación
        if (parseInt(id_estado) === 3 && cita.fecha_cancelacion) {
            const { fecha: fechaCancelacion, hora: horaCancelacion } = window.formatDateTime(cita.fecha_cancelacion, cita.hora_cancelacion);
            detallesAdicionales += `
                <hr>
                <h4 class="detalle-titulo">Detalles de Cancelación</h4>
                <p><strong>Motivo:</strong> ${cita.motivo_cancelacion || 'No especificado'}</p>
                <p><strong>Fecha y Hora de Cancelación:</strong> ${fechaCancelacion} - ${horaCancelacion}</p>
            `;
        }

        // Detalle de Modificación (Usa la columna id_horario_original)
        if (parseInt(id_estado) === 2 && cita.fecha_original && cita.hora_original) {
            const { fecha: fechaOriginalTexto, hora: horaOriginalTexto } = window.formatDateTime(cita.fecha_original, cita.hora_original);
            detallesAdicionales += `
                <hr>
                <h4 class="detalle-titulo">Detalles de Modificación</h4>
                <p><strong>Fecha/Hora Original:</strong> ${fechaOriginalTexto} - ${horaOriginalTexto}</p>
            `;
        }

        modalContent.innerHTML = `
            <h2 id="modal-title">Detalles de Cita</h2>
            <p><strong>Especialidad:</strong> ${especialidadTexto}</p>
            <p><strong>Estado Actual:</strong> <span class="estado-label ${estadoClass}">${nombre_estado}</span></p>
            <hr>
            <p><strong>Fecha:</strong> ${fechaTexto}</p>
            <p><strong>Hora:</strong> ${horaTexto}</p>
            <p><strong>Profesional:</strong> ${profesionalCompleto}</p>
            <p><strong>Sede:</strong> ${sedeTexto}</p>
            <p><strong>Dirección:</strong> ${direccionTexto}</p>
            ${detallesAdicionales}
        `;

        modal.style.display = 'flex';
        modal.focus();
    }


    const closeModal = () => {
        modal.style.display = 'none';
    };

    btnCerrarModal.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Iniciar la carga de citas al cargar la página
    cargarCitas();
});