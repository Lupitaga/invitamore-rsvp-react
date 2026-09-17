/**
 * ============================================================
 * INVITAMORE RSVP
 * Configuración de compilación de la librería
 * ============================================================
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {
  fileURLToPath,
  URL,
} from "node:url";

export default defineConfig({
  /**
   * Permitimos JSX / React dentro de la librería.
   */
  plugins: [
    react(),
  ],

  build: {
    /**
     * ========================================================
     * LIBRARY MODE
     * ========================================================
     *
     * Le indicamos a Vite que genere una librería
     * reutilizable y no una aplicación HTML.
     */
    lib: {
      /**
       * Punto de entrada:
       *
       * src/index.js
       */
      entry: fileURLToPath(
        new URL(
          "./src/index.js",
          import.meta.url
        )
      ),

      /**
       * Nombre interno de la librería.
       */
      name: "InvitamoreRSVP",

      /**
       * Utilizamos ES Modules porque todos nuestros
       * proyectos React/Vite los soportan.
       */
      formats: [
        "es",
      ],

      /**
       * Archivo que aparecerá en /dist
       */
      fileName: () =>
        "invitamore-rsvp-react.js",
    },

    /**
     * Generar source map ayuda durante desarrollo
     * si posteriormente tenemos que rastrear errores.
     */
    sourcemap: true,

    /**
     * Limpiar dist antes de cada compilación.
     */
    emptyOutDir: true,

    rollupOptions: {
      /**
       * ======================================================
       * REACT NO DEBE EMPAQUETARSE DENTRO
       * ======================================================
       *
       * Cada proyecto consumidor ya tiene React.
       *
       * No queremos meter una segunda copia de React
       * dentro de @invitamore/rsvp-react.
       */
      external: [
        "react",
        "react-dom",
      ],
    },
  },
});