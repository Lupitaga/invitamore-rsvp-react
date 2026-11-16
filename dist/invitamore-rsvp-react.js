import { useCallback as e, useEffect as t, useMemo as n, useState as r } from "react";
// src/api/rsvpApi.js
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
async function l({ apiBase: e, codigoInvitacion: t, IdEvento: n, signal: r }) {
	let s = a(e), l = o(t), u = `${s}/invitaciones/publicas/${encodeURIComponent(l)}` + (n == null ? "" : `?IdEvento=${encodeURIComponent(n)}`), d;
	try {
		d = await fetch(u, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: r
		});
	} catch (e) {
		throw e?.name === "AbortError" ? e : new i("No fue posible conectar con el servidor.");
	}
	let f = await c(d);
	if (!f?.data) throw new i("El servidor no devolvió los datos de la invitación.", d.status, f);
	return f.data;
}
async function u({ apiBase: e, codigoInvitacion: t, IdEvento: n, respuesta: r, numeroPasesConfirmados: s, Mensaje: l = null }) {
	let u = a(e), d = o(t), f = n == null ? null : n.trim();
	if (r !== "ACEPTADA" && r !== "RECHAZADA") throw new i("La respuesta debe ser ACEPTADA o RECHAZADA.");
	let p;
	if (r === "RECHAZADA") p = 0;
	else {
		if (p = Number(s), !Number.isInteger(p)) throw new i("El número de pases confirmados debe ser un entero.");
		if (p < 1) throw new i("Debes confirmar al menos un pase.");
	}
	let m = `${u}/invitaciones/publicas/${encodeURIComponent(d)}/confirmar`, h;
	try {
		h = await fetch(m, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				...f == null ? {} : { IdEvento: f },
				respuesta: r,
				numeroPasesConfirmados: p,
				Mensaje: l ?? null
			})
		});
	} catch {
		throw new i("No fue posible conectar con el servidor.");
	}
	let g = await c(h), _ = g?.data?.invitacion;
	if (!_) throw new i("El servidor no devolvió la invitación actualizada.", h.status, g);
	return _;
}
async function d({ apiBase: e, codigoInvitacion: t, IdEvento: n, numeroPasesConfirmados: r, Mensaje: i = null }) {
	return u({
		apiBase: e,
		codigoInvitacion: t,
		IdEvento: n,
		respuesta: "ACEPTADA",
		numeroPasesConfirmados: r,
		Mensaje: i
	});
}
async function f({ apiBase: e, codigoInvitacion: t, IdEvento: n }) {
	return u({
		apiBase: e,
		codigoInvitacion: t,
		IdEvento: n,
		respuesta: "RECHAZADA",
		numeroPasesConfirmados: 0,
		Mensaje: null
	});
}
// src/utils/invitationCode.js
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
// src/hooks/useRSVP.js
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
function S({ apiBase: i, IdEvento: a, codigoInvitacion: o, parametroCodigo: s = "codigo", campoNumeroWhatsapp: c = "NumeroWhatsAppConfirmacion" } = {}) {
	let [u, p] = r(null), [m, h] = r(!0), [S, C] = r(!1), [w, T] = r(null), [E, D] = r(""), [O, k] = r(1), [A, j] = r(!1), M = n(() => {
		try {
			return {
				codigo: g({
					codigoInvitacion: o,
					parametro: s
				}),
				error: null
			};
		} catch (e) {
			return {
				codigo: null,
				error: e
			};
		}
	}, [o, s]), N = M.codigo, P = e(async ({ signal: e } = {}) => {
		if (T(null), D(""), M.error || !N) return p(null), j(!1), T(M.error?.message || "No se encontró el código de invitación."), h(!1), null;
		try {
			h(!0);
			let t = await l({
				apiBase: i,
				codigoInvitacion: N,
				IdEvento: a,
				signal: e
			});
			p(t), j(t?.IsConfirmacionPersonalizada === !0);
			let n = Number(t?.NumeroPases) || 0, r = Number(t?.NumeroPasesConfirmados) || 0;
			return t?.ClaveEstatus === v && r > 0 ? k(r) : k(+(n > 0)), t;
		} catch (e) {
			return e?.name === "AbortError" || (p(null), T(e?.message || "No fue posible cargar la invitación.")), null;
		} finally {
			e?.aborted || h(!1);
		}
	}, [
		i,
		N,
		a,
		M.error
	]);
	t(() => {
		let e = new AbortController();
		return P({ signal: e.signal }), () => {
			e.abort();
		};
	}, [P]);
	let F = u?.ClaveEstatus ?? null, I = F === _, L = F === v, R = F === y, z = A, B = Number(u?.NumeroPases) || 0, V = Number(u?.NumeroPasesConfirmados) || 0, H = Math.max(B - V, 0), U = x(u?.[c] ?? null), W = typeof u?.CodigoInvitacion == "string" ? u.CodigoInvitacion.trim() : null, G = L && u?.MostrarQrAcceso === !0 && !!W, K = b.DESCONOCIDO;
	m ? K = b.CARGANDO : w && !u ? K = b.ERROR : I ? K = z ? b.PERSONALIZADA : b.WHATSAPP : L ? K = b.ACEPTADA : R && (K = b.RECHAZADA);
	let q = !!u && z && (I || L || R), J = e((e) => {
		let t = Number(e);
		return Number.isInteger(t) ? t < 1 ? {
			valido: !1,
			mensaje: "Debes seleccionar al menos un pase."
		} : t > B ? {
			valido: !1,
			mensaje: `Puedes seleccionar máximo ${B} pase(s).`
		} : {
			valido: !0,
			mensaje: null,
			pases: t
		} : {
			valido: !1,
			mensaje: "El número de pases debe ser un entero."
		};
	}, [B]), Y = e(async (e, t = null) => {
		if (!u) return T("No hay una invitación cargada."), null;
		if (S) return null;
		if (!A) return T("La confirmación personalizada no está disponible."), null;
		let n = J(e === void 0 ? O : e);
		if (!n.valido) return T(n.mensaje), null;
		try {
			C(!0), T(null), D("");
			let e = typeof t == "string" ? t.trim() : null, r = await d({
				apiBase: i,
				codigoInvitacion: N,
				IdEvento: a,
				numeroPasesConfirmados: n.pases,
				Mensaje: e
			});
			return p((e) => ({
				...e,
				...r,
				IsConfirmacionPersonalizada: A
			})), k(Number(r?.NumeroPasesConfirmados) || n.pases), D("Tu asistencia fue confirmada correctamente."), r;
		} catch (e) {
			return T(e?.message || "No fue posible confirmar tu asistencia."), null;
		} finally {
			C(!1);
		}
	}, [
		i,
		N,
		a,
		A,
		S,
		u,
		O,
		J
	]), X = e(async () => {
		if (!u) return T("No hay una invitación cargada."), null;
		if (S) return null;
		if (!A) return T("La confirmación personalizada no está disponible."), null;
		try {
			C(!0), T(null), D("");
			let e = await f({
				apiBase: i,
				codigoInvitacion: N,
				IdEvento: a
			});
			return p((t) => ({
				...t,
				...e,
				IsConfirmacionPersonalizada: A,
				NumeroPasesConfirmados: 0,
				ClaveEstatus: e?.ClaveEstatus || y
			})), k(0), D("Tu respuesta fue registrada correctamente."), e;
		} catch (e) {
			return T(e?.message || "No fue posible registrar tu respuesta."), null;
		} finally {
			C(!1);
		}
	}, [
		i,
		N,
		a,
		A,
		S,
		u
	]), Z = e((e) => {
		let t = J(e);
		if (!t.valido) throw Error(t.mensaje);
		let n = t.pases, r = u?.Nombre || "Invitado", i = u?.NombreEvento, a = [];
		return a.push(`Hola, soy ${r}.`), i ? a.push(`Confirmo mi asistencia a ${i}.`) : a.push("Confirmo mi asistencia al evento."), a.push(n === 1 ? "Asistiré 1 persona." : `Asistiremos ${n} personas.`), a.join("\n");
	}, [u, J]), Q = e(({ cantidad: e, mensaje: t } = {}) => {
		if (!u) throw Error("No hay una invitación cargada.");
		if (!I || z) throw Error("La confirmación por WhatsApp no está disponible.");
		if (!U) throw Error("No se configuró el número de WhatsApp para la confirmación.");
		let n = J(e === void 0 ? O : e);
		if (!n.valido) throw Error(n.mensaje);
		let r = typeof t == "string" && t.trim() ? t.trim() : Z(n.pases);
		return `https://wa.me/${U}?text=${encodeURIComponent(r)}`;
	}, [
		Z,
		I,
		u,
		z,
		O,
		U,
		J
	]), $ = e(({ cantidad: e, mensaje: t } = {}) => {
		try {
			T(null), D("");
			let n = Q({
				cantidad: e,
				mensaje: t
			});
			if (typeof window > "u") throw Error("WhatsApp solo puede abrirse desde el navegador.");
			return window.open(n, "_blank", "noopener,noreferrer"), n;
		} catch (e) {
			return T(e?.message || "No fue posible abrir WhatsApp."), null;
		}
	}, [Q]), ee = e(() => {
		T(null), D("");
	}, []);
	return {
		invitacion: u,
		codigoInvitacion: N,
		claveEstatus: F,
		cargando: m,
		guardando: S,
		error: w,
		mensaje: E,
		estaPendiente: I,
		estaAceptada: L,
		estaRechazada: R,
		modo: K,
		isConfirmacionPersonalizada: z,
		puedeResponderPersonalizada: q,
		numeroPases: B,
		numeroPasesConfirmados: V,
		numeroPasesRestantes: H,
		numeroPasesSeleccionados: O,
		setNumeroPasesSeleccionados: k,
		validarPases: J,
		confirmar: Y,
		rechazar: X,
		numeroWhatsapp: U,
		crearMensajeWhatsapp: Z,
		crearUrlWhatsapp: Q,
		abrirWhatsapp: $,
		mostrarQr: G,
		codigoQr: W,
		limpiarMensajes: ee,
		refrescar: P
	};
}
export { i as RSVPApiError, p as RSVPCodigoInvitacionError, b as RSVP_MODOS, d as aceptarInvitacion, l as consultarInvitacionPublica, m as normalizarCodigoInvitacion, h as obtenerCodigoInvitacionDesdeURL, f as rechazarInvitacion, g as resolverCodigoInvitacion, u as responderInvitacionPublica, S as useRSVP };

//# sourceMappingURL=invitamore-rsvp-react.js.map