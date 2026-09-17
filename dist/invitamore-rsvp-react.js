import { useCallback as e, useEffect as t, useMemo as n, useState as r } from "react";
//#region src/api/rsvpApi.js
var i = class extends Error {
	constructor(e, t = null, n = null) {
		super(e), this.name = "RSVPApiError", this.status = t, this.data = n;
	}
};
function a(e) {
	if (!e || typeof e != "string") throw new i("No se configuró la URL base del backend.");
	return e.trim().replace(/\/+$/, "");
}
function o(e) {
	if (!e || typeof e != "string") throw new i("El código de invitación es obligatorio.");
	let t = e.trim();
	if (!t) throw new i("El código de invitación es obligatorio.");
	if (t.length > 100) throw new i("El código de invitación no puede superar los 100 caracteres.");
	return t;
}
async function s(e) {
	let t;
	try {
		t = await e.json();
	} catch {
		throw new i("El servidor devolvió una respuesta inválida.", e.status);
	}
	return t;
}
async function c(e) {
	let t = await s(e);
	if (!e.ok || t?.status !== "ok") throw new i(t?.message || "No fue posible completar la operación.", e.status, t);
	return t;
}
async function l({ apiBase: e, codigoInvitacion: t, signal: n }) {
	let r = a(e), s = o(t), l = `${r}/invitaciones/publicas/` + encodeURIComponent(s), u;
	try {
		u = await fetch(l, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: n
		});
	} catch (e) {
		throw e?.name === "AbortError" ? e : new i("No fue posible conectar con el servidor.");
	}
	let d = await c(u);
	if (!d?.data) throw new i("El servidor no devolvió los datos de la invitación.", u.status, d);
	return d.data;
}
async function u({ apiBase: e, codigoInvitacion: t, respuesta: n, numeroPasesConfirmados: r }) {
	let s = a(e), l = o(t);
	if (n !== "ACEPTADA" && n !== "RECHAZADA") throw new i("La respuesta debe ser ACEPTADA o RECHAZADA.");
	let u;
	if (n === "RECHAZADA") u = 0;
	else {
		if (u = Number(r), !Number.isInteger(u)) throw new i("El número de pases confirmados debe ser un entero.");
		if (u < 1) throw new i("Debes confirmar al menos un pase.");
	}
	let d = `${s}/invitaciones/publicas/${encodeURIComponent(l)}/confirmar`, f;
	try {
		f = await fetch(d, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				respuesta: n,
				numeroPasesConfirmados: u
			})
		});
	} catch {
		throw new i("No fue posible conectar con el servidor.");
	}
	let p = await c(f), m = p?.data?.invitacion;
	if (!m) throw new i("El servidor no devolvió la invitación actualizada.", f.status, p);
	return m;
}
async function d({ apiBase: e, codigoInvitacion: t, numeroPasesConfirmados: n }) {
	return u({
		apiBase: e,
		codigoInvitacion: t,
		respuesta: "ACEPTADA",
		numeroPasesConfirmados: n
	});
}
async function f({ apiBase: e, codigoInvitacion: t }) {
	return u({
		apiBase: e,
		codigoInvitacion: t,
		respuesta: "RECHAZADA",
		numeroPasesConfirmados: 0
	});
}
//#endregion
//#region src/utils/invitationCode.js
var p = class extends Error {
	constructor(e) {
		super(e), this.name = "RSVPCodigoInvitacionError";
	}
};
function m(e) {
	if (e == null) throw new p("No se encontró el código de invitación.");
	if (typeof e != "string") throw new p("El código de invitación debe ser una cadena de texto.");
	let t = e.trim();
	if (!t) throw new p("No se encontró el código de invitación.");
	if (t.length > 100) throw new p("El código de invitación no puede superar los 100 caracteres.");
	return t;
}
function h({ parametro: e = "codigo", search: t } = {}) {
	if (typeof e != "string" || !e.trim()) throw new p("El nombre del parámetro de la URL no es válido.");
	let n;
	if (typeof t == "string") n = t;
	else {
		if (typeof window > "u") throw new p("No es posible obtener el código de invitación fuera del navegador sin proporcionar una URL.");
		n = window.location.search;
	}
	return m(new URLSearchParams(n).get(e.trim()));
}
function g({ codigoInvitacion: e, parametro: t = "codigo", search: n } = {}) {
	return e == null ? h({
		parametro: t,
		search: n
	}) : m(e);
}
//#endregion
//#region src/hooks/useRSVP.js
var _ = "PENDIENTE", v = "ACEPTADA", y = "RECHAZADA", b = Object.freeze({
	CARGANDO: "CARGANDO",
	PERSONALIZADA: "PERSONALIZADA",
	WHATSAPP: "WHATSAPP",
	ACEPTADA: "ACEPTADA",
	RECHAZADA: "RECHAZADA",
	ERROR: "ERROR",
	DESCONOCIDO: "DESCONOCIDO"
});
function x(e) {
	return e == null ? "" : String(e).replace(/\D/g, "");
}
function S({ apiBase: i, codigoInvitacion: a, parametroCodigo: o = "codigo", campoNumeroWhatsapp: s = "NumeroWhatsAppConfirmacion" } = {}) {
	let [c, u] = r(null), [p, m] = r(!0), [h, S] = r(!1), [C, w] = r(null), [T, E] = r(""), [D, O] = r(1), [k, A] = r(!1), j = n(() => {
		try {
			return {
				codigo: g({
					codigoInvitacion: a,
					parametro: o
				}),
				error: null
			};
		} catch (e) {
			return {
				codigo: null,
				error: e
			};
		}
	}, [a, o]), M = j.codigo, N = e(async ({ signal: e } = {}) => {
		if (w(null), E(""), j.error || !M) return u(null), A(!1), w(j.error?.message || "No se encontró el código de invitación."), m(!1), null;
		try {
			m(!0);
			let t = await l({
				apiBase: i,
				codigoInvitacion: M,
				signal: e
			});
			u(t), A(t?.IsConfirmacionPersonalizada === !0);
			let n = Number(t?.NumeroPases) || 0, r = Number(t?.NumeroPasesConfirmados) || 0;
			return t?.ClaveEstatus === v && r > 0 ? O(r) : O(+(n > 0)), t;
		} catch (e) {
			return e?.name === "AbortError" ? null : (u(null), w(e?.message || "No fue posible cargar la invitación."), null);
		} finally {
			e?.aborted || m(!1);
		}
	}, [
		i,
		M,
		j.error
	]);
	t(() => {
		let e = new AbortController();
		return N({ signal: e.signal }), () => {
			e.abort();
		};
	}, [N]);
	let P = c?.ClaveEstatus ?? null, F = P === _, I = P === v, L = P === y, R = k, z = Number(c?.NumeroPases) || 0, B = Number(c?.NumeroPasesConfirmados) || 0, V = Math.max(z - B, 0), H = x(c?.[s] ?? null), U = typeof c?.CodigoInvitacion == "string" ? c.CodigoInvitacion.trim() : null, W = I && c?.MostrarQrAcceso === !0 && !!U, G = b.DESCONOCIDO;
	p ? G = b.CARGANDO : C && !c ? G = b.ERROR : F ? G = R ? b.PERSONALIZADA : b.WHATSAPP : I ? G = b.ACEPTADA : L && (G = b.RECHAZADA);
	let K = !!c && R && (F || I || L), q = e((e) => {
		let t = Number(e);
		return Number.isInteger(t) ? t < 1 ? {
			valido: !1,
			mensaje: "Debes seleccionar al menos un pase."
		} : t > z ? {
			valido: !1,
			mensaje: `Puedes seleccionar máximo ${z} pase(s).`
		} : {
			valido: !0,
			mensaje: null,
			pases: t
		} : {
			valido: !1,
			mensaje: "El número de pases debe ser un entero."
		};
	}, [z]), J = e(async (e) => {
		if (!c) return w("No hay una invitación cargada."), null;
		if (h) return null;
		if (!k) return w("La confirmación personalizada no está disponible."), null;
		let t = q(e === void 0 ? D : e);
		if (!t.valido) return w(t.mensaje), null;
		try {
			S(!0), w(null), E("");
			let e = await d({
				apiBase: i,
				codigoInvitacion: M,
				numeroPasesConfirmados: t.pases
			});
			return u((t) => ({
				...t,
				...e,
				IsConfirmacionPersonalizada: k
			})), O(Number(e?.NumeroPasesConfirmados) || t.pases), E("Tu asistencia fue confirmada correctamente."), e;
		} catch (e) {
			return w(e?.message || "No fue posible confirmar tu asistencia."), null;
		} finally {
			S(!1);
		}
	}, [
		i,
		M,
		k,
		h,
		c,
		D,
		q
	]), Y = e(async () => {
		if (!c) return w("No hay una invitación cargada."), null;
		if (h) return null;
		if (!k) return w("La confirmación personalizada no está disponible."), null;
		try {
			S(!0), w(null), E("");
			let e = await f({
				apiBase: i,
				codigoInvitacion: M
			});
			return u((t) => ({
				...t,
				...e,
				IsConfirmacionPersonalizada: k,
				NumeroPasesConfirmados: 0,
				ClaveEstatus: e?.ClaveEstatus || y
			})), O(0), E("Tu respuesta fue registrada correctamente."), e;
		} catch (e) {
			return w(e?.message || "No fue posible registrar tu respuesta."), null;
		} finally {
			S(!1);
		}
	}, [
		i,
		M,
		k,
		h,
		c
	]), X = e((e) => {
		let t = q(e);
		if (!t.valido) throw Error(t.mensaje);
		let n = t.pases, r = c?.Nombre || "Invitado", i = c?.NombreEvento, a = [];
		return a.push(`Hola, soy ${r}.`), i ? a.push(`Confirmo mi asistencia a ${i}.`) : a.push("Confirmo mi asistencia al evento."), a.push(n === 1 ? "Asistiré 1 persona." : `Asistiremos ${n} personas.`), a.join("\n");
	}, [c, q]), Z = e(({ cantidad: e, mensaje: t } = {}) => {
		if (!c) throw Error("No hay una invitación cargada.");
		if (!F || R) throw Error("La confirmación por WhatsApp no está disponible.");
		if (!H) throw Error("No se configuró el número de WhatsApp para la confirmación.");
		let n = q(e === void 0 ? D : e);
		if (!n.valido) throw Error(n.mensaje);
		let r = typeof t == "string" && t.trim() ? t.trim() : X(n.pases);
		return `https://wa.me/${H}?text=${encodeURIComponent(r)}`;
	}, [
		X,
		F,
		c,
		R,
		D,
		H,
		q
	]), Q = e(({ cantidad: e, mensaje: t } = {}) => {
		try {
			w(null), E("");
			let n = Z({
				cantidad: e,
				mensaje: t
			});
			if (typeof window > "u") throw Error("WhatsApp solo puede abrirse desde el navegador.");
			return window.open(n, "_blank", "noopener,noreferrer"), n;
		} catch (e) {
			return w(e?.message || "No fue posible abrir WhatsApp."), null;
		}
	}, [Z]), $ = e(() => {
		w(null), E("");
	}, []);
	return {
		invitacion: c,
		codigoInvitacion: M,
		claveEstatus: P,
		cargando: p,
		guardando: h,
		error: C,
		mensaje: T,
		estaPendiente: F,
		estaAceptada: I,
		estaRechazada: L,
		modo: G,
		isConfirmacionPersonalizada: R,
		puedeResponderPersonalizada: K,
		numeroPases: z,
		numeroPasesConfirmados: B,
		numeroPasesRestantes: V,
		numeroPasesSeleccionados: D,
		setNumeroPasesSeleccionados: O,
		validarPases: q,
		confirmar: J,
		rechazar: Y,
		numeroWhatsapp: H,
		crearMensajeWhatsapp: X,
		crearUrlWhatsapp: Z,
		abrirWhatsapp: Q,
		mostrarQr: W,
		codigoQr: U,
		limpiarMensajes: $,
		refrescar: N
	};
}
//#endregion
export { i as RSVPApiError, p as RSVPCodigoInvitacionError, b as RSVP_MODOS, d as aceptarInvitacion, l as consultarInvitacionPublica, m as normalizarCodigoInvitacion, h as obtenerCodigoInvitacionDesdeURL, f as rechazarInvitacion, g as resolverCodigoInvitacion, u as responderInvitacionPublica, S as useRSVP };

//# sourceMappingURL=invitamore-rsvp-react.js.map