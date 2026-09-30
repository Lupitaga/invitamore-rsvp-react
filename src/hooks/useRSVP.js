import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  consultarInvitacionPublica,
  aceptarInvitacion,
  rechazarInvitacion,
} from "../api/rsvpApi.js";

import {
  resolverCodigoInvitacion,
} from "../utils/invitationCode.js";

/* =========================================================
   ESTADOS BACKEND
========================================================= */

const ESTADO_PENDIENTE = "PENDIENTE";
const ESTADO_ACEPTADA = "ACEPTADA";
const ESTADO_RECHAZADA = "RECHAZADA";

/* =========================================================
   MODOS
========================================================= */

export const RSVP_MODOS = Object.freeze({
  CARGANDO: "CARGANDO",
  PERSONALIZADA: "PERSONALIZADA",
  WHATSAPP: "WHATSAPP",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
  ERROR: "ERROR",
  DESCONOCIDO: "DESCONOCIDO",
});

/* =========================================================
   HELPERS
========================================================= */

function normalizarNumeroWhatsapp(numero) {
  if (
    numero === null ||
    numero === undefined
  ) {
    return "";
  }

  return String(numero).replace(
    /\D/g,
    ""
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useRSVP({
  apiBase,

  IdEvento,

  codigoInvitacion:
    codigoManual,

  parametroCodigo = "codigo",

  campoNumeroWhatsapp =
    "NumeroWhatsAppConfirmacion",
} = {}) {
  /* =======================================================
     STATE
  ======================================================= */

  const [
    invitacion,
    setInvitacion,
  ] = useState(null);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    numeroPasesSeleccionados,
    setNumeroPasesSeleccionados,
  ] = useState(1);

  /**
   * MUY IMPORTANTE:
   *
   * Guardamos por separado si la
   * confirmación es personalizada.
   *
   * Así NO perdemos este dato aunque
   * el POST no vuelva a enviarlo.
   */
  const [
    confirmacionPersonalizadaHabilitada,
    setConfirmacionPersonalizadaHabilitada,
  ] = useState(false);

  /* =======================================================
     CÓDIGO ORIGINAL
  ======================================================= */

  const resultadoCodigo =
    useMemo(() => {
      try {
        const codigo =
          resolverCodigoInvitacion({
            codigoInvitacion:
              codigoManual,

            parametro:
              parametroCodigo,
          });

        return {
          codigo,
          error: null,
        };
      } catch (err) {
        return {
          codigo: null,
          error: err,
        };
      }
    }, [
      codigoManual,
      parametroCodigo,
    ]);

  const codigoInvitacion =
    resultadoCodigo.codigo;

  /* =======================================================
     GET INVITACIÓN
  ======================================================= */

  const cargarInvitacion =
    useCallback(
      async ({
        signal,
      } = {}) => {
        setError(null);
        setMensaje("");

        if (
          resultadoCodigo.error ||
          !codigoInvitacion
        ) {
          setInvitacion(null);

          setConfirmacionPersonalizadaHabilitada(
            false
          );

          setError(
            resultadoCodigo.error
              ?.message ||
              "No se encontró el código de invitación."
          );

          setCargando(false);

          return null;
        }

        try {
          setCargando(true);

          const data =
            await consultarInvitacionPublica({
              apiBase,
              codigoInvitacion,
              IdEvento,
              signal,
            });

          /**
           * GUARDAMOS RESPUESTA GET
           */
          setInvitacion(data);

          /**
           * GUARDAMOS ESTA BANDERA
           * POR SEPARADO.
           *
           * Este es el cambio importante.
           */
          setConfirmacionPersonalizadaHabilitada(
            data
              ?.IsConfirmacionPersonalizada ===
              true
          );

          const maximo =
            Number(
              data?.NumeroPases
            ) || 0;

          const confirmados =
            Number(
              data
                ?.NumeroPasesConfirmados
            ) || 0;

          if (
            data?.ClaveEstatus ===
              ESTADO_ACEPTADA &&
            confirmados > 0
          ) {
            setNumeroPasesSeleccionados(
              confirmados
            );
          } else if (
            maximo > 0
          ) {
            setNumeroPasesSeleccionados(
              1
            );
          } else {
            setNumeroPasesSeleccionados(
              0
            );
          }

          return data;
        } catch (err) {
          if (
            err?.name ===
            "AbortError"
          ) {
            return null;
          }

          setInvitacion(null);

          setError(
            err?.message ||
              "No fue posible cargar la invitación."
          );

          return null;
        } finally {
          if (
            !signal?.aborted
          ) {
            setCargando(false);
          }
        }
      },
      [
        apiBase,
        codigoInvitacion,
        IdEvento,
        resultadoCodigo.error,
      ]
    );

  /* =======================================================
     GET AUTOMÁTICO
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    cargarInvitacion({
      signal:
        controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [
    cargarInvitacion,
  ]);

  /* =======================================================
     ESTADO ACTUAL
  ======================================================= */

  const claveEstatus =
    invitacion
      ?.ClaveEstatus ??
    null;

  const estaPendiente =
    claveEstatus ===
    ESTADO_PENDIENTE;

  const estaAceptada =
    claveEstatus ===
    ESTADO_ACEPTADA;

  const estaRechazada =
    claveEstatus ===
    ESTADO_RECHAZADA;

  /**
   * YA NO depende solamente del
   * objeto recibido después del POST.
   */
  const isConfirmacionPersonalizada =
    confirmacionPersonalizadaHabilitada;

  /* =======================================================
     PASES
  ======================================================= */

  const numeroPases =
    Number(
      invitacion
        ?.NumeroPases
    ) || 0;

  const numeroPasesConfirmados =
    Number(
      invitacion
        ?.NumeroPasesConfirmados
    ) || 0;

  const numeroPasesRestantes =
    Math.max(
      numeroPases -
        numeroPasesConfirmados,
      0
    );

  /* =======================================================
     WHATSAPP
  ======================================================= */

  const numeroWhatsappRaw =
    invitacion?.[
      campoNumeroWhatsapp
    ] ?? null;

  const numeroWhatsapp =
    normalizarNumeroWhatsapp(
      numeroWhatsappRaw
    );

  /* =======================================================
     QR
  ======================================================= */

  const codigoQr =
    typeof invitacion
      ?.CodigoInvitacion ===
    "string"
      ? invitacion
          .CodigoInvitacion
          .trim()
      : null;

  const mostrarQr =
    estaAceptada &&
    invitacion
      ?.MostrarQrAcceso ===
      true &&
    Boolean(codigoQr);

  /* =======================================================
     MODO
  ======================================================= */

  let modo =
    RSVP_MODOS.DESCONOCIDO;

  if (cargando) {
    modo =
      RSVP_MODOS.CARGANDO;
  } else if (
    error &&
    !invitacion
  ) {
    modo =
      RSVP_MODOS.ERROR;
  } else if (
    estaPendiente
  ) {
    modo =
      isConfirmacionPersonalizada
        ? RSVP_MODOS.PERSONALIZADA
        : RSVP_MODOS.WHATSAPP;
  } else if (
    estaAceptada
  ) {
    modo =
      RSVP_MODOS.ACEPTADA;
  } else if (
    estaRechazada
  ) {
    modo =
      RSVP_MODOS.RECHAZADA;
  }

  /* =======================================================
     PERMISO PARA MODIFICAR RESPUESTA
  ======================================================= */

  const puedeResponderPersonalizada =
    Boolean(invitacion) &&
    isConfirmacionPersonalizada &&
    (
      estaPendiente ||
      estaAceptada ||
      estaRechazada
    );

  /* =======================================================
     VALIDAR PASES
  ======================================================= */

  const validarPases =
    useCallback(
      (
        cantidad
      ) => {
        const pases =
          Number(
            cantidad
          );

        if (
          !Number.isInteger(
            pases
          )
        ) {
          return {
            valido: false,

            mensaje:
              "El número de pases debe ser un entero.",
          };
        }

        if (
          pases < 1
        ) {
          return {
            valido: false,

            mensaje:
              "Debes seleccionar al menos un pase.",
          };
        }

        if (
          pases >
          numeroPases
        ) {
          return {
            valido: false,

            mensaje:
              `Puedes seleccionar máximo ${numeroPases} pase(s).`,
          };
        }

        return {
          valido: true,

          mensaje: null,

          pases,
        };
      },
      [
        numeroPases,
      ]
    );

  /* =======================================================
     CONFIRMAR
  ======================================================= */

  const confirmar =
    useCallback(
      async (
        cantidadTotal
      ) => {
        if (
          !invitacion
        ) {
          setError(
            "No hay una invitación cargada."
          );

          return null;
        }

        if (
          guardando
        ) {
          return null;
        }

        /**
         * IMPORTANTE:
         *
         * NO comprobamos que esté PENDIENTE.
         *
         * Puede estar:
         *
         * PENDIENTE
         * ACEPTADA
         * RECHAZADA
         */
        if (
          !confirmacionPersonalizadaHabilitada
        ) {
          setError(
            "La confirmación personalizada no está disponible."
          );

          return null;
        }

        const pases =
          cantidadTotal !==
          undefined
            ? cantidadTotal
            : numeroPasesSeleccionados;

        const validacion =
          validarPases(
            pases
          );

        if (
          !validacion.valido
        ) {
          setError(
            validacion.mensaje
          );

          return null;
        }

        try {
          setGuardando(true);

          setError(null);

          setMensaje("");

          const actualizada =
            await aceptarInvitacion({
              apiBase,

              codigoInvitacion,

              IdEvento,

              numeroPasesConfirmados:
                validacion.pases,
            });

          /**
           * MUY IMPORTANTE:
           *
           * NO sustituimos:
           *
           * setInvitacion(actualizada)
           *
           * porque el POST podría no devolver
           * todos los campos del GET.
           *
           * FUSIONAMOS.
           */
          setInvitacion(
            anterior => ({
              ...anterior,
              ...actualizada,

              /**
               * Preservamos explícitamente
               * esta bandera.
               */
              IsConfirmacionPersonalizada:
                confirmacionPersonalizadaHabilitada,
            })
          );

          setNumeroPasesSeleccionados(
            Number(
              actualizada
                ?.NumeroPasesConfirmados
            ) ||
              validacion.pases
          );

          setMensaje(
            "Tu asistencia fue confirmada correctamente."
          );

          return actualizada;
        } catch (err) {
          setError(
            err?.message ||
              "No fue posible confirmar tu asistencia."
          );

          return null;
        } finally {
          setGuardando(false);
        }
      },
      [
        apiBase,
        codigoInvitacion,
        IdEvento,
        confirmacionPersonalizadaHabilitada,
        guardando,
        invitacion,
        numeroPasesSeleccionados,
        validarPases,
      ]
    );

  /* =======================================================
     RECHAZAR
  ======================================================= */

  const rechazar =
    useCallback(
      async () => {
        if (
          !invitacion
        ) {
          setError(
            "No hay una invitación cargada."
          );

          return null;
        }

        if (
          guardando
        ) {
          return null;
        }

        /**
         * TAMPOCO exigimos:
         *
         * estaPendiente
         */
        if (
          !confirmacionPersonalizadaHabilitada
        ) {
          setError(
            "La confirmación personalizada no está disponible."
          );

          return null;
        }

        try {
          setGuardando(true);

          setError(null);

          setMensaje("");

          const actualizada =
            await rechazarInvitacion({
              apiBase,

              codigoInvitacion,

              IdEvento,
            });

          /**
           * FUSIONAMOS CON EL ESTADO
           * ANTERIOR.
           */
          setInvitacion(
            anterior => ({
              ...anterior,
              ...actualizada,

              IsConfirmacionPersonalizada:
                confirmacionPersonalizadaHabilitada,

              NumeroPasesConfirmados:
                0,

              ClaveEstatus:
                actualizada
                  ?.ClaveEstatus ||
                ESTADO_RECHAZADA,
            })
          );

          setNumeroPasesSeleccionados(
            0
          );

          setMensaje(
            "Tu respuesta fue registrada correctamente."
          );

          return actualizada;
        } catch (err) {
          setError(
            err?.message ||
              "No fue posible registrar tu respuesta."
          );

          return null;
        } finally {
          setGuardando(false);
        }
      },
      [
        apiBase,
        codigoInvitacion,
        IdEvento,
        confirmacionPersonalizadaHabilitada,
        guardando,
        invitacion,
      ]
    );

  /* =======================================================
     MENSAJE WHATSAPP
  ======================================================= */

  const crearMensajeWhatsapp =
    useCallback(
      (
        cantidad
      ) => {
        const validacion =
          validarPases(
            cantidad
          );

        if (
          !validacion.valido
        ) {
          throw new Error(
            validacion.mensaje
          );
        }

        const pases =
          validacion.pases;

        const nombre =
          invitacion
            ?.Nombre ||
          "Invitado";

        const evento =
          invitacion
            ?.NombreEvento;

        const partes = [];

        partes.push(
          `Hola, soy ${nombre}.`
        );

        if (
          evento
        ) {
          partes.push(
            `Confirmo mi asistencia a ${evento}.`
          );
        } else {
          partes.push(
            "Confirmo mi asistencia al evento."
          );
        }

        partes.push(
          pases === 1
            ? "Asistiré 1 persona."
            : `Asistiremos ${pases} personas.`
        );

        return partes.join(
          "\n"
        );
      },
      [
        invitacion,
        validarPases,
      ]
    );

  /* =======================================================
     CREAR URL WHATSAPP
  ======================================================= */

  const crearUrlWhatsapp =
    useCallback(
      ({
        cantidad,

        mensaje:
          mensajePersonalizado,
      } = {}) => {
        if (
          !invitacion
        ) {
          throw new Error(
            "No hay una invitación cargada."
          );
        }

        if (
          !estaPendiente ||
          isConfirmacionPersonalizada
        ) {
          throw new Error(
            "La confirmación por WhatsApp no está disponible."
          );
        }

        if (
          !numeroWhatsapp
        ) {
          throw new Error(
            "No se configuró el número de WhatsApp para la confirmación."
          );
        }

        const pases =
          cantidad !==
          undefined
            ? cantidad
            : numeroPasesSeleccionados;

        const validacion =
          validarPases(
            pases
          );

        if (
          !validacion.valido
        ) {
          throw new Error(
            validacion.mensaje
          );
        }

        const mensajeFinal =
          typeof mensajePersonalizado ===
            "string" &&
          mensajePersonalizado.trim()
            ? mensajePersonalizado.trim()
            : crearMensajeWhatsapp(
                validacion.pases
              );

        return (
          `https://wa.me/${numeroWhatsapp}` +
          `?text=${encodeURIComponent(
            mensajeFinal
          )}`
        );
      },
      [
        crearMensajeWhatsapp,
        estaPendiente,
        invitacion,
        isConfirmacionPersonalizada,
        numeroPasesSeleccionados,
        numeroWhatsapp,
        validarPases,
      ]
    );

  /* =======================================================
     ABRIR WHATSAPP
  ======================================================= */

  const abrirWhatsapp =
    useCallback(
      ({
        cantidad,

        mensaje:
          mensajePersonalizado,
      } = {}) => {
        try {
          setError(null);

          setMensaje("");

          const url =
            crearUrlWhatsapp({
              cantidad,

              mensaje:
                mensajePersonalizado,
            });

          if (
            typeof window ===
            "undefined"
          ) {
            throw new Error(
              "WhatsApp solo puede abrirse desde el navegador."
            );
          }

          window.open(
            url,
            "_blank",
            "noopener,noreferrer"
          );

          return url;
        } catch (err) {
          setError(
            err?.message ||
              "No fue posible abrir WhatsApp."
          );

          return null;
        }
      },
      [
        crearUrlWhatsapp,
      ]
    );

  /* =======================================================
     LIMPIAR
  ======================================================= */

  const limpiarMensajes =
    useCallback(() => {
      setError(null);

      setMensaje("");
    }, []);

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    invitacion,

    codigoInvitacion,

    claveEstatus,

    cargando,

    guardando,

    error,

    mensaje,

    estaPendiente,

    estaAceptada,

    estaRechazada,

    modo,

    isConfirmacionPersonalizada,

    puedeResponderPersonalizada,

    numeroPases,

    numeroPasesConfirmados,

    numeroPasesRestantes,

    numeroPasesSeleccionados,

    setNumeroPasesSeleccionados,

    validarPases,

    confirmar,

    rechazar,

    numeroWhatsapp,

    crearMensajeWhatsapp,

    crearUrlWhatsapp,

    abrirWhatsapp,

    mostrarQr,

    codigoQr,

    limpiarMensajes,

    refrescar:
      cargarInvitacion,
  };
}