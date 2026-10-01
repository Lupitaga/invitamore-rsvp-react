/**
 * ============================================================
 * INVITAMORE RSVP
 * Capa de comunicación con la API pública de invitaciones
 * ============================================================
 */

/**
 * Error personalizado para los servicios RSVP.
 *
 * Nos permitirá posteriormente identificar:
 *
 * 400 -> datos inválidos
 * 404 -> invitación inexistente o restricción de negocio
 * 500 -> error interno
 */
export class RSVPApiError extends Error {
  constructor(message, status = null, data = null) {
    super(message);

    this.name = "RSVPApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * ============================================================
 * NORMALIZAR API BASE
 * ============================================================
 *
 * Ejemplo:
 *
 * https://api.tudominio.com/
 *
 * se convierte en:
 *
 * https://api.tudominio.com
 */
function normalizarApiBase(apiBase) {
  if (!apiBase || typeof apiBase !== "string") {
    throw new RSVPApiError(
      "No se configuró la URL base del backend."
    );
  }

  return apiBase.trim().replace(/\/+$/, "");
}

/**
 * ============================================================
 * VALIDAR CÓDIGO
 * ============================================================
 *
 * Según el contrato:
 *
 * - obligatorio
 * - string
 * - máximo 100 caracteres
 */
function validarCodigoInvitacion(codigoInvitacion) {
  if (
    !codigoInvitacion ||
    typeof codigoInvitacion !== "string"
  ) {
    throw new RSVPApiError(
      "El código de invitación es obligatorio."
    );
  }

  const codigo = codigoInvitacion.trim();

  if (!codigo) {
    throw new RSVPApiError(
      "El código de invitación es obligatorio."
    );
  }

  if (codigo.length > 100) {
    throw new RSVPApiError(
      "El código de invitación no puede superar los 100 caracteres."
    );
  }

  return codigo;
}

function validarIdEvento(IdEvento) {
  if (
    IdEvento === null ||
    IdEvento === undefined ||
    String(IdEvento).trim() === ""
  ) {
    throw new RSVPApiError(
      "El IdEvento es obligatorio."
    );
  }

  return String(IdEvento).trim();
}

/**
 * ============================================================
 * LEER RESPUESTA JSON
 * ============================================================
 */
async function obtenerJson(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new RSVPApiError(
      "El servidor devolvió una respuesta inválida.",
      response.status
    );
  }

  return data;
}

/**
 * ============================================================
 * PROCESAR RESPUESTA
 * ============================================================
 *
 * Según tu documentación:
 *
 * únicamente consideramos exitosa la operación cuando:
 *
 * response HTTP exitoso
 *
 * Y
 *
 * status === "ok"
 */
async function procesarRespuesta(response) {
  const data = await obtenerJson(response);

  if (!response.ok || data?.status !== "ok") {
    throw new RSVPApiError(
      data?.message ||
        "No fue posible completar la operación.",
      response.status,
      data
    );
  }

  return data;
}

/**
 * ============================================================
 * CONSULTAR INVITACIÓN PÚBLICA
 * ============================================================
 *
 * GET
 *
 * /invitaciones/publicas/{codigoInvitacion}
 *
 * No requiere JWT.
 */
export async function consultarInvitacionPublica({
  apiBase,
  codigoInvitacion,
  IdEvento,
  signal,
}) {
  const base = normalizarApiBase(apiBase);

  const codigo =
    validarCodigoInvitacion(codigoInvitacion);

  const idEvento =
    validarIdEvento(IdEvento);

  const url =
    `${base}/invitaciones/publicas/` +
    `${encodeURIComponent(codigo)}?IdEvento=` +
    encodeURIComponent(idEvento);

  let response;

  try {
    response = await fetch(url, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    });
  } catch (error) {
    /**
     * Si AbortController cancela la petición,
     * dejamos pasar AbortError.
     */
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new RSVPApiError(
      "No fue posible conectar con el servidor."
    );
  }

  const resultado =
    await procesarRespuesta(response);

  if (!resultado?.data) {
    throw new RSVPApiError(
      "El servidor no devolvió los datos de la invitación.",
      response.status,
      resultado
    );
  }

  /**
   * IMPORTANTE:
   *
   * Regresamos TODO data.
   *
   * No seleccionamos campos manualmente.
   *
   * Por eso si el backend agrega:
   *
   * IsConfirmacionPersonalizada
   *
   * automáticamente estará disponible.
   */
  return resultado.data;
}

/**
 * ============================================================
 * RESPONDER INVITACIÓN
 * ============================================================
 *
 * POST
 *
 * /invitaciones/publicas/{codigoInvitacion}/confirmar
 *
 * respuestas válidas:
 *
 * ACEPTADA
 * RECHAZADA
 */
export async function responderInvitacionPublica({
  apiBase,
  codigoInvitacion,
  IdEvento,
  respuesta,
  numeroPasesConfirmados,
}) {
  const base = normalizarApiBase(apiBase);

  const codigo =
    validarCodigoInvitacion(codigoInvitacion);

  const idEvento =
    validarIdEvento(IdEvento);

  /**
   * Solo admitimos los valores
   * permitidos por el backend.
   */
  if (
    respuesta !== "ACEPTADA" &&
    respuesta !== "RECHAZADA"
  ) {
    throw new RSVPApiError(
      "La respuesta debe ser ACEPTADA o RECHAZADA."
    );
  }

  let pases;

  /**
   * RECHAZADA siempre manda 0.
   */
  if (respuesta === "RECHAZADA") {
    pases = 0;
  } else {
    pases = Number(numeroPasesConfirmados);

    /**
     * Nuestra librería valida estrictamente
     * que sea un entero.
     */
    if (!Number.isInteger(pases)) {
      throw new RSVPApiError(
        "El número de pases confirmados debe ser un entero."
      );
    }

    if (pases < 1) {
      throw new RSVPApiError(
        "Debes confirmar al menos un pase."
      );
    }
  }

  const url =
    `${base}/invitaciones/publicas/` +
    `${encodeURIComponent(codigo)}/confirmar`;

  let response;

  try {
    response = await fetch(url, {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        IdEvento: idEvento,
        respuesta,
        numeroPasesConfirmados: pases,
      }),
    });
  } catch {
    throw new RSVPApiError(
      "No fue posible conectar con el servidor."
    );
  }

  const resultado =
    await procesarRespuesta(response);

  /**
   * Según el contrato:
   *
   * data.invitacion
   */
  const invitacionActualizada =
    resultado?.data?.invitacion;

  if (!invitacionActualizada) {
    throw new RSVPApiError(
      "El servidor no devolvió la invitación actualizada.",
      response.status,
      resultado
    );
  }

  return invitacionActualizada;
}

/**
 * ============================================================
 * CONFIRMAR ASISTENCIA
 * ============================================================
 */
export async function aceptarInvitacion({
  apiBase,
  codigoInvitacion,
  IdEvento,
  numeroPasesConfirmados,
}) {
  return responderInvitacionPublica({
    apiBase,
    codigoInvitacion,
    IdEvento,
    respuesta: "ACEPTADA",
    numeroPasesConfirmados,
  });
}

/**
 * ============================================================
 * RECHAZAR ASISTENCIA
 * ============================================================
 */
export async function rechazarInvitacion({
  apiBase,
  codigoInvitacion,
  IdEvento,
}) {
  return responderInvitacionPublica({
    apiBase,
    codigoInvitacion,
    IdEvento,
    respuesta: "RECHAZADA",
    numeroPasesConfirmados: 0,
  });
}