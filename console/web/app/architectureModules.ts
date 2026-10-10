/** Content mirrors docs/architecture.svg and the console contract. Nothing here is invented. */

export interface ArchitectureModule {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  connections: readonly string[];
}

export const REPLICA_MODULES: readonly ArchitectureModule[] = [
  {
    id: "server",
    name: "http/server.ts",
    role: "Adaptador HTTP",
    responsibility: "Único adaptador de I/O. Autenticación Bearer y rutas /health, /__reset y /msg; responde con el encabezado X-Req.",
    connections: ["1 · recibe HTTPS del cliente", "2 · valida con protocol/parse.ts", "6 · devuelve status + JSON"],
  },
  {
    id: "parse",
    name: "protocol/parse.ts",
    role: "Validación",
    responsibility: "Analiza y valida el mensaje en orden: E201 → E202 → E301 → E302. Usa el dígito de control como auxiliar.",
    connections: ["3 · usa control/iso7064.ts", "4 · ejecuta en bank/commands.ts si es válido"],
  },
  {
    id: "iso7064",
    name: "control/iso7064.ts",
    role: "Auxiliar",
    responsibility: "Cálculo del dígito de control ISO 7064 MOD 97-10. Módulo puro, sin I/O.",
    connections: ["usado por protocol/parse.ts"],
  },
  {
    id: "commands",
    name: "bank/commands.ts",
    role: "Lógica de dominio",
    responsibility: "Los 6 comandos del banco. Puro y síncrono: valida todo antes de mutar el estado.",
    connections: ["5 · lee/escribe bank/state.ts"],
  },
  {
    id: "state",
    name: "bank/state.ts",
    role: "Estado",
    responsibility: "Estado en memoria: cuentas y operaciones. Determinista tras POST /__reset.",
    connections: ["usado por bank/commands.ts"],
  },
  {
    id: "errors",
    name: "protocol/errors.ts",
    role: "Compartido",
    responsibility: "Catálogo de errores, compartido por el análisis (parse) y los comandos. Único lugar con los cuerpos de error.",
    connections: ["usado por protocol/parse.ts", "usado por bank/commands.ts"],
  },
];

export const CONSOLE_PATH: readonly ArchitectureModule[] = [
  {
    id: "browser",
    name: "Navegador",
    role: "Consola web",
    responsibility: "Esta interfaz. Guarda el id de sesión solo en memoria; nunca recibe el token interno del sandbox.",
    connections: ["envía solicitudes al BFF"],
  },
  {
    id: "bff",
    name: "BFF",
    role: "Backend-for-frontend",
    responsibility: "Crea sesiones aleatorias, aplica los límites del sandbox y reenvía únicamente a sus propias réplicas en loopback.",
    connections: ["reenvía a la réplica de la sesión"],
  },
  {
    id: "sandbox",
    name: "Réplica por sesión",
    role: "createServer() en 127.0.0.1",
    responsibility: "Una réplica real del servidor por sesión, con token interno propio. Nunca se contacta el servicio original.",
    connections: ["ejecuta la misma cadena http → parse → commands → state"],
  },
];
