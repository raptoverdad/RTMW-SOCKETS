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
var testingconfig_1 = require("../config/testingconfig");
var socket_io_1 = require("socket.io");
var gateway_1 = require("../dataaccess/gateway");
var jwtFunctions_1 = require("./jwtFunctions");
var raptoreumCoreFunctions_1 = require("./raptoreumCoreFunctions");
var fs = require("fs");
var https = require("https");
var tokenExpresion = /^[a-zA-Z0-9._-]*$/;
var assetExpresion = /^[a-z]*$/;
var passwordExpresion = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]*$/;
var addressExpresion = /^[a-zA-Z0-9]*$/;
var numberExpression = /^[0-9]+$/;
var minusStringExpression = /^[a-z]+$/;
var socketService = /** @class */ (function () {
    function socketService() {
        var _this = this;
        this.gateway = gateway_1.UserGateway.getInstance();
        this.raptoreumCore = raptoreumCoreFunctions_1.raptoreumCoreAccess.getInstance();
        this.withdrawBlockedAccounts = [];
        this.key = "skrillex";
        var certPath = '/etc/ssl/certs/raptoreumworld.ddns.net+1.pem';
        var keyPath = '/etc/ssl/certs/raptoreumworld.ddns.net+1-key.pem';
        var options = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
        this.io = new socket_io_1.Server(https.createServer(options).listen(4000), {
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
            var object, subject, user, result, encontrado, result_1, result, error_1;
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
                        _a.trys.push([1, 11, , 12]);
                        if (!(subject == "balance")) return [3 /*break*/, 8];
                        if (!tokenExpresion.test(user)) return [3 /*break*/, 7];
                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(user, testingconfig_1.CONFIG.JWT_SECRET)];
                    case 2:
                        result = _a.sent();
                        if (!(result != null)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.gateway];
                    case 3: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(result.usuario)];
                    case 4:
                        encontrado = _a.sent();
                        if (!(encontrado === true)) return [3 /*break*/, 5];
                        socket.emit("blockAccount", result.usuario);
                        return [3 /*break*/, 7];
                    case 5:
                        if (!(encontrado === false)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.getUserInfo(user)];
                    case 6:
                        result_1 = _a.sent();
                        if (result_1 !== false) {
                            socket.emit("balance", result_1);
                        }
                        _a.label = 7;
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        if (!(subject == "assetsmarket")) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.getAssetsMarket()];
                    case 9:
                        result = _a.sent();
                        socket.emit("assetsmarket", result);
                        _a.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_1 = _a.sent();
                        console.log(error_1);
                        return [3 /*break*/, 12];
                    case 12:
                        socket.on("getBalance", function (json, senderSocket) { return __awaiter(_this, void 0, void 0, function () {
                            var resultToken, encontrado, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!tokenExpresion.test(json.token)) return [3 /*break*/, 6];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(json.token, testingconfig_1.CONFIG.JWT_SECRET)];
                                    case 1:
                                        resultToken = _a.sent();
                                        if (!resultToken) return [3 /*break*/, 6];
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(resultToken.usuario)];
                                    case 3:
                                        encontrado = _a.sent();
                                        if (!(encontrado === false)) return [3 /*break*/, 5];
                                        return [4 /*yield*/, this.getUserInfo(json.token)];
                                    case 4:
                                        result = _a.sent();
                                        if (result !== false) {
                                            socket.emit("balance", result);
                                        }
                                        return [3 /*break*/, 6];
                                    case 5:
                                        if (encontrado) {
                                            socket.emit("blockAccount", resultToken.usuario);
                                        }
                                        _a.label = 6;
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on("withdraw", function (json, senderSocket) { return __awaiter(_this, void 0, void 0, function () {
                            var result, encontrado, verifyPass, float, withdraw, error_2, ricaComision, resultGetBalanceOfVendedor, withdraw, withdraw_1, error_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(tokenExpresion.test(json.token) && addressExpresion.test(json.to))) return [3 /*break*/, 29];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(json.token, testingconfig_1.CONFIG.JWT_SECRET)];
                                    case 1:
                                        result = _a.sent();
                                        if (!(result != null)) return [3 /*break*/, 29];
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(result.usuario)];
                                    case 3:
                                        encontrado = _a.sent();
                                        if (!(encontrado === false)) return [3 /*break*/, 28];
                                        console.log("password de withdraw:", json.password);
                                        return [4 /*yield*/, this.gateway];
                                    case 4: return [4 /*yield*/, (_a.sent()).verifyPassword(result.usuario, json.password)];
                                    case 5:
                                        verifyPass = _a.sent();
                                        if (!verifyPass) return [3 /*break*/, 26];
                                        console.log("contra verificada", json.password);
                                        float = parseFloat(json.amount);
                                        _a.label = 6;
                                    case 6:
                                        _a.trys.push([6, 24, , 25]);
                                        console.log("coin:", json.coin);
                                        if (!(json.coin == 'raptoreum')) return [3 /*break*/, 15];
                                        console.log("pasamos a coin raptoreum");
                                        console.log("coin:", json.password);
                                        console.log("el balance de la cuenta de raptoreum es el suficiente");
                                        _a.label = 7;
                                    case 7:
                                        _a.trys.push([7, 10, 11, 14]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 8: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(result.usuario, json.to, float)];
                                    case 9:
                                        withdraw = _a.sent();
                                        if (withdraw) {
                                            socket.emit("successfulWithdraw");
                                        }
                                        return [3 /*break*/, 14];
                                    case 10:
                                        error_2 = _a.sent();
                                        console.log(error_2);
                                        if (error_2 !== false) {
                                            socket.emit("notEnoughBalance");
                                        }
                                        else {
                                            socket.emit("withdrawError");
                                        }
                                        return [3 /*break*/, 14];
                                    case 11: return [4 /*yield*/, this.raptoreumCore];
                                    case 12: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(result.usuario, "RRk1kqXNWfgzLB8EWENBw2cgTEibgQPhcW", 0.87)];
                                    case 13:
                                        ricaComision = _a.sent();
                                        return [7 /*endfinally*/];
                                    case 14: return [3 /*break*/, 23];
                                    case 15: return [4 /*yield*/, this.raptoreumCore];
                                    case 16: return [4 /*yield*/, (_a.sent()).getAssetBalance(result.usuario, result.address, json.coin)];
                                    case 17:
                                        resultGetBalanceOfVendedor = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 18: return [4 /*yield*/, (_a.sent()).withdrawToken(result.usuario, json.to, float, json.asset)];
                                    case 19:
                                        withdraw = _a.sent();
                                        if (!withdraw) return [3 /*break*/, 22];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 20: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(result.usuario, "RRk1kqXNWfgzLB8EWENBw2cgTEibgQPhcW", 0.8)];
                                    case 21:
                                        withdraw_1 = _a.sent();
                                        socket.emit("successfulWithdraw");
                                        return [3 /*break*/, 23];
                                    case 22:
                                        socket.emit("withdrawError");
                                        _a.label = 23;
                                    case 23: return [3 /*break*/, 25];
                                    case 24:
                                        error_3 = _a.sent();
                                        if (error_3 != false) {
                                            socket.emit("notEnoughBalance");
                                        }
                                        else {
                                            socket.emit("withdrawError");
                                        }
                                        return [3 /*break*/, 25];
                                    case 25: return [3 /*break*/, 27];
                                    case 26:
                                        socket.emit("wrongPassword");
                                        _a.label = 27;
                                    case 27: return [3 /*break*/, 29];
                                    case 28:
                                        if (encontrado) {
                                            socket.emit("blockAccount", result.usuario);
                                        }
                                        _a.label = 29;
                                    case 29: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on("validAddress", function (data, senderSocket) { return __awaiter(_this, void 0, void 0, function () {
                            var result, error_4;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!addressExpresion.test(data)) return [3 /*break*/, 5];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 4, , 5]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 2: return [4 /*yield*/, (_a.sent()).validateAddress(data)];
                                    case 3:
                                        result = _a.sent();
                                        if (result) {
                                            socket.emit("validAddressResult", true);
                                        }
                                        else if (!result) {
                                            socket.emit("validAddressResult", false);
                                        }
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_4 = _a.sent();
                                        console.log(error_4);
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('detenerVenta', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido, usuario, encontrado, asset, resultDetenerVenta;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(tokenExpresion.test(data.token) && assetExpresion.test(data.asset))) return [3 /*break*/, 7];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token, testingconfig_1.CONFIG.JWT_SECRET)];
                                    case 1:
                                        tokenValido = _a.sent();
                                        if (!(tokenValido != null)) return [3 /*break*/, 7];
                                        usuario = tokenValido.usuario;
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(usuario)];
                                    case 3:
                                        encontrado = _a.sent();
                                        if (!(encontrado === false)) return [3 /*break*/, 6];
                                        asset = data.asset;
                                        return [4 /*yield*/, this.gateway];
                                    case 4: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, asset)];
                                    case 5:
                                        resultDetenerVenta = _a.sent();
                                        if (resultDetenerVenta) {
                                            this.io.sockets.emit("ventaDetenida", { asset: asset, vendedor: usuario });
                                        }
                                        return [3 /*break*/, 7];
                                    case 6:
                                        if (encontrado === true) {
                                            socket.emit("blockAccount", usuario);
                                        }
                                        _a.label = 7;
                                    case 7: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('compra', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido_1, buyer_1, encontrado, assetsEnVentaDelVendedor, asset_1, resultGetBalanceOfVendedor, resultGetRaptoreumBalanceOfVendedor_1, getBalanceOfBuyer, getTokenBalanceOfBuyer_1, raptoreumNecesario_1, retirar, retirarDelVendedor, comisionRTMWORLD, resultGetBalanceOfVendedor_1, resultBlockBuyer, resultBlockSeller, retirarDeRaptoreumWorld, intentarRetiradaDeEmergenciaDeToken_1, resultBlockBuyer, resultBlockSeller, reembolzarAlBuyer, intentarRetiradaDeEmergencia_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!tokenExpresion.test(data.token)) return [3 /*break*/, 42];
                                        console.log("La cadena es válida");
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token, testingconfig_1.CONFIG.JWT_SECRET)];
                                    case 1:
                                        tokenValido_1 = _a.sent();
                                        if (!(tokenValido_1 != null)) return [3 /*break*/, 41];
                                        buyer_1 = tokenValido_1.usuario;
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(buyer_1)];
                                    case 3:
                                        encontrado = _a.sent();
                                        if (!(encontrado === true)) return [3 /*break*/, 4];
                                        socket.emit("blockAccount", buyer_1);
                                        return [2 /*return*/];
                                    case 4:
                                        if (!(encontrado === false)) return [3 /*break*/, 41];
                                        return [4 /*yield*/, this.gateway];
                                    case 5: return [4 /*yield*/, (_a.sent()).getMarketAssetsByUser(data.vendedor)];
                                    case 6:
                                        assetsEnVentaDelVendedor = _a.sent();
                                        if (!(assetsEnVentaDelVendedor.length > 0)) return [3 /*break*/, 41];
                                        asset_1 = assetsEnVentaDelVendedor.find(function (e) {
                                            return e.asset == data.asset && e.vendedor == data.vendedor;
                                        });
                                        if (!asset_1) return [3 /*break*/, 40];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 7: return [4 /*yield*/, (_a.sent()).getAssetBalance(data.vendedor, asset_1.sellerAddress, asset_1.assetId)];
                                    case 8:
                                        resultGetBalanceOfVendedor = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 9: return [4 /*yield*/, (_a.sent()).getAccountBalance(data.vendedor)];
                                    case 10:
                                        resultGetRaptoreumBalanceOfVendedor_1 = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 11: return [4 /*yield*/, (_a.sent()).getAccountBalance(buyer_1)];
                                    case 12:
                                        getBalanceOfBuyer = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 13: return [4 /*yield*/, (_a.sent()).getAssetBalance(buyer_1, tokenValido_1.address, asset_1.assetId)];
                                    case 14:
                                        getTokenBalanceOfBuyer_1 = _a.sent();
                                        raptoreumNecesario_1 = data.cantidad * asset_1.price;
                                        if (!(resultGetBalanceOfVendedor >= data.cantidad && getBalanceOfBuyer >= raptoreumNecesario_1 + 0.8)) return [3 /*break*/, 38];
                                        console.log("direccion a enviar RTM:", asset_1.sellerAddress);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 15: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(buyer_1, asset_1.sellerAddress, raptoreumNecesario_1)];
                                    case 16:
                                        retirar = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 17: return [4 /*yield*/, (_a.sent()).withdrawToken(data.vendedor, tokenValido_1.address, data.cantidad, asset_1.assetID)];
                                    case 18:
                                        retirarDelVendedor = _a.sent();
                                        if (!(retirar && retirarDelVendedor)) return [3 /*break*/, 23];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 19: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(buyer_1, "RQfvPMJjrLmHJnn3fWmEhz3Lpp4KKdKvdE", 0.7)];
                                    case 20:
                                        comisionRTMWORLD = _a.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 21: return [4 /*yield*/, (_a.sent()).getAssetBalance(data.vendedor, asset_1.sellerAddress, asset_1.assetId)];
                                    case 22:
                                        resultGetBalanceOfVendedor_1 = _a.sent();
                                        socket.emit("compraExitosa");
                                        this.io.sockets.emit("venta", { vendedor: data.vendedor, asset: data.asset, assetID: asset_1.assetID, balance: resultGetBalanceOfVendedor_1 });
                                        return [3 /*break*/, 37];
                                    case 23:
                                        if (!(!retirar && retirarDelVendedor)) return [3 /*break*/, 30];
                                        return [4 /*yield*/, this.gateway];
                                    case 24: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(buyer_1, "block")];
                                    case 25:
                                        resultBlockBuyer = _a.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 26: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(data.vendedor, "block")];
                                    case 27:
                                        resultBlockSeller = _a.sent();
                                        socket.emit("errorDeCompra");
                                        this.io.sockets.emit("blockAccount", data.vendedor);
                                        this.io.sockets.emit("blockAccount", buyer_1);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 28: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum("raptoreumworld", tokenValido_1.address, 0.3)];
                                    case 29:
                                        retirarDeRaptoreumWorld = _a.sent();
                                        intentarRetiradaDeEmergenciaDeToken_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                            var balance, retirarDeEmergenciaDelCliente, resultBlockBuyer_1, resultBlockSeller_1;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, this.raptoreumCore];
                                                    case 1: return [4 /*yield*/, (_a.sent()).getAssetBalance(buyer_1, tokenValido_1.address, asset_1.assetId)];
                                                    case 2:
                                                        balance = _a.sent();
                                                        if (!(balance >= getTokenBalanceOfBuyer_1)) return [3 /*break*/, 10];
                                                        return [4 /*yield*/, this.raptoreumCore];
                                                    case 3: return [4 /*yield*/, (_a.sent()).withdrawToken(buyer_1, asset_1.sellerAddress, data.cantidad, asset_1.assetID)];
                                                    case 4:
                                                        retirarDeEmergenciaDelCliente = _a.sent();
                                                        if (!retirarDeEmergenciaDelCliente) return [3 /*break*/, 9];
                                                        return [4 /*yield*/, this.gateway];
                                                    case 5: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(buyer_1, "unblock")];
                                                    case 6:
                                                        resultBlockBuyer_1 = _a.sent();
                                                        return [4 /*yield*/, this.gateway];
                                                    case 7: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(data.vendedor, "unblock")];
                                                    case 8:
                                                        resultBlockSeller_1 = _a.sent();
                                                        this.io.sockets.emit("accountUnblocked", buyer_1);
                                                        this.io.sockets.emit("accountUnblocked", data.vendedor);
                                                        _a.label = 9;
                                                    case 9: return [3 /*break*/, 11];
                                                    case 10:
                                                        this.io.sockets.emit("blockAccount", buyer_1);
                                                        this.io.sockets.emit("blockAccount", data.vendedor);
                                                        setTimeout(intentarRetiradaDeEmergenciaDeToken_1, 4000);
                                                        _a.label = 11;
                                                    case 11: return [2 /*return*/];
                                                }
                                            });
                                        }); };
                                        intentarRetiradaDeEmergenciaDeToken_1();
                                        return [3 /*break*/, 37];
                                    case 30:
                                        if (!(!retirarDelVendedor && retirar)) return [3 /*break*/, 37];
                                        return [4 /*yield*/, this.gateway];
                                    case 31: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(buyer_1, "block")];
                                    case 32:
                                        resultBlockBuyer = _a.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 33: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(data.vendedor, "block")];
                                    case 34:
                                        resultBlockSeller = _a.sent();
                                        socket.emit("errorDeCompra");
                                        this.io.sockets.emit("blockAccount", data.vendedor);
                                        this.io.sockets.emit("blockAccount", buyer_1);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 35: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum("raptoreumworld", tokenValido_1.address, raptoreumNecesario_1)];
                                    case 36:
                                        reembolzarAlBuyer = _a.sent();
                                        intentarRetiradaDeEmergencia_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                            var _this = this;
                                            return __generator(this, function (_a) {
                                                setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                                    var balance, retirarDeEmergenciaDelVendedor, resultUnblockBuyer, resultUnblockSeller;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, this.raptoreumCore];
                                                            case 1: return [4 /*yield*/, (_a.sent()).getAccountBalance(data.vendedor)];
                                                            case 2:
                                                                balance = _a.sent();
                                                                if (!(balance >= resultGetRaptoreumBalanceOfVendedor_1 + raptoreumNecesario_1 - 0.1)) return [3 /*break*/, 10];
                                                                console.log("Intentando retirar el Raptoreum enviado");
                                                                return [4 /*yield*/, this.raptoreumCore];
                                                            case 3: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(data.vendedor, "RQfvPMJjrLmHJnn3fWmEhz3Lpp4KKdKvdE", raptoreumNecesario_1 - 0.1)];
                                                            case 4:
                                                                retirarDeEmergenciaDelVendedor = _a.sent();
                                                                if (!retirarDeEmergenciaDelVendedor) return [3 /*break*/, 9];
                                                                return [4 /*yield*/, this.gateway];
                                                            case 5: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(buyer_1, "unblock")];
                                                            case 6:
                                                                resultUnblockBuyer = _a.sent();
                                                                return [4 /*yield*/, this.gateway];
                                                            case 7: return [4 /*yield*/, (_a.sent()).blockOrUnblockUserTransactions(data.vendedor, "unblock")];
                                                            case 8:
                                                                resultUnblockSeller = _a.sent();
                                                                this.io.sockets.emit("accountUnblocked", data.vendedor);
                                                                this.io.sockets.emit("accountUnblocked", buyer_1);
                                                                _a.label = 9;
                                                            case 9: return [3 /*break*/, 11];
                                                            case 10:
                                                                this.io.sockets.emit("blockAccount", data.vendedor);
                                                                this.io.sockets.emit("blockAccount", buyer_1);
                                                                setTimeout(intentarRetiradaDeEmergencia_1, 30000);
                                                                _a.label = 11;
                                                            case 11: return [2 /*return*/];
                                                        }
                                                    });
                                                }); }, 30000);
                                                return [2 /*return*/];
                                            });
                                        }); };
                                        intentarRetiradaDeEmergencia_1();
                                        _a.label = 37;
                                    case 37: return [3 /*break*/, 39];
                                    case 38:
                                        if (resultGetBalanceOfVendedor < data.cantidad) {
                                            socket.emit("sellerNotEnoughTokens");
                                        }
                                        else if (getBalanceOfBuyer < raptoreumNecesario_1) {
                                            socket.emit("buyerNotEnoughRaptoreum");
                                        }
                                        _a.label = 39;
                                    case 39: return [3 /*break*/, 41];
                                    case 40:
                                        socket.emit("notSelling");
                                        _a.label = 41;
                                    case 41: return [3 /*break*/, 43];
                                    case 42:
                                        console.log("elseeeeeeeeeee");
                                        _a.label = 43;
                                    case 43: return [2 /*return*/];
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
            var tokenValido_2, usuariofinal_1, assetsDelUsuario, userRaptoreumData, address, balance, assetsEnVentaDelUsuario_1, todosLosAssets, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 15, , 16]);
                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(token, testingconfig_1.CONFIG.JWT_SECRET)];
                    case 1:
                        tokenValido_2 = _a.sent();
                        if (!(tokenValido_2 != null)) return [3 /*break*/, 13];
                        usuariofinal_1 = tokenValido_2.usuario;
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
                                        case 1: return [4 /*yield*/, (_a.sent()).getAssetBalance(tokenValido_2.usuario, tokenValido_2.address, element.assetId)];
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
                        error_5 = _a.sent();
                        console.log(error_5);
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
