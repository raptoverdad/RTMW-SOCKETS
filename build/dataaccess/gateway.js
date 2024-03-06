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
var testingconfig_1 = require("../config/testingconfig");
var jwtFunctions_1 = require("../domain/jwtFunctions");
var UserGateway = /** @class */ (function () {
    function UserGateway() {
        this.pool = null;
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
    UserGateway.prototype.anularHora = function (hora, usuario) {
        return __awaiter(this, void 0, void 0, function () {
            var success, anularHora, valoresDeAnulacion, resultado, affectedRows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        success = false;
                        anularHora = "DELETE FROM horas WHERE hora = ? AND usuario = ?";
                        valoresDeAnulacion = [hora, usuario];
                        if (!(this.pool != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pool.execute(anularHora, valoresDeAnulacion)];
                    case 1:
                        resultado = _a.sent();
                        if (Array.isArray(resultado)) {
                            affectedRows = resultado[0].affectedRows;
                            if (affectedRows !== undefined && affectedRows > 0) {
                                success = true;
                            }
                            else {
                                success = false;
                            }
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/, success];
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
    UserGateway.prototype.getPersonas = function () {
        return __awaiter(this, void 0, void 0, function () {
            var getVotesQuery, result, newArray_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        getVotesQuery = "SELECT * FROM misiones";
                        if (!!this.pool) return [3 /*break*/, 1];
                        throw new Error('No se pudo conectar a la base de datos');
                    case 1: return [4 /*yield*/, this.pool.execute(getVotesQuery)];
                    case 2:
                        result = (_a.sent())[0];
                        if (Array.isArray(result)) {
                            if (result.length == 0 || result == undefined) {
                                return [2 /*return*/, "no misiones"];
                            }
                            else if (result.length > 0) {
                                newArray_1 = [];
                                result.forEach(function (i) {
                                    newArray_1.push(i);
                                });
                                return [2 /*return*/, newArray_1];
                            }
                            else {
                                return [2 /*return*/, "no misiones"];
                            }
                        }
                        else {
                            return [2 /*return*/, "no misiones"];
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.aceptarRecahazarMision = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var updateMisionesQuery, usuariodecodificado, updateMisionesValues, updateHoraResult, _a, result, fields, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        updateMisionesQuery = '';
                        if (data.type == 'accept') {
                            updateMisionesQuery = "UPDATE misiones SET estado = 'aceptada' WHERE usuario = ? AND descripcion = ?";
                        }
                        else if (data.type == 'reject') {
                            updateMisionesQuery = "UPDATE misiones SET estado = 'rechazada' WHERE usuario = ? AND descripcion = ?";
                        }
                        return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(data.token, testingconfig_1.CONFIG.JWT_SECRET)];
                    case 1:
                        usuariodecodificado = _b.sent();
                        updateMisionesValues = [usuariodecodificado, data.descripcion];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, , 8]);
                        if (!(this.pool != null)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.pool];
                    case 3: return [4 /*yield*/, (_b.sent()).execute(updateMisionesQuery, updateMisionesValues)];
                    case 4:
                        _a = _b.sent(), result = _a[0], fields = _a[1];
                        if (result && 'affectedRows' in result) {
                            updateHoraResult = result;
                            if (updateHoraResult.affectedRows < 0) {
                                return [2 /*return*/, true];
                            }
                            else {
                                return [2 /*return*/, false];
                            }
                        }
                        else {
                            return [2 /*return*/, false];
                        }
                        return [3 /*break*/, 6];
                    case 5: return [2 /*return*/, false];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    UserGateway.prototype.setupDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connected, _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        connected = false;
                        _b.label = 1;
                    case 1:
                        if (!!connected) return [3 /*break*/, 7];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 6]);
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
                        connected = true; // Establecemos la conexión con éxito
                        return [3 /*break*/, 6];
                    case 4:
                        error_2 = _b.sent();
                        console.log("ERRORRRRRR");
                        connected = false;
                        console.error("Error al conectar a la base de datos:", error_2);
                        // Esperamos antes de intentar nuevamente
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 5:
                        // Esperamos antes de intentar nuevamente
                        _b.sent(); // Puedes ajustar el tiempo de espera según tus necesidades
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return UserGateway;
}());
exports.UserGateway = UserGateway;
