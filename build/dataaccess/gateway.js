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
exports.UserGateway = void 0;
var mongodb_1 = require("mongodb");
var mysql = require("mysql2/promise");
var mongodb_2 = require("mongodb");
var axios = require('axios');
var redis = require('redis');
var util = require('util');
var jwt = require('jsonwebtoken');
var UserGateway = /** @class */ (function () {
    function UserGateway() {
        this.db = null;
        this.assetsCollection = null;
        this.assetsEnVentaCollection = null;
        this.pool = null;
        this.volatileUserDataCollection = null;
        this.ordenesVentaAssetsCollection = null;
        this.comprasYventasAssetsCollection = null;
        this.transaccionesPendientesCollection = null;
        this.stockTransactionsCollection = null;
        this.nftCollection = null;
        this.nftsEnVentaCollection = null;
        this.ordenesVentaNFTsCollection = null;
        this.transaccionesErroneasCollection = null;
        this.apiUrl = 'http://localhost:3030';
        this.client = redis.createClient({
            host: 'localhost',
            port: 6380,
            password: process.env.GOOGLEPASS,
            legacyMode: true
        });
        this.client.connect().catch(console.error);
    }
    UserGateway.getInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.instance) return [3 /*break*/, 2];
                        this.instance = new UserGateway();
                        return [4 /*yield*/, this.instance.setupDatabase()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.instance];
                }
            });
        });
    };
    UserGateway.prototype.getRedisClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    UserGateway.prototype.addWrongTransaction = function (deudorId, deudorAddress, toId, toAddress, activo, monto) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.transaccionesErroneasCollection) === null || _a === void 0 ? void 0 : _a.insertOne({ deudorId: deudorId, deudorAddress: deudorAddress, toId: toId, toAddress: toAddress, activo: activo, monto: monto }))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.transaccionPendiente = function (deudorId, deudorAddress, toAddress, toId, rtmOassetId, monto) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _id, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        console.log("EJECUTANDO TRANSACCIONPENDIENTE");
                        return [4 /*yield*/, new mongodb_2.ObjectId().toString()];
                    case 1:
                        _id = _b.sent();
                        return [4 /*yield*/, ((_a = this.transaccionesPendientesCollection) === null || _a === void 0 ? void 0 : _a.insertOne({ _id: _id, deudorId: deudorId, deudorAddress: deudorAddress, toId: toId, toAddress: toAddress, activo: rtmOassetId, monto: monto }))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, _id];
                    case 3:
                        error_1 = _b.sent();
                        console.log("error en transaccion pendiente");
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.transaccionPendienteOut = function (id) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                (_a = this.transaccionesPendientesCollection) === null || _a === void 0 ? void 0 : _a.deleteOne({ _id: id });
                return [2 /*return*/];
            });
        });
    };
    UserGateway.prototype.isActive = function (id) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var is;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.transaccionesPendientesCollection) === null || _a === void 0 ? void 0 : _a.find({ _id: id }).toArray())];
                    case 1:
                        is = _b.sent();
                        if (is && is.length > 0) {
                            return [2 /*return*/, true];
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getAssetRegistered = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAsset, error_2;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    if (!this.db) {
                                        console.log('El pool no está disponible');
                                        return [2 /*return*/, reject(new Error("La pool no está activa"))];
                                    }
                                    return [4 /*yield*/, ((_a = this.assetsCollection) === null || _a === void 0 ? void 0 : _a.findOne({ asset: asset }))];
                                case 1:
                                    resultGetAsset = _b.sent();
                                    console.log("RESULT GET ASSET:", resultGetAsset);
                                    // Verificar si el activo fue encontrado y retornar el objeto
                                    if (resultGetAsset) {
                                        resolve(resultGetAsset);
                                    }
                                    else {
                                        resolve(null); // Retorna null si no se encuentra el activo
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_2 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_2);
                                    return [2 /*return*/, reject(new Error("Error tratando de conseguir el asset"))];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getNFTRegistered = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAsset, error_3;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    if (!this.db) {
                                        console.log('El pool no está disponible');
                                        return [2 /*return*/, reject(new Error("La pool no está activa"))];
                                    }
                                    return [4 /*yield*/, ((_a = this.nftCollection) === null || _a === void 0 ? void 0 : _a.findOne({ asset: asset }))];
                                case 1:
                                    resultGetAsset = _b.sent();
                                    // Verificar si el activo fue encontrado y retornar el objeto
                                    if (resultGetAsset) {
                                        resolve(resultGetAsset);
                                    }
                                    else {
                                        resolve(null); // Retorna null si no se encuentra el activo
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_3 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_3);
                                    return [2 /*return*/, reject(new Error("Error tratando de conseguir el asset"))];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getTransaccionesPendientes = function () {
        var _a;
        var result = (_a = this.transaccionesPendientesCollection) === null || _a === void 0 ? void 0 : _a.find().toArray();
        return result;
    };
    UserGateway.prototype.getTransaccionPendiente = function (id) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, ((_a = this.transaccionesPendientesCollection) === null || _a === void 0 ? void 0 : _a.findOne({ _id: id }))];
                    case 1:
                        result = _b.sent();
                        if (result) {
                            // Si se encuentra la transacción
                            return [2 /*return*/, true];
                        }
                        else {
                            // Si no se encuentra la transacción
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _b.sent();
                        // Si hay un error
                        console.error("Error al buscar la transacción:", error_4);
                        return [2 /*return*/, "error"];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.updateCompraOventa = function (idTransaccion, newStatus, txid) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.comprasYventasAssetsCollection) === null || _a === void 0 ? void 0 : _a.updateOne({ "transactions._id": idTransaccion }, { $set: { "transactions.$.status": newStatus, "transactions.$.txid": txid } }))];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    UserGateway.prototype.getSales = function (user) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var result, _c, collectionOrdenesAssets, collectionOrdenesNfts, e_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        result = [];
                        return [4 /*yield*/, Promise.all([
                                (_a = this.ordenesVentaAssetsCollection) === null || _a === void 0 ? void 0 : _a.find({ vendedorId: user }).toArray(),
                                (_b = this.ordenesVentaNFTsCollection) === null || _b === void 0 ? void 0 : _b.find({ vendedorId: user }).toArray()
                            ])];
                    case 1:
                        _c = _d.sent(), collectionOrdenesAssets = _c[0], collectionOrdenesNfts = _c[1];
                        if (collectionOrdenesAssets && collectionOrdenesAssets.length > 0) {
                            result.push.apply(result, collectionOrdenesAssets);
                        }
                        if (collectionOrdenesNfts && collectionOrdenesNfts.length > 0) {
                            result.push.apply(result, collectionOrdenesNfts);
                        }
                        console.log("RESULT GET SALES DEL USUARIO: ", result);
                        return [2 /*return*/, result.length > 0 ? result : false];
                    case 2:
                        e_1 = _d.sent();
                        console.log("ERROR GETsales:", e_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.insertCompraOventa = function (user, type, rtmInvolucrado, assetInvolucrado, assetInvolucradoCantidad, URLcoinSoldOrBought, typeAsset) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _id, date, transaccion, result, transaccion, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _id = new mongodb_2.ObjectId().toString();
                        date = new Date().toISOString();
                        if (!(type === "venta")) return [3 /*break*/, 2];
                        transaccion = {
                            _id: _id,
                            type: "venta",
                            txid: "none",
                            rtmGanado: rtmInvolucrado,
                            assetVendido: assetInvolucrado,
                            assetVendidoCantidad: assetInvolucradoCantidad,
                            URLcoinSoldOrBought: URLcoinSoldOrBought,
                            status: "PENDING",
                            typeAsset: typeAsset,
                            date: date
                        };
                        return [4 /*yield*/, ((_a = this.comprasYventasAssetsCollection) === null || _a === void 0 ? void 0 : _a.updateOne({ usuario: user }, { $push: { transactions: transaccion } }))];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, _id];
                    case 2:
                        if (!(type === "compra")) return [3 /*break*/, 4];
                        transaccion = {
                            _id: _id,
                            type: "compra",
                            txid: "none",
                            rtmGastado: rtmInvolucrado,
                            assetComprado: assetInvolucrado,
                            assetCompradoCantidad: assetInvolucradoCantidad,
                            URLcoinSoldOrBought: URLcoinSoldOrBought,
                            status: "PENDING",
                            typeAsset: typeAsset,
                            date: date
                        };
                        return [4 /*yield*/, ((_b = this.comprasYventasAssetsCollection) === null || _b === void 0 ? void 0 : _b.updateOne({ usuario: user }, { $push: { transactions: transaccion } }))];
                    case 3:
                        result = _c.sent();
                        return [2 /*return*/, _id];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getMarketAssets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAssetsEnVenta;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find().toArray())];
                                case 1:
                                    resultGetAssetsEnVenta = _b.sent();
                                    console.log('Result resultGetAssetsEnVenta:', resultGetAssetsEnVenta);
                                    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(resultGetAssetsEnVenta)];
                                    }
                                    else {
                                        return [2 /*return*/, resolve([])];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getMarketNFTs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAssetsEnVenta;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ((_a = this.nftsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find().toArray())];
                                case 1:
                                    resultGetAssetsEnVenta = _b.sent();
                                    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(resultGetAssetsEnVenta)];
                                    }
                                    else {
                                        return [2 /*return*/, resolve([])];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.verifyTokenEnVenta2 = function (assetEnVenta, user, type) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionOrdenes, collectionEnVenta, result, promises, results, found, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("USUARIO QUE USAMOS PARA BUSCAR EN SUS ORDENES DE VENTA", user);
                        if (type === "TOKEN") {
                            collectionOrdenes = this.ordenesVentaAssetsCollection;
                            collectionEnVenta = this.assetsEnVentaCollection;
                        }
                        else if (type === "NFT") {
                            collectionOrdenes = this.ordenesVentaNFTsCollection;
                            collectionEnVenta = this.nftsEnVentaCollection;
                        }
                        else {
                            return [2 /*return*/, "Invalid type provided"];
                        }
                        if (!collectionOrdenes || !collectionEnVenta) {
                            return [2 /*return*/, "errorGettingToken"];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, collectionOrdenes.find({ vendedorId: user }).toArray()];
                    case 2:
                        result = _a.sent();
                        console.log("entrando a verify token en venta 2");
                        if (!(result && result.length > 0)) return [3 /*break*/, 4];
                        console.log("tenemos ordenes de venta:", result);
                        promises = result.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                            var element, elemento;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        element = e.ordenId;
                                        return [4 /*yield*/, collectionEnVenta.find({ _id: element }).toArray()];
                                    case 1:
                                        elemento = _a.sent();
                                        console.log("asset en venta y ordenid que usamos para encontrar el elemento en assetsEnVentaColeccion: ", element, "<orden asset> ", assetEnVenta);
                                        console.log("ELEMENTO FALLANDO EN VERIFYTOKENENVENTA:", elemento);
                                        return [2 /*return*/, elemento && elemento[0].asset === assetEnVenta];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 3:
                        results = _a.sent();
                        console.log("Resultado de las promesas recorridas ya que las ordenes de venta superan el largo cero:", results);
                        found = results.includes(true);
                        return [2 /*return*/, found];
                    case 4:
                        if (result && result.length === 0) {
                            return [2 /*return*/, false];
                        }
                        else {
                            return [2 /*return*/, "errorGettingToken"];
                        }
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        console.error("Error verifying token in sale:", error_5);
                        return [2 /*return*/, "errorGettingToken"];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.raptoreumWorldStockTransaction = function (address, rtmEnviado, transactionType) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var hora, transaccion, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        hora = new Date().toISOString();
                        transaccion = { type: transactionType, address: address, rtmGanado: rtmEnviado, hora: hora };
                        return [4 /*yield*/, ((_a = this.stockTransactionsCollection) === null || _a === void 0 ? void 0 : _a.insertOne(transaccion))];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getVendedorDelToken = function (ordenId, type) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(type === "Asset")) return [3 /*break*/, 2];
                        return [4 /*yield*/, ((_a = this.ordenesVentaAssetsCollection) === null || _a === void 0 ? void 0 : _a.find({ ordenId: ordenId }).toArray())];
                    case 1:
                        result = _b.sent();
                        if (result) {
                            return [2 /*return*/, result[0]];
                        }
                        else if (!result) {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(type === "nft")) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ordenesVentaNFTsCollection.find({ ordenId: ordenId }).toArray()];
                    case 3:
                        result = _b.sent();
                        if (result) {
                            return [2 /*return*/, result[0]];
                        }
                        else if (!result) {
                            return [2 /*return*/, false];
                        }
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getVendedorDelNFT = function (ordenId) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.ordenesVentaNFTsCollection) === null || _a === void 0 ? void 0 : _a.find({ ordenId: ordenId }).toArray())];
                    case 1:
                        result = _b.sent();
                        if (result) {
                            return [2 /*return*/, result[0]];
                        }
                        else if (!result) {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getMarketAssetsById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAssetsEnVenta;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find({ _id: id }).toArray())];
                                case 1:
                                    resultGetAssetsEnVenta = _b.sent();
                                    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(resultGetAssetsEnVenta)];
                                    }
                                    else if (resultGetAssetsEnVenta == undefined || resultGetAssetsEnVenta.length == 0) {
                                        // No se encontraron assets
                                        return [2 /*return*/, resolve([])];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getMarketNFTsById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAssetsEnVenta;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ((_a = this.nftsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find({ _id: id }).toArray())];
                                case 1:
                                    resultGetAssetsEnVenta = _b.sent();
                                    console.log("RESULTADO GET MARKET NFTS:", resultGetAssetsEnVenta);
                                    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(resultGetAssetsEnVenta)];
                                    }
                                    else if (resultGetAssetsEnVenta == undefined || resultGetAssetsEnVenta.length == 0) {
                                        // No se encontraron assets
                                        return [2 /*return*/, resolve([])];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.detenerVenta = function (usuario, id, type) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var resultEliminarVenta, resultEliminarOrden, eliminacionExitosa, error_6, resultEliminarVenta, resultEliminarOrden, eliminacionExitosa, error_7;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!(type == "asset")) return [3 /*break*/, 6];
                        console.log("TYPE DETENER: asset");
                        console.log("DETONANDO DETENER VENTA DEL GATEWAY");
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 4, , 5]);
                        console.log("ID AL INGRESAR LA STOP VENTA:", id);
                        return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.deleteMany({ _id: id }))];
                    case 2:
                        resultEliminarVenta = _e.sent();
                        return [4 /*yield*/, ((_b = this.ordenesVentaAssetsCollection) === null || _b === void 0 ? void 0 : _b.deleteMany({ ordenId: id, vendedorId: usuario }))];
                    case 3:
                        resultEliminarOrden = _e.sent();
                        if (resultEliminarVenta != undefined && resultEliminarOrden != undefined) {
                            eliminacionExitosa = (resultEliminarVenta === null || resultEliminarVenta === void 0 ? void 0 : resultEliminarVenta.deletedCount) > 0 && (resultEliminarOrden === null || resultEliminarOrden === void 0 ? void 0 : resultEliminarOrden.deletedCount) > 0;
                            if (eliminacionExitosa) {
                                return [2 /*return*/, true];
                            }
                            else {
                                console.log('Error: No se pudo eliminar correctamente.');
                                return [2 /*return*/, false];
                            }
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _e.sent();
                        console.error('Error al eliminar el elemento:', error_6);
                        return [2 /*return*/, false];
                    case 5: return [3 /*break*/, 13];
                    case 6:
                        if (!(type == "nft")) return [3 /*break*/, 12];
                        console.log("DETONANDO DETENER VENTA (VERSION NFT) DEL GATEWAY");
                        _e.label = 7;
                    case 7:
                        _e.trys.push([7, 10, , 11]);
                        console.log("ID AL INGRESAR LA STOP VENTA:", id);
                        return [4 /*yield*/, ((_c = this.nftsEnVentaCollection) === null || _c === void 0 ? void 0 : _c.deleteMany({ _id: id }))];
                    case 8:
                        resultEliminarVenta = _e.sent();
                        return [4 /*yield*/, ((_d = this.ordenesVentaNFTsCollection) === null || _d === void 0 ? void 0 : _d.deleteMany({ ordenId: id, vendedorId: usuario }))];
                    case 9:
                        resultEliminarOrden = _e.sent();
                        if (resultEliminarVenta != undefined && resultEliminarOrden != undefined) {
                            eliminacionExitosa = (resultEliminarVenta === null || resultEliminarVenta === void 0 ? void 0 : resultEliminarVenta.deletedCount) > 0 && (resultEliminarOrden === null || resultEliminarOrden === void 0 ? void 0 : resultEliminarOrden.deletedCount) > 0;
                            if (eliminacionExitosa) {
                                return [2 /*return*/, true];
                            }
                            else {
                                console.log('Error: No se pudo eliminar correctamente.');
                                return [2 /*return*/, false];
                            }
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        error_7 = _e.sent();
                        console.error('Error al eliminar el elemento:', error_7);
                        return [2 /*return*/, false];
                    case 11: return [3 /*break*/, 13];
                    case 12: return [2 /*return*/, false];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getData = function (sentence, values) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedValues, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.pool != null)) return [3 /*break*/, 2];
                        sanitizedValues = values ? values.map(function (value) { return (value !== undefined ? value : null); }) : [];
                        console.log("sentencia:", sentence);
                        console.log("valores a insertar=", sanitizedValues);
                        return [4 /*yield*/, this.pool.execute(sentence, sanitizedValues)];
                    case 1:
                        result = (_a.sent())[0];
                        return [2 /*return*/, result];
                    case 2: return [2 /*return*/, false];
                }
            });
        });
    };
    UserGateway.prototype.verifyAccountBlocked = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var securityTokenResult, config, response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, jwt.sign({ user: "root" }, process.env.USERSSECRET, {
                            expiresIn: '1h' // El token expirará en 1 hora
                        })];
                    case 1:
                        securityTokenResult = _a.sent();
                        config = {
                            headers: {
                                'Authorization': "Bearer ".concat(securityTokenResult)
                            }
                        };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, axios.get("".concat(this.apiUrl, "/accountBlocked/").concat(username), config)];
                    case 3:
                        response = _a.sent();
                        if (response.status === 200) {
                            return [2 /*return*/, response.data];
                        }
                        else {
                            return [2 /*return*/, "error"];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_8 = _a.sent();
                        console.error('Error verifying account block status:', error_8);
                        return [2 /*return*/, "error"];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.blockOrUnblockUserTransactions = function (username, action) {
        return __awaiter(this, void 0, void 0, function () {
            var securityTokenResult, config, body, endpoint, response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, jwt.sign({ user: username }, process.env.USERSSECRET, {
                            expiresIn: '1h' // El token expirará en 1 hora
                        })];
                    case 1:
                        securityTokenResult = _a.sent();
                        config = {
                            headers: {
                                'Authorization': "Bearer ".concat(securityTokenResult),
                                'Content-Type': 'application/json'
                            }
                        };
                        body = {
                            user: username
                        };
                        endpoint = action === 'block' ? 'blockAccount' : 'unblockAccount';
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        console.log("body enviado:", body);
                        return [4 /*yield*/, axios.get("".concat(this.apiUrl, "/").concat(endpoint), config)];
                    case 3:
                        response = _a.sent();
                        if (response && response.status == 200) {
                            return [2 /*return*/, true];
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_9 = _a.sent();
                        console.error("Error ".concat(action, "ing account:"), error_9);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getMarketAssetsByUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAssetsEnVenta, resultOrders, marketAssets_1;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find().toArray())];
                                case 1:
                                    resultGetAssetsEnVenta = _c.sent();
                                    return [4 /*yield*/, ((_b = this.ordenesVentaAssetsCollection) === null || _b === void 0 ? void 0 : _b.find({ vendedorId: user }).toArray())];
                                case 2:
                                    resultOrders = _c.sent();
                                    if (resultOrders && resultOrders.length > 0) {
                                        marketAssets_1 = [];
                                        resultOrders.forEach(function (e) {
                                            var marketid = e.ordenId;
                                            var result = resultGetAssetsEnVenta === null || resultGetAssetsEnVenta === void 0 ? void 0 : resultGetAssetsEnVenta.find(function (elemento) {
                                                return elemento._id === marketid;
                                            });
                                            marketAssets_1.push(result);
                                        });
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(marketAssets_1)];
                                    }
                                    else if (resultGetAssetsEnVenta == undefined || resultGetAssetsEnVenta.length == 0) {
                                        // No se encontraron assets
                                        return [2 /*return*/, resolve([])];
                                    }
                                    else if (resultOrders && resultOrders.length == 0) {
                                        return [2 /*return*/, resolve([])];
                                    }
                                    else if (!resultOrders) {
                                        return [2 /*return*/, resolve([])];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getUserAddress = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var getAddressQuery, result, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        getAddressQuery = "SELECT address FROM users WHERE userId=? ";
                        if (!!this.pool) return [3 /*break*/, 1];
                        throw new Error('No se pudo conectar a la base de datos');
                    case 1: return [4 /*yield*/, this.pool.execute(getAddressQuery, [user])];
                    case 2:
                        result = (_a.sent())[0];
                        if (Array.isArray(result)) {
                            if (result) {
                                console.log("RESULT OBTENIDO EN GETUSERADDRESS: ", result);
                                return [2 /*return*/, result[0].address];
                            }
                            else {
                                return [2 /*return*/, "error"];
                            }
                        }
                        else {
                            return [2 /*return*/, "no address"];
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_10 = _a.sent();
                        console.log("error get user address:", error_10);
                        return [2 /*return*/, "error"];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.insertData = function (sentence, values) {
        return __awaiter(this, void 0, void 0, function () {
            var success, sanitizedValues, result, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        success = false;
                        if (!(this.pool != null)) return [3 /*break*/, 4];
                        sanitizedValues = values ? values.map(function (value) { return (value !== undefined ? value : null); }) : [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("ejecutando consulta");
                        return [4 /*yield*/, this.pool.execute(sentence, sanitizedValues)];
                    case 2:
                        result = (_a.sent())[0];
                        console.log("RESULTADO DE LA insercion", result);
                        if (result.affectedRows > 0) {
                            console.log("affected rows");
                            success = true;
                            return [2 /*return*/, true];
                        }
                        else {
                            success = false;
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_11 = _a.sent();
                        console.log("Error inserting data:", error_11);
                        success = false;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, success];
                }
            });
        });
    };
    UserGateway.prototype.insertVolatileData = function (user) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.db) return [3 /*break*/, 2];
                        return [4 /*yield*/, ((_a = this.volatileUserDataCollection) === null || _a === void 0 ? void 0 : _a.insertOne({ usuario: user, transactionsBlocked: false }))];
                    case 1:
                        result = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, true];
                }
            });
        });
    };
    UserGateway.prototype.insertWallet = function (usuario, wallet) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var updateQuery, updateValues, _a, result, fields, updateWallet, error_12;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 5, , 6]);
                                    if (!this.pool) {
                                        console.log('El pool no está disponible');
                                        return [2 /*return*/, reject(false)];
                                    }
                                    if (!this.pool) return [3 /*break*/, 3];
                                    updateQuery = 'UPDATE users SET address=? WHERE userid=?';
                                    updateValues = [wallet, usuario];
                                    return [4 /*yield*/, this.pool];
                                case 1: return [4 /*yield*/, (_b.sent()).execute(updateQuery, updateValues)];
                                case 2:
                                    _a = _b.sent(), result = _a[0], fields = _a[1];
                                    // Verificar si la consulta se ejecutó correctamente
                                    if (result && 'affectedRows' in result) {
                                        updateWallet = result;
                                        // Verificar si se realizó una inserción exitosa
                                        if (updateWallet.affectedRows > 0) {
                                            console.log("INSERT WALLET: true");
                                            return [2 /*return*/, resolve(true)];
                                        }
                                        else {
                                            console.log("No se actualizó ninguna fila");
                                            return [2 /*return*/, reject(false)];
                                        }
                                    }
                                    else {
                                        console.log("Hubo un error al actualizar la billetera");
                                        return [2 /*return*/, reject(false)];
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    console.log("El pool no está activo");
                                    return [2 /*return*/, reject(false)];
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_12 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_12);
                                    return [2 /*return*/, reject(false)];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.insertAsset = function (asset, usuario, usuarioId, assetpicture, total, creatorAddress, assetId, acronimo, description) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultInsertAsset, error_13;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    if (!this.db) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ((_a = this.assetsCollection) === null || _a === void 0 ? void 0 : _a.insertOne({ creador: usuario, creadorId: usuarioId, asset: asset, assetpicture: assetpicture, total: total, creadorAddress: creatorAddress, assetId: assetId, acronimo: acronimo, description: description }))];
                                case 1:
                                    resultInsertAsset = _b.sent();
                                    if (resultInsertAsset) {
                                        console.log("La inserción se ha realizado correctamente.");
                                        return [2 /*return*/, resolve({ creador: usuario, creadorId: usuarioId, asset: asset, assetpicture: assetpicture, total: total, creadorAddress: creatorAddress, assetId: assetId, acronimo: acronimo, description: description })];
                                    }
                                    else {
                                        return [2 /*return*/, reject(new Error("error intentando insertar el asset"))];
                                    }
                                    _b.label = 2;
                                case 2: return [3 /*break*/, 4];
                                case 3:
                                    error_13 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_13);
                                    return [2 /*return*/, reject(new Error("error intentando insertar el asset"))];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getAssets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAsset, error_14;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    if (!this.db) {
                                        console.log('El pool no está disponible');
                                        return [2 /*return*/, reject(new Error("la pool no está activa"))];
                                    }
                                    if (!this.db) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ((_a = this.assetsCollection) === null || _a === void 0 ? void 0 : _a.find().toArray())];
                                case 1:
                                    resultGetAsset = _b.sent();
                                    if (resultGetAsset && resultGetAsset.length > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(resultGetAsset)];
                                    }
                                    else {
                                        // No se encontraron assets
                                        return [2 /*return*/, resolve(false)];
                                    }
                                    _b.label = 2;
                                case 2: return [3 /*break*/, 4];
                                case 3:
                                    error_14 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_14);
                                    return [2 /*return*/, reject(new Error("error tratando de conseguir aaset"))];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.verifyTokenEnVenta = function (asset, user, orden) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, promises, results, found, foundFalse;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.ordenesVentaAssetsCollection) === null || _a === void 0 ? void 0 : _a.find({ vendedorId: user }).toArray())];
                    case 1:
                        result = _b.sent();
                        console.log("entrando a verify token en venta");
                        if (!result) return [3 /*break*/, 3];
                        console.log("tenemos o ordenesAssetEnVenta:", result);
                        promises = result.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (e.ordenId == orden) {
                                    return [2 /*return*/, true];
                                }
                                else {
                                    return [2 /*return*/, false];
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        results = _b.sent();
                        found = results.includes(true);
                        foundFalse = results.every(function (result) { return result === false; });
                        if (found && !foundFalse) {
                            return [2 /*return*/, true];
                        }
                        else if (!found && foundFalse) {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 4];
                    case 3: return [2 /*return*/, "errorGettingToken"];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.verifyNftEnVenta = function (asset, user, orden) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, promises, results, found, foundFalse;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.ordenesVentaNFTsCollection) === null || _a === void 0 ? void 0 : _a.find({ vendedorId: user }).toArray())];
                    case 1:
                        result = _b.sent();
                        console.log("entrando a verify token en venta");
                        if (!result) return [3 /*break*/, 3];
                        console.log("tenemos o ordenesAssetEnVenta:", result);
                        promises = result.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (e.ordenId == orden) {
                                    return [2 /*return*/, true];
                                }
                                else {
                                    return [2 /*return*/, false];
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        results = _b.sent();
                        found = results.includes(true);
                        foundFalse = results.every(function (result) { return result === false; });
                        if (found && !foundFalse) {
                            return [2 /*return*/, true];
                        }
                        else if (!found && foundFalse) {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 4];
                    case 3: return [2 /*return*/, "errorGettingToken"];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.insertAssetInMarket = function (assetEnVenta, userid, nombre, address, price, type) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var asset, _id, vendedorId, sellerAddress, collection, resultInsert, e_2;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 16, , 17]);
                                    if (!this.db) return [3 /*break*/, 14];
                                    asset = void 0;
                                    console.log("TYPE INSERT ASSET:", type);
                                    if (!(type === "NFT")) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this.getNFTRegistered(assetEnVenta)];
                                case 1:
                                    asset = _c.sent();
                                    return [3 /*break*/, 4];
                                case 2:
                                    if (!(type === "TOKEN")) return [3 /*break*/, 4];
                                    return [4 /*yield*/, this.getAssetRegistered(assetEnVenta)];
                                case 3:
                                    asset = _c.sent();
                                    _c.label = 4;
                                case 4:
                                    if (!asset) return [3 /*break*/, 12];
                                    _id = new mongodb_2.ObjectId().toString();
                                    vendedorId = userid;
                                    sellerAddress = address;
                                    collection = void 0;
                                    if (type === "NFT") {
                                        collection = this.nftsEnVentaCollection;
                                    }
                                    else if (type === "TOKEN") {
                                        collection = this.assetsEnVentaCollection;
                                    }
                                    if (!collection) return [3 /*break*/, 10];
                                    return [4 /*yield*/, collection.insertOne({
                                            _id: _id,
                                            creador: asset.creador,
                                            asset: asset.asset,
                                            assetpicture: asset.assetpicture,
                                            total: asset.total,
                                            vendedor: nombre,
                                            assetId: asset.assetId,
                                            acronimo: asset.acronimo,
                                            description: asset.description,
                                            ipfsLink: asset.linkIPFS,
                                            price: price
                                        })];
                                case 5:
                                    resultInsert = _c.sent();
                                    if (!resultInsert)
                                        return [2 /*return*/, reject("No se pudo insertar el asset en la colección correspondiente")];
                                    if (!(type === "NFT")) return [3 /*break*/, 7];
                                    return [4 /*yield*/, ((_a = this.ordenesVentaNFTsCollection) === null || _a === void 0 ? void 0 : _a.insertOne({ ordenId: _id, vendedorId: vendedorId, sellerAddress: sellerAddress }))];
                                case 6:
                                    _c.sent();
                                    return [3 /*break*/, 9];
                                case 7:
                                    if (!(type === "TOKEN")) return [3 /*break*/, 9];
                                    return [4 /*yield*/, ((_b = this.ordenesVentaAssetsCollection) === null || _b === void 0 ? void 0 : _b.insertOne({ ordenId: _id, vendedorId: vendedorId, sellerAddress: sellerAddress }))];
                                case 8:
                                    _c.sent();
                                    _c.label = 9;
                                case 9: return [2 /*return*/, resolve({
                                        _id: _id,
                                        creador: asset.creador,
                                        vendedor: nombre,
                                        asset: asset.asset,
                                        assetId: asset.assetId,
                                        assetpicture: asset.assetpicture,
                                        total: asset.total,
                                        price: price,
                                        acronimo: asset.acronimo
                                    })];
                                case 10: return [2 /*return*/, reject("No se pudo insertar el asset en la colección correspondiente")];
                                case 11: return [3 /*break*/, 13];
                                case 12:
                                    console.log("por esto la respuesta sale mal:", asset);
                                    return [2 /*return*/, reject("el activo no existe por lo tanto no puede ser vendido")];
                                case 13: return [3 /*break*/, 15];
                                case 14: return [2 /*return*/, reject("Database connection is not available")];
                                case 15: return [3 /*break*/, 17];
                                case 16:
                                    e_2 = _c.sent();
                                    console.log(e_2);
                                    return [2 /*return*/, reject("No se pudo insertar el asset en la colección correspondiente")];
                                case 17: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getAsset = function (asset) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAsset, error_15;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    if (!this.db) {
                                        console.log('El pool no está disponible');
                                        return [2 /*return*/, reject(new Error("la pool no está activa"))];
                                    }
                                    if (!this.db) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ((_a = this.assetsCollection) === null || _a === void 0 ? void 0 : _a.countDocuments({ asset: asset }))];
                                case 1:
                                    resultGetAsset = _b.sent();
                                    if (resultGetAsset && resultGetAsset > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(true)];
                                    }
                                    else if (resultGetAsset == 0 || resultGetAsset == undefined) {
                                        // No se encontraron assets
                                        return [2 /*return*/, resolve(false)];
                                    }
                                    _b.label = 2;
                                case 2: return [3 /*break*/, 4];
                                case 3:
                                    error_15 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_15);
                                    return [2 /*return*/, reject(new Error("error tratando de conseguir aaset"))];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.removeData = function (sentence, values) {
        return __awaiter(this, void 0, void 0, function () {
            var success, sanitizedValues, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        success = false;
                        if (!(this.pool != null)) return [3 /*break*/, 2];
                        sanitizedValues = values ? values.map(function (value) { return (value !== undefined ? value : null); }) : [];
                        return [4 /*yield*/, this.pool.execute(sentence, sanitizedValues)];
                    case 1:
                        result = (_a.sent())[0];
                        success = true;
                        return [2 /*return*/, success];
                    case 2: return [2 /*return*/, success];
                }
            });
        });
    };
    UserGateway.prototype.updateData = function (sentence, values) {
        return __awaiter(this, void 0, void 0, function () {
            var success, sanitizedValues, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        success = false;
                        if (!(this.pool != null)) return [3 /*break*/, 2];
                        sanitizedValues = values ? values.map(function (value) { return (value !== undefined ? value : null); }) : [];
                        return [4 /*yield*/, this.pool.execute(sentence, sanitizedValues)];
                    case 1:
                        result = (_a.sent())[0];
                        if (result !== undefined) {
                            success = true;
                        }
                        return [2 /*return*/, success];
                    case 2: return [2 /*return*/, success];
                }
            });
        });
    };
    UserGateway.prototype.setupDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connected, mysqlpassword, _a, mongoPass, mongoUser, auth, uri, client, error_16;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        connected = false;
                        mysqlpassword = process.env.USERSSECRET;
                        _b.label = 1;
                    case 1:
                        if (!!connected) return [3 /*break*/, 8];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 5, , 7]);
                        _a = this;
                        return [4 /*yield*/, mysql.createPool({
                                host: '127.0.0.1',
                                user: 'raptoreumworld',
                                password: mysqlpassword,
                                database: 'raptoreumworld'
                            })];
                    case 3:
                        _a.pool = _b.sent();
                        console.log('Connected to MySQL');
                        mongoPass = process.env.MONGOPASS;
                        console.log("MONGO PASS: ", mongoPass);
                        mongoUser = 'raptoreumworld';
                        auth = "DEFAULT";
                        uri = "mongodb://".concat(mongoUser, ":").concat(mongoPass, "@127.0.0.1/raptoreumworld?authMechanism=").concat(auth);
                        client = new mongodb_1.MongoClient(uri);
                        return [4 /*yield*/, client.connect()];
                    case 4:
                        _b.sent();
                        this.db = client.db('raptoreumworld');
                        this.assetsCollection = this.db.collection('assets');
                        this.assetsEnVentaCollection = this.db.collection('assetsEnVenta');
                        this.volatileUserDataCollection = this.db.collection('volatileUserData');
                        this.ordenesVentaAssetsCollection = this.db.collection('ordenesAssetEnVenta');
                        this.comprasYventasAssetsCollection = this.db.collection('comprasYventas');
                        this.transaccionesPendientesCollection = this.db.collection('transaccionesPendientes');
                        this.stockTransactionsCollection = this.db.collection('stockTransactions');
                        this.nftCollection = this.db.collection('nft');
                        this.nftsEnVentaCollection = this.db.collection('nftsEnVenta');
                        this.ordenesVentaNFTsCollection = this.db.collection('ordenesNFTsEnVenta');
                        console.log('Connected to MongoDB');
                        connected = true;
                        return [3 /*break*/, 7];
                    case 5:
                        error_16 = _b.sent();
                        console.error('Error connecting to databases:', error_16);
                        connected = false;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 1];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return UserGateway;
}());
exports.UserGateway = UserGateway;
