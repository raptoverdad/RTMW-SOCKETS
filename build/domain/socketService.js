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
            var object, subject, user, result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("new connection");
                        console.log("object connection:", socket.handshake.query.object);
                        object = JSON.parse(socket.handshake.query.object);
                        subject = object.subject;
                        user = object.token;
                        if (!(subject == 'balance')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getUserInfo(user)];
                    case 1:
                        result = _a.sent();
                        if (result !== false) {
                            socket.emit("balance", result);
                        }
                        _a.label = 2;
                    case 2:
                        try {
                            //socket.on("agregarMision", async (json: any) => {  
                            //  console.log("llega socket agregar hora")
                            //  try {
                            //    let result=await (await this.gateway).insertMision(json)
                            //    console.log("result de agregar hora:", result )
                            //    if(result == true){
                            //      let misiones=await (await this.gateway).getMisiones()
                            //      this.io.sockets.emit("misiones",misiones)
                            //    }else{
                            //      socket.emit("ERROR-agregarHoras")
                            //    }  
                            //  } catch (error) {
                            //    console.log("error en agregar hora")
                            //    console.log(error)
                            //  }
                            //
                            //});
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
                        }
                        catch (e) {
                            console.log(e);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    }
    socketService.prototype.getUserInfo = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenValido, usuariofinal, address, balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, jwtFunctions_1.decodeToken)(token, testingconfig_1.CONFIG.JWT_SECRET)];
                    case 1:
                        tokenValido = _a.sent();
                        if (!(tokenValido != null)) return [3 /*break*/, 8];
                        usuariofinal = tokenValido.data;
                        return [4 /*yield*/, this.gateway];
                    case 2: return [4 /*yield*/, (_a.sent()).getUserAddress(usuariofinal)];
                    case 3:
                        address = _a.sent();
                        if (!(address == 'none')) return [3 /*break*/, 4];
                        console.log("address es none");
                        return [2 /*return*/, { address: address }];
                    case 4:
                        console.log("address no es none");
                        return [4 /*yield*/, this.raptoreumCore];
                    case 5: return [4 /*yield*/, (_a.sent()).getAccountBalance(address)];
                    case 6:
                        balance = _a.sent();
                        return [2 /*return*/, { balance: balance, address: address }];
                    case 7: return [3 /*break*/, 9];
                    case 8: return [2 /*return*/, false];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return socketService;
}());
exports.socketService = socketService;
