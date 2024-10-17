import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const productsRouter = Router()

productsRouter.get("/info/:code", callController(controller.queryCode))
productsRouter.get("/qr/:code", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))
productsRouter.get("/marcas/:includeNoStock", isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryMarcas))
productsRouter.get("/byMarca/:code/:includeNoStock", isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByMarca))
productsRouter.get("/bySearch/:brand/:search", isAuth, checkPermissions(["visor-de-precios"]), callController(controller.productsBySearch))
productsRouter.post("/redirect",  callController(controller.redirect))
productsRouter.post("/jspdf",  callController(controller.JSPDF))



export default productsRouter