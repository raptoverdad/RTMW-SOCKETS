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
var jwt = require('jsonwebtoken');
var raptoreumCoreFunctions_1 = require("./raptoreumCoreFunctions");
var http = require("http");
var speakeasy = require('speakeasy');
var axios_1 = require("axios");
var tokenExpresion = /^[a-zA-Z0-9._-]*$/;
var addressExpresion = /^[a-zA-Z0-9]*$/;
var util = require('util');
function getFromCache(key, client) {
    return __awaiter(this, void 0, void 0, function () {
        var getAsync, cachedData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getAsync = util.promisify(client.get).bind(client);
                    return [4 /*yield*/, getAsync(key)];
                case 1:
                    cachedData = _a.sent();
                    return [2 /*return*/, JSON.parse(cachedData)];
            }
        });
    });
}
function cacheData(key, data, client) {
    return __awaiter(this, void 0, void 0, function () {
        var setAsync;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setAsync = util.promisify(client.set).bind(client);
                    return [4 /*yield*/, setAsync(key, JSON.stringify(data))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteFromCache(key, client) {
    return __awaiter(this, void 0, void 0, function () {
        var delAsync;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    delAsync = util.promisify(client.del).bind(client);
                    return [4 /*yield*/, delAsync(key)];
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
        this.redisClient = false;
        this.io = new socket_io_1.Server(http.createServer().listen(3000), {
            cors: {
                origin: ["https://raptoreumworld.com"],
                methods: ["GET", "POST"],
                credentials: false,
            },
        });
        this.startChecking();
        this.io.on("connection", function (socket) { return __awaiter(_this, void 0, void 0, function () {
            var _a, busySales, busyAssets, socketId, object, subject, user;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.redisClient) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, this.gateway];
                    case 1: return [4 /*yield*/, (_b.sent()).getRedisClient()];
                    case 2:
                        _a.redisClient = _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                    case 4:
                        busySales = _b.sent();
                        if (!!busySales) return [3 /*break*/, 6];
                        return [4 /*yield*/, cacheData("busySales", [], this.redisClient)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [4 /*yield*/, getFromCache("busyAssets", this.redisClient)];
                    case 7:
                        busyAssets = _b.sent();
                        if (!!busySales) return [3 /*break*/, 9];
                        return [4 /*yield*/, cacheData("busyAssets", [], this.redisClient)];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9:
                        socketId = socket.id;
                        console.log('Cliente conectado:', socket);
                        if (!this.rateLimiters[socketId]) {
                            this.rateLimiters[socketId] = new RateLimiter(1, 1 / 3);
                        }
                        socket.on('disconnect', function () {
                            delete _this.rateLimiters[socketId];
                        });
                        object = JSON.parse(socket.handshake.query.object);
                        subject = object.subject.trim();
                        user = object.token;
                        if (!this.rateLimiters[socketId]) {
                            this.rateLimiters[socketId] = new RateLimiter(1, 1 / 3);
                        }
                        if (!(subject === "assetsmarket" || subject === "nftmarket")) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.handleMarket(subject, socket, socketId, user)];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11:
                        socket.on('assetToMarketDiscord', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var asset, price, health, result, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        asset = data.asset;
                                        price = parseFloat(data.price);
                                        // Verificar si `price` es un número válido y está dentro del rango permitido
                                        if (isNaN(price) || price <= 0 || price > 1000000000) {
                                            return [2 /*return*/, socket.emit("ASSETTOMARKET_assetToMarketError", { comprador: data.userid })];
                                        }
                                        if (!asset || asset.length < 1 || asset.length > 250) {
                                            return [2 /*return*/, socket.emit("ASSETTOMARKET_assetToMarketError", { comprador: data.userid })];
                                        }
                                        return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 1:
                                        health = _a.sent();
                                        if (health == "error" || health == "dead") {
                                            return [2 /*return*/, socket.emit("ASSETTOMARKET_serverDown", { comprador: data.userid })];
                                        }
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, this.assetToMarket(data.asset, data.token, data.price, data.totp)];
                                    case 3:
                                        result = _a.sent();
                                        console.log("result assetToMarket:", result);
                                        if (result) {
                                            socket.emit("ASSETTOMARKET_successAssetToMarket", { comprador: data.userid });
                                            if (result.type === "TOKEN")
                                                this.io.sockets.emit("newAssetInMarket", result.result);
                                            if (result.type === "NFT")
                                                this.io.sockets.emit("newNftInMarket", result.result);
                                            return [2 /*return*/];
                                        }
                                        return [3 /*break*/, 5];
                                    case 4:
                                        e_1 = _a.sent();
                                        switch (e_1) {
                                            case "invalidTOTP":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_invalidTOTP", { comprador: data.userid })];
                                            case "errorTOTP":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_errorTOTP", { comprador: data.userid })];
                                            case "blockedAccount":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_blockedAccount", { comprador: data.userid })];
                                            case "assetNotFoundInWallet":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_assetNotFoundInWallet", { comprador: data.userid })];
                                            case "selling":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_selling", { comprador: data.userid })];
                                            case "expired":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_expired", { comprador: data.userid })];
                                            case "notExists":
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_notExists", { comprador: data.userid })];
                                            default:
                                                return [2 /*return*/, socket.emit("ASSETTOMARKET_assetToMarketError", { comprador: data.userid })];
                                        }
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('assetToMarket', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var asset, price, health, result, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        asset = data.asset;
                                        price = parseFloat(data.price);
                                        // Verificar si `price` es un número válido y está dentro del rango permitido
                                        if (isNaN(price) || price <= 0 || price > 1000000000) {
                                            return [2 /*return*/, socket.emit("assetToMarketError", "notValidPrice")];
                                        }
                                        if (!asset || asset.length < 1 || asset.length > 250) {
                                            return [2 /*return*/, socket.emit("assetToMarketError", "invalidParameters")];
                                        }
                                        return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 1:
                                        health = _a.sent();
                                        if (health == "error" || health == "dead") {
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
                                        console.log("result assetToMarket:", result);
                                        if (result) {
                                            socket.emit("successAssetToMarket", result.result);
                                            if (result.type === "TOKEN")
                                                this.io.sockets.emit("newAssetInMarket", result.result);
                                            if (result.type === "NFT")
                                                this.io.sockets.emit("newNftInMarket", result.result);
                                            return [2 /*return*/];
                                        }
                                        return [3 /*break*/, 5];
                                    case 4:
                                        e_2 = _a.sent();
                                        if (e_2 === "invalidTOTP") {
                                            return [2 /*return*/, socket.emit("invalidTOTP")];
                                        }
                                        else if (e_2 === "errorTOTP") {
                                            return [2 /*return*/, socket.emit("errorTOTP")];
                                        }
                                        else if (e_2 === "blockedAccount") {
                                            return [2 /*return*/, socket.emit("blockedAccount")];
                                        }
                                        else if (e_2 === "assetNotFoundInWallet") {
                                            return [2 /*return*/, socket.emit("assetNotFoundInWallet")];
                                        }
                                        else if (e_2 === "selling") {
                                            return [2 /*return*/, socket.emit("selling")];
                                        }
                                        else if (e_2 === "expired") {
                                            return [2 /*return*/, socket.emit("expired")];
                                        }
                                        else if (e_2 === "notExists") {
                                            return [2 /*return*/, socket.emit("notExists")];
                                        }
                                        else {
                                            return [2 /*return*/, socket.emit("assetToMarketError", e_2)];
                                        }
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('detenerVentaDiscord', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var healh, tokenValido, usuario, NFTenVentaPorElUsuario, enVentaPorElUsuario, resultDetenerVenta, isActive, index, resultDetenerVenta, isActive, index, e_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.log("DATA QUE LLEGA PARA DETENER VENTA:", data);
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 26, , 27]);
                                        return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 2:
                                        healh = _a.sent();
                                        console.log("resultado health:", healh);
                                        if (healh == "error") {
                                            console.log("emiting serverDown");
                                            return [2 /*return*/, socket.emit("STOPSALE_serverDown", { comprador: data.userid })];
                                        }
                                        else if (healh == "dead") {
                                            console.log("emiting serverDown");
                                            return [2 /*return*/, socket.emit("STOPSALE_serverDown", { comprador: data.userid })];
                                        }
                                        if (!tokenExpresion.test(data.token)) return [3 /*break*/, 25];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 3:
                                        tokenValido = _a.sent();
                                        if (!(tokenValido != "expired" && tokenValido != "error")) return [3 /*break*/, 24];
                                        console.log("TOKEN VALIDO");
                                        usuario = tokenValido.userid;
                                        console.log("pasando a verifyaccountblocked");
                                        console.log("data con la que revisar token en venta por el usuario:", data);
                                        return [4 /*yield*/, this.gateway];
                                    case 4: return [4 /*yield*/, (_a.sent()).verifyNftEnVenta(data.asset, usuario, data.ventaId)];
                                    case 5:
                                        NFTenVentaPorElUsuario = _a.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 6: return [4 /*yield*/, (_a.sent()).verifyTokenEnVenta(data.asset, usuario, data.ventaId)];
                                    case 7:
                                        enVentaPorElUsuario = _a.sent();
                                        if (!(enVentaPorElUsuario && !NFTenVentaPorElUsuario)) return [3 /*break*/, 14];
                                        console.log("asset en venta");
                                        return [4 /*yield*/, this.gateway];
                                    case 8: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, data.ventaId, "asset")];
                                    case 9:
                                        resultDetenerVenta = _a.sent();
                                        if (!resultDetenerVenta) return [3 /*break*/, 13];
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 10:
                                        isActive = _a.sent();
                                        index = isActive.findIndex(function (i) { return i.ventaId === data.ventaId; });
                                        if (!(index !== -1)) return [3 /*break*/, 12];
                                        isActive.splice(index, 1); // Elimina el objeto encontrado
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 11:
                                        _a.sent(); // Guarda el array actualizado en Redis
                                        _a.label = 12;
                                    case 12:
                                        socket.emit("STOPSALE_ventaUsuarioDetenida", { comprador: data.userid });
                                        return [2 /*return*/, this.io.sockets.emit("ventaDetenida", data.ventaId)];
                                    case 13: return [2 /*return*/, socket.emit("STOPSALE_errorStoppingSell", { comprador: data.userid })];
                                    case 14:
                                        if (!(!enVentaPorElUsuario && NFTenVentaPorElUsuario)) return [3 /*break*/, 22];
                                        console.log("nft en venta");
                                        return [4 /*yield*/, this.gateway];
                                    case 15: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, data.ventaId, "nft")];
                                    case 16:
                                        resultDetenerVenta = _a.sent();
                                        if (!resultDetenerVenta) return [3 /*break*/, 20];
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 17:
                                        isActive = _a.sent();
                                        index = isActive.findIndex(function (i) { return i.ventaId === data.ventaId; });
                                        if (!(index !== -1)) return [3 /*break*/, 19];
                                        isActive.splice(index, 1); // Elimina el objeto encontrado
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 18:
                                        _a.sent(); // Guarda el array actualizado en Redis
                                        _a.label = 19;
                                    case 19:
                                        socket.emit("STOPSALE_ventaUsuarioDetenida", { comprador: data.userid });
                                        return [2 /*return*/, this.io.sockets.emit("ventaDetenida", data.ventaId)];
                                    case 20: return [2 /*return*/, socket.emit("STOPSALE_errorStoppingSell", { comprador: data.userid })];
                                    case 21: return [3 /*break*/, 23];
                                    case 22:
                                        if (!enVentaPorElUsuario && !NFTenVentaPorElUsuario) {
                                            console.log("EMITIENDO NOT SELLING Y CONSOLEANDO ENVENTAPORELUSUARIO:", enVentaPorElUsuario);
                                            return [2 /*return*/, socket.emit("STOPSALE_notSelling", { comprador: data.userid })];
                                        }
                                        _a.label = 23;
                                    case 23: return [3 /*break*/, 25];
                                    case 24:
                                        if (tokenValido == "expired") {
                                            return [2 /*return*/, socket.emit("expired")];
                                        }
                                        _a.label = 25;
                                    case 25: return [3 /*break*/, 27];
                                    case 26:
                                        e_3 = _a.sent();
                                        console.log(e_3);
                                        return [3 /*break*/, 27];
                                    case 27: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('detenerVenta', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var healh, tokenValido, usuario, NFTenVentaPorElUsuario, enVentaPorElUsuario, resultDetenerVenta, isActive, index, resultDetenerVenta, isActive, index, e_4;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!this.rateLimiters[socketId].consume(1, user)) {
                                            return [2 /*return*/];
                                        }
                                        console.log("DATA QUE LLEGA PARA DETENER VENTA:", data);
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 26, , 27]);
                                        return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 2:
                                        healh = _a.sent();
                                        console.log("resultado health:", healh);
                                        if (healh == "error") {
                                            console.log("emiting serverDown");
                                            return [2 /*return*/, socket.emit("emiting serverDown")];
                                        }
                                        else if (healh == "dead") {
                                            console.log("emiting serverDown");
                                            return [2 /*return*/, socket.emit("serverDown")];
                                        }
                                        if (!tokenExpresion.test(data.token)) return [3 /*break*/, 25];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 3:
                                        tokenValido = _a.sent();
                                        if (!(tokenValido != "expired" && tokenValido != "error")) return [3 /*break*/, 24];
                                        console.log("TOKEN VALIDO");
                                        usuario = tokenValido.userid;
                                        console.log("pasando a verifyaccountblocked");
                                        console.log("data con la que revisar token en venta por el usuario:", data);
                                        return [4 /*yield*/, this.gateway];
                                    case 4: return [4 /*yield*/, (_a.sent()).verifyNftEnVenta(data.asset, usuario, data.ventaId)];
                                    case 5:
                                        NFTenVentaPorElUsuario = _a.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 6: return [4 /*yield*/, (_a.sent()).verifyTokenEnVenta(data.asset, usuario, data.ventaId)];
                                    case 7:
                                        enVentaPorElUsuario = _a.sent();
                                        if (!(enVentaPorElUsuario && !NFTenVentaPorElUsuario)) return [3 /*break*/, 14];
                                        console.log("asset en venta");
                                        return [4 /*yield*/, this.gateway];
                                    case 8: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, data.ventaId, "asset")];
                                    case 9:
                                        resultDetenerVenta = _a.sent();
                                        if (!resultDetenerVenta) return [3 /*break*/, 13];
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 10:
                                        isActive = _a.sent();
                                        index = isActive.findIndex(function (i) { return i.ventaId === data.ventaId; });
                                        if (!(index !== -1)) return [3 /*break*/, 12];
                                        isActive.splice(index, 1); // Elimina el objeto encontrado
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 11:
                                        _a.sent(); // Guarda el array actualizado en Redis
                                        _a.label = 12;
                                    case 12:
                                        socket.emit("ventaUsuarioDetenida", data.ventaId);
                                        return [2 /*return*/, this.io.sockets.emit("ventaDetenida", data.ventaId)];
                                    case 13: return [2 /*return*/, socket.emit("errorStoppingSell")];
                                    case 14:
                                        if (!(!enVentaPorElUsuario && NFTenVentaPorElUsuario)) return [3 /*break*/, 22];
                                        console.log("nft en venta");
                                        return [4 /*yield*/, this.gateway];
                                    case 15: return [4 /*yield*/, (_a.sent()).detenerVenta(usuario, data.ventaId, "nft")];
                                    case 16:
                                        resultDetenerVenta = _a.sent();
                                        if (!resultDetenerVenta) return [3 /*break*/, 20];
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 17:
                                        isActive = _a.sent();
                                        index = isActive.findIndex(function (i) { return i.ventaId === data.ventaId; });
                                        if (!(index !== -1)) return [3 /*break*/, 19];
                                        isActive.splice(index, 1); // Elimina el objeto encontrado
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 18:
                                        _a.sent(); // Guarda el array actualizado en Redis
                                        _a.label = 19;
                                    case 19:
                                        socket.emit("ventaUsuarioDetenida", data.ventaId);
                                        return [2 /*return*/, this.io.sockets.emit("ventaDetenida", data.ventaId)];
                                    case 20: return [2 /*return*/, socket.emit("errorStoppingSell")];
                                    case 21: return [3 /*break*/, 23];
                                    case 22:
                                        if (!enVentaPorElUsuario && !NFTenVentaPorElUsuario) {
                                            console.log("EMITIENDO NOT SELLING Y CONSOLEANDO ENVENTAPORELUSUARIO:", enVentaPorElUsuario);
                                            return [2 /*return*/, socket.emit("notSelling")];
                                        }
                                        _a.label = 23;
                                    case 23: return [3 /*break*/, 25];
                                    case 24:
                                        if (tokenValido == "expired") {
                                            return [2 /*return*/, socket.emit("expired")];
                                        }
                                        _a.label = 25;
                                    case 25: return [3 /*break*/, 27];
                                    case 26:
                                        e_4 = _a.sent();
                                        console.log(e_4);
                                        return [3 /*break*/, 27];
                                    case 27: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('compra', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido, address, isTotp, resultTOTP, result, buyer, accountBlocked, _a, assetsEnVentaDelVendedor, nftEnVentaDelVendedor, _b, _c, _d, itemType, itemEnVenta_1, vendedor, cuentaBloqueadaVendedor, _e, balanceOfVendedor, raptoreumBalanceOfVendedor, balanceOfBuyer, resultGetAssetBalanceOfComprador, _f, _g, _h, isRWS, rawValue, DECIMAL_FACTOR, realValue, balanceAssetEnVenta, raptoreumNecesario, blocked, blocked2, insertarVentaVendedor, insertarCompraComprador, pending, retiroCajaChica, isActive, _j, raptoreumWithdraw, tokenWithdraw, resultDetenerVenta, e_5, _k, updateBuyer, updateSeller, _l, _m, _o, isActive, index, _p, isActive, transaccionPendidente, retirarDeRaptoreumWorld, resultunBlockcomprador, isActive, transaccionPendidente, retirarDeRaptoreumWorld, resultunBlockvendedor, error_1;
                            return __generator(this, function (_q) {
                                switch (_q.label) {
                                    case 0:
                                        if (!(tokenExpresion.test(data.token) && typeof (data.cantidad) == "number" && data.cantidad > 0)) return [3 /*break*/, 110];
                                        console.log("pasamos la validacion de parametros");
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 1:
                                        tokenValido = _q.sent();
                                        if (tokenValido === "error")
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "jwt error")];
                                        if (tokenValido === "expired")
                                            return [2 /*return*/, socket.emit("expired")];
                                        if (!!tokenValido.address) return [3 /*break*/, 4];
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_q.sent()).getUserAddress(tokenValido.userid)];
                                    case 3:
                                        address = _q.sent();
                                        if (address === "error")
                                            return [2 /*return*/, socket.emit("errorDeCompra")];
                                        if (address === "no address")
                                            return [2 /*return*/, socket.emit("errorDeCompra")];
                                        tokenValido.address = address;
                                        _q.label = 4;
                                    case 4: return [4 /*yield*/, this.isTOTP(tokenValido.userid)];
                                    case 5:
                                        isTotp = _q.sent();
                                        if (isTotp === "error")
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "totp error")];
                                        if (!(isTotp === true)) return [3 /*break*/, 7];
                                        return [4 /*yield*/, this.verifyTOTP(tokenValido.userid, data.totp)];
                                    case 6:
                                        resultTOTP = _q.sent();
                                        if (resultTOTP === false)
                                            return [2 /*return*/, socket.emit("invalidTOTP")];
                                        if (resultTOTP === "error")
                                            return [2 /*return*/, socket.emit("errorTOTP")];
                                        _q.label = 7;
                                    case 7: return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 8:
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
                                    case 9: return [4 /*yield*/, (_q.sent()).verifyAccountBlocked(buyer)];
                                    case 10:
                                        accountBlocked = _q.sent();
                                        if (accountBlocked !== "error" && accountBlocked === true) {
                                            console.log("cuenta bloqueada del comprador!!");
                                            return [2 /*return*/, this.handleError(socket, "blockAccount", "Account is blocked")];
                                        }
                                        console.log("ID DE LA VENTA:", data.ventaId);
                                        _c = (_b = Promise).all;
                                        return [4 /*yield*/, this.gateway];
                                    case 11: return [4 /*yield*/, (_q.sent()).getMarketAssetsById(data.ventaId)];
                                    case 12:
                                        _d = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.gateway];
                                    case 13: return [4 /*yield*/, (_q.sent()).getMarketNFTsById(data.ventaId)];
                                    case 14: return [4 /*yield*/, _c.apply(_b, [_d.concat([
                                                _q.sent()
                                            ])])];
                                    case 15:
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
                                    case 16: return [4 /*yield*/, (_q.sent()).getVendedorDelToken(itemEnVenta_1._id, itemType)];
                                    case 17:
                                        vendedor = _q.sent();
                                        console.log("VENDEDOR:", vendedor);
                                        if (!!vendedor) return [3 /*break*/, 19];
                                        console.log("NO HAY VENDEDOR:", vendedor);
                                        return [4 /*yield*/, this.handleError(socket, "notSelling", "Seller is not available")];
                                    case 18: return [2 /*return*/, _q.sent()];
                                    case 19:
                                        console.log("HAY VENDEDOR:");
                                        return [4 /*yield*/, this.gateway];
                                    case 20: return [4 /*yield*/, (_q.sent()).verifyAccountBlocked(vendedor.vendedorId)];
                                    case 21:
                                        cuentaBloqueadaVendedor = _q.sent();
                                        if (!(cuentaBloqueadaVendedor !== "error" && cuentaBloqueadaVendedor === true)) return [3 /*break*/, 23];
                                        console.log("cuenta bloqueada del vendedor!!");
                                        return [4 /*yield*/, this.handleError(socket, "notAvailable", "Seller's account is blocked")];
                                    case 22: return [2 /*return*/, _q.sent()];
                                    case 23:
                                        if (!(cuentaBloqueadaVendedor === "error")) return [3 /*break*/, 25];
                                        return [4 /*yield*/, this.handleError(socket, "notAvailable", "Seller's account is blocked")];
                                    case 24: return [2 /*return*/, _q.sent()];
                                    case 25:
                                        console.log("obteniendo data importante:!!");
                                        _g = (_f = Promise).all;
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 26: return [4 /*yield*/, (_q.sent()).getUserAssets(vendedor.sellerAddress)];
                                    case 27:
                                        _h = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 28: return [4 /*yield*/, (_q.sent()).getAccountBalance(vendedor.vendedorId)];
                                    case 29:
                                        _h = _h.concat([
                                            _q.sent()
                                        ]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 30: return [4 /*yield*/, (_q.sent()).getAccountBalance(buyer)];
                                    case 31:
                                        _h = _h.concat([
                                            _q.sent()
                                        ]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 32: return [4 /*yield*/, (_q.sent()).getAddressBalance(tokenValido.address, "TESTINGCOINTESTINGCOIN")];
                                    case 33: return [4 /*yield*/, _g.apply(_f, [_h.concat([
                                                _q.sent()
                                            ])])];
                                    case 34:
                                        _e = _q.sent(), balanceOfVendedor = _e[0], raptoreumBalanceOfVendedor = _e[1], balanceOfBuyer = _e[2], resultGetAssetBalanceOfComprador = _e[3];
                                        console.log("DATA IMPORTANTE:", "BALANCE OF VENDEDOR:", balanceOfVendedor, "raptoreum balance of vendedor:", raptoreumBalanceOfVendedor, "BALANCE DEL COMPRADOR:", balanceOfBuyer, "RESULT GET ASSET BALANCE OF COMPRADOR:", resultGetAssetBalanceOfComprador);
                                        isRWS = false;
                                        if (resultGetAssetBalanceOfComprador !== "error" && resultGetAssetBalanceOfComprador !== "notFound" && resultGetAssetBalanceOfComprador != false) {
                                            rawValue = resultGetAssetBalanceOfComprador.balance;
                                            DECIMAL_FACTOR = Math.pow(10, 8);
                                            realValue = rawValue / DECIMAL_FACTOR;
                                            if (realValue > 0) {
                                                isRWS = true;
                                            }
                                        }
                                        balanceAssetEnVenta = balanceOfVendedor.find(function (e) { return e.asset === itemEnVenta_1.asset; });
                                        if (!(balanceAssetEnVenta === "error")) return [3 /*break*/, 36];
                                        return [4 /*yield*/, this.handleError(socket, "notSelling", "Seller is not available")];
                                    case 35: return [2 /*return*/, _q.sent()];
                                    case 36:
                                        if (!(balanceAssetEnVenta === "notFound")) return [3 /*break*/, 38];
                                        return [4 /*yield*/, this.handleError(socket, "notSelling", "Seller is not available")];
                                    case 37: return [2 /*return*/, _q.sent()];
                                    case 38:
                                        raptoreumNecesario = itemEnVenta_1.price * data.cantidad;
                                        if (!raptoreumNecesario)
                                            return [2 /*return*/, this.handleError(socket, "notAvailable", "no se pudo conseguir precio del asset")];
                                        if (!(balanceAssetEnVenta.balance >= data.cantidad)) return [3 /*break*/, 108];
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
                                    case 39: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "block")];
                                    case 40:
                                        blocked = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 41: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(buyer, "block")];
                                    case 42:
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
                                    case 43: return [4 /*yield*/, (_q.sent()).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, itemEnVenta_1.asset, data.cantidad, itemEnVenta_1.assetpicture, itemType)];
                                    case 44:
                                        insertarVentaVendedor = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 45: return [4 /*yield*/, (_q.sent()).insertCompraOventa(buyer, "compra", raptoreumNecesario, itemEnVenta_1.asset, data.cantidad, itemEnVenta_1.assetpicture, itemType)];
                                    case 46:
                                        insertarCompraComprador = _q.sent();
                                        pending = false;
                                        console.log("nos saltamos el retiro de raptoreum por que el vendedor tiene mas de 1");
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 47: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("charlieeee", vendedor.sellerAddress, 0.00009)];
                                    case 48:
                                        retiroCajaChica = _q.sent();
                                        if (!retiroCajaChica) {
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "Error in small cash withdrawal")];
                                        }
                                        if (!(raptoreumBalanceOfVendedor < 0.00002)) return [3 /*break*/, 52];
                                        pending = true;
                                        console.log("empujando ID BUSY por que el usuario tiene menos de 0.00002 RTM");
                                        socket.emit("compraPendiente");
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 49:
                                        isActive = _q.sent();
                                        isActive.push({ user: vendedor.vendedorId, reason: "sale", ventaId: data.ventaId, buyer: tokenValido.usuario });
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 50:
                                        _q.sent();
                                        console.log("BUSY SALES:", isActive);
                                        this.io.sockets.emit("busySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, reason: "sale" });
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50000); })];
                                    case 51:
                                        _q.sent();
                                        _q.label = 52;
                                    case 52:
                                        _q.trys.push([52, 106, , 107]);
                                        return [4 /*yield*/, this.handleWithdrawals(buyer, vendedor.sellerAddress, raptoreumNecesario, vendedor.vendedorId, tokenValido.address, data.cantidad, balanceAssetEnVenta.assetid)];
                                    case 53:
                                        _j = _q.sent(), raptoreumWithdraw = _j.raptoreumWithdraw, tokenWithdraw = _j.tokenWithdraw;
                                        console.log("RAPTOREUM WITHDRAW:", raptoreumWithdraw);
                                        console.log("token WITHDRAW:", tokenWithdraw);
                                        if (!(raptoreumWithdraw && tokenWithdraw)) return [3 /*break*/, 78];
                                        _q.label = 54;
                                    case 54:
                                        _q.trys.push([54, 58, , 59]);
                                        if (!(itemType === "nft")) return [3 /*break*/, 57];
                                        return [4 /*yield*/, this.gateway];
                                    case 55: return [4 /*yield*/, (_q.sent()).detenerVenta(vendedor.vendedorId, vendedor.ordenId, "nft")];
                                    case 56:
                                        resultDetenerVenta = _q.sent();
                                        if (resultDetenerVenta) {
                                            this.io.sockets.emit("ventaDetenida", vendedor.ordenId);
                                        }
                                        _q.label = 57;
                                    case 57: return [3 /*break*/, 59];
                                    case 58:
                                        e_5 = _q.sent();
                                        console.log("ERROR EN DETENER VENTA:", e_5);
                                        return [3 /*break*/, 59];
                                    case 59:
                                        console.log("AMBAS TRANSACCIONES SALIERON BIEN");
                                        _m = (_l = Promise).all;
                                        return [4 /*yield*/, this.gateway];
                                    case 60: return [4 /*yield*/, (_q.sent()).updateCompraOventa(insertarCompraComprador, "SUCCESS", tokenWithdraw)];
                                    case 61:
                                        _o = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.gateway];
                                    case 62: return [4 /*yield*/, (_q.sent()).updateCompraOventa(insertarVentaVendedor, "SUCCESS", raptoreumWithdraw)];
                                    case 63: return [4 /*yield*/, _m.apply(_l, [_o.concat([
                                                _q.sent()
                                            ])])];
                                    case 64:
                                        _k = _q.sent(), updateBuyer = _k[0], updateSeller = _k[1];
                                        if (!(pending === false)) return [3 /*break*/, 66];
                                        return [4 /*yield*/, socket.emit("compraExitosa", { asset: itemEnVenta_1.asset, cantidad: data.cantidad })];
                                    case 65:
                                        _q.sent();
                                        _q.label = 66;
                                    case 66:
                                        if (!(pending === true)) return [3 /*break*/, 69];
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 67:
                                        isActive = _q.sent();
                                        index = isActive.findIndex(function (i) { return i.ventaId === data.ventaId; });
                                        if (!(index !== -1)) return [3 /*break*/, 69];
                                        isActive.splice(index, 1); // Elimina el objeto encontrado
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 68:
                                        _q.sent(); // Guarda el array actualizado en Redis
                                        _q.label = 69;
                                    case 69: return [4 /*yield*/, this.io.sockets.emit("notBusySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, actualBalance: balanceAssetEnVenta.balance - data.cantidad })];
                                    case 70:
                                        _q.sent();
                                        return [4 /*yield*/, this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: balanceAssetEnVenta.balance - data.cantidad })];
                                    case 71:
                                        _q.sent();
                                        _p = this.blockOrUnblockTransactions;
                                        return [4 /*yield*/, this.gateway];
                                    case 72: return [4 /*yield*/, _p.apply(this, [_q.sent(), [buyer, vendedor.vendedorId], false])];
                                    case 73:
                                        _q.sent();
                                        if (!!isRWS) return [3 /*break*/, 77];
                                        console.log("enviando dinero a inversores");
                                        return [4 /*yield*/, this.raptoreumWorldStockInvestorsMoney(buyer, 0.32, "asset sold")];
                                    case 74:
                                        _q.sent();
                                        console.log("enviando dinero a la caja chica");
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 75: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum(buyer, "rocJmBwaA4wRP2y3moUWNn1p37eCZK4D9E", 1.99)];
                                    case 76:
                                        _q.sent();
                                        _q.label = 77;
                                    case 77: return [3 /*break*/, 105];
                                    case 78:
                                        if (!(raptoreumWithdraw && !tokenWithdraw)) return [3 /*break*/, 89];
                                        if (!pending)
                                            socket.emit("errorDeCompra");
                                        if (!pending)
                                            this.io.sockets.emit("busySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, reason: "sale" });
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 79:
                                        isActive = _q.sent();
                                        isActive.push({ user: vendedor.vendedorId, reason: "sale", ventaId: data.ventaId, buyer: tokenValido.usuario });
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 80:
                                        _q.sent();
                                        console.log("TOKEN WITHDRAW SALIÓ MAL");
                                        return [4 /*yield*/, this.gateway];
                                    case 81: return [4 /*yield*/, (_q.sent()).transaccionPendiente(vendedor.vendedorId, vendedor.sellerAddress, buyer, tokenValido.address, "raptoreum", raptoreumNecesario)];
                                    case 82:
                                        transaccionPendidente = _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 83: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009)];
                                    case 84:
                                        retirarDeRaptoreumWorld = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 85: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(buyer, "unblock")];
                                    case 86:
                                        resultunBlockcomprador = _q.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                                    case 87:
                                        _q.sent();
                                        return [4 /*yield*/, this.intentarRetiradaDeEmergenciaDeRaptoreum(tokenValido, transaccionPendidente, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, raptoreumNecesario, itemEnVenta_1.asset, insertarCompraComprador, insertarVentaVendedor, data.ventaId, balanceAssetEnVenta.balance)];
                                    case 88:
                                        _q.sent();
                                        return [2 /*return*/];
                                    case 89:
                                        if (!(!raptoreumWithdraw && tokenWithdraw)) return [3 /*break*/, 100];
                                        if (!pending)
                                            this.io.sockets.emit("busySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, reason: "sale" });
                                        if (!pending)
                                            socket.emit("errorDeCompra");
                                        console.log("RAPTOREUM WITHDRAW SALIÓ MAL");
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 90:
                                        isActive = _q.sent();
                                        isActive.push({ user: vendedor.vendedorId, reason: "sale", ventaId: data.ventaId, buyer: tokenValido.usuario });
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 91:
                                        _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 92: return [4 /*yield*/, (_q.sent()).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, itemEnVenta_1.asset, data.cantidad)];
                                    case 93:
                                        transaccionPendidente = _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 94: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009)];
                                    case 95:
                                        retirarDeRaptoreumWorld = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 96: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 97:
                                        resultunBlockvendedor = _q.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                                    case 98:
                                        _q.sent();
                                        return [4 /*yield*/, this.intentarRetiradaDeEmergenciaDeToken(tokenValido, transaccionPendidente, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, data.cantidad, balanceAssetEnVenta.assetid, insertarCompraComprador, insertarVentaVendedor, data.ventaId, balanceAssetEnVenta.balance)];
                                    case 99:
                                        _q.sent();
                                        return [2 /*return*/];
                                    case 100:
                                        if (!(!raptoreumWithdraw && !tokenWithdraw)) return [3 /*break*/, 105];
                                        if (pending)
                                            return [2 /*return*/, socket.emit("errorDeCompra")];
                                        return [4 /*yield*/, this.gateway];
                                    case 101: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 102:
                                        _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 103: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 104:
                                        _q.sent();
                                        _q.label = 105;
                                    case 105: return [3 /*break*/, 107];
                                    case 106:
                                        error_1 = _q.sent();
                                        console.log("ERROR DE COMPRA:", error_1);
                                        return [2 /*return*/, this.handleError(socket, "errorDeCompra", "Purchase error")];
                                    case 107: return [3 /*break*/, 109];
                                    case 108:
                                        if (balanceOfVendedor < data.cantidad) {
                                            console.log("EMITIENDO SELLERNOTENOIGHTOKENS");
                                            return [2 /*return*/, this.handleError(socket, "sellerNotEnoughTokens", "Seller does not have enough tokens")];
                                        }
                                        _q.label = 109;
                                    case 109: return [3 /*break*/, 111];
                                    case 110:
                                        console.log("error con la data");
                                        _q.label = 111;
                                    case 111: return [2 /*return*/];
                                }
                            });
                        }); });
                        socket.on('getBusyUser', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var dataFinal, tokenValido, busyAssets, busySales, userid, busySale, busyAsset;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        dataFinal = [];
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 1:
                                        tokenValido = _a.sent();
                                        if (tokenValido === "error")
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "jwt error")];
                                        if (tokenValido === "expired")
                                            return [2 /*return*/, socket.emit("expired")];
                                        return [4 /*yield*/, getFromCache('busyAssets', this.redisClient)];
                                    case 2:
                                        busyAssets = _a.sent();
                                        return [4 /*yield*/, getFromCache('busySales', this.redisClient)];
                                    case 3:
                                        busySales = _a.sent();
                                        userid = tokenValido.userid;
                                        busySale = busySales.find(function (i) { return i.buyer === userid || i.user === userid; });
                                        if (busySale) {
                                            dataFinal.push({ reason: "sale" });
                                        }
                                        busyAsset = busyAssets.find(function (i) { return i.user === userid; });
                                        if (busyAsset) {
                                            dataFinal.push({ reason: "assetCreation" });
                                        }
                                        return [2 /*return*/, socket.emit("getBusyUserData", dataFinal)];
                                }
                            });
                        }); });
                        socket.on('compraDiscord', function (data) { return __awaiter(_this, void 0, void 0, function () {
                            var tokenValido, address, isTotp, resultTOTP, result, buyer, accountBlocked, _a, assetsEnVentaDelVendedor, nftEnVentaDelVendedor, _b, _c, _d, itemType, itemEnVenta_2, vendedor, cuentaBloqueadaVendedor, _e, balanceOfVendedor, raptoreumBalanceOfVendedor, balanceOfBuyer, resultGetAssetBalanceOfComprador, _f, _g, _h, isRWS, rawValue, DECIMAL_FACTOR, realValue, balanceAssetEnVenta, raptoreumNecesario, blocked, blocked2, insertarVentaVendedor, insertarCompraComprador, pending, retiroCajaChica, isActive, _j, raptoreumWithdraw, tokenWithdraw, resultDetenerVenta, e_6, _k, updateBuyer, updateSeller, _l, _m, _o, isActive, index, _p, isActive, transaccionPendidente, retirarDeRaptoreumWorld, resultunBlockcomprador, isActive, transaccionPendidente, retirarDeRaptoreumWorld, resultunBlockvendedor, error_2;
                            return __generator(this, function (_q) {
                                switch (_q.label) {
                                    case 0:
                                        if (!(tokenExpresion.test(data.token) && typeof (data.cantidad) == "number" && data.cantidad > 0)) return [3 /*break*/, 100];
                                        console.log("pasamos la validacion de parametros");
                                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token)];
                                    case 1:
                                        tokenValido = _q.sent();
                                        if (tokenValido === "error")
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "jwt error")];
                                        if (tokenValido === "expired")
                                            return [2 /*return*/, socket.emit("expired", { comprador: data.userid })];
                                        if (!!tokenValido.address) return [3 /*break*/, 4];
                                        return [4 /*yield*/, this.gateway];
                                    case 2: return [4 /*yield*/, (_q.sent()).getUserAddress(tokenValido.userid)];
                                    case 3:
                                        address = _q.sent();
                                        if (address === "error")
                                            return [2 /*return*/, socket.emit("errorDeCompra", { comprador: data.userid })];
                                        if (address === "no address")
                                            return [2 /*return*/, socket.emit("errorDeCompra", { comprador: data.userid })];
                                        tokenValido.address = address;
                                        _q.label = 4;
                                    case 4: return [4 /*yield*/, this.isTOTP(tokenValido.userid)];
                                    case 5:
                                        isTotp = _q.sent();
                                        if (isTotp === "error")
                                            return [2 /*return*/, this.handleError(socket, "errorDeCompra", "totp error")];
                                        if (!(isTotp === true)) return [3 /*break*/, 7];
                                        return [4 /*yield*/, this.verifyTOTP(tokenValido.userid, data.totp)];
                                    case 6:
                                        resultTOTP = _q.sent();
                                        if (resultTOTP === false)
                                            return [2 /*return*/, socket.emit("invalidTOTP", { comprador: data.userid })];
                                        if (resultTOTP === "error")
                                            return [2 /*return*/, socket.emit("errorTOTP", { comprador: data.userid })];
                                        _q.label = 7;
                                    case 7: return [4 /*yield*/, this.getRaptoreumdHealth()];
                                    case 8:
                                        result = _q.sent();
                                        if (result == "error" || result == "dead") {
                                            return [2 /*return*/, socket.emit('serverDown', { comprador: data.userid })];
                                        }
                                        console.log("La cadena es válida");
                                        buyer = tokenValido.userid;
                                        return [4 /*yield*/, this.gateway];
                                    case 9: return [4 /*yield*/, (_q.sent()).verifyAccountBlocked(buyer)];
                                    case 10:
                                        accountBlocked = _q.sent();
                                        if (accountBlocked !== "error" && accountBlocked === true) {
                                            console.log("cuenta bloqueada del comprador!!");
                                            return [2 /*return*/, socket.emit('blockAccount', { comprador: data.userid })];
                                        }
                                        console.log("ID DE LA VENTA:", data.ventaId);
                                        _c = (_b = Promise).all;
                                        return [4 /*yield*/, this.gateway];
                                    case 11: return [4 /*yield*/, (_q.sent()).getMarketAssetsById(data.ventaId)];
                                    case 12:
                                        _d = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.gateway];
                                    case 13: return [4 /*yield*/, (_q.sent()).getMarketNFTsById(data.ventaId)];
                                    case 14: return [4 /*yield*/, _c.apply(_b, [_d.concat([
                                                _q.sent()
                                            ])])];
                                    case 15:
                                        _a = _q.sent(), assetsEnVentaDelVendedor = _a[0], nftEnVentaDelVendedor = _a[1];
                                        console.log("ASSET EN VENTA?:", assetsEnVentaDelVendedor);
                                        console.log("NFT EN VENTA?:", nftEnVentaDelVendedor);
                                        if (assetsEnVentaDelVendedor.length === 0 && nftEnVentaDelVendedor.length === 0) {
                                            console.log("no está en venta!!!");
                                            return [2 /*return*/, socket.emit('notSelling', { comprador: data.userid })];
                                        }
                                        else if (assetsEnVentaDelVendedor.length > 0 && nftEnVentaDelVendedor.length > 0)
                                            return [2 /*return*/, this.handleError(socket, "notSelling", "2 assets  are being sold")];
                                        itemType = null;
                                        itemEnVenta_2 = null;
                                        if (assetsEnVentaDelVendedor.length > 0) {
                                            itemEnVenta_2 = assetsEnVentaDelVendedor[0];
                                            itemType = 'Asset';
                                        }
                                        else if (nftEnVentaDelVendedor.length > 0) {
                                            itemEnVenta_2 = nftEnVentaDelVendedor[0];
                                            itemType = 'nft';
                                        }
                                        console.log("obtendremos al vendedor:", itemEnVenta_2._id);
                                        return [4 /*yield*/, this.gateway];
                                    case 16: return [4 /*yield*/, (_q.sent()).getVendedorDelToken(itemEnVenta_2._id, itemType)];
                                    case 17:
                                        vendedor = _q.sent();
                                        console.log("VENDEDOR:", vendedor);
                                        if (!vendedor) {
                                            console.log("NO HAY VENDEDOR:", vendedor);
                                            return [2 /*return*/, socket.emit('notSelling', { comprador: data.userid })];
                                        }
                                        console.log("HAY VENDEDOR:");
                                        return [4 /*yield*/, this.gateway];
                                    case 18: return [4 /*yield*/, (_q.sent()).verifyAccountBlocked(vendedor.vendedorId)];
                                    case 19:
                                        cuentaBloqueadaVendedor = _q.sent();
                                        if (cuentaBloqueadaVendedor !== "error" && cuentaBloqueadaVendedor === true) {
                                            return [2 /*return*/, socket.emit('notAvailable', { comprador: data.userid })];
                                        }
                                        else if (cuentaBloqueadaVendedor === "error") {
                                            return [2 /*return*/, socket.emit('notAvailable', { comprador: data.userid })];
                                        }
                                        console.log("obteniendo data importante:!!");
                                        _g = (_f = Promise).all;
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 20: return [4 /*yield*/, (_q.sent()).getUserAssets(vendedor.sellerAddress)];
                                    case 21:
                                        _h = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 22: return [4 /*yield*/, (_q.sent()).getAccountBalance(vendedor.vendedorId)];
                                    case 23:
                                        _h = _h.concat([
                                            _q.sent()
                                        ]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 24: return [4 /*yield*/, (_q.sent()).getAccountBalance(buyer)];
                                    case 25:
                                        _h = _h.concat([
                                            _q.sent()
                                        ]);
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 26: return [4 /*yield*/, (_q.sent()).getAddressBalance(tokenValido.address, "TESTINGCOINTESTINGCOIN")];
                                    case 27: return [4 /*yield*/, _g.apply(_f, [_h.concat([
                                                _q.sent()
                                            ])])];
                                    case 28:
                                        _e = _q.sent(), balanceOfVendedor = _e[0], raptoreumBalanceOfVendedor = _e[1], balanceOfBuyer = _e[2], resultGetAssetBalanceOfComprador = _e[3];
                                        console.log("DATA IMPORTANTE:", "BALANCE OF VENDEDOR:", balanceOfVendedor, "raptoreum balance of vendedor:", raptoreumBalanceOfVendedor, "BALANCE DEL COMPRADOR:", balanceOfBuyer, "RESULT GET ASSET BALANCE OF COMPRADOR:", resultGetAssetBalanceOfComprador);
                                        isRWS = false;
                                        if (resultGetAssetBalanceOfComprador !== "error" && resultGetAssetBalanceOfComprador !== "notFound" && resultGetAssetBalanceOfComprador != false) {
                                            rawValue = resultGetAssetBalanceOfComprador.balance;
                                            DECIMAL_FACTOR = Math.pow(10, 8);
                                            realValue = rawValue / DECIMAL_FACTOR;
                                            if (realValue > 0) {
                                                isRWS = true;
                                            }
                                        }
                                        balanceAssetEnVenta = balanceOfVendedor.find(function (e) { return e.asset === itemEnVenta_2.asset; });
                                        if (balanceAssetEnVenta === "error")
                                            return [2 /*return*/, socket.emit('errorDeCompra', { comprador: data.userid })];
                                        if (balanceAssetEnVenta === "notFound")
                                            return [2 /*return*/, socket.emit("notSelling", { comprador: data.userid })];
                                        raptoreumNecesario = itemEnVenta_2.price * data.cantidad;
                                        if (!raptoreumNecesario)
                                            return [2 /*return*/, socket.emit('errorDeCompra', { comprador: data.userid })];
                                        if (!(balanceAssetEnVenta.balance >= data.cantidad)) return [3 /*break*/, 98];
                                        console.log("PASAMOS POR QUE EL VENDEDOR TIENE EL BALANCE SUFICIENTE PARA VENDER");
                                        if (!isRWS) {
                                            console.log("NO ES RWS");
                                            if (balanceOfBuyer < (raptoreumNecesario + 10)) {
                                                console.log("NO TIENE PLATA");
                                                return [2 /*return*/, socket.emit('buyerNotEnoughRaptoreum', { comprador: data.userid })];
                                            }
                                        }
                                        else if (isRWS) {
                                            if (balanceOfBuyer < raptoreumNecesario) {
                                                return [2 /*return*/, socket.emit('buyerNotEnoughRaptoreum', { comprador: data.userid })];
                                            }
                                        }
                                        console.log("pasamos a bloquear:");
                                        return [4 /*yield*/, this.gateway];
                                    case 29: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "block")];
                                    case 30:
                                        blocked = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 31: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(buyer, "block")];
                                    case 32:
                                        blocked2 = _q.sent();
                                        if (!blocked) {
                                            console.log("no pudimos bloquear");
                                            console.log("emitiendo couldNotConnect");
                                            socket.emit('couldNotConnect', { comprador: data.userid });
                                            return [2 /*return*/];
                                        }
                                        if (!blocked2) {
                                            console.log("no pudimos bloquear");
                                            console.log("emitiendo couldNotConnect");
                                            socket.emit('couldNotConnect', { comprador: data.userid });
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, this.gateway];
                                    case 33: return [4 /*yield*/, (_q.sent()).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, itemEnVenta_2.asset, data.cantidad, itemEnVenta_2.assetpicture, itemType)];
                                    case 34:
                                        insertarVentaVendedor = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 35: return [4 /*yield*/, (_q.sent()).insertCompraOventa(buyer, "compra", raptoreumNecesario, itemEnVenta_2.asset, data.cantidad, itemEnVenta_2.assetpicture, itemType)];
                                    case 36:
                                        insertarCompraComprador = _q.sent();
                                        pending = false;
                                        console.log("nos saltamos el retiro de raptoreum por que el vendedor tiene mas de 1");
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 37: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("charlieeee", vendedor.sellerAddress, 0.00009)];
                                    case 38:
                                        retiroCajaChica = _q.sent();
                                        if (!retiroCajaChica) {
                                            return [2 /*return*/, socket.emit("errorDeCompra", { comprador: data.userid })];
                                        }
                                        if (!(raptoreumBalanceOfVendedor < 0.00002)) return [3 /*break*/, 42];
                                        pending = true;
                                        console.log("empujando ID BUSY por que el usuario tiene menos de 0.00002 RTM");
                                        socket.emit("compraPendiente");
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 39:
                                        isActive = _q.sent();
                                        isActive.push({ user: vendedor.vendedorId, reason: "sale", ventaId: data.ventaId, buyer: tokenValido.usuario });
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 40:
                                        _q.sent();
                                        console.log("BUSY SALES:", isActive);
                                        this.io.sockets.emit("busySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, reason: "sale" });
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50000); })];
                                    case 41:
                                        _q.sent();
                                        _q.label = 42;
                                    case 42:
                                        _q.trys.push([42, 96, , 97]);
                                        return [4 /*yield*/, this.handleWithdrawals(buyer, vendedor.sellerAddress, raptoreumNecesario, vendedor.vendedorId, tokenValido.address, data.cantidad, balanceAssetEnVenta.assetid)];
                                    case 43:
                                        _j = _q.sent(), raptoreumWithdraw = _j.raptoreumWithdraw, tokenWithdraw = _j.tokenWithdraw;
                                        console.log("RAPTOREUM WITHDRAW:", raptoreumWithdraw);
                                        console.log("token WITHDRAW:", tokenWithdraw);
                                        if (!(raptoreumWithdraw && tokenWithdraw)) return [3 /*break*/, 68];
                                        _q.label = 44;
                                    case 44:
                                        _q.trys.push([44, 48, , 49]);
                                        if (!(itemType === "nft")) return [3 /*break*/, 47];
                                        return [4 /*yield*/, this.gateway];
                                    case 45: return [4 /*yield*/, (_q.sent()).detenerVenta(vendedor.vendedorId, vendedor.ordenId, "nft")];
                                    case 46:
                                        resultDetenerVenta = _q.sent();
                                        if (resultDetenerVenta) {
                                            this.io.sockets.emit("ventaDetenida", vendedor.ordenId);
                                        }
                                        _q.label = 47;
                                    case 47: return [3 /*break*/, 49];
                                    case 48:
                                        e_6 = _q.sent();
                                        console.log("ERROR EN DETENER VENTA:", e_6);
                                        return [3 /*break*/, 49];
                                    case 49:
                                        console.log("AMBAS TRANSACCIONES SALIERON BIEN");
                                        _m = (_l = Promise).all;
                                        return [4 /*yield*/, this.gateway];
                                    case 50: return [4 /*yield*/, (_q.sent()).updateCompraOventa(insertarCompraComprador, "SUCCESS", tokenWithdraw)];
                                    case 51:
                                        _o = [
                                            _q.sent()
                                        ];
                                        return [4 /*yield*/, this.gateway];
                                    case 52: return [4 /*yield*/, (_q.sent()).updateCompraOventa(insertarVentaVendedor, "SUCCESS", raptoreumWithdraw)];
                                    case 53: return [4 /*yield*/, _m.apply(_l, [_o.concat([
                                                _q.sent()
                                            ])])];
                                    case 54:
                                        _k = _q.sent(), updateBuyer = _k[0], updateSeller = _k[1];
                                        if (!(pending === false)) return [3 /*break*/, 56];
                                        return [4 /*yield*/, socket.emit("compraExitosa", { comprador: data.userid })];
                                    case 55:
                                        _q.sent();
                                        _q.label = 56;
                                    case 56:
                                        if (!(pending === true)) return [3 /*break*/, 59];
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 57:
                                        isActive = _q.sent();
                                        index = isActive.findIndex(function (i) { return i.ventaId === data.ventaId; });
                                        if (!(index !== -1)) return [3 /*break*/, 59];
                                        isActive.splice(index, 1); // Elimina el objeto encontrado
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 58:
                                        _q.sent(); // Guarda el array actualizado en Redis
                                        _q.label = 59;
                                    case 59: return [4 /*yield*/, this.io.sockets.emit("notBusySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, actualBalance: balanceAssetEnVenta.balance - data.cantidad })];
                                    case 60:
                                        _q.sent();
                                        return [4 /*yield*/, this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: balanceAssetEnVenta.balance - data.cantidad })];
                                    case 61:
                                        _q.sent();
                                        _p = this.blockOrUnblockTransactions;
                                        return [4 /*yield*/, this.gateway];
                                    case 62: return [4 /*yield*/, _p.apply(this, [_q.sent(), [buyer, vendedor.vendedorId], false])];
                                    case 63:
                                        _q.sent();
                                        if (!!isRWS) return [3 /*break*/, 67];
                                        console.log("enviando dinero a inversores");
                                        return [4 /*yield*/, this.raptoreumWorldStockInvestorsMoney(buyer, 0.32, "asset sold")];
                                    case 64:
                                        _q.sent();
                                        console.log("enviando dinero a la caja chica");
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 65: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum(buyer, "rocJmBwaA4wRP2y3moUWNn1p37eCZK4D9E", 1.99)];
                                    case 66:
                                        _q.sent();
                                        _q.label = 67;
                                    case 67: return [3 /*break*/, 95];
                                    case 68:
                                        if (!(raptoreumWithdraw && !tokenWithdraw)) return [3 /*break*/, 79];
                                        if (!pending)
                                            socket.emit("errorDeCompra", { comprador: data.userid });
                                        if (!pending)
                                            this.io.sockets.emit("busySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, reason: "sale" });
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 69:
                                        isActive = _q.sent();
                                        isActive.push({ user: vendedor.vendedorId, reason: "sale", ventaId: data.ventaId, buyer: tokenValido.usuario });
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 70:
                                        _q.sent();
                                        console.log("TOKEN WITHDRAW SALIÓ MAL");
                                        return [4 /*yield*/, this.gateway];
                                    case 71: return [4 /*yield*/, (_q.sent()).transaccionPendiente(vendedor.vendedorId, vendedor.sellerAddress, buyer, tokenValido.address, "raptoreum", raptoreumNecesario)];
                                    case 72:
                                        transaccionPendidente = _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 73: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009)];
                                    case 74:
                                        retirarDeRaptoreumWorld = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 75: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(buyer, "unblock")];
                                    case 76:
                                        resultunBlockcomprador = _q.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                                    case 77:
                                        _q.sent();
                                        return [4 /*yield*/, this.intentarRetiradaDeEmergenciaDeRaptoreum(tokenValido, transaccionPendidente, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, raptoreumNecesario, itemEnVenta_2.asset, insertarCompraComprador, insertarVentaVendedor, data.ventaId, balanceAssetEnVenta.balance)];
                                    case 78:
                                        _q.sent();
                                        return [2 /*return*/];
                                    case 79:
                                        if (!(!raptoreumWithdraw && tokenWithdraw)) return [3 /*break*/, 90];
                                        if (!pending)
                                            this.io.sockets.emit("busySeller", { ventaId: data.ventaId, buyer: tokenValido.usuario, reason: "sale" });
                                        if (!pending)
                                            socket.emit("errorDeCompra", { comprador: data.userid });
                                        console.log("RAPTOREUM WITHDRAW SALIÓ MAL");
                                        return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                    case 80:
                                        isActive = _q.sent();
                                        isActive.push({ user: vendedor.vendedorId, reason: "sale", ventaId: data.ventaId, buyer: tokenValido.usuario });
                                        return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                                    case 81:
                                        _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 82: return [4 /*yield*/, (_q.sent()).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, itemEnVenta_2.asset, data.cantidad)];
                                    case 83:
                                        transaccionPendidente = _q.sent();
                                        return [4 /*yield*/, this.raptoreumCore];
                                    case 84: return [4 /*yield*/, (_q.sent()).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009)];
                                    case 85:
                                        retirarDeRaptoreumWorld = _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 86: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 87:
                                        resultunBlockvendedor = _q.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                                    case 88:
                                        _q.sent();
                                        return [4 /*yield*/, this.intentarRetiradaDeEmergenciaDeToken(tokenValido, transaccionPendidente, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, data.cantidad, balanceAssetEnVenta.assetid, insertarCompraComprador, insertarVentaVendedor, data.ventaId, balanceAssetEnVenta.balance)];
                                    case 89:
                                        _q.sent();
                                        return [2 /*return*/];
                                    case 90:
                                        if (!(!raptoreumWithdraw && !tokenWithdraw)) return [3 /*break*/, 95];
                                        if (pending)
                                            return [2 /*return*/, socket.emit("errorDeCompra", { comprador: data.userid })];
                                        return [4 /*yield*/, this.gateway];
                                    case 91: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 92:
                                        _q.sent();
                                        return [4 /*yield*/, this.gateway];
                                    case 93: return [4 /*yield*/, (_q.sent()).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")];
                                    case 94:
                                        _q.sent();
                                        _q.label = 95;
                                    case 95: return [3 /*break*/, 97];
                                    case 96:
                                        error_2 = _q.sent();
                                        console.log("ERROR DE COMPRA:", error_2);
                                        return [2 /*return*/, socket.emit("errorDeCompra", { comprador: data.userid })];
                                    case 97: return [3 /*break*/, 99];
                                    case 98:
                                        if (balanceOfVendedor < data.cantidad) {
                                            console.log("EMITIENDO SELLERNOTENOIGHTOKENS");
                                            return [2 /*return*/, socket.emit("sellerNotEnoughTokens", { comprador: data.userid })];
                                        }
                                        _q.label = 99;
                                    case 99: return [3 /*break*/, 101];
                                    case 100:
                                        console.log("error con la data");
                                        _q.label = 101;
                                    case 101: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        }); });
    }
    socketService.prototype.checkBusySellers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var busyAssets_2, busySales_1, _loop_1, this_1, i, _i, busyAssets_1, ia, userSales, promises, e_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 14, , 15]);
                        return [4 /*yield*/, getFromCache('busyAssets', this.redisClient)];
                    case 1:
                        busyAssets_2 = _a.sent();
                        console.log("busyAssets conseguido en checkBusySellers: ", busyAssets_2);
                        return [4 /*yield*/, getFromCache('busySales', this.redisClient)];
                    case 2:
                        busySales_1 = _a.sent();
                        _loop_1 = function (i) {
                            var sale, found;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        sale = busySales_1[i];
                                        found = busyAssets_2.find(function (asset) { return asset.user === sale.user; });
                                        if (!(sale.reason === 'assetCreation' && !found)) return [3 /*break*/, 2];
                                        console.log('No se encuentra busy:', sale.user);
                                        return [4 /*yield*/, this_1.io.sockets.emit("notBusySeller", { ventaId: sale.ventaId, buyer: sale.user, actualBalance: "+1" })];
                                    case 1:
                                        _b.sent();
                                        busySales_1.splice(i, 1); // Eliminar el elemento de busySales
                                        _b.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        i = busySales_1.length - 1;
                        _a.label = 3;
                    case 3:
                        if (!(i >= 0)) return [3 /*break*/, 6];
                        return [5 /*yield**/, _loop_1(i)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        i--;
                        return [3 /*break*/, 3];
                    case 6:
                        _i = 0, busyAssets_1 = busyAssets_2;
                        _a.label = 7;
                    case 7:
                        if (!(_i < busyAssets_1.length)) return [3 /*break*/, 12];
                        ia = busyAssets_1[_i];
                        return [4 /*yield*/, this.gateway];
                    case 8: return [4 /*yield*/, (_a.sent()).getSales(ia.user)];
                    case 9:
                        userSales = _a.sent();
                        if (!userSales) return [3 /*break*/, 11];
                        console.log("Sales of the user:", userSales);
                        promises = userSales.map(function (ib) { return __awaiter(_this, void 0, void 0, function () {
                            var found, isInSales;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        found = busyAssets_2.find(function (item) { return item.user === ib.vendedorId; });
                                        if (!found) return [3 /*break*/, 4];
                                        isInSales = busySales_1.find(function (item) { return item.ventaId === ib.ordenId; });
                                        if (!!isInSales) return [3 /*break*/, 2];
                                        console.log("El elemento no está en los busySales");
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                busySales_1.push({ user: ib.vendedorId, reason: "assetCreation", ventaId: ib.ordenId, buyer: found.username });
                                                _this.io.sockets.emit('busySeller', { ventaId: ib.ordenId, buyer: found.username, reason: "assetCreation" }, resolve);
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 2:
                                        console.log("El elemento está en los busySales");
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                _this.io.sockets.emit('busySeller', { ventaId: ib.ordenId, buyer: found.username, reason: "assetCreation" }, resolve);
                                            })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11:
                        _i++;
                        return [3 /*break*/, 7];
                    case 12: return [4 /*yield*/, cacheData("busySales", busySales_1, this.redisClient)];
                    case 13:
                        _a.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        e_7 = _a.sent();
                        console.log("Error en check busy sellers: ", e_7);
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.startChecking = function () {
        var _this = this;
        setInterval(function () {
            console.log("CHECKING FOR BUSYSELLERS:");
            _this.checkBusySellers();
        }, 10000);
    };
    socketService.prototype.isTOTP = function (userid) {
        return __awaiter(this, void 0, void 0, function () {
            var result, e_8;
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
                        e_8 = _a.sent();
                        console.log(e_8);
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
            var health, marketAssets, balancePromises, filteredAssets, e_9;
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
                                var orden, vendedor, isActive, result, asseEncontrado, resultDetenerVenta, e_10;
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
                                        case 6: return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                                        case 7:
                                            isActive = _a.sent();
                                            console.log("busySales asset to market:", isActive);
                                            result = isActive.find(function (i) { return i.ventaId === orden; });
                                            if (result) {
                                                e.balance = "busy";
                                                return [2 /*return*/, e];
                                            }
                                            return [4 /*yield*/, this.raptoreumCore];
                                        case 8: return [4 /*yield*/, (_a.sent()).getAddressBalance(vendedor.sellerAddress, e.asset)];
                                        case 9:
                                            asseEncontrado = _a.sent();
                                            console.log("asseEncontrado:", asseEncontrado);
                                            if (!(asseEncontrado !== "error" && asseEncontrado !== "notFound" && asseEncontrado.balance >= 1)) return [3 /*break*/, 10];
                                            console.log("paso 2 el balance es mayor a 1, asignando balance al elemento");
                                            e.balance = asseEncontrado.balance;
                                            return [2 /*return*/, e];
                                        case 10:
                                            _a.trys.push([10, 13, 14, 15]);
                                            console.log("paso 2 el balance es menor a 1, detenemos la venta del ".concat(subject));
                                            return [4 /*yield*/, this.gateway];
                                        case 11: return [4 /*yield*/, (_a.sent()).detenerVenta(vendedor.vendedorId, orden, subject === "assetsmarket" ? "asset" : "nft")];
                                        case 12:
                                            resultDetenerVenta = _a.sent();
                                            if (resultDetenerVenta) {
                                                this.io.sockets.emit("ventaDetenida", orden);
                                            }
                                            console.log("RESULT DETENER VENTA:", resultDetenerVenta);
                                            console.log("venta detenida");
                                            return [3 /*break*/, 15];
                                        case 13:
                                            e_10 = _a.sent();
                                            console.log("ERROR EN GET".concat(subject.toUpperCase()), e_10);
                                            return [3 /*break*/, 15];
                                        case 14: return [2 /*return*/, undefined];
                                        case 15: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 10:
                        balancePromises = _a.sent();
                        filteredAssets = balancePromises.filter(function (asset) { return asset !== undefined; });
                        socket.emit(subject, filteredAssets);
                        return [3 /*break*/, 12];
                    case 11:
                        e_9 = _a.sent();
                        console.log("ERROR NO CENTRALIZADO EN IF DE BALANCE MAYOR A 1:", e_9);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    socketService.prototype.raptoreumWorldStockInvestorsMoney = function (comprador, rtmAenviar, transactionType) {
        return __awaiter(this, void 0, void 0, function () {
            var result, envios, delay, _i, result_1, ITEM, partes, withdraw, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.raptoreumCore];
                    case 1: return [4 /*yield*/, (_a.sent()).listCoinholders("TESTINGCOINTESTINGCOIN")];
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
                        if (!(_i < result_1.length)) return [3 /*break*/, 18];
                        ITEM = result_1[_i];
                        console.log("ADDRESS A ENVIAR:", ITEM.address);
                        partes = 0;
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 14, , 17]);
                        partes = ITEM.balance;
                        console.log("PARTES A ENVIAR:", partes);
                        return [4 /*yield*/, this.raptoreumCore];
                    case 5: return [4 /*yield*/, (_a.sent()).withdrawRaptoreum(comprador, ITEM.address, partes * rtmAenviar)];
                    case 6:
                        withdraw = _a.sent();
                        if (!withdraw) return [3 /*break*/, 9];
                        envios += partes;
                        console.log("enviado:", envios);
                        return [4 /*yield*/, this.gateway];
                    case 7: return [4 /*yield*/, (_a.sent()).raptoreumWorldStockTransaction(ITEM.address, partes * rtmAenviar, transactionType)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 9: return [4 /*yield*/, this.gateway];
                    case 10: return [4 /*yield*/, (_a.sent()).raptoreumWorldStockTransaction(ITEM.address, partes * rtmAenviar, "transaction error")];
                    case 11:
                        _a.sent();
                        _a.label = 12;
                    case 12: 
                    // Wait for 6 seconds before proceeding to the next iteration
                    return [4 /*yield*/, delay(6000)];
                    case 13:
                        // Wait for 6 seconds before proceeding to the next iteration
                        _a.sent();
                        return [3 /*break*/, 17];
                    case 14:
                        error_3 = _a.sent();
                        return [4 /*yield*/, this.gateway];
                    case 15: return [4 /*yield*/, (_a.sent()).raptoreumWorldStockTransaction(ITEM.address, partes * rtmAenviar, "transaction error")];
                    case 16:
                        _a.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        _i++;
                        return [3 /*break*/, 3];
                    case 18: return [2 /*return*/, envios];
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
                        var usuariodecodificado, isTotp, resultTOTP, address, cuentaBloqueadaVendedor, foundAsset, result, result_2, error_4, error_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 24, , 25]);
                                    console.log("primer paso");
                                    return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(token)];
                                case 1:
                                    usuariodecodificado = _a.sent();
                                    if (!(usuariodecodificado != "error" && usuariodecodificado != "expired")) return [3 /*break*/, 22];
                                    return [4 /*yield*/, this.isTOTP(usuariodecodificado.userid)];
                                case 2:
                                    isTotp = _a.sent();
                                    if (isTotp === "error")
                                        return [2 /*return*/, reject("errorTOTP")];
                                    if (!(isTotp === true)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, this.verifyTOTP(usuariodecodificado.userid, totp)];
                                case 3:
                                    resultTOTP = _a.sent();
                                    if (resultTOTP === false)
                                        return [2 /*return*/, reject("invalidTOTP")];
                                    if (resultTOTP === "error")
                                        return [2 /*return*/, reject("errorTOTP")];
                                    _a.label = 4;
                                case 4:
                                    if (!!usuariodecodificado.address) return [3 /*break*/, 7];
                                    return [4 /*yield*/, this.gateway];
                                case 5: return [4 /*yield*/, (_a.sent()).getUserAddress(usuariodecodificado.userid)];
                                case 6:
                                    address = _a.sent();
                                    if (address === "error")
                                        reject("error");
                                    if (address === "no address")
                                        reject("error");
                                    usuariodecodificado.address = address;
                                    _a.label = 7;
                                case 7: return [4 /*yield*/, this.gateway];
                                case 8: return [4 /*yield*/, (_a.sent()).verifyAccountBlocked(usuariodecodificado.userid)];
                                case 9:
                                    cuentaBloqueadaVendedor = _a.sent();
                                    if (cuentaBloqueadaVendedor !== "error" && cuentaBloqueadaVendedor === true) {
                                        console.log("cuenta bloqueada del vendedor!!");
                                        reject("blockedAccount");
                                    }
                                    else if (cuentaBloqueadaVendedor === "error") {
                                        reject("error");
                                    }
                                    return [4 /*yield*/, this.raptoreumCore];
                                case 10: return [4 /*yield*/, (_a.sent()).getAddressBalance(usuariodecodificado.address, asset)];
                                case 11:
                                    foundAsset = _a.sent();
                                    if (foundAsset === "notFound")
                                        reject("assetNotFoundInWallet");
                                    if (foundAsset === "error")
                                        reject("assetNotFoundInWallet");
                                    if (!(foundAsset !== "notFound" && foundAsset !== "error")) return [3 /*break*/, 21];
                                    return [4 /*yield*/, this.gateway];
                                case 12: return [4 /*yield*/, (_a.sent()).verifyTokenEnVenta2(asset, usuariodecodificado.userid, foundAsset.type)];
                                case 13:
                                    result = _a.sent();
                                    console.log("segundo paso");
                                    console.log("result verifytokenenventa:", result);
                                    if (!(result === true)) return [3 /*break*/, 14];
                                    console.log("rejecting cuz verifytokenenventa es true");
                                    reject("selling");
                                    return [3 /*break*/, 21];
                                case 14:
                                    if (!(result === false)) return [3 /*break*/, 20];
                                    _a.label = 15;
                                case 15:
                                    _a.trys.push([15, 18, , 19]);
                                    console.log("TYPE PARA INSERTAR EN EL MARKET:", foundAsset.type);
                                    return [4 /*yield*/, this.gateway];
                                case 16: return [4 /*yield*/, (_a.sent()).insertAssetInMarket(asset, usuariodecodificado.userid, usuariodecodificado.usuario, usuariodecodificado.address, price, foundAsset.type)];
                                case 17:
                                    result_2 = _a.sent();
                                    if (result_2)
                                        resolve({ result: result_2, type: foundAsset.type });
                                    return [3 /*break*/, 19];
                                case 18:
                                    error_4 = _a.sent();
                                    reject("assetToMarketError");
                                    return [3 /*break*/, 19];
                                case 19: return [3 /*break*/, 21];
                                case 20:
                                    if (result === "errorGettingToken") {
                                        reject("assetToMarketError");
                                    }
                                    _a.label = 21;
                                case 21: return [3 /*break*/, 23];
                                case 22:
                                    if (usuariodecodificado == "expired") {
                                        reject("expired");
                                    }
                                    _a.label = 23;
                                case 23: return [3 /*break*/, 25];
                                case 24:
                                    error_5 = _a.sent();
                                    console.log("error de aassettomarket", error_5);
                                    if (error_5 == 'el activo no existe por lo tanto no puede ser vendido') {
                                        reject("notExists");
                                    }
                                    else if (error_5 == "selling") {
                                        reject("selling");
                                    }
                                    else {
                                        reject("error");
                                    }
                                    return [3 /*break*/, 25];
                                case 25: return [2 /*return*/];
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
                        console.log("HANDLE WITHDRAW RAPTOREUM WITHDRAW", raptoreumWithdraw);
                        console.log("enviados ", raptoreumAmount, " a ", sellerAddress);
                        return [4 /*yield*/, this.raptoreumCore];
                    case 3: return [4 /*yield*/, (_a.sent()).withdrawToken(sellerId, tokenAddress, tokenAmount, asset, sellerAddress, sellerAddress)];
                    case 4:
                        tokenWithdraw = _a.sent();
                        console.log("HANDLE WITHDRAW TOKEN WITHDRAW", raptoreumWithdraw);
                        return [2 /*return*/, { raptoreumWithdraw: raptoreumWithdraw, tokenWithdraw: tokenWithdraw }];
                }
            });
        });
    };
    socketService.prototype.intentarRetiradaDeEmergenciaDeRaptoreum = function (comprador, transaccionPending, addressComprador, addressVendedor, idVendedor, raptoreumDebt, assetName, idVentaComprador, idVentaVendedor, ordenId, actualBalance) {
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
                    var isPending, retirarDeEmergenciaDelVendedor, isActive, index, _a, _b, _c, _d, _e, _f;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0: return [4 /*yield*/, this.gateway];
                            case 1: return [4 /*yield*/, (_g.sent()).getTransaccionPendiente(transaccionPending)];
                            case 2:
                                isPending = _g.sent();
                                if (!(isPending === true)) return [3 /*break*/, 22];
                                return [4 /*yield*/, this.raptoreumCore];
                            case 3: return [4 /*yield*/, (_g.sent()).withdrawRaptoreum(idVendedor, addressComprador, raptoreumDebt)];
                            case 4:
                                retirarDeEmergenciaDelVendedor = _g.sent();
                                if (!retirarDeEmergenciaDelVendedor) return [3 /*break*/, 15];
                                return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                            case 5:
                                isActive = _g.sent();
                                index = isActive.findIndex(function (i) { return i.ventaId === ordenId; });
                                if (!(index !== -1)) return [3 /*break*/, 7];
                                isActive.splice(index, 1); // Elimina el objeto encontrado
                                return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                            case 6:
                                _g.sent(); // Guarda el array actualizado en Redis
                                _g.label = 7;
                            case 7: return [4 /*yield*/, this.io.sockets.emit("notBusySeller", { ventaId: ordenId, buyer: comprador.usuario, actualBalance: actualBalance })];
                            case 8:
                                _g.sent();
                                console.log(raptoreumDebt, " RAPTOREUMS RETIRADOS CORRECTAMENTE DEL DEL VENDEDOR");
                                _b = (_a = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 9:
                                _c = [
                                    (_g.sent()).transaccionPendienteOut(transaccionPending)
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 10:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 11:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 12:
                                _c = _c.concat([
                                    (_g.sent()).blockOrUnblockUserTransactions(comprador.userid, "unblock")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 13: return [4 /*yield*/, _b.apply(_a, [_c.concat([
                                        (_g.sent()).blockOrUnblockUserTransactions(idVendedor, "unblock")
                                    ])])];
                            case 14:
                                _g.sent();
                                return [3 /*break*/, 21];
                            case 15:
                                if (!(intentos < 5)) return [3 /*break*/, 16];
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM");
                                intentos++;
                                setTimeout(intentar, 20000);
                                return [3 /*break*/, 21];
                            case 16:
                                _e = (_d = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 17:
                                _f = [
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 18:
                                _f = _f.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 19: return [4 /*yield*/, _e.apply(_d, [_f.concat([
                                        (_g.sent()).addWrongTransaction(comprador.userid, addressComprador, addressVendedor, idVendedor, assetName, raptoreumDebt)
                                    ])])];
                            case 20:
                                _g.sent();
                                _g.label = 21;
                            case 21: return [3 /*break*/, 23];
                            case 22:
                                if (isPending === false) {
                                    return [2 /*return*/];
                                }
                                else if (isPending === "error") {
                                    setTimeout(intentar, 20000);
                                }
                                _g.label = 23;
                            case 23: return [2 /*return*/];
                        }
                    });
                }); };
                setTimeout(intentar, 20000);
                return [2 /*return*/];
            });
        });
    };
    socketService.prototype.intentarRetiradaDeEmergenciaDeToken = function (comprador, transaccionPending, addressComprador, addressVendedor, idVendedor, assetDebt, assetName, idVentaComprador, idVentaVendedor, ordenId, actualBalance) {
        return __awaiter(this, void 0, void 0, function () {
            var intentos, intentar;
            var _this = this;
            return __generator(this, function (_a) {
                intentos = 0;
                intentar = function () { return __awaiter(_this, void 0, void 0, function () {
                    var isPending, retirarDeEmergenciaDelCliente, isActive, index, _a, _b, _c, _d, _e, _f;
                    return __generator(this, function (_g) {
                        switch (_g.label) {
                            case 0: return [4 /*yield*/, this.gateway];
                            case 1: return [4 /*yield*/, (_g.sent()).getTransaccionPendiente(transaccionPending)];
                            case 2:
                                isPending = _g.sent();
                                if (!(isPending === true)) return [3 /*break*/, 22];
                                return [4 /*yield*/, this.raptoreumCore];
                            case 3: return [4 /*yield*/, (_g.sent()).withdrawToken(comprador.userid, addressVendedor, assetDebt, assetName, addressComprador, addressComprador)];
                            case 4:
                                retirarDeEmergenciaDelCliente = _g.sent();
                                if (!retirarDeEmergenciaDelCliente) return [3 /*break*/, 15];
                                return [4 /*yield*/, getFromCache("busySales", this.redisClient)];
                            case 5:
                                isActive = _g.sent();
                                index = isActive.findIndex(function (i) { return i.ventaId === ordenId; });
                                if (!(index !== -1)) return [3 /*break*/, 7];
                                isActive.splice(index, 1); // Elimina el objeto encontrado
                                return [4 /*yield*/, cacheData("busySales", isActive, this.redisClient)];
                            case 6:
                                _g.sent(); // Guarda el array actualizado en Redis
                                _g.label = 7;
                            case 7: return [4 /*yield*/, this.io.sockets.emit("notBusySeller", { ventaId: ordenId, buyer: comprador.usuario, actualBalance: actualBalance })];
                            case 8:
                                _g.sent();
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                console.log("ACTUALIZANDO DATA. TOKEN ENVIADO");
                                _b = (_a = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 9:
                                _c = [
                                    (_g.sent()).transaccionPendienteOut(transaccionPending)
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 10:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 11:
                                _c = _c.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 12:
                                _c = _c.concat([
                                    (_g.sent()).blockOrUnblockUserTransactions(comprador.userid, "unblock")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 13: return [4 /*yield*/, _b.apply(_a, [_c.concat([
                                        (_g.sent()).blockOrUnblockUserTransactions(idVendedor, "unblock")
                                    ])])];
                            case 14:
                                _g.sent();
                                return [3 /*break*/, 21];
                            case 15:
                                if (!(intentos < 5)) return [3 /*break*/, 16];
                                intentos++;
                                setTimeout(intentar, 40000);
                                return [3 /*break*/, 21];
                            case 16:
                                _e = (_d = Promise).all;
                                return [4 /*yield*/, this.gateway];
                            case 17:
                                _f = [
                                    (_g.sent()).updateCompraOventa(idVentaComprador, "REJECTED", "none")
                                ];
                                return [4 /*yield*/, this.gateway];
                            case 18:
                                _f = _f.concat([
                                    (_g.sent()).updateCompraOventa(idVentaVendedor, "REJECTED", "none")
                                ]);
                                return [4 /*yield*/, this.gateway];
                            case 19: return [4 /*yield*/, _e.apply(_d, [_f.concat([
                                        (_g.sent()).addWrongTransaction(comprador.userid, addressComprador, addressVendedor, idVendedor, assetName, assetDebt)
                                    ])])];
                            case 20:
                                _g.sent();
                                _g.label = 21;
                            case 21: return [3 /*break*/, 23];
                            case 22:
                                if (isPending === false) {
                                    return [2 /*return*/];
                                }
                                else if (isPending === "error") {
                                    setTimeout(intentar, 40000);
                                }
                                _g.label = 23;
                            case 23: return [2 /*return*/];
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
