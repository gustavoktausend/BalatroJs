import { app } from "./app.js";
import { mostrarTela } from "./ui/screens.js";
import { iniciarFundo } from "./ui/fundo.js";

app.renderizar = mostrarTela;
iniciarFundo();
mostrarTela(null);
