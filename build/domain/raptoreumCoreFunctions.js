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
    raptoreumCoreAccess.prototype.getAccountBalance = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var raptoreumAddress;
            return __generator(this, function (_a) {
                raptoreumAddress = account;
                exec("dir", { cwd: 'C:/Users/56947/projects' }, function (error, stdout, stderr) {
                    if (error) {
                        console.error("Error al retroceder el directorio: ".concat(error.message));
                        return;
                    }
                    if (stderr) {
                        console.error("Error en la salida est\u00E1ndar: ".concat(stderr));
                        return;
                    }
                    else {
                        console.log("Salida est\u00E1ndar del comando \"dir\":\n".concat(stdout));
                    }
                    // Listar archivos en el directorio actual  
                });
                return [2 /*return*/];
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
                                console.log(walletAddress);
                                resolve(stdout);
                            }
                        });
                    })];
            });
        });
    };
    return raptoreumCoreAccess;
}());
exports.raptoreumCoreAccess = raptoreumCoreAccess;
