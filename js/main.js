import { app } from "./app.js";
import { mostrarTela, mostrarTabelaMaos } from "./ui/screens.js";
import { iniciarFundo } from "./ui/fundo.js";

app.renderizar = mostrarTela;
app.mostrarTabelaMaos = mostrarTabelaMaos;
iniciarFundo();
mostrarTela(null);
