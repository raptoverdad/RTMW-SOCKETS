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
var mysql = require("mysql2/promise");
var brcryptjs = require('bcryptjs');
var mongodb_1 = require("mongodb");
var UserGateway = /** @class */ (function () {
    function UserGateway() {
        this.pool = null;
        this.db = null;
        this.assetsEnVentaCollection = null;
        this.assetsCollection = null;
    }
    UserGateway.getInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var setup;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!UserGateway.instance) return [3 /*break*/, 2];
                        UserGateway.instance = new UserGateway();
                        return [4 /*yield*/, UserGateway.instance.setupDatabase()];
                    case 1:
                        setup = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, UserGateway.instance];
                }
            });
        });
    };
    UserGateway.prototype.verifyAccountBlocked = function (user) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, transactionsBlocked;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find({ usuario: user }).toArray())];
                    case 1:
                        result = _b.sent();
                        if (result) {
                            transactionsBlocked = result[0].transactionsBlocked;
                            if (transactionsBlocked == true) {
                                return [2 /*return*/, true];
                            }
                            else {
                                return [2 /*return*/, false];
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.blockOrUnblockUserTransactions = function (user, type) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var resultado, resultado;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(type == 'block')) return [3 /*break*/, 2];
                        return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.updateOne({ usuario: user }, // Filtro para encontrar el documento
                            { $set: { transactionsBlocked: true } } // Actualización del campo 'user'
                            ))];
                    case 1:
                        resultado = _c.sent();
                        if (resultado) {
                            if (resultado.modifiedCount > 0) {
                                return [2 /*return*/, true];
                            }
                            else {
                                return [2 /*return*/, false];
                            }
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(type == 'unblock')) return [3 /*break*/, 4];
                        return [4 /*yield*/, ((_b = this.assetsEnVentaCollection) === null || _b === void 0 ? void 0 : _b.updateOne({ usuario: user }, // Filtro para encontrar el documento
                            { $set: { transactionsBlocked: false } } // Actualización del campo 'user'
                            ))];
                    case 3:
                        resultado = _c.sent();
                        if (resultado) {
                            if (resultado.modifiedCount > 0) {
                                return [2 /*return*/, true];
                            }
                            else {
                                return [2 /*return*/, false];
                            }
                        }
                        _c.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.getUserAddress = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var getAddressQuery, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        getAddressQuery = "SELECT address FROM users WHERE usuario=? ";
                        if (!!this.pool) return [3 /*break*/, 1];
                        throw new Error('No se pudo conectar a la base de datos');
                    case 1: return [4 /*yield*/, this.pool.execute(getAddressQuery, [user])];
                    case 2:
                        result = (_a.sent())[0];
                        if (Array.isArray(result)) {
                            if (result.length == 0 || result == undefined) {
                                return [2 /*return*/, "no address"];
                            }
                            else if (result.length > 0) {
                                return [2 /*return*/, result[0].address];
                            }
                            else {
                                throw new Error("UNEXPECTED RESULT");
                            }
                        }
                        else {
                            return [2 /*return*/, "no address"];
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.verifyPassword = function (usuario, contrasena) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var result, passwordMatch;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!this.pool) return [3 /*break*/, 3];
                                    return [4 /*yield*/, this.pool];
                                case 1: return [4 /*yield*/, (_a.sent()).execute("SELECT usuario,contrasena FROM users WHERE usuario = ?", [usuario])];
                                case 2:
                                    result = (_a.sent())[0];
                                    if (result) {
                                        passwordMatch = brcryptjs.compareSync(contrasena, result.contrasena);
                                        if (passwordMatch) {
                                            resolve(true);
                                        }
                                        else {
                                            reject(false);
                                        }
                                    }
                                    else {
                                        reject(false);
                                    }
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getAssetsComprados = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    UserGateway.prototype.insertAssetComprado = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    UserGateway.prototype.detenerVenta = function (usuario, asset) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var resultEliminarVenta, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.deleteOne({ vendedor: usuario, asset: asset }))];
                    case 1:
                        resultEliminarVenta = _b.sent();
                        if (resultEliminarVenta && resultEliminarVenta.deletedCount) {
                            if (resultEliminarVenta.deletedCount === 1) {
                                return [2 /*return*/, true];
                            }
                            else if (resultEliminarVenta.deletedCount === 0) {
                                return [2 /*return*/, false];
                            }
                        }
                        return [2 /*return*/, false]; // Si ninguna de las condiciones anteriores se cumple
                    case 2:
                        error_1 = _b.sent();
                        console.error('Error al eliminar el elemento:', error_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
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
                                    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
                                        // Se encontraron assets
                                        return [2 /*return*/, resolve(resultGetAssetsEnVenta)];
                                    }
                                    else if (resultGetAssetsEnVenta == undefined || resultGetAssetsEnVenta.length == 0) {
                                        return [2 /*return*/, resolve([])];
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getAssetEnVentaPorVendedor = function (asset, vendedor) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAsset, error_2;
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
                                    return [4 /*yield*/, ((_a = this.assetsCollection) === null || _a === void 0 ? void 0 : _a.countDocuments({ asset: asset, vendedor: vendedor }))];
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
                                    error_2 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_2);
                                    return [2 /*return*/, reject(new Error("error tratando de conseguir aaset"))];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.getMarketAssetsByUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAssetsEnVenta;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ((_a = this.assetsEnVentaCollection) === null || _a === void 0 ? void 0 : _a.find({ vendedor: user }).toArray())];
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
    UserGateway.prototype.getAssets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var resultGetAsset, error_3;
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
                                    else if (resultGetAsset == undefined || resultGetAsset.length == 0) {
                                        // No se encontraron assets
                                        return [2 /*return*/, resolve([])];
                                    }
                                    _b.label = 2;
                                case 2: return [3 /*break*/, 4];
                                case 3:
                                    error_3 = _b.sent();
                                    console.log("Error en la función de inserción de billetera:", error_3);
                                    return [2 /*return*/, reject(new Error("error tratando de conseguir aaset"))];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    UserGateway.prototype.setupDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connected, _a, client, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        connected = false;
                        _b.label = 1;
                    case 1:
                        if (!!connected) return [3 /*break*/, 8];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 5, , 7]);
                        _a = this;
                        return [4 /*yield*/, mysql.createPool({
                                host: "localhost",
                                user: "root",
                                password: "1234",
                                database: "raptoreumworld",
                            })];
                    case 3:
                        _a.pool = _b.sent();
                        console.log("connected to database");
                        client = new mongodb_1.MongoClient('mongodb://127.0.0.1:27017');
                        return [4 /*yield*/, client.connect()];
                    case 4:
                        _b.sent();
                        this.db = client.db('raptoreumworld');
                        this.assetsCollection = this.db.collection('assets');
                        this.assetsEnVentaCollection = this.db.collection('assetsEnVenta');
                        console.log('Connected to MongoDB');
                        connected = true; // Establecemos la conexión con éxito
                        return [3 /*break*/, 7];
                    case 5:
                        error_4 = _b.sent();
                        console.log("ERRORRRRRR");
                        connected = false;
                        console.error("Error al conectar a la base de datos:", error_4);
                        // Esperamos antes de intentar nuevamente
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 6:
                        // Esperamos antes de intentar nuevamente
                        _b.sent(); // Puedes ajustar el tiempo de espera según tus necesidades
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
