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
var http = require('http');
var testingconfig_1 = require("../config/testingconfig");
var socket_io_1 = require("socket.io");
var gateway_1 = require("../dataaccess/gateway");
var jwtFunctions_1 = require("./jwtFunctions");
var raptoreumCoreFunctions_1 = require("./raptoreumCoreFunctions");
var socketService = /** @class */ (function () {
    function socketService() {
        var _this = this;
        this.gateway = gateway_1.UserGateway.getInstance();
        this.raptoreumCore = raptoreumCoreFunctions_1.raptoreumCoreAccess.getInstance();
        this.withdrawBlockedAccounts = [];
        this.key = "skrillex";
        this.io = new socket_io_1.Server(http.createServer().listen(4000), {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: false,
            },
        });
        console.log("conectado en", " ", 4000);
        this.io.use(function (sockete, next) { return __awaiter(_this, void 0, void 0, function () {
            var frontendKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sockete.handshake.query.key];
                    case 1:
                        frontendKey = _a.sent();
                        if (frontendKey !== this.key) {
                            throw new Error("invalid socket connection");
                        }
                        else {
                            next();
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        this.io.on("connection", function (socket) { return __awaiter(_this, void 0, void 0, function () {
            var object, subject, user, result, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("new connection");
                        console.log("object connection:", socket.handshake.query.object);
                        object = JSON.parse(socket.handshake.query.object);
                        subject = object.subject.trim();
                        user = object.token;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!(subject == "balance")) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getUserInfo(user)];
                    case 2:
                        result = _a.sent();
                        if (result !== false) {
                            socket.emit("balance", result);
                        }
                        else {
                            console.log("NO SE PUDO EMITIR EL SOCKET");
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(subject == "assetsmarket")) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getAssetsMarket()];
                    case 4:
                        result = _a.sent();
                        socket.emit("assetsmarket", result);
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.log(error_1);
                        return [3 /*break*/, 7];
                    case 7:
                        socket.on("getBalance", function (json, senderSocket) { return __awaiter(_this, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.getUserInfo(json.token)];
                                    case 1:
                                        result = _a.sent();
                                        if (result !== false) {
                                            socket.emit("balance", result);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on("validAddress", function (data, senderSocket) { return __awaiter(_this, void 0, void 0, function () {
                            var result, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 1: return [4 /*yield*/, (_a.sent()).validateAddress(data)];
                                    case 2:
                                        result = _a.sent();
                                        if (result) {
                                            socket.emit("validAddressResult", true);
                                        }
                                        else if (!result) {
                                            socket.emit("validAddressResult", false);
                                        }
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_2 = _a.sent();
                                        console.log(error_2);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('detenerVenta', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido, usuario, asset, resultDetenerVenta;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token, testingconfig_1.CONFIG.JWT_SECRET)];
                                    case 1:
                                        tokenValido = _a.sent();
                                        if (!(tokenValido != null)) return [3 /*break*/, 4];
                                        usuario = tokenValido.usuario;
                                        asset = data.asset;
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, asset)];
                                    case 3:
                                        resultDetenerVenta = _a.sent();
                                        if (resultDetenerVenta) {
                                            this.io.sockets.emit("ventaDetenida", { asset: asset, vendedor: usuario });
                                        }
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('compra', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido, buyer_1, assetsEnVentaDelVendedor, asset_1, resultGetBalanceOfVendedor, getBalanceOfBuyer, raptoreumNecesario_1, retirar, retirarDelVendedor, resultGetBalanceOfVendedor_1, getBalanceOfBuyer_1, retirarDeRaptoreumWorld, intentarRetiradaDeEmergenciaDeToken_1, intentarRetiradaDeEmergencia_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token, testingconfig_1.CONFIG.JWT_SECRET)];
                                    case 1:
                                        tokenValido = _a.sent();
                                        if (!(tokenValido != null)) return [3 /*break*/, 25];
                                        buyer_1 = tokenValido.usuario;
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_a.sent()).getMarketAssetsByUser(data.vendedor)];
                                    case 3:
                                        assetsEnVentaDelVendedor = _a.sent();
                                        if (!(assetsEnVentaDelVendedor.length > 0)) return [3 /*break*/, 25];
                                        asset_1 = assetsEnVentaDelVendedor.find(function (e) {
                                            return e.asset == data.asset && e.vendedor == data.vendedor;
                                        });
                                        if (!asset_1) return [3 /*break*/, 24];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 4: return [4 /*yield*/, (_a.sent()).getAssetBalance(data.vendedor, asset_1.sellerAddress, asset_1.assetId)];
                                    case 5:
                                        resultGetBalanceOfVendedor = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 6: return [4 /*yield*/, (_a.sent()).getAccountBalance(buyer_1)];
                                    case 7:
                                        getBalanceOfBuyer = _a.sent();
                                        raptoreumNecesario_1 = data.cantidad * asset_1.price;
                                        if (!(resultGetBalanceOfVendedor >= data.cantidad && getBalanceOfBuyer > raptoreumNecesario_1)) return [3 /*break*/, 22];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 8: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(buyer_1, asset_1.sellerAddress, raptoreumNecesario_1)];
                                    case 9:
                                        retirar = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 10: return [4 /*yield*/, (_a.sent()).withdrawToken(data.vendedor, tokenValido.address, data.cantidad, asset_1.assetID)];
                                    case 11:
                                        retirarDelVendedor = _a.sent();
                                        if (!(retirar && retirarDelVendedor)) return [3 /*break*/, 14];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 12: return [4 /*yield*/, (_a.sent()).getAssetBalance(data.vendedor, asset_1.sellerAddress, asset_1.assetId)];
                                    case 13:
                                        resultGetBalanceOfVendedor_1 = _a.sent();
                                        socket.emit("compraExitosa");
                                        this.io.sockets.emit("venta", { vendedor: data.vendedor, asset: data.asset, assetID: asset_1.assetID, balance: resultGetBalanceOfVendedor_1 });
                                        return [3 /*break*/, 21];
                                    case 14:
                                        if (!(!retirar && retirarDelVendedor)) return [3 /*break*/, 20];
                                        this.withdrawBlockedAccounts.push({ usuario: buyer_1 });
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 15: return [4 /*yield*/, (_a.sent()).getAccountBalance(buyer_1)];
                                    case 16:
                                        getBalanceOfBuyer_1 = _a.sent();
                                        if (!(getBalanceOfBuyer_1 < 1)) return [3 /*break*/, 19];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 17: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum("raptoreumworld", tokenValido.address, 1)];
                                    case 18:
                                        retirarDeRaptoreumWorld = _a.sent();
                                        _a.label = 19;
                                    case 19:
                                        intentarRetiradaDeEmergenciaDeToken_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                            var retirarDeEmergenciaDelCliente, index;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, this.raptoreumCore];
                                                    case 1: return [4 /*yield*/, (_a.sent()).withdrawToken(buyer_1, asset_1.sellerAddress, data.cantidad, asset_1.assetID)];
                                                    case 2:
                                                        retirarDeEmergenciaDelCliente = _a.sent();
                                                        if (retirarDeEmergenciaDelCliente) {
                                                            index = this.withdrawBlockedAccounts.findIndex(function (objeto) { return objeto.usuario === data.vendedor; });
                                                            // Si se encuentra el índice del objeto, elimínalo del array
                                                            if (index !== -1) {
                                                                this.withdrawBlockedAccounts.splice(index, 1);
                                                            }
                                                            this.io.sockets.emit("accountUnblocked", buyer_1);
                                                        }
                                                        else {
                                                            this.io.sockets.emit("blockAccount", buyer_1);
                                                            // Si la retirada no fue exitosa, esperar y volver a intentarlo después de 4 segundos
                                                            setTimeout(intentarRetiradaDeEmergenciaDeToken_1, 4000);
                                                        }
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); };
                                        intentarRetiradaDeEmergenciaDeToken_1();
                                        return [3 /*break*/, 21];
                                    case 20:
                                        if (!retirarDelVendedor && retirar) {
                                            this.withdrawBlockedAccounts.push({ usuario: data.vendedor });
                                            intentarRetiradaDeEmergencia_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                                var retirarDeEmergenciaDelVendedor, index;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, this.raptoreumCore];
                                                        case 1: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(data.vendedor, tokenValido.address, raptoreumNecesario_1 - 0.5)];
                                                        case 2:
                                                            retirarDeEmergenciaDelVendedor = _a.sent();
                                                            if (retirarDeEmergenciaDelVendedor) {
                                                                index = this.withdrawBlockedAccounts.findIndex(function (objeto) { return objeto.usuario === data.vendedor; });
                                                                // Si se encuentra el índice del objeto, elimínalo del array
                                                                if (index !== -1) {
                                                                    this.withdrawBlockedAccounts.splice(index, 1);
                                                                }
                                                                this.io.sockets.emit("accountUnblocked", data.vendedor);
                                                            }
                                                            else {
                                                                this.io.sockets.emit("blockAccount", data.vendedor);
                                                                // Si la retirada no fue exitosa, esperar y volver a intentarlo después de 4 segundos
                                                                setTimeout(intentarRetiradaDeEmergencia_1, 4000);
                                                            }
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); };
                                            intentarRetiradaDeEmergencia_1();
                                        }
                                        _a.label = 21;
                                    case 21: return [3 /*break*/, 23];
                                    case 22:
                                        if (resultGetBalanceOfVendedor < data.cantidad) {
                                            socket.emit("sellerNotEnoughTokens");
                                        }
                                        else if (getBalanceOfBuyer < raptoreumNecesario_1) {
                                            socket.emit("buyerNotEnoughRaptoreum");
                                        }
                                        _a.label = 23;
                                    case 23: return [3 /*break*/, 25];
                                    case 24:
                                        socket.emit("notSelling");
                                        _a.label = 25;
                                    case 25: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        }); });
    }
    socketService.prototype.getUserInfo = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenValido_1, usuariofinal_1, assetsDelUsuario, userRaptoreumData, address, balance, assetsEnVentaDelUsuario_1, todosLosAssets, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 15, , 16]);
                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(token, testingconfig_1.CONFIG.JWT_SECRET)];
                    case 1:
                        tokenValido_1 = _a.sent();
                        if (!(tokenValido_1 != null)) return [3 /*break*/, 13];
                        usuariofinal_1 = tokenValido_1.usuario;
                        assetsDelUsuario = [];
                        userRaptoreumData = void 0;
                        return [4 /*yield*/, this.gateway];
                    case 2: return [4 /*yield*/, (_a.sent()).getUserAddress(usuariofinal_1)];
                    case 3:
                        address = _a.sent();
                        if (!(address == 'none')) return [3 /*break*/, 4];
                        console.log("address es none");
                        userRaptoreumData = { address: address };
                        return [3 /*break*/, 12];
                    case 4:
                        console.log("address no es none");
                        return [4 /*yield*/, this.raptoreumCore];
                    case 5: return [4 /*yield*/, (_a.sent()).getAccountBalance(usuariofinal_1)];
                    case 6:
                        balance = _a.sent();
                        userRaptoreumData = { balance: balance, address: address };
                        return [4 /*yield*/, this.gateway];
                    case 7: return [4 /*yield*/, (_a.sent()).getMarketAssetsByUser(usuariofinal_1)];
                    case 8:
                        assetsEnVentaDelUsuario_1 = _a.sent();
                        return [4 /*yield*/, this.gateway];
                    case 9: return [4 /*yield*/, (_a.sent()).getAssets()];
                    case 10:
                        todosLosAssets = _a.sent();
                        return [4 /*yield*/, Promise.all(todosLosAssets.map(function (element) { return __awaiter(_this, void 0, void 0, function () {
                                var balance, enVenta;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.raptoreumCore];
                                        case 1: return [4 /*yield*/, (_a.sent()).getAssetBalance(tokenValido_1.usuario, tokenValido_1.address, element.assetId)];
                                        case 2:
                                            balance = _a.sent();
                                            element.balance = balance;
                                            if (assetsEnVentaDelUsuario_1.length > 0) {
                                                console.log("encontramos assets en venta (rodrigo el mejor)");
                                                enVenta = assetsEnVentaDelUsuario_1.some(function (asset) { return asset.asset === element.asset; });
                                                element.enVenta = enVenta;
                                                console.log("asset.enVenta de rodrigoelmejor:", enVenta);
                                            }
                                            else {
                                                element.enVenta = false;
                                            }
                                            if (element.balance > 0 || element.creador === usuariofinal_1 || element.enVenta || element.vendedor === usuariofinal_1) {
                                                return [2 /*return*/, element];
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 11:
                        assetsDelUsuario = _a.sent();
                        _a.label = 12;
                    case 12:
                        if (assetsDelUsuario.length > 0) {
                            return [2 /*return*/, { raptoreumData: userRaptoreumData, todosLosAssets: assetsDelUsuario }];
                        }
                        else {
                            return [2 /*return*/, { raptoreumData: userRaptoreumData, todosLosAssets: "no hay assets del usuario" }];
                        }
                        return [3 /*break*/, 14];
                    case 13: return [2 /*return*/, false];
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        error_3 = _a.sent();
                        console.log(error_3);
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.getAssetsMarket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var marketAssets, balancePromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.gateway];
                    case 1: return [4 /*yield*/, (_a.sent()).getMarketAssets()];
                    case 2:
                        marketAssets = _a.sent();
                        balancePromises = marketAssets.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = e;
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 1: return [4 /*yield*/, (_b.sent()).getAssetBalance(e.vendedor, e.sellerAddress, e.assetId)];
                                    case 2:
                                        _a.balance = _b.sent();
                                        return [2 /*return*/, e];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(balancePromises)];
                    case 3:
                        // Esperar a que todas las promesas se resuelvan
                        marketAssets = _a.sent();
                        return [2 /*return*/, marketAssets];
                }
            });
        });
    };
    return socketService;
}());
exports.socketService = socketService;
