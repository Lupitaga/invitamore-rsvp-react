/**
 * ============================================================
 * INVITAMORE RSVP
 * Utilidades para obtener y validar el código de invitación
 * ============================================================
 *
 * URL esperada:
 *
 * https://dominio.com/invitacion/?codigo=INV-ABC123
 *
 * IMPORTANTE:
 *
 * El código obtenido de la URL es el código que se utilizará
 * para consultar y actualizar la invitación.
 *
 * NO debe sustituirse posteriormente por:
 *
 * invitacion.CodigoInvitacion
 *
 * ya que ese campo puede ser null o corresponder al QR.
 */

/**
 * ============================================================
 * ERROR PERSONALIZADO
 * ============================================================
 */
export class RSVPCodigoInvitacionError extends Error {
  constructor(message) {
    super(message);

    this.name = "RSVPCodigoInvitacionError";
  }
}

/**
 * ============================================================
 * NORMALIZAR Y VALIDAR CÓDIGO
 * ============================================================
 *
 * Reglas actuales:
 *
 * - obligatorio
 * - debe ser string
 * - no puede estar vacío
 * - máximo 100 caracteres
 */
export function normalizarCodigoInvitacion(
  codigoInvitacion
) {
  /**
   * URLSearchParams.get() devuelve null
   * cuando el parámetro no existe.
   *
   * También contemplamos undefined.
   */
  if (
    codigoInvitacion === null ||
    codigoInvitacion === undefined
  ) {
    throw new RSVPCodigoInvitacionError(
      "No se encontró el código de invitación."
    );
  }

  /**
   * Si existe pero no es texto,
   * entonces sí es un tipo inválido.
   */
  if (typeof codigoInvitacion !== "string") {
    throw new RSVPCodigoInvitacionError(
      "El código de invitación debe ser una cadena de texto."
    );
  }

  /**
   * Quitamos espacios al inicio y al final.
   */
  const codigo = codigoInvitacion.trim();

  /**
   * Por ejemplo:
   *
   * ?codigo=
   *
   * o:
   *
   * ?codigo=    
   */
  if (!codigo) {
    throw new RSVPCodigoInvitacionError(
      "No se encontró el código de invitación."
    );
  }

  /**
   * Restricción actual del backend.
   */
  if (codigo.length > 100) {
    throw new RSVPCodigoInvitacionError(
      "El código de invitación no puede superar los 100 caracteres."
    );
  }

  return codigo;
}

/**
 * ============================================================
 * OBTENER CÓDIGO DESDE LA URL
 * ============================================================
 *
 * Por defecto busca:
 *
 * ?codigo=INV-ABC123
 *
 * También acepta "search" manualmente para pruebas.
 */
export function obtenerCodigoInvitacionDesdeURL({
  parametro = "codigo",
  search,
} = {}) {
  /**
   * Validamos el nombre del parámetro.
   */
  if (
    typeof parametro !== "string" ||
    !parametro.trim()
  ) {
    throw new RSVPCodigoInvitacionError(
      "El nombre del parámetro de la URL no es válido."
    );
  }

  let queryString;

  /**
   * Si recibimos search manualmente:
   *
   * "?codigo=INV-ABC123"
   *
   * lo utilizamos directamente.
   */
  if (typeof search === "string") {
    queryString = search;
  } else {
    /**
     * En una invitación React real utilizaremos
     * automáticamente window.location.search.
     */
    if (typeof window === "undefined") {
      throw new RSVPCodigoInvitacionError(
        "No es posible obtener el código de invitación fuera del navegador sin proporcionar una URL."
      );
    }

    queryString = window.location.search;
  }

  /**
   * Interpretamos los query params.
   */
  const parametros = new URLSearchParams(
    queryString
  );

  /**
   * Ejemplo:
   *
   * ?tema=lila&codigo=INV-ABC123
   *
   * devuelve:
   *
   * INV-ABC123
   *
   * Si no existe devuelve null.
   */
  const codigo = parametros.get(
    parametro.trim()
  );

  return normalizarCodigoInvitacion(codigo);
}

/**
 * ============================================================
 * RESOLVER CÓDIGO DE INVITACIÓN
 * ============================================================
 *
 * Esta será la función principal utilizada posteriormente
 * por useRSVP.
 *
 * Puede:
 *
 * 1. recibir el código manualmente
 *
 * o
 *
 * 2. obtenerlo automáticamente de la URL.
 */
export function resolverCodigoInvitacion({
  codigoInvitacion,
  parametro = "codigo",
  search,
} = {}) {
  /**
   * Si NO nos mandaron un código explícitamente,
   * lo buscamos en la URL.
   */
  if (
    codigoInvitacion === undefined ||
    codigoInvitacion === null
  ) {
    return obtenerCodigoInvitacionDesdeURL({
      parametro,
      search,
    });
  }

  /**
   * Si sí nos mandaron uno,
   * lo validamos directamente.
   */
  return normalizarCodigoInvitacion(
    codigoInvitacion
  );
}