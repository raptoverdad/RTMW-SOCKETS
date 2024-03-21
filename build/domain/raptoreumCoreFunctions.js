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
var raptoreumCoreAccess = /** @class */ (function () {
    function raptoreumCoreAccess() {
    }
    raptoreumCoreAccess.getInstance = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!raptoreumCoreAccess.instance) {
                    raptoreumCoreAccess.instance = new raptoreumCoreAccess();
                }
                return [2 /*return*/, raptoreumCoreAccess.instance];
            });
        });
    };
    raptoreumCoreAccess.prototype.getAccountBalance = function (usuario) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var rpcUser, rpcPassword, rpcHost, requestData, response, accountBalance, error_1;
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
                                        console.log(response);
                                        accountBalance = parseFloat(response.data.result);
                                        resolve(accountBalance);
                                    }
                                    else {
                                        reject(false);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    reject(false);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    raptoreumCoreAccess.prototype.getAssetBalance = function (vendedor, addressVendedor, assetId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Retroceder un directorio
                        //    exec(`raptoreum-cli -rpcwallet=${address} getbalance`, {cwd: 'C:/Users/56947/Desktop/raptoreum'}, (error:any, stdout:any, stderr:any) => {
                        //    if (error) {
                        //      console.error(`Error al retroceder el directorio: ${error.message}`);
                        //      reject(error);
                        //    }
                        //    if (stderr) {
                        //      console.error(`Error en la salida estándar: ${stderr}`);
                        //      reject(new Error(stderr));
                        //    }else{
                        //      console.log(`Salida GETACCOUNTBALANCE:\n${stdout}`);
                        //      const outputLines = stdout.trim().split('\n');
                        //      const addressBalance = outputLines[outputLines.length - 1].trim();
                        //      resolve(addressBalance)
                        //}
                        //// Listar archivos en el directorio actual  
                        //});
                        var numeroAleatorio = Math.floor(Math.random() * 11);
                        resolve(numeroAleatorio);
                    })];
            });
        });
    };
    raptoreumCoreAccess.prototype.withdrawToken = function (billeteraDelToken, to, cantidad, assetID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                //revisar el balance de raptoreum para poder sacar el token
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Retroceder un directorio
                        //    exec(`raptoreum-cli -rpcwallet=${address} getbalance`, {cwd: 'C:/Users/56947/Desktop/raptoreum'}, (error:any, stdout:any, stderr:any) => {
                        //    if (error) {
                        //      console.error(`Error al retroceder el directorio: ${error.message}`);
                        //      reject(error);
                        //    }
                        //    if (stderr) {
                        //      console.error(`Error en la salida estándar: ${stderr}`);
                        //      reject(new Error(stderr));
                        //    }else{
                        //      console.log(`Salida GETACCOUNTBALANCE:\n${stdout}`);
                        //      const outputLines = stdout.trim().split('\n');
                        //      const addressBalance = outputLines[outputLines.length - 1].trim();
                        //      resolve(addressBalance)
                        //}
                        //// Listar archivos en el directorio actual  
                        //});
                        resolve(false);
                        //reject("Insufficient tokens funds")
                    })];
            });
        });
    };
    //public async withdrawRaptoreum(username:string,address:string,amount:number): Promise<string | false> {
    //  return new Promise((resolve, reject) => {
    //      exec(`raptoreum-cli -rpcwallet=C:/Users/56947/AppData/Roaming/RaptoreumCore/${username} sendtoaddress "${address}" ${amount}`, { cwd: 'C:/Users/56947/Desktop/raptoreum' }, (error: any, stdout: any, stderr: any) => {
    //        if (error) {
    //          console.error(`Error al ejecutar el comando: ${error.message}`);
    //          return reject(false);
    //        } else if (stderr) {
    //          console.error(`Error en la salida estándar: ${stderr}`);
    //          return reject(false);
    //        } else {
    //            console.log(stdout)
    //          console.log("typeof de stdout:", typeof stdout)
    //          console.log("length de stdout:",stdout.length)
    //          if( stdout.length== 66){
    //            let output=stdout
    //            return resolve(output);
    //          }else if(stdout.includes("Insufficient")){
    //            console.log("rechazando")
    //            return reject("Insufficient raptoreum funds");
    //          }
    //    }});
    //  });
    //}
    raptoreumCoreAccess.prototype.withdrawRaptoreum = function (username, address, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var userBalance, rpcUser, rpcPassword, rpcHost, requestData, response, error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
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
                                        if (response.data.length == 64) {
                                            resolve(response.data);
                                        }
                                    }
                                    else {
                                        reject(false);
                                    }
                                    return [3 /*break*/, 4];
                                case 3:
                                    reject("notEnoughBalance");
                                    _a.label = 4;
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_2 = _a.sent();
                                    reject(false);
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    //arrglar esta funcion
    raptoreumCoreAccess.prototype.createWallet = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        exec("raptoreum-cli -rpcwallet=C:/Users/56947/AppData/Roaming/RaptoreumCore/wallet3/ getnewaddress", { cwd: 'C:/Users/56947/Desktop/raptoreum' }, function (error, stdout, stderr) {
                            if (error) {
                                console.error("Error al ejecutar el comando: ".concat(error.message));
                                reject(error);
                            }
                            else if (stderr) {
                                console.error("Error en la salida est\u00E1ndar: ".concat(stderr));
                                reject(stderr);
                            }
                            else {
                                // Dividir la salida en líneas y tomar la última línea que contiene la dirección de la cartera
                                var outputLines = stdout.trim().split('\n');
                                var walletAddress = outputLines[outputLines.length - 1].trim();
                                // Devolver la dirección de la cartera
                                console.log("create wallet address", walletAddress);
                                resolve(walletAddress);
                            }
                        });
                    })];
            });
        });
    };
    raptoreumCoreAccess.prototype.validateAddress = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        exec("raptoreum-cli validateaddress \"".concat(address, "\""), { cwd: 'C:/Users/56947/Desktop/raptoreum' }, function (error, stdout, stderr) {
                            if (error) {
                                console.error("Error al ejecutar el comando: ".concat(error.message));
                                reject(error.message);
                            }
                            else if (stderr) {
                                console.error("Error en la salida est\u00E1ndar: ".concat(stderr));
                                reject(stderr);
                            }
                            else {
                                var output = stdout;
                                if (output.indexOf('"isvalid":') !== -1) {
                                    var startIndex = output.indexOf('"isvalid":') + '"isvalid":'.length;
                                    if (startIndex === undefined) {
                                        reject(new Error('No se pudo encontrar el índice de inicio'));
                                    }
                                    else {
                                        var endIndex = output.indexOf(',', startIndex) !== -1 ? output.indexOf(',', startIndex) : output.indexOf('}', startIndex);
                                        var valid = output.substring(startIndex, endIndex).trim();
                                        if (valid === 'true') {
                                            resolve(true);
                                        }
                                        else if (valid === 'false') {
                                            resolve(false);
                                        }
                                        else {
                                            reject(new Error('No se pudo determinar si la dirección es válida'));
                                        }
                                    }
                                }
                                else {
                                    reject(new Error('No se pudo encontrar el campo "isvalid" en la salida'));
                                }
                            }
                        });
                    })];
            });
        });
    };
    return raptoreumCoreAccess;
}());
exports.raptoreumCoreAccess = raptoreumCoreAccess;
