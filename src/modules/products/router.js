import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const productsRouter = Router()

productsRouter.get("/info/:code", callController(controller.queryCode))
productsRouter.post("/qr/:code", isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))
productsRouter.post("/marcas", isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryMarcas))
productsRouter.post("/byMarca/:code", isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByMarca))
productsRouter.get("/bySearch/:brand/:search", isAuth, checkPermissions(["visor-de-precios"]), callController(controller.productsBySearch))
productsRouter.post("/redirect",  callController(controller.redirect))
productsRouter.post("/jspdf",  callController(controller.JSPDF))
productsRouter.get("/price-lists",  callController(controller.getPriceLists))



export default productsRouter