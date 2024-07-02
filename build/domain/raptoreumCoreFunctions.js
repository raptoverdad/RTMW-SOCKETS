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
exports.raptoreumCoreAccess = void 0;
var exec = require('child_process').exec;
var axios_1 = require("axios");
var util = require('util');
var gateway_1 = require("../dataaccess/gateway");
var gateway = gateway_1.UserGateway.getInstance();
function getFromCache(key, client) {
    return __awaiter(this, void 0, void 0, function () {
        var getAsync, setAsync, cachedData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getAsync = util.promisify(client.get).bind(client);
                    setAsync = util.promisify(client.set).bind(client);
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
        var getAsync, setAsync;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    getAsync = util.promisify(client.get).bind(client);
                    setAsync = util.promisify(client.set).bind(client);
                    return [4 /*yield*/, setAsync(key, JSON.stringify(data))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var raptoreumCoreAccess = /** @class */ (function () {
    function raptoreumCoreAccess() {
    }
    raptoreumCoreAccess.getInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var instance, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!raptoreumCoreAccess.instance) return [3 /*break*/, 3];
                        instance = new raptoreumCoreAccess();
                        _a = instance;
                        return [4 /*yield*/, gateway];
                    case 1: return [4 /*yield*/, (_b.sent()).getRedisClient()];
                    case 2:
                        _a.client = _b.sent();
                        raptoreumCoreAccess.instance = instance;
                        _b.label = 3;
                    case 3: return [2 /*return*/, raptoreumCoreAccess.instance];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.getassetdetailsbyname = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var rpcUser, rpcPassword, rpcHost, requestData, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        rpcUser = 'rodrigo';
                        rpcPassword = '1234';
                        rpcHost = "http://localhost:10225/wallet/";
                        requestData = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'getassetdetailsbyname',
                            params: [name],
                        };
                        console.log('Sending request to RPC server');
                        return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                auth: {
                                    username: rpcUser,
                                    password: rpcPassword,
                                },
                                headers: {
                                    'Content-Type': 'text/plain;',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('Received response from RPC server');
                        if (response) {
                            console.log("Response status: ".concat(response.status));
                            if (response.status === 200) {
                                console.log('Response status is 200');
                                if (response.data && response.data.result) {
                                    console.log('Response data and result exist');
                                    if (response.data.result.Asset_name) {
                                        console.log('Asset name found');
                                        return [2 /*return*/, response.data.result];
                                    }
                                    else {
                                        console.log('Asset name not found');
                                        return [2 /*return*/, "notFound"];
                                    }
                                }
                                else {
                                    console.log('Response data or result does not exist');
                                    return [2 /*return*/, "notFound"];
                                }
                            }
                            else if (response.status === 500) {
                                console.log('Response status is 500');
                                return [2 /*return*/, "notFound"];
                            }
                            else {
                                console.log('Response status is neither 200 nor 500');
                                return [2 /*return*/, "getassetdetailsbynameError"];
                            }
                        }
                        else {
                            console.log('Response is empty');
                            return [2 /*return*/, "getassetdetailsbynameError"];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.log('Caught an error');
                        if (error_1.response && error_1.response.status === 500) {
                            console.log('Error status is 500');
                            return [2 /*return*/, "notFound"];
                        }
                        else {
                            console.log('Error status is not 500 or error response does not exist');
                            return [2 /*return*/, "getassetdetailsbynameError"];
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.getAddressBalance = function (address, asset) {
        return __awaiter(this, void 0, void 0, function () {
            var rpcUser, rpcPassword, rpcHost, requestData, response, assetData, DECIMAL_FACTOR, rawValue, realValue, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        rpcUser = 'rodrigo';
                        rpcPassword = '1234';
                        rpcHost = "http://localhost:10225/wallet/";
                        requestData = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'getaddressbalance',
                            params: [{ addresses: [address], asset: asset }],
                        };
                        console.log('Sending request to RPC server');
                        return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                auth: {
                                    username: rpcUser,
                                    password: rpcPassword,
                                },
                                headers: {
                                    'Content-Type': 'text/plain;',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('Received response from RPC server');
                        if (response) {
                            console.log("Response status: ".concat(response.status));
                            if (response.status === 200) {
                                console.log('Response status is 200');
                                if (response.data && response.data.result) {
                                    console.log('Response data and result exist');
                                    assetData = response.data.result[asset];
                                    if (assetData) {
                                        console.log("Balance for asset ".concat(asset, ": ").concat(assetData.balance));
                                        DECIMAL_FACTOR = Math.pow(10, 8);
                                        rawValue = assetData.balance;
                                        realValue = rawValue / DECIMAL_FACTOR;
                                        assetData.balance = realValue;
                                        return [2 /*return*/, assetData];
                                    }
                                    else {
                                        console.log('Asset data not found');
                                        return [2 /*return*/, "notFound"];
                                    }
                                }
                                else {
                                    console.log('Response data or result does not exist');
                                    return [2 /*return*/, "notFound"];
                                }
                            }
                            else if (response.status === 500) {
                                console.log('Response status is 500');
                                return [2 /*return*/, "notFound"];
                            }
                            else {
                                console.log('Response status is neither 200 nor 500');
                                return [2 /*return*/, "error"];
                            }
                        }
                        else {
                            console.log('Response is empty');
                            return [2 /*return*/, "error"];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.log('Caught an error');
                        if (error_2.response && error_2.response.status === 500) {
                            console.log('Error status is 500');
                            return [2 /*return*/, "notFound"];
                        }
                        else {
                            console.log('Error status is not 500 or error response does not exist');
                            return [2 /*return*/, "error"];
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.getUserAssets = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var rpcUser, rpcPassword, rpcHost, requestData, response, data_1, DECIMAL_FACTOR_1, result, filteredResult, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        rpcUser = 'rodrigo';
                        rpcPassword = '1234';
                        rpcHost = 'http://localhost:10225/';
                        requestData = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'listassetbalancesbyaddress',
                            params: [address],
                        };
                        return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                auth: { username: rpcUser, password: rpcPassword },
                                headers: { 'Content-Type': 'text/plain;' },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!(response.status === 200 && response.data && response.data.result)) return [3 /*break*/, 3];
                        data_1 = response.data.result;
                        DECIMAL_FACTOR_1 = Math.pow(10, 8);
                        return [4 /*yield*/, Promise.all(Object.keys(data_1).map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                                var cachedAssetDetails, isNft, assetData;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, getFromCache("assetDetails:".concat(key), this.client)];
                                        case 1:
                                            cachedAssetDetails = _a.sent();
                                            if (!cachedAssetDetails) return [3 /*break*/, 2];
                                            // Si se encuentra en el caché, usar los detalles del caché
                                            return [2 /*return*/, {
                                                    asset: key,
                                                    balance: data_1[key] / DECIMAL_FACTOR_1,
                                                    _id: false,
                                                    enVenta: false,
                                                    type: cachedAssetDetails.Isunique ? 'NFT' : 'TOKEN',
                                                    assetpicture: 'none',
                                                    acronimo: '',
                                                    assetid: cachedAssetDetails.Asset_id,
                                                }];
                                        case 2: return [4 /*yield*/, this.getassetdetailsbyname(key)];
                                        case 3:
                                            isNft = _a.sent();
                                            if (isNft === 'getassetdetailsbynameError') {
                                                return [2 /*return*/, 'error'];
                                            }
                                            assetData = {
                                                Isunique: isNft.Isunique,
                                                Asset_id: isNft.Asset_id,
                                            };
                                            // Guardar en caché los detalles del activo con una expiración de 5 minutos (300 segundos)
                                            return [4 /*yield*/, cacheData("assetDetails:".concat(key), assetData, this.client)];
                                        case 4:
                                            // Guardar en caché los detalles del activo con una expiración de 5 minutos (300 segundos)
                                            _a.sent();
                                            // Construir y retornar el objeto de activo
                                            return [2 /*return*/, {
                                                    asset: key,
                                                    balance: data_1[key] / DECIMAL_FACTOR_1,
                                                    _id: false,
                                                    enVenta: false,
                                                    type: isNft.Isunique ? 'NFT' : 'TOKEN',
                                                    assetpicture: 'none',
                                                    acronimo: '',
                                                    assetid: isNft.Asset_id,
                                                }];
                                    }
                                });
                            }); }))];
                    case 2:
                        result = _a.sent();
                        // Verificar si hay algún error en los resultados
                        if (result.includes('error')) {
                            return [2 /*return*/, 'getUserAssetsError'];
                        }
                        filteredResult = result.filter(function (r) { return r !== undefined; });
                        return [2 /*return*/, filteredResult];
                    case 3:
                        if (response.status === 404) {
                            return [2 /*return*/, 'getUserAssetsError'];
                        }
                        else {
                            console.log('La petición salió mal en getUserAssets');
                            return [2 /*return*/, 'getUserAssetsError'];
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        console.error('Error en getUserAssets:', error_3);
                        return [2 /*return*/, 'getUserAssetsError'];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.getAccountBalance = function (usuario) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var rpcUser, rpcPassword, rpcHost, requestData, response, accountBalance, error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    rpcUser = 'rodrigo';
                                    rpcPassword = '1234';
                                    rpcHost = "http://localhost:10225/wallet/".concat(usuario);
                                    requestData = {
                                        jsonrpc: '1.0',
                                        id: 'curltest',
                                        method: 'getbalance',
                                        params: [],
                                    };
                                    return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                            auth: {
                                                username: rpcUser,
                                                password: rpcPassword,
                                            },
                                            headers: {
                                                'Content-Type': 'text/plain;',
                                            },
                                        })];
                                case 1:
                                    response = _a.sent();
                                    if (response) {
                                        console.log("response true account balance!");
                                        console.log(response);
                                        accountBalance = parseFloat(response.data.result);
                                        resolve(accountBalance);
                                    }
                                    else {
                                        console.log("response false!");
                                        reject(false);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_4 = _a.sent();
                                    console.log("error account balance:", error_4);
                                    reject(false);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    raptoreumCoreAccess.prototype.listCoinholders = function (coin) {
        return __awaiter(this, void 0, void 0, function () {
            var rpcUser, rpcPassword, rpcHost, requestData, response, data_2, DECIMAL_FACTOR_2, result, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        rpcUser = 'rodrigo';
                        rpcPassword = '1234';
                        rpcHost = "http://localhost:10225/";
                        requestData = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'listassetbalancesbyaddress',
                            params: [coin],
                        };
                        return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                auth: {
                                    username: rpcUser,
                                    password: rpcPassword,
                                },
                                headers: {
                                    'Content-Type': 'text/plain;',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response) return [3 /*break*/, 6];
                        if (!(response.status == 200)) return [3 /*break*/, 4];
                        if (!response.data) return [3 /*break*/, 3];
                        console.log("DATA LIST COIN HOLDERS:", response.data);
                        data_2 = response.data.result || false;
                        if (!data_2 || Object.keys(data_2).length === 0)
                            return [2 /*return*/, "listCoinHoldersError"];
                        DECIMAL_FACTOR_2 = Math.pow(10, 8);
                        return [4 /*yield*/, Promise.all(Object.keys(data_2).map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                                var rawValue, realValue;
                                return __generator(this, function (_a) {
                                    rawValue = data_2[key];
                                    realValue = rawValue / DECIMAL_FACTOR_2;
                                    return [2 /*return*/, {
                                            address: key,
                                            amount: realValue
                                        }];
                                });
                            }); }))];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        if (response.status == 404) {
                            return [2 /*return*/, "listCoinHoldersError"];
                        }
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6: return [2 /*return*/, "listCoinHoldersError"];
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_5 = _a.sent();
                        return [2 /*return*/, "listCoinHoldersError"];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.getAssetBalance = function (address, assetId) {
        return __awaiter(this, void 0, void 0, function () {
            var rpcUser, rpcPassword, rpcHost, requestData, response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        rpcUser = 'rodrigo';
                        rpcPassword = '1234';
                        rpcHost = "http://localhost:10225/";
                        requestData = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'getaddressbalance',
                            params: [address, assetId],
                        };
                        return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                auth: {
                                    username: rpcUser,
                                    password: rpcPassword,
                                },
                                headers: {
                                    'Content-Type': 'text/plain;',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (response && response.data.result) {
                            console.log("response create wallet:", response.data.result);
                            return [2 /*return*/, response.data.result];
                        }
                        else {
                            console.log("ELSE create wallet:", response);
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.log("ERROR CREATE WALLET:", error_6);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.withdrawToken = function (billeteraDelToken, to, cantidad, assetID, rtmSpendAddresss, assetSpendAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var rpcUser, rpcPassword, rpcHost, requestData, response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        rpcUser = 'rodrigo';
                        rpcPassword = '1234';
                        rpcHost = "http://localhost:10225/wallet/".concat(billeteraDelToken);
                        requestData = {
                            jsonrpc: '1.0',
                            id: 'curltest',
                            method: 'sendasset',
                            params: [assetID, cantidad, to, rtmSpendAddresss, assetSpendAddress],
                        };
                        return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                auth: {
                                    username: rpcUser,
                                    password: rpcPassword,
                                },
                                headers: {
                                    'Content-Type': 'text/plain;',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (response && response.status == 200) {
                            console.log(response);
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        console.log("ERROR WITHDRAW TOKEN", error_7);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    raptoreumCoreAccess.prototype.withdrawRaptoreum = function (username, address, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var userBalance, rpcUser, rpcPassword, rpcHost, requestData, response, error_8;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 7, , 8]);
                                    if (!(amount > 0)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, this.getAccountBalance(username)];
                                case 1:
                                    userBalance = _a.sent();
                                    if (!userBalance) return [3 /*break*/, 4];
                                    if (!(userBalance > amount)) return [3 /*break*/, 3];
                                    rpcUser = 'rodrigo';
                                    rpcPassword = '1234';
                                    rpcHost = "http://localhost:10225/wallet/".concat(username);
                                    requestData = {
                                        jsonrpc: '1.0',
                                        id: 'curltest',
                                        method: 'sendtoaddress',
                                        params: [address, amount],
                                    };
                                    return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                            auth: {
                                                username: rpcUser,
                                                password: rpcPassword,
                                            },
                                            headers: {
                                                'Content-Type': 'text/plain;',
                                            },
                                        })];
                                case 2:
                                    response = _a.sent();
                                    if (response) {
                                        if (response.status == 200) {
                                            if (response.data.result.length == 64) {
                                                resolve(response.data.result);
                                            }
                                            else {
                                                reject("noValidResponse");
                                            }
                                        }
                                        else {
                                            reject("notOk");
                                        }
                                    }
                                    else {
                                        reject("notResponse");
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    reject("notEnoughBalance");
                                    _a.label = 4;
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    reject("notEnoughBalance");
                                    _a.label = 6;
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    error_8 = _a.sent();
                                    console.log(error_8);
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    raptoreumCoreAccess.prototype.validateAddress = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var rpcUser, rpcPassword, rpcHost, requestData, response, error_9;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    rpcUser = 'rodrigo';
                                    rpcPassword = '1234';
                                    rpcHost = "http://localhost:10225/wallet/";
                                    requestData = {
                                        jsonrpc: '1.0',
                                        id: 'curltest',
                                        method: 'validateaddress',
                                        params: [address],
                                    };
                                    return [4 /*yield*/, axios_1.default.post(rpcHost, requestData, {
                                            auth: {
                                                username: rpcUser,
                                                password: rpcPassword,
                                            },
                                            headers: {
                                                'Content-Type': 'text/plain;',
                                            },
                                        })];
                                case 1:
                                    response = _a.sent();
                                    if (response) {
                                        if (response.status == 200) {
                                            if (response.data.result.isvalid == true) {
                                                resolve(true);
                                            }
                                            else {
                                                resolve(false);
                                            }
                                        }
                                        else {
                                            reject(false);
                                        }
                                    }
                                    else {
                                        reject(false);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_9 = _a.sent();
                                    reject(false);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    return raptoreumCoreAccess;
}());
exports.raptoreumCoreAccess = raptoreumCoreAccess;
