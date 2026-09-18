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
function s(e) {
	if (e == null || String(e).trim() === "") throw new i("El IdEvento es obligatorio.");
	return String(e).trim();
}
async function c(e) {
	let t;
	try {
		t = await e.json();
	} catch {
		throw new i("El servidor devolvió una respuesta inválida.", e.status);
	}
	return t;
}
async function l(e) {
	let t = await c(e);
	if (!e.ok || t?.status !== "ok") throw new i(t?.message || "No fue posible completar la operación.", e.status, t);
	return t;
}
async function u({ apiBase: e, codigoInvitacion: t, IdEvento: n, signal: r }) {
	let c = a(e), u = o(t), d = s(n), f = `${c}/invitaciones/publicas/${encodeURIComponent(u)}?IdEvento=` + encodeURIComponent(d), p;
	try {
		p = await fetch(f, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: r
		});
	} catch (e) {
		throw e?.name === "AbortError" ? e : new i("No fue posible conectar con el servidor.");
	}
	let m = await l(p);
	if (!m?.data) throw new i("El servidor no devolvió los datos de la invitación.", p.status, m);
	return m.data;
}
async function d({ apiBase: e, codigoInvitacion: t, IdEvento: n, respuesta: r, numeroPasesConfirmados: c }) {
	let u = a(e), d = o(t), f = s(n);
	if (r !== "ACEPTADA" && r !== "RECHAZADA") throw new i("La respuesta debe ser ACEPTADA o RECHAZADA.");
	let p;
	if (r === "RECHAZADA") p = 0;
	else {
		if (p = Number(c), !Number.isInteger(p)) throw new i("El número de pases confirmados debe ser un entero.");
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
				IdEvento: f,
				respuesta: r,
				numeroPasesConfirmados: p
			})
		});
	} catch {
		throw new i("No fue posible conectar con el servidor.");
	}
	let g = await l(h), _ = g?.data?.invitacion;
	if (!_) throw new i("El servidor no devolvió la invitación actualizada.", h.status, g);
	return _;
}
async function f({ apiBase: e, codigoInvitacion: t, IdEvento: n, numeroPasesConfirmados: r }) {
	return d({
		apiBase: e,
		codigoInvitacion: t,
		IdEvento: n,
		respuesta: "ACEPTADA",
		numeroPasesConfirmados: r
	});
}
async function p({ apiBase: e, codigoInvitacion: t, IdEvento: n }) {
	return d({
		apiBase: e,
		codigoInvitacion: t,
		IdEvento: n,
		respuesta: "RECHAZADA",
		numeroPasesConfirmados: 0
	});
}
//#endregion
//#region src/utils/invitationCode.js
var m = class extends Error {
	constructor(e) {
		super(e), this.name = "RSVPCodigoInvitacionError";
	}
};
function h(e) {
	if (e == null) throw new m("No se encontró el código de invitación.");
	if (typeof e != "string") throw new m("El código de invitación debe ser una cadena de texto.");
	let t = e.trim();
	if (!t) throw new m("No se encontró el código de invitación.");
	if (t.length > 100) throw new m("El código de invitación no puede superar los 100 caracteres.");
	return t;
}
function g({ parametro: e = "codigo", search: t } = {}) {
	if (typeof e != "string" || !e.trim()) throw new m("El nombre del parámetro de la URL no es válido.");
	let n;
	if (typeof t == "string") n = t;
	else {
		if (typeof window > "u") throw new m("No es posible obtener el código de invitación fuera del navegador sin proporcionar una URL.");
		n = window.location.search;
	}
	return h(new URLSearchParams(n).get(e.trim()));
}
function _({ codigoInvitacion: e, parametro: t = "codigo", search: n } = {}) {
	return e == null ? g({
		parametro: t,
		search: n
	}) : h(e);
}
//#endregion
//#region src/hooks/useRSVP.js
var v = "PENDIENTE", y = "ACEPTADA", b = "RECHAZADA", x = Object.freeze({
	CARGANDO: "CARGANDO",
	PERSONALIZADA: "PERSONALIZADA",
	WHATSAPP: "WHATSAPP",
	ACEPTADA: "ACEPTADA",
	RECHAZADA: "RECHAZADA",
	ERROR: "ERROR",
	DESCONOCIDO: "DESCONOCIDO"
});
function S(e) {
	return e == null ? "" : String(e).replace(/\D/g, "");
}
function C({ apiBase: i, IdEvento: a, codigoInvitacion: o, parametroCodigo: s = "codigo", campoNumeroWhatsapp: c = "NumeroWhatsAppConfirmacion" } = {}) {
	let [l, d] = r(null), [m, h] = r(!0), [g, C] = r(!1), [w, T] = r(null), [E, D] = r(""), [O, k] = r(1), [A, j] = r(!1), M = n(() => {
		try {
			return {
				codigo: _({
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
		if (T(null), D(""), M.error || !N) return d(null), j(!1), T(M.error?.message || "No se encontró el código de invitación."), h(!1), null;
		try {
			h(!0);
			let t = await u({
				apiBase: i,
				codigoInvitacion: N,
				IdEvento: a,
				signal: e
			});
			d(t), j(t?.IsConfirmacionPersonalizada === !0);
			let n = Number(t?.NumeroPases) || 0, r = Number(t?.NumeroPasesConfirmados) || 0;
			return t?.ClaveEstatus === y && r > 0 ? k(r) : k(+(n > 0)), t;
		} catch (e) {
			return e?.name === "AbortError" ? null : (d(null), T(e?.message || "No fue posible cargar la invitación."), null);
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
	let F = l?.ClaveEstatus ?? null, I = F === v, L = F === y, R = F === b, z = A, B = Number(l?.NumeroPases) || 0, V = Number(l?.NumeroPasesConfirmados) || 0, H = Math.max(B - V, 0), U = S(l?.[c] ?? null), W = typeof l?.CodigoInvitacion == "string" ? l.CodigoInvitacion.trim() : null, G = L && l?.MostrarQrAcceso === !0 && !!W, K = x.DESCONOCIDO;
	m ? K = x.CARGANDO : w && !l ? K = x.ERROR : I ? K = z ? x.PERSONALIZADA : x.WHATSAPP : L ? K = x.ACEPTADA : R && (K = x.RECHAZADA);
	let q = !!l && z && (I || L || R), J = e((e) => {
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
	}, [B]), Y = e(async (e) => {
		if (!l) return T("No hay una invitación cargada."), null;
		if (g) return null;
		if (!A) return T("La confirmación personalizada no está disponible."), null;
		let t = J(e === void 0 ? O : e);
		if (!t.valido) return T(t.mensaje), null;
		try {
			C(!0), T(null), D("");
			let e = await f({
				apiBase: i,
				codigoInvitacion: N,
				IdEvento: a,
				numeroPasesConfirmados: t.pases
			});
			return d((t) => ({
				...t,
				...e,
				IsConfirmacionPersonalizada: A
			})), k(Number(e?.NumeroPasesConfirmados) || t.pases), D("Tu asistencia fue confirmada correctamente."), e;
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
		g,
		l,
		O,
		J
	]), X = e(async () => {
		if (!l) return T("No hay una invitación cargada."), null;
		if (g) return null;
		if (!A) return T("La confirmación personalizada no está disponible."), null;
		try {
			C(!0), T(null), D("");
			let e = await p({
				apiBase: i,
				codigoInvitacion: N,
				IdEvento: a
			});
			return d((t) => ({
				...t,
				...e,
				IsConfirmacionPersonalizada: A,
				NumeroPasesConfirmados: 0,
				ClaveEstatus: e?.ClaveEstatus || b
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
		g,
		l
	]), Z = e((e) => {
		let t = J(e);
		if (!t.valido) throw Error(t.mensaje);
		let n = t.pases, r = l?.Nombre || "Invitado", i = l?.NombreEvento, a = [];
		return a.push(`Hola, soy ${r}.`), i ? a.push(`Confirmo mi asistencia a ${i}.`) : a.push("Confirmo mi asistencia al evento."), a.push(n === 1 ? "Asistiré 1 persona." : `Asistiremos ${n} personas.`), a.join("\n");
	}, [l, J]), Q = e(({ cantidad: e, mensaje: t } = {}) => {
		if (!l) throw Error("No hay una invitación cargada.");
		if (!I || z) throw Error("La confirmación por WhatsApp no está disponible.");
		if (!U) throw Error("No se configuró el número de WhatsApp para la confirmación.");
		let n = J(e === void 0 ? O : e);
		if (!n.valido) throw Error(n.mensaje);
		let r = typeof t == "string" && t.trim() ? t.trim() : Z(n.pases);
		return `https://wa.me/${U}?text=${encodeURIComponent(r)}`;
	}, [
		Z,
		I,
		l,
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
		invitacion: l,
		codigoInvitacion: N,
		claveEstatus: F,
		cargando: m,
		guardando: g,
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
//#endregion
export { i as RSVPApiError, m as RSVPCodigoInvitacionError, x as RSVP_MODOS, f as aceptarInvitacion, u as consultarInvitacionPublica, h as normalizarCodigoInvitacion, g as obtenerCodigoInvitacionDesdeURL, p as rechazarInvitacion, _ as resolverCodigoInvitacion, d as responderInvitacionPublica, C as useRSVP };

//# sourceMappingURL=invitamore-rsvp-react.js.map