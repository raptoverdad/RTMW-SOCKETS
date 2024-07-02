import { Server } from 'socket.io';
import { UserGateway } from '../dataaccess/gateway';
import { decodeToken } from './jwtFunctions';
import { raptoreumCoreAccess } from './raptoreumCoreFunctions';
import * as http from 'http';
import axios from 'axios'
const tokenExpresion = /^[a-zA-Z0-9._-]*$/;
const addressExpresion= /^[a-zA-Z0-9]*$/

class RateLimiter {
  private tokens: number;
  private capacity: number;
  private refillRate: number;
  private lastRefillTime: number;

  constructor(capacity: number, refillRate: number) {
    this.tokens = capacity;
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.lastRefillTime = Date.now();
  }

  public consume(amount: number, userId: string): boolean {
    this.refill();

    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }

    console.log(`Rate limit exceeded for user ${userId}`);
    return false;
  }

  private refill()
   {
    const now = Date.now();
    const elapsed = (now - this.lastRefillTime) / 1000;
    const refillAmount = Math.min(this.capacity - this.tokens, this.refillRate * elapsed);

    this.tokens += refillAmount;
    this.lastRefillTime = now;
  }
}

export class socketService {
    private gateway = UserGateway.getInstance();
    private raptoreumCore = raptoreumCoreAccess.getInstance();
    private io: Server;
    private rateLimiters: { [key: string]: RateLimiter } = {};
    constructor() {
        this.io = new Server(
            http.createServer().listen(3000),
            {
              cors: {
                origin: ["https://raptoreumworld.com"],
                methods: ["GET", "POST"],
                credentials: false,
              },
            }
          );
 this.io.on("connection", async (socket: any) => {
    const socketId = socket.id;

    if (!this.rateLimiters[socketId]) {
      this.rateLimiters[socketId] = new RateLimiter(1, 1 / 3);
    }
    socket.on('disconnect', () => {
      delete this.rateLimiters[socketId];
    });
    console.log("new connection");
    console.log("object connection:", socket.handshake.query.object);
    const object: any = JSON.parse(socket.handshake.query.object);
    let subject: string = object.subject.trim();
    let user: string = object.token;
    console.log("conectado en", " ", 3000);
    if (!this.rateLimiters[socketId]) {
      this.rateLimiters[socketId] = new RateLimiter(1, 1 / 3);
    }
    socket.on('disconnect', () => {
      delete this.rateLimiters[socketId];
    });
    console.log("new connection");
    console.log("object connection:", socket.handshake.query.object);

    if (subject === "assetsmarket" || subject === "nftmarket") {
        await this.handleMarket(subject, socket, socketId, user);
    }
// Main event handler
 socket.on('compra', async (data: { token: string; ventaId: string; cantidad: number; }) => {
    if (tokenExpresion.test(data.token) && typeof (data.cantidad) == "number" && data.cantidad > 0) {
        let tokenValido = await decodeToken(data.token);
        let result = await this.getRaptoreumdHealth();
        if (result == "error" || result == "dead") {
            return this.handleError(socket, "serverDown", "Server is down");
        }

        if (!this.rateLimiters[socketId].consume(1, user)) { return; }
        console.log("La cadena es válida");

        let buyer = tokenValido.userid;
        let accountBlocked = await (await this.gateway).verifyAccountBlocked(buyer);
        if (accountBlocked) {
            return this.handleError(socket, "blockAccount", "Account is blocked");
        }

        let [assetsEnVentaDelVendedor, nftEnVentaDelVendedor] = await Promise.all([
           await (await this.gateway).getMarketAssetsById(data.ventaId),
            await(await this.gateway).getMarketNFTsById(data.ventaId)
        ]);

        if (assetsEnVentaDelVendedor.length === 0 && nftEnVentaDelVendedor.length === 0) {
            return this.handleError(socket, "notSelling", "No assets or NFTs are being sold");
        }

        let itemEnVenta = assetsEnVentaDelVendedor.length > 0 ? assetsEnVentaDelVendedor[0] : nftEnVentaDelVendedor[0];
        let vendedor = await (await this.gateway).getVendedorDelToken(itemEnVenta._id);

        if (!vendedor) {
            return await this.handleError(socket, "notSelling", "Seller is not available");
        }

        let cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);
        if (cuentaBloqueadaVendedor) {
            return await this.handleError(socket, "notAvailable", "Seller's account is blocked");
        }

        let [balanceOfVendedor, raptoreumBalanceOfVendedor, balanceOfBuyer,resultGetAssetBalanceOfComprador] = await Promise.all([
           await (await this.raptoreumCore).getUserAssets(vendedor.sellerAddress),
           await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId),
           await (await this.raptoreumCore).getAccountBalance(buyer),
           await (await this.raptoreumCore).getUserAssets(tokenValido.address),
        ]);
        let insertarVentaVendedor:any
        let insertarCompraComprador:any
 
      
        let isRWS = resultGetAssetBalanceOfComprador.find((i:any) => i.asset === "RAPTOREUMWORLDCOIN");
        let raptoreumNecesario=itemEnVenta.price*data.cantidad
        if(!raptoreumNecesario)    return this.handleError(socket, "notAvailable", "no se pudo conseguir precio del asset");
        if ( balanceOfVendedor >= data.cantidad ) {
            if(!isRWS){
                if (balanceOfBuyer < (raptoreumNecesario + 10)){
                return this.handleError(socket, "buyerNotEnoughRaptoreum", "Buyer does not have enough Raptoreum");
                }
            }else if(isRWS){
                if (balanceOfBuyer < raptoreumNecesario){
                    return this.handleError(socket, "buyerNotEnoughRaptoreum", "Buyer does not have enough Raptoreum");
                }
            }

            let blocked = await this.blockOrUnblockTransactions(await this.gateway, [vendedor.vendedorId, buyer], true);
            if (!blocked) {
                return this.handleError(socket, 'couldNotConnect', 'Could not block transactions');
            }
            let pendiente=false
            if (raptoreumBalanceOfVendedor < 0.00002) {
                let retiroCajaChica = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                if (!retiroCajaChica) {
                    return this.handleError(socket, "errorDeCompra", "Error in small cash withdrawal");
                }
                pendiente=true
                socket.emit("compraPendiente");
            }
            try {
                let { raptoreumWithdraw, tokenWithdraw } = await this.handleWithdrawals(this.raptoreumCore, buyer, vendedor.sellerAddress, raptoreumNecesario, vendedor.vendedorId, tokenValido.address, data.cantidad, itemEnVenta.asset);
                if (raptoreumWithdraw && tokenWithdraw) {
                    let [updateBuyer, updateSeller] = await Promise.all([
                   await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", tokenWithdraw),
                   await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", raptoreumWithdraw)
                    ]);
                  
                    if(!pendiente)socket.emit("compraExitosa", { asset: itemEnVenta.asset, cantidad: data.cantidad });
                  
                    let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getUserAssets(vendedor.sellerAddress);
                    let findAssetBalance = resultGetBalanceOfVendedor.find((i:any) => i.asset===itemEnVenta.asset);
                    this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: findAssetBalance.balance });
                    await this.blockOrUnblockTransactions(await this.gateway, [buyer, vendedor.vendedorId], false);
                    if(!isRWS){
                        await this.raptoreumWorldStockInvestorsMoney(buyer, 0.32, "tokenSold");
                  await (await this.raptoreumCore).withdrawRaptoreum(vendedor.vendedorId,  tokenValido.address, 1.99);
                    }
             
                 
                } else if(raptoreumWithdraw && !tokenWithdraw){
                    let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                    let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                    let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");                         
                    await new Promise(resolve => setTimeout(resolve, 20000));
                    this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,raptoreumNecesario,itemEnVenta.asset,insertarCompraComprador,insertarVentaVendedor);       
                } else if(!raptoreumWithdraw && tokenWithdraw){
                    let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, itemEnVenta.asset, data.cantidad);
                    let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial",tokenValido.address, 0.00009);
                    let resultunBlockvendedor = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                    await new Promise(resolve => setTimeout(resolve, 20000));                        
                    this.intentarRetiradaDeEmergenciaDeToken(buyer,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,data.cantidad,itemEnVenta.asset,insertarCompraComprador,insertarVentaVendedor);
                }
            } catch (error) {
                return this.handleError(socket, "errorDeCompra", "Purchase error");
            }
        } else if (balanceOfVendedor < data.cantidad) {
            return this.handleError(socket, "sellerNotEnoughTokens", "Seller does not have enough tokens");
        } 
    }
});


 })

}
public async handleMarket(subject:any, socket:any, socketId:any, user:any) {
    let health = await this.getRaptoreumdHealth();
    if (health === "error") {
        return;
    } else if (health === "dead") {
        return socket.emit("serverDown");
    }
    if (!this.rateLimiters[socketId].consume(1, user)) {
        return;
    }

    console.log(`get ${subject} disparada`);

    try {
        let marketAssets;
        if (subject === "assetsmarket") {
            marketAssets = await (await this.gateway).getMarketAssets();
        } else if (subject === "nftmarket") {
            marketAssets = await (await this.gateway).getMarketNFTs();
        } else {
            throw new Error(`Unknown subject: ${subject}`);
        }

        // Mapear las promesas de balance y esperar a que todas se resuelvan
        const balancePromises = await Promise.all(marketAssets.map(async (e) => {
            let orden = e._id;
            let vendedor;
            if (subject === "assetsmarket") {
                vendedor = await (await this.gateway).getVendedorDelToken(orden);
            } else if (subject === "nftmarket") {
                vendedor = await (await this.gateway).getVendedorDelNFT(orden);
            }

            let balance = await (await this.raptoreumCore).getUserAssets(vendedor.sellerAddress);
            console.log(`paso 1 consolear balance obtenido en el mapeo de marketAssets:`, balance);

            if (balance >= 1) {
                console.log(`paso 2 el balance es mayor a 1, asignando balance al elemento`);
                e.balance = balance;
                return e;
            } else if (balance < 1) {
                try {
                    console.log(`paso 2 el balance es menor a 1, detenemos la venta del ${subject}`);
                    let resultDetenerVenta = await (await this.gateway).detenerVenta(vendedor.vendedorId, orden, subject === "assetsmarket" ? "asset" : "nft");
                    if (resultDetenerVenta) {
                        this.io.sockets.emit("ventaDetenida", orden);
                    }
                    console.log(`RESULT DETENER VENTA:`, resultDetenerVenta);
                    console.log("venta detenida");
                } catch (e) {
                    console.log(`ERROR EN GET${subject.toUpperCase()}`, e);
                } finally {
                    return undefined;
                }
            }
        }));

        // Filtrar los elementos que no son undefined
        const filteredAssets = balancePromises.filter(asset => asset !== undefined);
        socket.emit(subject, filteredAssets);
    } catch (e) {
        console.log(`ERROR NO CENTRALIZADO EN IF DE BALANCE MAYOR A 1:`, e);
    }
}
public async raptoreumWorldStockInvestorsMoney(comprador: string, rtmAenviar: number, transactionType: string) {
    let result: any = await (await this.raptoreumCore).listCoinholders('RAPTOREUMWORLDCOIN');
    if (result!=="listCoinHoldersError" && result.lenght >0) {
      let envios = 0;
      const assetPromises = result.map(async (ITEM: any) => {
        let resultGetBalance = await (await this.raptoreumCore).getUserAssets(ITEM.address);
        let resultGetBalanceOfToken=resultGetBalance.find((i:any) => i.asset === "RAPTOREUMWORLDCOIN");
        if (resultGetBalanceOfToken && resultGetBalanceOfToken.balance != 0 && resultGetBalanceOfToken.balance > 0) {
          let partes = resultGetBalanceOfToken;
      
          let withdraw = await (await this.raptoreumCore).withdrawRaptoreum(comprador, ITEM.address, partes * rtmAenviar);
          if (withdraw) {
            envios += partes;
            (await this.gateway).raptoreumWorldStockTransaction(result.userid, partes * rtmAenviar, transactionType);
          }

        }
      });
      const resolvedAssets = await Promise.all(assetPromises);
      return envios;
    }else{
      return false
    }
  }
  private async   handleError(socket:any, event:string, message:string) {
    console.log(message);
    socket.emit(event);
}
private async blockOrUnblockTransactions(gateway:UserGateway, users:any, block = true) {
    const action = block ? "block" : "unblock";
    for (const user of users) {
        const result = await gateway.blockOrUnblockUserTransactions(user, action);
        if (!result) {
            await gateway.blockOrUnblockUserTransactions(user, block ? "unblock" : "block");
            return false;
        }
    }
    return true;
}
private async getRaptoreumdHealth(){
    let result =await axios.get('http://localhost:3009')
    if(result.status==200){
      if(result.data == "alive"){
         return "alive"
      }else if(result.data=="dead"){
       return "dead"
       }else{
       return "error"
       }
    }else{
     return "error"
    }
 }
 public async handleWithdrawals(raptoreumCore:any, buyer:any, sellerAddress:any, raptoreumAmount:any, sellerId:any, tokenAddress:any, tokenAmount:any, asset:any) {
    let raptoreumWithdraw = await raptoreumCore.withdrawRaptoreum(buyer, sellerAddress, raptoreumAmount);
    let tokenWithdraw = await raptoreumCore.withdrawToken(sellerId, tokenAddress, tokenAmount, asset);
    return { raptoreumWithdraw, tokenWithdraw };
}
 private async intentarRetiradaDeEmergenciaDeRaptoreum (
    comprador: string,
    transaccionPending: string,
    addressComprador: string,
    addressVendedor: string,
    idVendedor: string,
    raptoreumDebt: number,
    assetName: string,
    idVentaComprador: string,
    idVentaVendedor: string
  ) {
    let intentos = 0;
  
    const intentar = async () => {
      let isPending = await (await this.gateway).getTransaccionPendiente(transaccionPending);
  
      if (isPending === true) {
        
          let retirarDeEmergenciaDelVendedor = await (await this.raptoreumCore).withdrawRaptoreum(idVendedor, addressComprador, raptoreumDebt);
  
          if (retirarDeEmergenciaDelVendedor) {
            await Promise.all([
              (await this.gateway).transaccionPendienteOut(transaccionPending),
              (await this.gateway).updateCompraOventa(idVentaComprador, "REJECTED", "none"),
              (await this.gateway).updateCompraOventa(idVentaVendedor, "REJECTED", "none"),
              (await this.gateway).blockOrUnblockUserTransactions(comprador, "unblock"),
              (await this.gateway).blockOrUnblockUserTransactions(idVendedor, "unblock")
            ]);
          } else {
            if (intentos < 5) {
              intentos++;
              setTimeout(intentar, 5000);
            } else {
              await Promise.all([
                (await this.gateway).updateCompraOventa(idVentaComprador, "REJECTED", "none"),
                (await this.gateway).updateCompraOventa(idVentaVendedor, "REJECTED", "none"),
                (await this.gateway).addWrongTransaction(comprador, addressComprador, addressVendedor, idVendedor, assetName, raptoreumDebt)
              ]);
            }
          }
      
      } else if (isPending === false) {
        return;
      } else if (isPending === "error") {
        setTimeout(intentar, 5000);
      }
    };
  
    setTimeout(intentar, 5000);
  }
  private async intentarRetiradaDeEmergenciaDeToken(comprador: string, transaccionPending: string, addressComprador: string, addressVendedor: string, idVendedor: string, assetDebt: number, assetName: string, idVentaComprador: string, idVentaVendedor: string) {
    let intentos = 0;
  
    const intentar = async () => {
      let isPending = await (await this.gateway).getTransaccionPendiente(transaccionPending);
  
      if (isPending === true) {
   
          let retirarDeEmergenciaDelCliente = await (await this.raptoreumCore).withdrawToken(comprador, addressVendedor, assetDebt, assetName);
  
          if (retirarDeEmergenciaDelCliente) {
            await Promise.all([
              (await this.gateway).transaccionPendienteOut(transaccionPending),
              (await this.gateway).updateCompraOventa(idVentaComprador, "REJECTED", "none"),
              (await this.gateway).updateCompraOventa(idVentaVendedor, "REJECTED", "none"),
              (await this.gateway).blockOrUnblockUserTransactions(comprador, "unblock"),
              (await this.gateway).blockOrUnblockUserTransactions(idVendedor, "unblock")
            ]);
          } else {
            if (intentos < 5) {
              intentos++;
              setTimeout(intentar, 5000);
            } else {
              await Promise.all([
                (await this.gateway).updateCompraOventa(idVentaComprador, "REJECTED", "none"),
                (await this.gateway).updateCompraOventa(idVentaVendedor, "REJECTED", "none"),
                (await this.gateway).addWrongTransaction(comprador, addressComprador, addressVendedor, idVendedor, assetName, assetDebt)
              ]);
            }
          }
     
      } else if (isPending === false) {
        return;
      } else if (isPending === "error") {
        setTimeout(intentar, 5000);
      }
    };
  
    setTimeout(intentar, 5000);
  }
}
