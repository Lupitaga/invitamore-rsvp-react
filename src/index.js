/**
 * ============================================================
 * INVITAMORE RSVP
 * Punto de entrada público de la librería
 * ============================================================
 */

/**
 * Hook principal que utilizarán las invitaciones.
 */
export {
  useRSVP,
  RSVP_MODOS,
} from "./hooks/useRSVP.js";

/**
 * Servicios de bajo nivel.
 *
 * Normalmente una invitación utilizará useRSVP(),
 * pero dejamos disponibles estas funciones por si
 * algún proyecto necesita consumirlas directamente.
 */
export {
  RSVPApiError,
  consultarInvitacionPublica,
  responderInvitacionPublica,
  aceptarInvitacion,
  rechazarInvitacion,
} from "./api/rsvpApi.js";

/**
 * Utilidades relacionadas con el código de invitación.
 */
export {
  RSVPCodigoInvitacionError,
  normalizarCodigoInvitacion,
  obtenerCodigoInvitacionDesdeURL,
  resolverCodigoInvitacion,
} from "./utils/invitationCode.js";