"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
var socket_io_1 = require("socket.io");
var gateway_1 = require("../dataaccess/gateway");
var jwtFunctions_1 = require("./jwtFunctions");
var raptoreumCoreFunctions_1 = require("./raptoreumCoreFunctions");
var http = require("http");
var speakeasy = require('speakeasy');
var axios_1 = require("axios");
var tokenExpresion = /^[a-zA-Z0-9._-]*$/;
var addressExpresion = /^[a-zA-Z0-9]*$/;
function getFromCache(key, client) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.get(key)];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data ? JSON.parse(data) : null];
            }
        });
    });
}
function setInCache(key, value, client) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: // 1 hour expiration by defa>
                return [4 /*yield*/, client.set(key, JSON.stringify(value))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var RateLimiter = /** @class */ (function () {
    function RateLimiter(capacity, refillRate) {
        this.tokens = capacity;
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.lastRefillTime = Date.now();
    }
    RateLimiter.prototype.consume = function (amount, userId) {
        this.refill();
        console.log("consumiendo");
        if (this.tokens >= amount) {
            this.tokens -= amount;
            return true;
        }
        console.log("Rate limit exceeded for user ".concat(userId));
        return false;
    };
    RateLimiter.prototype.refill = function () {
        var now = Date.now();
        var elapsed = (now - this.lastRefillTime) / 1000;
        var refillAmount = Math.min(this.capacity - this.tokens, this.refillRate * elapsed);
        this.tokens += refillAmount;
        this.lastRefillTime = now;
    };
    return RateLimiter;
}());
var socketService = /** @class */ (function () {
    function socketService() {
        var _this = this;
        this.gateway = gateway_1.UserGateway.getInstance();
        this.raptoreumCore = raptoreumCoreFunctions_1.raptoreumCoreAccess.getInstance();
        this.rateLimiters = {};
        this.io = new socket_io_1.Server(http.createServer().listen(3000), {
            cors: {
                origin: ["https://raptoreumworld.com"],
                methods: ["GET", "POST"],
                credentials: false,
            },
        });
        this.io.on("connection", function (socket) { return __awaiter(_this, void 0, void 0, function () {
            var socketId, object, subject, user;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        socketId = socket.id;
                        if (!this.rateLimiters[socketId]) {
                            this.rateLimiters[socketId] = new RateLimiter(1, 1 / 3);
                        }
                        socket.on('disconnect', function () {
                            delete _this.rateLimiters[socketId];
                        });
                        object = JSON.parse(socket.handshake.query.object);
                        subject = object.subject.trim();
                        user = object.token;
                        console.log("conectado en", " ", 3000);
                        if (!this.rateLimiters[socketId]) {
                            this.rateLimiters[socketId] = new RateLimiter(1, 1 / 3);
                        }
                        socket.on('disconnect', function () {
                            delete _this.rateLimiters[socketId];
                        });
                        if (!(subject === "assetsmarket" || subject === "nftmarket")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.handleMarket(subject, socket, socketId, user)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        socket.on('assetToMarket', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var asset, price, healh, result, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        asset = data.asset;
                                        price = parseFloat(data.price);
                                        //console.log(data)
                                        // Verificar si `price` es un número válido y está dentro del rango permitido
                                        if (isNaN(price) || price <= 0 || price > 1000000000) {
                                            return [2 /*return*/, "notValidPrice"];
                                        }
                                        if (!asset || asset.length < 1 || asset.length > 250) {
                                            return [2 /*return*/, "invalidParameters"];
                                        }
                                        return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 1:
                                        healh = _a.sent();
                                        if (healh == "error") {
                                            return [2 /*return*/, socket.emit("serverDown")];
                                        }
                                        else if (healh == "dead") {
                                            return [2 /*return*/, socket.emit("serverDown")];
                                        }
                                        if (!this.rateLimiters[socketId].consume(1, user)) {
                                            return [2 /*return*/];
                                        }
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, this.assetToMarket(data.asset, data.token, data.price, data.totp)];
                                    case 3:
                                        result = _a.sent();
                                        if (result) {
                                            socket.emit("successAssetToMarket", result);
                                            this.io.sockets.emit("newAssetInMarket", result);
                                            return [2 /*return*/];
                                        }
                                        return [3 /*break*/, 5];
                                    case 4:
                                        e_1 = _a.sent();
                                        if (e_1 === "invalidTOTP") {
                                            return [2 /*return*/, socket.emit("invalidTOTP")];
                                        }
                                        else if (e_1 === "errorTOTP") {
                                            return [2 /*return*/, socket.emit("errorTOTP")];
                                        }
                                        return [2 /*return*/, socket.emit("assetToMarketError", e_1)];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('detenerVenta', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var healh, tokenValido, usuario, encontrado, NFTenVentaPorElUsuario, enVentaPorElUsuario, resultDetenerVenta, resultDetenerVenta, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!this.rateLimiters[socketId].consume(1, user)) {
                                            return [2 /*return*/];
                                        }
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 19, , 20]);
                                        return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 2:
                                        healh = _a.sent();
                                        if (healh == "error") {
                                            return [2 /*return*/, socket.emit("serverDown")];
                                        }
                                        else if (healh == "dead") {
                                            return [2 /*return*/, socket.emit("serverDown")];
                                        }
                                        console.log("DATA QUE LLEGA PARA DETENER VENTA:", data);
                                        if (!tokenExpresion.test(data.token)) return [3 /*break*/, 18];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 3:
                                        tokenValido = _a.sent();
                                        if (!(tokenValido != "expired" && tokenValido != "error")) return [3 /*break*/, 17];
                                        console.log("TOKEN VALIDO");
                                        usuario = tokenValido.userid;
                                        console.log("pasando a verifyaccountblocked");
                                        return [4 /*yield*/, this.gateway];
                                    case 4: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(usuario)];
                                    case 5:
                                        encontrado = _a.sent();
                                        console.log("RESULTADO DE LA BUSQUEDA DEL USUARIO EN CUENTAS BLOQUEADAS:", encontrado);
                                        if (!(encontrado === false)) return [3 /*break*/, 16];
                                        console.log("data con la que revisar token en venta por el usuario:", data);
                                        return [4 /*yield*/, this.gateway];
                                    case 6: return [4 /*yield*/, (_a.sent()).verifyNftEnVenta(data.asset, usuario, data.ventaId)];
                                    case 7:
                                        NFTenVentaPorElUsuario = _a.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 8: return [4 /*yield*/, (_a.sent()).verifyTokenEnVenta(data.asset, usuario, data.ventaId)];
                                    case 9:
                                        enVentaPorElUsuario = _a.sent();
                                        if (!(enVentaPorElUsuario && !NFTenVentaPorElUsuario)) return [3 /*break*/, 12];
                                        console.log("asset en venta");
                                        return [4 /*yield*/, this.gateway];
                                    case 10: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, data.ventaId, "asset")];
                                    case 11:
                                        resultDetenerVenta = _a.sent();
                                        if (resultDetenerVenta) {
                                            //enviar el id de la venta y removerlo del market assets en el front
                                            socket.emit("ventaUsuarioDetenida", data.ventaId);
                                            return [2 /*return*/, this.io.sockets.emit("ventaDetenida", data.ventaId)];
                                        }
                                        else {
                                            return [2 /*return*/, socket.emit("errorStoppingSell")];
                                        }
                                        _a.label = 12;
                                    case 12:
                                        if (!(!enVentaPorElUsuario && NFTenVentaPorElUsuario)) return [3 /*break*/, 15];
                                        console.log("nft en venta");
                                        return [4 /*yield*/, this.gateway];
                                    case 13: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, data.ventaId, "nft")];
                                    case 14:
                                        resultDetenerVenta = _a.sent();
                                        if (resultDetenerVenta) {
                                            //enviar el id de la venta y removerlo del market assets en el front
                                            socket.emit("ventaUsuarioDetenida", data.ventaId);
                                            return [2 /*return*/, this.io.sockets.emit("ventaDetenida", data.ventaId)];
                                        }
                                        else {
                                            return [2 /*return*/, socket.emit("errorStoppingSell")];
                                        }
                                        return [3 /*break*/, 16];
                                    case 15:
                                        if (!enVentaPorElUsuario && !NFTenVentaPorElUsuario) {
                                            console.log("EMITIENDO NOT SELLING Y CONSOLEANDO ENVENTAPORELUSUARIO:", enVentaPorElUsuario);
                                            return [2 /*return*/, socket.emit("notSelling")];
                                        }
                                        _a.label = 16;
                                    case 16: return [3 /*break*/, 18];
                                    case 17:
                                        if (tokenValido == "expired") {
                                            return [2 /*return*/, socket.emit("expired")];
                                        }
                                        _a.label = 18;
                                    case 18: return [3 /*break*/, 20];
                                    case 19:
                                        e_2 = _a.sent();
                                        console.log(e_2);
                                        return [3 /*break*/, 20];
                                    case 20: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('compra', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido, isTotp, resultTOTP, result, buyer, accountBlocked, _a, assetsEnVentaDelVendedor, nftEnVentaDelVendedor, _b, _c, _d, itemType, itemEnVenta_1, vendedor, cuentaBloqueadaVendedor, _e, balanceOfVendedor, raptoreumBalanceOfVendedor, balanceOfBuyer, resultGetAssetBalanceOfComprador, _f, _g, _h, isRWS, balanceAssetEnVenta, raptoreumNecesario, blocked, blocked2, insertarVentaVendedor, insertarCompraComprador, pending, retiroCajaChica, _j, raptoreumWithdraw, tokenWithdraw, resultDetenerVenta, e_3, _k, updateBuyer, updateSeller, _l, _m, _o, _p, transaccionPendidente, retirarDeRaptoreumWorld, resultunBlockcomprador, transaccionPendidente, retirarDeRaptoreumWorld, resultunBlockvendedor, error_1;
                            return __generator(this, function (_q) {
                                switch (_q.label) {
                                    case 0:
                                        if (!(tokenExpresion.test(data.token) && typeof (data.cantidad) == "number" && data.cantidad > 0)) return [3 /*break*/, 94];
                                        console.log("pasamos la validacion de parametros");
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 1:
                                        tokenValido = _q.sent();
                                        if (tokenValido === "error")
                                            return [2 /*return*/];
                                        if (tokenValido === "expired")
                                            return [2 /*return*/, socket.emit("expired")];
                                        return [4 /*yield*/, this.isTOTP(tokenValido.userid)];
                                    case 2:
                                        isTotp = _q.sent();
                                        if (isTotp === "error")
                                            return [2 /*return*/];
                                        if (!(isTotp === true)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, this.verifyTOTP(tokenValido.userid, data.totp)];
                                    case 3:
                                        resultTOTP = _q.sent();
                                        if (resultTOTP === false)
                                            return [2 /*return*/, socket.emit("invalidTOTP")];
                                        if (resultTOTP === "error")
                                            return [2 /*return*/, socket.emit("errorTOTP")];
                                        _q.label = 4;
                                    case 4: return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 5:
                                        result = _q.sent();
                                        if (result == "error" || result == "dead") {
                                            return [2 /*return*/, this.handleError(socket, "serverDown", "Server is down")];
                                        }
                                        if (!this.rateLimiters[socketId].consume(1, user)) {
                                            return [2 /*return*/];
                                        }
                                        console.log("La cadena es válida");
                                        buyer = tokenValido.userid;
                                        return [4 /*yield*/, this.gateway];
                                    case 6: return [4 /*yield*/, (_q.sent()).verifyAccountBlocked(buyer)];
                                    case 7:
                                        accountBlocked = _q.sent();
                                        if (accountBlocked !== "error" && accountBlocked === true) {
                                            console.log("cuenta bloqueada del comprador!!");
                                            return [2 /*return*/, this.handleError(socket, "blockAccount", "Account is blocked")];
                                        }
                                        console.log("ID DE LA VENTA:", data.ventaId);
                                        _c = (_b = Promise).all;
                                        return [4 /*yield*/, this.gateway];
                                    case 8: return [4 /*yield*/, (_q.sent()).getMarketAssetsById(data.ventaId)];
                                    case 9:
                                        _d = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.gateway];
                                    case 10: return [4 /*yield*/, (_q.sent()).getMarketNFTsById(data.ventaId)];
                                    case 11: return [4 /*yield*/, _c.apply(_b, [_d.concat([
                                                _q.sent()
                                            ])])];
                                    case 12:
                                        _a = _q.sent(), assetsEnVentaDelVendedor = _a[0], nftEnVentaDelVendedor = _a[1];
                                        console.log("ASSET EN VENTA?:", assetsEnVentaDelVendedor);
                                        console.log("NFT EN VENTA?:", nftEnVentaDelVendedor);
                                        if (assetsEnVentaDelVendedor.length === 0 && nftEnVentaDelVendedor.length === 0) {
                                            console.log("no está en venta!!!");
                                            return [2 /*return*/, this.handleError(socket, "notSelling", "No assets or NFTs are being sold")];
                                        }
                                        else if (assetsEnVentaDelVendedor.length > 0 && nftEnVentaDelVendedor.length > 0)
                                            return [2 /*return*/, this.handleError(socket, "notSelling", "2 assets  are being sold")];
                                        itemType = null;
                                        itemEnVenta_1 = null;
                                        if (assetsEnVentaDelVendedor.length > 0) {
                                            itemEnVenta_1 = assetsEnVentaDelVendedor[0];
                                            itemType = 'Asset';
                                        }
                                        else if (nftEnVentaDelVendedor.length > 0) {
                                            itemEnVenta_1 = nftEnVentaDelVendedor[0];
                                            itemType = 'nft';
                                        }
                                        console.log("obtendremos al vendedor:", itemEnVenta_1._id);
                                        return [4 /*yield*/, this.gateway];
                                    case 13: return [4 /*yield*/, (_q.sent()).getVendedorDelToken(itemEnVenta_1._id, itemType)];
                                    case 14:
                                        vendedor = _q.sent();
                                        console.log("VENDEDOR:", vendedor);
                                        if (!!vendedor) return [3 /*break*/, 16];
                                        console.log("NO HAY VENDEDOR:", vendedor);
                                        return [4 /*yield*/, this.handleError(socket, "notSelling", "Seller is not available")];
                                    case 15: return [2 /*return*/, _q.sent()];
                                    case 16:
                                        console.log("HAY VENDEDOR:");
                                        return [4 /*yield*/, this.gateway];
                                    case 17: return [4 /*yield*/, (_q.sent()).verifyAccountBlocked(vendedor.vendedorId)];
                                    case 18:
                                        cuentaBloqueadaVendedor = _q.sent();
                                        if (!(cuentaBloqueadaVendedor !== "error" && cuentaBloqueadaVendedor === true)) return [3 /*break*/, 20];
                                        console.log("cuenta bloqueada del vendedor!!");
                                        return [4 /*yield*/, this.handleError(socket, "notAvailable", "Seller's account is blocked")];
                                    case 19: return [2 /*return*/, _q.sent()];
                                    case 20:
                                        if (!(cuentaBloqueadaVendedor === "error")) return [3 /*break*/, 22];
                                        return [4 /*yield*/, this.handleError(socket, "notAvailable", "Seller's account is blocked")];
                                    case 21: return [2 /*return*/, _q.sent()];
                                    case 22:
                                        console.log("obteniendo data importante:!!");
                                        _g = (_f = Promise).all;
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 23: return [4 /*yield*/, (_q.sent()).getUserAssets(vendedor.sellerAddress)];
                                    case 24:
                                        _h = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 25: return [4 /*yield*/, (_q.sent()).getAccountBalance(vendedor.vendedorId)];
                                    case 26:
                                        _h = _h.concat([
                                            _q.sent()
                                        ]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 27: return [4 /*yield*/, (_q.sent()).getAccountBalance(buyer)];
                                    case 28:
                                        _h = _h.concat([
                                            _q.sent()
                                        ]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 29: return [4 /*yield*/, (_q.sent()).getAddressBalance(tokenValido.address, "RAPTOREUMWORLDCOIN")];
                                    case 30: return [4 /*yield*/, _g.apply(_f, [_h.concat([
                                                _q.sent()
                                            ])])];
                                    case 31:
                                        _e = _q.sent(), balanceOfVendedor = _e[0], raptoreumBalanceOfVendedor = _e[1], balanceOfBuyer = _e[2], resultGetAssetBalanceOfComprador = _e[3];
                                        console.log("DATA IMPORTANTE:", "BALANCE OF VENDEDOR:", balanceOfVendedor, "raptoreum balance of vendedor:", raptoreumBalanceOfVendedor, "BALANCE DEL COMPRADOR:", balanceOfBuyer, "RESULT GET ASSET BALANCE OF COMPRADOR:", resultGetAssetBalanceOfComprador);
                                        isRWS = false;
                                        if (resultGetAssetBalanceOfComprador !== "error" && resultGetAssetBalanceOfComprador !== "notFound" && resultGetAssetBalanceOfComprador > 0)
                                            isRWS = true;
                                        balanceAssetEnVenta = balanceOfVendedor.find(function (e) { return e.asset === itemEnVenta_1.asset; });
                                        if (!(balanceAssetEnVenta === "error")) return [3 /*break*/, 33];
                                        return [4 /*yield*/, this.handleError(socket, "notSelling", "Seller is not available")];
                                    case 32: return [2 /*return*/, _q.sent()];
                                    case 33:
                                        if (!(balanceAssetEnVenta === "notFound")) return [3 /*break*/, 35];
                                        return [4 /*yield*/, this.handleError(socket, "notSelling", "Seller is not available")];
                                    case 34: return [2 /*return*/, _q.sent()];
                                    case 35:
                                        raptoreumNecesario = itemEnVenta_1.price * data.cantidad;
                                        if (!raptoreumNecesario)
                                            return [2 /*return*/, this.handleError(socket, "notAvailable", "no se pudo conseguir precio del asset")];
                                        if (!(balanceAssetEnVenta.balance >= data.cantidad)) return [3 /*break*/, 92];
                                        console.log("PASAMOS POR QUE EL VENDEDOR TIENE EL BALANCE SUFICIENTE PARA VENDER");
                                        if (!isRWS) {
                                            console.log("NO ES RWS");
                                            if (balanceOfBuyer < (raptoreumNecesario + 10)) {
                                                console.log("NO TIENE PLATA");
                                                return [2 /*return*/, this.handleError(socket, "buyerNotEnoughRaptoreum", "Buyer does not have enough Raptoreum")];
                                            }
                                        }
                                        else if (isRWS) {
                                            if (balanceOfBuyer < raptoreumNecesario) {
                                                return [2 /*return*/, this.handleError(socket, "buyerNotEnoughRaptoreum", "Buyer does not have enough Raptoreum")];
                                            }
                                        }
                                        console.log("pasamos a bloquear:");
                                        return [4 /*yield*/, this.gateway];
                                    case 36: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "block")];
                                    case 37:
                                        blocked = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 38: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(buyer, "block")];
                                    case 39:
                                        blocked2 = _q.sent();
                                        if (!blocked) {
                                            console.log("no pudimos bloquear");
                                            console.log("emitiendo couldNotConnect");
                                            socket.emit('couldNotConnect');
                                            return [2 /*return*/];
                                        }
                                        if (!blocked2) {
                                            console.log("no pudimos bloquear");
                                            console.log("emitiendo couldNotConnect");
                                            socket.emit('couldNotConnect');
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, this.gateway];
                                    case 40: return [4 /*yield*/, (_q.sent()).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, itemEnVenta_1.asset, data.cantidad, itemEnVenta_1.assetpicture, itemType)];
                                    case 41:
                                        insertarVentaVendedor = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 42: return [4 /*yield*/, (_q.sent()).insertCompraOventa(buyer, "compra", raptoreumNecesario, itemEnVenta_1.asset, data.cantidad, itemEnVenta_1.assetpicture, itemType)];
                                    case 43:
                                        insertarCompraComprador = _q.sent();
                                        pending = false;
                                        console.log("nos saltamos el retiro de raptoreum por que el vendedor tiene mas de 1");
                                        if (!(raptoreumBalanceOfVendedor < 0.00002)) return [3 /*break*/, 47];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 44: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009)];
                                    case 45:
                                        retiroCajaChica = _q.sent();
                                        if (!retiroCajaChica) {
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "Error in small cash withdrawal")];
                                        }
                                        pending = true;
                                        socket.emit("compraPendiente");
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 20000); })];
                                    case 46:
                                        _q.sent();
                                        _q.label = 47;
                                    case 47:
                                        _q.trys.push([47, 90, , 91]);
                                        return [4 /*yield*/, this.handleWithdrawals(buyer, vendedor.sellerAddress, raptoreumNecesario, vendedor.vendedorId, tokenValido.address, data.cantidad, balanceAssetEnVenta.assetid)];
                                    case 48:
                                        _j = _q.sent(), raptoreumWithdraw = _j.raptoreumWithdraw, tokenWithdraw = _j.tokenWithdraw;
                                        console.log("RAPTOREUM WITHDRAW:", raptoreumWithdraw);
                                        console.log("token WITHDRAW:", tokenWithdraw);
                                        if (!(raptoreumWithdraw && tokenWithdraw)) return [3 /*break*/, 66];
                                        _q.label = 49;
                                    case 49:
                                        _q.trys.push([49, 53, , 54]);
                                        if (!(itemType === "nft")) return [3 /*break*/, 52];
                                        return [4 /*yield*/, this.gateway];
                                    case 50: return [4 /*yield*/, (_q.sent()).detenerVenta(vendedor.vendedorId, vendedor.ordenId, "nft")];
                                    case 51:
                                        resultDetenerVenta = _q.sent();
                                        if (resultDetenerVenta) {
                                            this.io.sockets.emit("ventaDetenida", vendedor.ordenId);
                                        }
                                        _q.label = 52;
                                    case 52: return [3 /*break*/, 54];
                                    case 53:
                                        e_3 = _q.sent();
                                        console.log("ERROR EN DETENER VENTA:", e_3);
                                        return [3 /*break*/, 54];
                                    case 54:
                                        console.log("AMBAS TRANSACCIONES SALIERON BIEN");
                                        _m = (_l = Promise).all;
                                        return [4 /*yield*/, this.gateway];
                                    case 55: return [4 /*yield*/, (_q.sent()).updateCompraOventa(insertarCompraComprador, "SUCCESS", tokenWithdraw)];
                                    case 56:
                                        _o = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.gateway];
                                    case 57: return [4 /*yield*/, (_q.sent()).updateCompraOventa(insertarVentaVendedor, "SUCCESS", raptoreumWithdraw)];
                                    case 58: return [4 /*yield*/, _m.apply(_l, [_o.concat([
                                                _q.sent()
                                            ])])];
                                    case 59:
                                        _k = _q.sent(), updateBuyer = _k[0], updateSeller = _k[1];
                                        socket.emit("compraExitosa", { asset: itemEnVenta_1.asset, cantidad: data.cantidad });
                                        this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: balanceAssetEnVenta.balance - data.cantidad });
                                        _p = this.blockOrUnblockTransactions;
                                        return [4 /*yield*/, this.gateway];
                                    case 60: return [4 /*yield*/, _p.apply(this, [_q.sent(), [buyer, vendedor.vendedorId], false])];
                                    case 61:
                                        _q.sent();
                                        if (!!isRWS) return [3 /*break*/, 65];
                                        return [4 /*yield*/, this.raptoreumWorldStockInvestorsMoney(buyer, 0.32, "tokenSold")];
                                    case 62:
                                        _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 63: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum(vendedor.vendedorId, tokenValido.address, 1.99)];
                                    case 64:
                                        _q.sent();
                                        _q.label = 65;
                                    case 65: return [3 /*break*/, 89];
                                    case 66:
                                        if (!(raptoreumWithdraw && !tokenWithdraw)) return [3 /*break*/, 75];
                                        if (pending)
                                            return [2 /*return*/, socket.emit("errorDeCompra")];
                                        console.log("TOKEN WITHDRAW SALIÓ MAL");
                                        return [4 /*yield*/, this.gateway];
                                    case 67: return [4 /*yield*/, (_q.sent()).transaccionPendiente(vendedor.vendedorId, vendedor.sellerAddress, buyer, tokenValido.address, "raptoreum", raptoreumNecesario)];
                                    case 68:
                                        transaccionPendidente = _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 69: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009)];
                                    case 70:
                                        retirarDeRaptoreumWorld = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 71: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(buyer, "unblock")];
                                    case 72:
                                        resultunBlockcomprador = _q.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                                    case 73:
                                        _q.sent();
                                        return [4 /*yield*/, this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer, transaccionPendidente, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, raptoreumNecesario, itemEnVenta_1.asset, insertarCompraComprador, insertarVentaVendedor)];
                                    case 74:
                                        _q.sent();
                                        return [2 /*return*/];
                                    case 75:
                                        if (!(!raptoreumWithdraw && tokenWithdraw)) return [3 /*break*/, 84];
                                        if (pending)
                                            return [2 /*return*/, socket.emit("errorDeCompra")];
                                        console.log("RAPTOREUM WITHDRAW SALIÓ MAL");
                                        return [4 /*yield*/, this.gateway];
                                    case 76: return [4 /*yield*/, (_q.sent()).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, itemEnVenta_1.asset, data.cantidad)];
                                    case 77:
                                        transaccionPendidente = _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 78: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009)];
                                    case 79:
                                        retirarDeRaptoreumWorld = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 80: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 81:
                                        resultunBlockvendedor = _q.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                                    case 82:
                                        _q.sent();
                                        return [4 /*yield*/, this.intentarRetiradaDeEmergenciaDeToken(buyer, transaccionPendidente, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, data.cantidad, balanceAssetEnVenta.assetid, insertarCompraComprador, insertarVentaVendedor)];
                                    case 83:
                                        _q.sent();
                                        return [2 /*return*/];
                                    case 84:
                                        if (!(!raptoreumWithdraw && !tokenWithdraw)) return [3 /*break*/, 89];
                                        if (pending)
                                            return [2 /*return*/, socket.emit("errorDeCompra")];
                                        return [4 /*yield*/, this.gateway];
                                    case 85: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 86:
                                        _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 87: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 88:
                                        _q.sent();
                                        _q.label = 89;
                                    case 89: return [3 /*break*/, 91];
                                    case 90:
                                        error_1 = _q.sent();
                                        console.log("ERROR DE COMPRA:", error_1);
                                        return [2 /*return*/, this.handleError(socket, "errorDeCompra", "Purchase error")];
                                    case 91: return [3 /*break*/, 93];
                                    case 92:
                                        if (balanceOfVendedor < data.cantidad) {
                                            console.log("EMITIENDO SELLERNOTENOIGHTOKENS");
                                            return [2 /*return*/, this.handleError(socket, "sellerNotEnoughTokens", "Seller does not have enough tokens")];
                                        }
                                        _q.label = 93;
                                    case 93: return [3 /*break*/, 95];
                                    case 94:
                                        console.log("error con la data");
                                        _q.label = 95;
                                    case 95: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        }); });
    }
    socketService.prototype.isTOTP = function (userid) {
        return __awaiter(this, void 0, void 0, function () {
            var result, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.gateway];
                    case 1: return [4 /*yield*/, (_a.sent()).getData("SELECT istotp FROM users where userid=?", [userid])];
                    case 2:
                        result = (_a.sent())[0];
                        if (result.istotp == "false") {
                            return [2 /*return*/, false];
                        }
                        else if (result.istotp == "true") {
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_4 = _a.sent();
                        console.log(e_4);
                        return [2 /*return*/, "error"];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.verifyTOTP = function (userid, code) {
        return __awaiter(this, void 0, void 0, function () {
            var result, isValid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.gateway];
                    case 1: return [4 /*yield*/, (_a.sent()).getData("SELECT totp FROM users where userid=?", [userid])];
                    case 2:
                        result = (_a.sent())[0];
                        if (result) {
                            if (result.totp != "none") {
                                isValid = speakeasy.totp.verify({
                                    secret: result.totp,
                                    encoding: 'base32',
                                    token: code,
                                });
                                if (isValid) {
                                    return [2 /*return*/, true];
                                }
                                else {
                                    return [2 /*return*/, false];
                                }
                            }
                            else {
                                return [2 /*return*/, false];
                            }
                            // Verifica que la contraseña ingresada coincida con la almacenada en la base de datos
                        }
                        else {
                            return [2 /*return*/, "error"];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.handleMarket = function (subject, socket, socketId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var health, marketAssets, balancePromises, filteredAssets, e_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRaptoreumdHealth()];
                    case 1:
                        health = _a.sent();
                        if (health === "error") {
                            return [2 /*return*/];
                        }
                        else if (health === "dead") {
                            return [2 /*return*/, socket.emit("serverDown")];
                        }
                        if (!this.rateLimiters[socketId].consume(1, user)) {
                            return [2 /*return*/];
                        }
                        console.log("get ".concat(subject, " disparada"));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 11, , 12]);
                        marketAssets = void 0;
                        if (!(subject === "assetsmarket")) return [3 /*break*/, 5];
                        console.log("llegó asset market:");
                        return [4 /*yield*/, this.gateway];
                    case 3: return [4 /*yield*/, (_a.sent()).getMarketAssets()];
                    case 4:
                        marketAssets = _a.sent();
                        return [3 /*break*/, 9];
                    case 5:
                        if (!(subject === "nftmarket")) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.gateway];
                    case 6: return [4 /*yield*/, (_a.sent()).getMarketNFTs()];
                    case 7:
                        marketAssets = _a.sent();
                        return [3 /*break*/, 9];
                    case 8: throw new Error("Unknown subject: ".concat(subject));
                    case 9:
                        console.log("asset market result:", marketAssets);
                        return [4 /*yield*/, Promise.all(marketAssets.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                                var orden, vendedor, asseEncontrado, resultDetenerVenta, e_6;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            orden = e._id;
                                            if (!(subject === "assetsmarket")) return [3 /*break*/, 3];
                                            return [4 /*yield*/, this.gateway];
                                        case 1: return [4 /*yield*/, (_a.sent()).getVendedorDelToken(orden, "Asset")];
                                        case 2:
                                            vendedor = _a.sent();
                                            return [3 /*break*/, 6];
                                        case 3:
                                            if (!(subject === "nftmarket")) return [3 /*break*/, 6];
                                            return [4 /*yield*/, this.gateway];
                                        case 4: return [4 /*yield*/, (_a.sent()).getVendedorDelNFT(orden)];
                                        case 5:
                                            vendedor = _a.sent();
                                            _a.label = 6;
                                        case 6: return [4 /*yield*/, this.raptoreumCore];
                                        case 7: return [4 /*yield*/, (_a.sent()).getAddressBalance(vendedor.sellerAddress, e.asset)];
                                        case 8:
                                            asseEncontrado = _a.sent();
                                            console.log("asseEncontrado:", asseEncontrado);
                                            if (!(asseEncontrado !== "error" && asseEncontrado !== "notFound" && asseEncontrado.balance >= 1)) return [3 /*break*/, 9];
                                            console.log("paso 2 el balance es mayor a 1, asignando balance al elemento");
                                            e.balance = asseEncontrado.balance;
                                            return [2 /*return*/, e];
                                        case 9:
                                            _a.trys.push([9, 12, 13, 14]);
                                            console.log("paso 2 el balance es menor a 1, detenemos la venta del ".concat(subject));
                                            return [4 /*yield*/, this.gateway];
                                        case 10: return [4 /*yield*/, (_a.sent()).detenerVenta(vendedor.vendedorId, orden, subject === "assetsmarket" ? "asset" : "nft")];
                                        case 11:
                                            resultDetenerVenta = _a.sent();
                                            if (resultDetenerVenta) {
                                                this.io.sockets.emit("ventaDetenida", orden);
                                            }
                                            console.log("RESULT DETENER VENTA:", resultDetenerVenta);
                                            console.log("venta detenida");
                                            return [3 /*break*/, 14];
                                        case 12:
                                            e_6 = _a.sent();
                                            console.log("ERROR EN GET".concat(subject.toUpperCase()), e_6);
                                            return [3 /*break*/, 14];
                                        case 13: return [2 /*return*/, undefined];
                                        case 14: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 10:
                        balancePromises = _a.sent();
                        filteredAssets = balancePromises.filter(function (asset) { return asset !== undefined; });
                        socket.emit(subject, filteredAssets);
                        return [3 /*break*/, 12];
                    case 11:
                        e_5 = _a.sent();
                        console.log("ERROR NO CENTRALIZADO EN IF DE BALANCE MAYOR A 1:", e_5);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.raptoreumWorldStockInvestorsMoney = function (comprador, rtmAenviar, transactionType) {
        return __awaiter(this, void 0, void 0, function () {
            var result, envios, delay, _i, result_1, ITEM, partes, withdraw, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.raptoreumCore];
                    case 1: return [4 /*yield*/, (_a.sent()).listCoinholders("TESTINGCOIN")];
                    case 2:
                        result = _a.sent();
                        if (result === "listCoinholdersError") {
                            return [2 /*return*/, "error"];
                        }
                        if (result === false) {
                            return [2 /*return*/, false];
                        }
                        envios = 0;
                        delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
                        _i = 0, result_1 = result;
                        _a.label = 3;
                    case 3:
                        if (!(_i < result_1.length)) return [3 /*break*/, 16];
                        ITEM = result_1[_i];
                        console.log("ADDRESS A VERIFICAR:", ITEM.address);
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 14, , 15]);
                        partes = ITEM.balance;
                        return [4 /*yield*/, this.raptoreumCore];
                    case 5: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(comprador, ITEM.address, partes * rtmAenviar)];
                    case 6:
                        withdraw = _a.sent();
                        if (!withdraw) return [3 /*break*/, 9];
                        envios += partes;
                        return [4 /*yield*/, this.gateway];
                    case 7: return [4 /*yield*/, (_a.sent()).raptoreumWorldStockTransaction(ITEM.userid, partes * rtmAenviar, transactionType)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 9: return [4 /*yield*/, this.gateway];
                    case 10: return [4 /*yield*/, (_a.sent()).raptoreumWorldStockTransaction(ITEM.userid, partes * rtmAenviar, "transaction error")];
                    case 11:
                        _a.sent();
                        _a.label = 12;
                    case 12: 
                    // Wait for 6 seconds before proceeding to the next iteration
                    return [4 /*yield*/, delay(6000)];
                    case 13:
                        // Wait for 6 seconds before proceeding to the next iteration
                        _a.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        error_2 = _a.sent();
                        return [2 /*return*/, "error"];
                    case 15:
                        _i++;
                        return [3 /*break*/, 3];
                    case 16: return [2 /*return*/, envios];
                }
            });
        });
    };
    socketService.prototype.handleError = function (socket, event, message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log(message);
                socket.emit(event);
                return [2 /*return*/];
            });
        });
    };
    socketService.prototype.blockOrUnblockTransactions = function (gateway, users, block) {
        if (block === void 0) { block = true; }
        return __awaiter(this, void 0, void 0, function () {
            var action, _i, users_1, user, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = block ? "block" : "unblock";
                        _i = 0, users_1 = users;
                        _a.label = 1;
                    case 1:
                        if (!(_i < users_1.length)) return [3 /*break*/, 6];
                        user = users_1[_i];
                        return [4 /*yield*/, gateway];
                    case 2: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(user, action)];
                    case 3:
                        result = _a.sent();
                        if (!!result) return [3 /*break*/, 5];
                        return [4 /*yield*/, gateway.blockOrUnblockUserTransactions(user, block ? "unblock" : "block")];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, false];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, true];
                }
            });
        });
    };
    socketService.prototype.getRaptoreumdHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.get('http://localhost:3009/raptoreumdHealth')];
                    case 1:
                        result = _a.sent();
                        if (result.status == 200) {
                            if (result.data == "alive") {
                                return [2 /*return*/, "alive"];
                            }
                            else if (result.data == "dead") {
                                return [2 /*return*/, "dead"];
                            }
                            else {
                                return [2 /*return*/, "error"];
                            }
                        }
                        else {
                            return [2 /*return*/, "error"];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.assetToMarket = function (asset, token, price, totp) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var usuariodecodificado, isTotp, resultTOTP, cuentaBloqueadaVendedor, getAssetType, foundAsset, result, result_2, error_3, error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 21, , 22]);
                                    console.log("primer paso");
                                    return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(token)];
                                case 1:
                                    usuariodecodificado = _a.sent();
                                    if (!(usuariodecodificado != "error" && usuariodecodificado != "expired")) return [3 /*break*/, 19];
                                    return [4 /*yield*/, this.isTOTP(usuariodecodificado.userid)];
                                case 2:
                                    isTotp = _a.sent();
                                    if (isTotp === "error")
                                        return [2 /*return*/];
                                    if (!(isTotp === true)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, this.verifyTOTP(usuariodecodificado.userid, totp)];
                                case 3:
                                    resultTOTP = _a.sent();
                                    if (resultTOTP === false)
                                        reject("invalidTOTP");
                                    if (resultTOTP === "error")
                                        reject("errorTOTP");
                                    _a.label = 4;
                                case 4: return [4 /*yield*/, this.gateway];
                                case 5: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(usuariodecodificado.userid)];
                                case 6:
                                    cuentaBloqueadaVendedor = _a.sent();
                                    if (cuentaBloqueadaVendedor !== "error" && cuentaBloqueadaVendedor === true) {
                                        console.log("cuenta bloqueada del vendedor!!");
                                        reject("blockedAccount");
                                    }
                                    else if (cuentaBloqueadaVendedor === "error") {
                                        reject("error");
                                    }
                                    return [4 /*yield*/, this.raptoreumCore];
                                case 7: return [4 /*yield*/, (_a.sent()).getUserAssets(usuariodecodificado.address)];
                                case 8:
                                    getAssetType = _a.sent();
                                    if (!(getAssetType !== "getUserAssetsError" && getAssetType.length > 0)) return [3 /*break*/, 18];
                                    foundAsset = getAssetType.find(function (i) { return i.asset === asset; });
                                    if (!foundAsset)
                                        return [2 /*return*/];
                                    return [4 /*yield*/, this.gateway];
                                case 9: return [4 /*yield*/, (_a.sent()).verifyTokenEnVenta2(asset, usuariodecodificado.userid, foundAsset.type)];
                                case 10:
                                    result = _a.sent();
                                    console.log("segundo paso");
                                    console.log("result verifytokenenventa:", result);
                                    if (!(result === true)) return [3 /*break*/, 11];
                                    console.log("rejecting cuz verifytokenenventa es true");
                                    reject("selling");
                                    return [3 /*break*/, 18];
                                case 11:
                                    if (!(result === false)) return [3 /*break*/, 17];
                                    _a.label = 12;
                                case 12:
                                    _a.trys.push([12, 15, , 16]);
                                    console.log("TYPE PARA INSERTAR EN EL MARKET:", foundAsset.type);
                                    return [4 /*yield*/, this.gateway];
                                case 13: return [4 /*yield*/, (_a.sent()).insertAssetInMarket(asset, usuariodecodificado.userid, usuariodecodificado.usuario, usuariodecodificado.address, price, foundAsset.type)];
                                case 14:
                                    result_2 = _a.sent();
                                    if (result_2)
                                        resolve(result_2);
                                    return [3 /*break*/, 16];
                                case 15:
                                    error_3 = _a.sent();
                                    reject("assetToMarketError");
                                    return [3 /*break*/, 16];
                                case 16: return [3 /*break*/, 18];
                                case 17:
                                    if (result === "errorGettingToken") {
                                        reject("assetToMarketError");
                                    }
                                    _a.label = 18;
                                case 18: return [3 /*break*/, 20];
                                case 19:
                                    if (usuariodecodificado == "expired") {
                                        console.log("aplicandonorlogged");
                                        reject("notLogged");
                                    }
                                    _a.label = 20;
                                case 20: return [3 /*break*/, 22];
                                case 21:
                                    error_4 = _a.sent();
                                    console.log("error de aassettomarket", error_4);
                                    if (error_4 == 'el activo no existe por lo tanto no puede ser vendido') {
                                        reject("notExists");
                                    }
                                    else if (error_4 == "selling") {
                                        reject("selling");
                                    }
                                    else {
                                        reject("error");
                                    }
                                    return [3 /*break*/, 22];
                                case 22: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    socketService.prototype.handleWithdrawals = function (buyer, sellerAddress, raptoreumAmount, sellerId, tokenAddress, tokenAmount, asset) {
        return __awaiter(this, void 0, void 0, function () {
            var raptoreumWithdraw, tokenWithdraw;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("ASSET A RETIRTAR:", asset);
                        console.log("ASSET A RETIRTAR:", asset);
                        console.log("ASSET A RETIRTAR:", asset);
                        console.log("ASSET A RETIRTAR:", asset);
                        console.log("ASSET A RETIRTAR:", asset);
                        console.log("ASSET A RETIRTAR:", asset);
                        console.log("ASSET A RETIRTAR:", asset);
                        return [4 /*yield*/, this.raptoreumCore];
                    case 1: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(buyer, sellerAddress, raptoreumAmount)];
                    case 2:
                        raptoreumWithdraw = _a.sent();
                        return [4 /*yield*/, this.raptoreumCore];
                    case 3: return [4 /*yield*/, (_a.sent()).withdrawToken(sellerId, tokenAddress, tokenAmount, asset, sellerAddress, sellerAddress)];
                    case 4:
                        tokenWithdraw = _a.sent();
                        return [2 /*return*/, { raptoreumWithdraw: raptoreumWithdraw, tokenWithdraw: tokenWithdraw }];
                }
            });
        });
    };
    socketService.prototype.intentarRetiradaDeEmergenciaDeRaptoreum = function (comprador, transaccionPending, addressComprador, addressVendedor, idVendedor, raptoreumDebt, assetName, idVentaComprador, idVentaVendedor) {
        return __awaiter(this, void 0, void 0, function () {
            var intentos, intentar;
            var _this = this;
            return __generator(this, function (_a) {
                intentos = 0;
                console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL");
                console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL");
                console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL");
                console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL");
                intentar = function () { return __awaiter(_this, void 0, void 0, function () {
                    var isPending, retirarDeEmergenciaDelVendedor, _a, _b, _c, _d, _e, _f;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0: return [4 /*yield*/, this.gateway];
                            case 1: return [4 /*yield*/, (_g.sent()).getTransaccionPendiente(transaccionPending)];
                            case 2:
                                isPending = _g.sent();
                                if (!(isPending === true)) return [3 /*break*/, 18];
                                return [4 /*yield*/, this.raptoreumCore];
                            case 3: return [4 /*yield*/, (_g.sent()).withdrawRaptoreum(idVendedor, addressComprador, raptoreumDebt)];
                            case 4:
                                retirarDeEmergenciaDelVendedor = _g.sent();
                                if (!retirarDeEmergenciaDelVendedor) return [3 /*break*/, 11];
                                console.log(raptoreumDebt, " RAPTOREUMS RETIRADOS CORRECTAMENTE DEL DEL VENDEDOR");
                                _b = (_a = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 5:
                                _c = [
                                    (_g.sent()).transaccionPendienteOut(transaccionPending)
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 6:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 7:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 8:
                                _c = _c.concat([
                                    (_g.sent()).blockOrUnblockUserTransactions(comprador, "unblock")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 9: return [4 /*yield*/, _b.apply(_a, [_c.concat([
                                        (_g.sent()).blockOrUnblockUserTransactions(idVendedor, "unblock")
                                    ])])];
                            case 10:
                                _g.sent();
                                return [3 /*break*/, 17];
                            case 11:
                                if (!(intentos < 5)) return [3 /*break*/, 12];
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                intentos++;
                                setTimeout(intentar, 20000);
                                return [3 /*break*/, 17];
                            case 12:
                                _e = (_d = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 13:
                                _f = [
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 14:
                                _f = _f.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 15: return [4 /*yield*/, _e.apply(_d, [_f.concat([
                                        (_g.sent()).addWrongTransaction(comprador, addressComprador, addressVendedor, idVendedor, assetName, raptoreumDebt)
                                    ])])];
                            case 16:
                                _g.sent();
                                _g.label = 17;
                            case 17: return [3 /*break*/, 19];
                            case 18:
                                if (isPending === false) {
                                    return [2 /*return*/];
                                }
                                else if (isPending === "error") {
                                    setTimeout(intentar, 20000);
                                }
                                _g.label = 19;
                            case 19: return [2 /*return*/];
                        }
                    });
                }); };
                setTimeout(intentar, 20000);
                return [2 /*return*/];
            });
        });
    };
    socketService.prototype.intentarRetiradaDeEmergenciaDeToken = function (comprador, transaccionPending, addressComprador, addressVendedor, idVendedor, assetDebt, assetName, idVentaComprador, idVentaVendedor) {
        return __awaiter(this, void 0, void 0, function () {
            var intentos, intentar;
            var _this = this;
            return __generator(this, function (_a) {
                intentos = 0;
                intentar = function () { return __awaiter(_this, void 0, void 0, function () {
                    var isPending, retirarDeEmergenciaDelCliente, _a, _b, _c, _d, _e, _f;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0: return [4 /*yield*/, this.gateway];
                            case 1: return [4 /*yield*/, (_g.sent()).getTransaccionPendiente(transaccionPending)];
                            case 2:
                                isPending = _g.sent();
                                if (!(isPending === true)) return [3 /*break*/, 18];
                                return [4 /*yield*/, this.raptoreumCore];
                            case 3: return [4 /*yield*/, (_g.sent()).withdrawToken(comprador, addressVendedor, assetDebt, assetName, addressComprador, addressComprador)];
                            case 4:
                                retirarDeEmergenciaDelCliente = _g.sent();
                                if (!retirarDeEmergenciaDelCliente) return [3 /*break*/, 11];
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                _b = (_a = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 5:
                                _c = [
                                    (_g.sent()).transaccionPendienteOut(transaccionPending)
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 6:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 7:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 8:
                                _c = _c.concat([
                                    (_g.sent()).blockOrUnblockUserTransactions(comprador, "unblock")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 9: return [4 /*yield*/, _b.apply(_a, [_c.concat([
                                        (_g.sent()).blockOrUnblockUserTransactions(idVendedor, "unblock")
                                    ])])];
                            case 10:
                                _g.sent();
                                return [3 /*break*/, 17];
                            case 11:
                                if (!(intentos < 5)) return [3 /*break*/, 12];
                                intentos++;
                                setTimeout(intentar, 40000);
                                return [3 /*break*/, 17];
                            case 12:
                                _e = (_d = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 13:
                                _f = [
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 14:
                                _f = _f.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 15: return [4 /*yield*/, _e.apply(_d, [_f.concat([
                                        (_g.sent()).addWrongTransaction(comprador, addressComprador, addressVendedor, idVendedor, assetName, assetDebt)
                                    ])])];
                            case 16:
                                _g.sent();
                                _g.label = 17;
                            case 17: return [3 /*break*/, 19];
                            case 18:
                                if (isPending === false) {
                                    return [2 /*return*/];
                                }
                                else if (isPending === "error") {
                                    setTimeout(intentar, 40000);
                                }
                                _g.label = 19;
                            case 19: return [2 /*return*/];
                        }
                    });
                }); };
                setTimeout(intentar, 40000);
                return [2 /*return*/];
            });
        });
    };
    return socketService;
}());
exports.socketService = socketService;
