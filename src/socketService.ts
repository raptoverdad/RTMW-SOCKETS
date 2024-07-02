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
  private key: string;

  private rateLimiters: { [key: string]: RateLimiter } = {};

  constructor() {
    this.key = "skrillex";
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
    
    console.log("conectado en", " ", 3000);

    this.io.use(async (sockete: any, next: any) => {
      let frontendKey = await sockete.handshake.query.key;
      if (frontendKey !== this.key) {
        throw new Error("invalid socket connection");
      } else {
        next();
      }
    });
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
      // Convierte la cadena nuevamente a un objeto
      const object: any = JSON.parse(socket.handshake.query.object);
      let subject: string = object.subject.trim();
      let user: string = object.token;
      if (subject == "assetsmarket") {
        let health=await this.getRaptoreumdHealth()
        if(health == "error"){
          return;
        }else if(health=="dead"){
         return socket.emit("serverDown")
        }
        if (!this.rateLimiters[socketId].consume(1, user)) {
          return;
        }
        console.log("get market assets disparada");

        try {
          let marketAssets = await (await this.gateway).getMarketAssets();
    
          // Mapear las promesas de balance y esperar a que todas se resuelvan
          const balancePromises = await Promise.all(marketAssets.map(async (e: any) => {
            let orden = e._id;
            let vendedor = await (await this.gateway).getVendedorDelToken(orden);
            let balance = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, e.asset);
            console.log("paso 1 consolear balance obtenido en el mapeo de marketAssets:", balance);
    
            if (balance >= 1) {
              console.log("paso 2 el balance es mayor a 1, asignando balance al elemento");
              e.balance = balance;
              return e;
            } else if (balance < 1) {
              try {
                console.log("paso 2 el balance es menor a 1, detenemos la venta del asset");
                let resultDetenerVenta = await (await this.gateway).detenerVenta(vendedor.vendedorId, orden,"asset");
                if(resultDetenerVenta){
                  this.io.sockets.emit("ventaDetenida", orden);
                }
                console.log("RESULT DETENER VENTA:", resultDetenerVenta);
                console.log("venta detenida");
              } catch (e) {
                console.log("ERROR EN GETASSETSMARKET", e);
                return undefined;
              }
    
            }
          }));
    
          // Filtrar los elementos que no son undefined
          const filteredAssets = balancePromises.filter(asset => asset !== undefined);
          socket.emit("assetsmarket",filteredAssets)
          return
        } catch (e) {
          console.log("ERROR NO CENTRALIZADO EN IF DE BALANCE MAYOR A 1:", e);
        }
      }else if (subject == "nftmarket"){
        try{ 
        let healh=await this.getRaptoreumdHealth()
        if(healh == "error"){
          return;
        }else if(healh=="dead"){
         return socket.emit("serverDown")
        }
        if (!this.rateLimiters[socketId].consume(1, user)) {
          return;
        }
        let marketAssets = await (await this.gateway).getMarketNFTs();
        // Mapear las promesas de balance y esperar a que todas se resuelvan
        const balancePromises = await Promise.all(marketAssets.map(async (e: any) => {
          let orden = e._id;
          let vendedor = await (await this.gateway).getVendedorDelNFT(orden);
          let balance = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, e.asset);
          console.log("paso 1 consolear balance obtenido en el mapeo de marketAssets:", balance);
          if (balance >= 1) {
            console.log("paso 2 el balance es mayor a 1, asignando balance al elemento");
            e.balance = balance;
            return e;
          } else if (balance < 1) {
            try {
              console.log("paso 2 el balance es menor a 1, detenemos la venta del asset");
              let resultDetenerVenta = await (await this.gateway).detenerVenta(vendedor.vendedorId, orden,"nft");
              if(resultDetenerVenta){
                this.io.sockets.emit("ventaDetenida", orden);
              }
             
              console.log("venta detenida");
            } catch (e) {
              console.log("ERROR EN GETASSETSMARKET", e);
            } finally {
              return undefined;
            }
          }
        }));
        // Filtrar los elementos que no son undefined
       
          // Filtrar los elementos que no son undefined
          const filteredAssets = balancePromises.filter(asset => asset !== undefined);
          return socket.emit("nftmarket",filteredAssets)
      } catch (e) {
        console.log("ERROR NO CENTRALIZADO EN IF DE BALANCE MAYOR A 1:", e);
      }
      }

      socket.on('assetToMarket', async (data: any) => {
try{
        let healh=await this.getRaptoreumdHealth()
        if(healh == "error"){
          return;
        }else if(healh=="dead"){
         return socket.emit("serverDown")
        }
         if (tokenExpresion.test(data.token)) {
          let tokenValido = await decodeToken(data.token);
          if(tokenValido==="expired")return socket.emit("expired");
          if(tokenValido==="error")return
       
        if (!this.rateLimiters[socketId].consume(1, user)) {
          console.log("no puedes consumir mas llamados")
          return;
        }
        if (data.price && typeof (data.price) == "number" && data.price > 0) {
           let getAssetType=await (await this.raptoreumCore).getUserAssets(tokenValido.address)
           if(getAssetType !== "getUserAssetsError" && getAssetType.length >0){
                let foundAsset = getAssetType.find((i:any) => i.asset===itemEnVenta.asset);
           if(!foundAsset)return 
            let result = await this.assetToMarket(data.asset , data.price,foundAsset.type);
            if (result)
            {
              socket.emit("successAssetToMarket", result);
              this.io.sockets.emit("newAssetInMarket", result);
              return;
            }
           }
        } else {
   return       socket.emit("notValidPrice");
        }

        }
 } catch (e) {
console.log("assetToMarketError:",e)
return      socket.emit("assetToMarketError", e);

          }

      });
                //vas acá
socket.on('detenerVenta', async (data: { token: string; asset: string; ventaId: string;}) => {
        if (!this.rateLimiters[socketId].consume(1, user)) {
          return;
        }
        let healh=await this.getRaptoreumdHealth()
        if(healh == "error"){
          return;
        }else if(healh=="dead"){
         return socket.emit("serverDown")
        }     
        console.log("DATA QUE LLEGA PARA DETENER VENTA:", data);
        if (tokenExpresion.test(data.token)) {
          let tokenValido = await decodeToken(data.token);
          if (tokenValido != "expired" && tokenValido != "error") {
            //sacar de las ordenes de los clientes si sierta orden está vinculada a su userid y si está se procede a eliminar la venta
            let usuario = tokenValido.userid;
            const encontrado = await (await this.gateway).verifyAccountBlocked(usuario);
            if (encontrado === false) {
              console.log("data con la que revisar token en venta por el usuario:", data);
              const NFTenVentaPorElUsuario = await (await this.gateway).verifyNftEnVenta(data.asset, usuario, data.ventaId);
              const enVentaPorElUsuario = await (await this.gateway).verifyTokenEnVenta(data.asset, usuario, data.ventaId);
              if (enVentaPorElUsuario && !NFTenVentaPorElUsuario) {
                let resultDetenerVenta = await (await this.gateway).detenerVenta(usuario, data.ventaId,"asset");
                if (resultDetenerVenta) {
                  //enviar el id de la venta y removerlo del market assets en el front
                   socket.emit("ventaUsuarioDetenida", data.ventaId);
                    return this.io.sockets.emit("ventaDetenida", data.ventaId);
                } else {
                 return    socket.emit("errorStoppingSell");
                }
              }   if (!enVentaPorElUsuario && NFTenVentaPorElUsuario) {
                let resultDetenerVenta = await (await this.gateway).detenerVenta(usuario, data.ventaId,"nft");
                if (resultDetenerVenta) {
                  //enviar el id de la venta y removerlo del market assets en el front
                   socket.emit("ventaUsuarioDetenida", data.ventaId);
                    return this.io.sockets.emit("ventaDetenida", data.ventaId);
                } else {
                 return    socket.emit("errorStoppingSell");
                }
               } else if (!enVentaPorElUsuario && NFTenVentaPorElUsuario){ 
                console.log("EMITIENDO NOT SELLING Y CONSOLEANDO ENVENTAPORELUSUARIO:", enVentaPorElUsuario);
             return  socket.emit("notSelling");
              }
            }
          } else if (tokenValido == "expired") {
            return socket.emit("expired");
          }
        }  
        return
   
      });
      //que ninguna compra con nft puede usar el parametro cantidad para poder comprar. siempre se puede comprar solo 1
      socket.on('compra', async (data: { token: string; ventaId: string; cantidad: number;}) => {
        let tokenValido = await decodeToken(data.token);
        let result=await this.getRaptoreumdHealth()
        if(result == "error"){
          return;
        }else if(result=="dead"){
         return socket.emit("serverDown")
        }
        if (!this.rateLimiters[socketId].consume(1, user)){return;}

        if (tokenExpresion.test(data.token) && typeof (data.cantidad) == "number" && data.cantidad > 0) {
          console.log("La cadena es válida");
          let intentos=0
         

            let buyer: string = tokenValido.userid;
            const encontrado = await (await this.gateway).verifyAccountBlocked(buyer);
            if (encontrado === true) { console.log("encontrado en cuentas bloquedas");  socket.emit("blockAccount");return;

            }else if (encontrado === false) {
              console.log("encontrado false");
              let assetsEnVentaDelVendedor = await (await this.gateway).getMarketAssetsById(data.ventaId);
              let nftEnVentaDelVendedor = await (await this.gateway).getMarketNFTsById(data.ventaId) ;
              if (assetsEnVentaDelVendedor.length > 0 && nftEnVentaDelVendedor.length==0) {
                console.log("encontrado el asset del vendedor");
                let asset = assetsEnVentaDelVendedor[0];
                if (asset) {
                  console.log("el asset está en nuestras manos");
                  console.log(asset);
                  let vendedor = await (await this.gateway).getVendedorDelToken(asset._id);
                  if (vendedor) {
                    const cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);
                    if (cuentaBloqueadaVendedor === true) {
                         socket.emit("notAvailable");
                      return;
                    }        
                    console.log("encontramos al vendedor");
                    let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                    console.log("pasamos el get asset balance");
                    let resultGetRaptoreumBalanceOfVendedor = await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId);
                    console.log("pasamos el account balance");
                    let getBalanceOfBuyer = await (await this.raptoreumCore).getAccountBalance(buyer);
                    console.log("pasamos el account balance del buyer");
                    let resultGetAssetBalanceOfComprador = await (await this.raptoreumCore).getAssetBalance(tokenValido.address, asset.asset);
                    console.log("pasamos el token balance del buyer");
                    let isRWS = await this.isRaptoreumWorldStockHolder(vendedor.vendedorId);
                    let raptoreumNecesario = data.cantidad * asset.price;
                    console.log("RAPTOREUM NECESARIO:", raptoreumNecesario);
                    if (isRWS === false && resultGetBalanceOfVendedor >= data.cantidad && getBalanceOfBuyer >= (raptoreumNecesario + 1) ) {     
                      let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                      let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                      if (!resultBlockBuyer && resultBlockSeller) {
                        await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                        socket.emit('couldNotConnect');
                        return;
                      }
                      if (resultBlockBuyer && !resultBlockSeller) {
                        await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                        socket.emit('couldNotConnect');
                        return;
                      }
                      let insertarVentaVendedor = "";
                      let insertarCompraComprador = "";
                      if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                        
                    
                        let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                    
                        if (retirarDeCajaChicaPalVendedor) {
                          socket.emit("compraPendiente");
                           insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, data.cantidad, asset.assetpicture,"Asset");
                           insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, data.cantidad, asset.assetpicture,"Asset");
                        }     else if (!retirarDeCajaChicaPalVendedor) {
                          socket.emit("errorDeCompra");
                          return;
                        }
                        await new Promise(resolve => setTimeout(resolve, 10000));
                      }
               
                        try 
                        {                                          
                        
                            console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                            let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                            let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, data.cantidad, asset.asset);
                            if (retirar && retirarDelVendedor) {
                              let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                              let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);                         
                              socket.emit("compraExitosa", { asset: asset.asset, cantidad: data.cantidad });                           
                              let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                              this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                              let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                              let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                              await this.raptoreumWorldStockInvestorsMoney(buyer,0.078,"tokenSold") 
                              return
                              // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                            } else if (!retirar && retirarDelVendedor) { 
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, data.cantidad);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultunBlockvendedor = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                              await new Promise(resolve => setTimeout(resolve, 10000));                        
                              this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            } else if (!retirarDelVendedor && retirar) {
                             
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                           
                              await new Promise(resolve => setTimeout(resolve, 10000));
                              this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            }                   
                        } catch (error) {
                          socket.emit("errorDeCompra");
                        }
                   
                      
                    } else if (resultGetBalanceOfVendedor < data.cantidad) {
                      return socket.emit("sellerNotEnoughTokens");
                    } else if (isRWS === false && getBalanceOfBuyer < (raptoreumNecesario + 1)) {  
                      return socket.emit("buyerNotEnoughRaptoreum");
                    } else if (isRWS === true) {
                      let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                      let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                      if (!resultBlockBuyer && resultBlockSeller) {
                      await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                      socket.emit('couldNotConnect');
                      return;
                    }
                    if (resultBlockBuyer && !resultBlockSeller) {
                      await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                      socket.emit('couldNotConnect');
                      return;
                    }
                    let insertarVentaVendedor ="";
                    let insertarCompraComprador = "";
                      if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                      
                       let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                    
                       if (retirarDeCajaChicaPalVendedor) {
                         socket.emit("compraPendiente");
                          insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, data.cantidad, asset.assetpicture,"Asset");
                          insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, data.cantidad, asset.assetpicture,"Asset");
                       }     else if (!retirarDeCajaChicaPalVendedor) {
                         socket.emit("errorDeCompra");
                         return;
                       }
                       await new Promise(resolve => setTimeout(resolve, 10000));
                     }
              
                      
                       try {                        
                
                   
                        
     
                           
                            console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                            let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                            let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, data.cantidad, asset.asset);
                            if (retirar && retirarDelVendedor) {
                              let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                              let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);
                           
                              socket.emit("compraExitosa", { asset: asset.asset, cantidad: data.cantidad });
                            
                              let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                              this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                              let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                              let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");

                              // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                            } else if (!retirar && retirarDelVendedor) { //reintentamos retiro de rtm para enviarlo al vendedor
                            
                         
                              //aqui se revierte el pago hecho de el vendedor al comprador    
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, data.cantidad);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                              socket.emit("compraPendiente")
                              await new Promise(resolve => setTimeout(resolve, 10000));
                              this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,data.cantidad,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            } else if (!retirarDelVendedor && retirar) {
                             
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                              socket.emit("revirtiendoTransaccionVendedor",{cantidad:raptoreumNecesario});
                              await new Promise(resolve => setTimeout(resolve, 10000));
                              this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            }
                     
                        } catch (error) {
                          return socket.emit("errorDeCompra");
                        }
                    }

                  } else {
                    return socket.emit('notSelling');
                  }


                } else {
                  return socket.emit("notSelling");
                }
              //esto significa que es nft
              }else if(assetsEnVentaDelVendedor.length == 0 && nftEnVentaDelVendedor.length>0){
 
                console.log("encontrado el NFT del vendedor");
                let asset = nftEnVentaDelVendedor[0];
                if (asset) {
                  console.log("el NFT está en nuestras manos");
                  console.log(asset);
                  let vendedor = await (await this.gateway).getVendedorDelNFT(asset._id);
                  if (vendedor) {
                    const cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);
                    if (cuentaBloqueadaVendedor === true) {
                      socket.emit("notAvailable");
                      return;
                    }
                    let resultGetAssetBalanceOfComprador = await (await this.raptoreumCore).getAssetBalance(tokenValido.address, asset.asset);
                    console.log("encontramos al vendedor");
                    let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                    console.log("pasamos el get asset balance");
                    let resultGetRaptoreumBalanceOfVendedor = await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId);
                    console.log("pasamos el account balance");
                    let getBalanceOfBuyer = await (await this.raptoreumCore).getAccountBalance(buyer);
                    console.log("pasamos el account balance del buyer");
                    let getTokenBalanceOfBuyer = await (await this.raptoreumCore).getAssetBalance(tokenValido.address, asset.asset);
                    console.log("pasamos el token balance del buyer");
                    let isRWS = await this.isRaptoreumWorldStockHolder(vendedor.vendedorId);
                    let raptoreumNecesario =asset.price;
                    console.log("RAPTOREUM NECESARIO:", raptoreumNecesario);

                    if (isRWS === false && resultGetBalanceOfVendedor == 1 && getBalanceOfBuyer >= (raptoreumNecesario + 1) ) {    
                      let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                      let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                      if (!resultBlockBuyer && resultBlockSeller) {
                        await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                        socket.emit('couldNotConnect');
                        return;
                      }
                      if (resultBlockBuyer && !resultBlockSeller) {
                        await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                        socket.emit('couldNotConnect');
                        return;
                      }
                      let insertarVentaVendedor = "";
                      let insertarCompraComprador = "";
                      if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                        
                    
                        let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                     
                        if (retirarDeCajaChicaPalVendedor) {
                          socket.emit("compraPendiente");
                           insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, 1, asset.assetpicture,"NFT");
                           insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, 1, asset.assetpicture,"NFT"); 
                        }     else if (!retirarDeCajaChicaPalVendedor) {
                          socket.emit("errorDeCompra");
                          return;
                        }
                        await new Promise(resolve => setTimeout(resolve, 10000));
                      }
               
                

                        try 
                        {
                          socket.emit("compraPendiente", { asset: asset.asset, cantidad: 1 });                                           
                         
                            console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                            let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                            let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, 1, asset.asset);
                            if (retirar && retirarDelVendedor) {
                              let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                              let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);                         
                              socket.emit("compraExitosa", { asset: asset.asset, cantidad: 1 });                           
                              let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                              this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                              let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                              let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                              await this.raptoreumWorldStockInvestorsMoney(buyer,0.078,"nftSold") 
                              // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                            } else if (!retirar && retirarDelVendedor) { //reintentamos retiro de rtm para enviarlo al vendedor                            
                        
                       
                              //la transaccion pendiente debe insertarse al principio y ser eliminadas una vez se termine el proceso de compra
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, 1);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                              await new Promise(resolve => setTimeout(resolve, 10000));

                              this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            } else if (!retirarDelVendedor && retirar) {
                            
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                          
                              await new Promise(resolve => setTimeout(resolve, 10000));

                              this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            }
                     
                        } catch (error) {
                          console.log(error)
            
                        }
                      

                  
                      return socket.emit("sellerNotEnoughTokens");
                    } else if (isRWS === false && getBalanceOfBuyer < (raptoreumNecesario + 1)) {
                      return socket.emit("buyerNotEnoughRaptoreum");
                    } else if (isRWS === true) {

                       try {                        
                        let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                        let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                        if (!resultBlockBuyer && resultBlockSeller) {
                          await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          socket.emit('couldNotConnect');
                          return;
                        }
                        if (resultBlockBuyer && !resultBlockSeller) {
                          await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                          socket.emit('couldNotConnect');
                          return;
                        }
                        let insertarVentaVendedor = "";
                        let insertarCompraComprador = "";
                        if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                        
                    
                          let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                    
                          if (retirarDeCajaChicaPalVendedor) {
                            socket.emit("compraPendiente");
                             insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, data.cantidad, asset.assetpicture,"Asset");
                             insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, data.cantidad, asset.assetpicture,"Asset");
                          }     else if (!retirarDeCajaChicaPalVendedor) {
                            socket.emit("errorDeCompra");
                            return;
                          }
                          await new Promise(resolve => setTimeout(resolve, 10000));
                        }
                  
                            console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                            let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                            let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, 1, asset.asset);
                            if (retirar && retirarDelVendedor) {
                              let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                              let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);
                           
                              socket.emit("compraExitosa", { asset: asset.asset, cantidad: data.cantidad });
                            
                              let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                              this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                              let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                              let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");

                              // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                            } else if (!retirar && retirarDelVendedor) { //reintentamos retiro de rtm para enviarlo al vendedor
                            
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, 1);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                         
                              await new Promise(resolve => setTimeout(resolve, 10000));

                       
                              this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);

                              //seguir revision desde aqui a abajo
                            } else if (!retirarDelVendedor && retirar) {
                            
                              let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                              let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                              let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
              
                              await new Promise(resolve => setTimeout(resolve, 10000));
                              this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                            }
                     
                        } catch (error) {
                        return  socket.emit("errorDeCompra");
                        }
                    }

                  } else {
                  return  socket.emit('notSelling');
                  }


                } else {
                return  socket.emit("notSelling");
                }

              }

            }

        

     } });

     socket.on('compraDiscord', async (data: { token: string;}) => {

      if (!this.rateLimiters[socketId].consume(1, user)){return;}
  
      if (tokenExpresion.test(data.token) ) {
        let tokenValido = await decodeToken(data.token);
        if(tokenValido=="error")return
        if(tokenValido=="expired")return
        
        console.log("La cadena es válida");
        let intentos=0
       

          let buyer: string = tokenValido.usuario;
          //obtener address del comprador
          tokenValido.address=  await (await this.gateway).getUserAddress(buyer);
          if(tokenValido.address=="error")return socket.emit("errorDeCompra",{comprador:buyer})
            if(tokenValido.address=="no address")return socket.emit("errorDeCompra",{comprador:buyer})
          const encontrado = await (await this.gateway).verifyAccountBlocked(buyer);
          let result=await this.getRaptoreumdHealth()
          if(result == "error"){
            return socket.emit("serverDown",{comprador:tokenValido.usuario})
          }else if(result=="dead"){
           return socket.emit("serverDown",{comprador:tokenValido.usuario})
          }
          if (encontrado === true) 
            {
            console.log("encontrado en cuentas bloquedas");
            socket.emit("blockAccount",{comprador:buyer});
            return;
        }else if (encontrado === false) {
          console.log("encontrado false");
          let assetsEnVentaDelVendedor = await (await this.gateway).getMarketAssetsById(tokenValido.ventaId);
          let nftEnVentaDelVendedor = await (await this.gateway).getMarketNFTsById(tokenValido.ventaId) ;
          if (assetsEnVentaDelVendedor.length > 0 && nftEnVentaDelVendedor.length==0) {
            console.log("encontrado el asset del vendedor");
            let asset = assetsEnVentaDelVendedor[0];
            if (asset) {
              console.log("el asset está en nuestras manos");
              console.log(asset);
              let vendedor = await (await this.gateway).getVendedorDelToken(asset._id);
              if (vendedor) {
                const cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);
                if (cuentaBloqueadaVendedor === true) {
                     socket.emit("notAvailable",{comprador:buyer});
                  return;
                }        
                console.log("encontramos al vendedor");
                let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                console.log("pasamos el get asset balance");
                let resultGetRaptoreumBalanceOfVendedor = await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId);
                console.log("pasamos el account balance");
                let getBalanceOfBuyer = await (await this.raptoreumCore).getAccountBalance(buyer);
                console.log("pasamos el account balance del buyer");
                let resultGetAssetBalanceOfComprador = await (await this.raptoreumCore).getAssetBalance(tokenValido.address, asset.asset);
                console.log("pasamos el token balance del buyer");
                let isRWS = await this.isRaptoreumWorldStockHolder(vendedor.vendedorId);
                let raptoreumNecesario = tokenValido.cantidad * asset.price;
                console.log("RAPTOREUM NECESARIO:", raptoreumNecesario);
                if (isRWS === false && resultGetBalanceOfVendedor >= tokenValido.cantidad && getBalanceOfBuyer >= (raptoreumNecesario + 1) ) {     
                  let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                  let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                  if (!resultBlockBuyer && resultBlockSeller) {
                    await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                    socket.emit('couldNotConnect',{comprador:buyer});
                    return;
                  }
                  if (resultBlockBuyer && !resultBlockSeller) {
                    await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                    socket.emit('couldNotConnect',{comprador:buyer});
                    return;
                  }
                  let insertarVentaVendedor = "";
                  let insertarCompraComprador = "";
                  if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                    
                
                    let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                
                    if (retirarDeCajaChicaPalVendedor) {
                      socket.emit("compraPendiente",{comprador:buyer});
                       insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, tokenValido.cantidad, asset.assetpicture,"Asset");
                       insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, tokenValido.cantidad, asset.assetpicture,"Asset");
                    }     else if (!retirarDeCajaChicaPalVendedor) {
                      socket.emit("errorDeCompra",{comprador:buyer});
                      return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 10000));
                  }
           
                    try 
                    {                                          
                    
                        console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                        let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                        let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, tokenValido.cantidad, asset.asset);
                        if (retirar && retirarDelVendedor) {
                          let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                          let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);                         
                          socket.emit("compraExitosa",{comprador:buyer});                           
                          let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                          this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                          let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                          let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          await this.raptoreumWorldStockInvestorsMoney(buyer,0.078,"tokenSold") 
                          return
                          // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                        } else if (!retirar && retirarDelVendedor) { 
                          socket.emit("revirtiendoAvendedor",{comprador:buyer});
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, tokenValido.cantidad);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultunBlockvendedor = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          await new Promise(resolve => setTimeout(resolve, 10000));                        
                          this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        } else if (!retirarDelVendedor && retirar) {
                          socket.emit("revirtiendoAcomprador",{comprador:buyer});
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                       
                          await new Promise(resolve => setTimeout(resolve, 10000));
                          this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        }                   
                    } catch (error) {
                      socket.emit("errorDeCompra",{comprador:buyer});
                    }
               
                  
                } else if (resultGetBalanceOfVendedor < tokenValido.cantidad) {
                  return socket.emit("sellerNotEnoughTokens",{comprador:buyer});
                } else if (isRWS === false && getBalanceOfBuyer < (raptoreumNecesario + 1)) {  
                  return socket.emit("buyerNotEnoughRaptoreum",{comprador:buyer});
                } else if (isRWS === true) {
                  let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                  let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                  if (!resultBlockBuyer && resultBlockSeller) {
                  await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                  socket.emit('couldNotConnect',{comprador:buyer});
                  return;
                }
                if (resultBlockBuyer && !resultBlockSeller) {
                  await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                  socket.emit('couldNotConnect',{comprador:buyer});
                  return;
                }
                let insertarVentaVendedor ="";
                let insertarCompraComprador = "";
                  if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                  
                   let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                
                   if (retirarDeCajaChicaPalVendedor) {
                     socket.emit("compraPendiente",{comprador:buyer});
                      insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, tokenValido.cantidad, asset.assetpicture,"Asset");
                      insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, tokenValido.cantidad, asset.assetpicture,"Asset");
                   }     else if (!retirarDeCajaChicaPalVendedor) {
                     socket.emit("errorDeCompra",{comprador:buyer});
                     return;
                   }
                   await new Promise(resolve => setTimeout(resolve, 10000));
                 }
          
                  
                   try {                        
            
               
                    
 
                       
                        console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                        let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                        let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, tokenValido.cantidad, asset.asset);
                        if (retirar && retirarDelVendedor) {
                          let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                          let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);
                       
                          socket.emit("compraExitosa",{comprador:buyer});
                        
                          let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                          this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                          let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                          let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");

                          // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                        } else if (!retirar && retirarDelVendedor) { //reintentamos retiro de rtm para enviarlo al vendedor                    
                          socket.emit("revirtiendoAvendedor",{comprador:buyer});
                          //aqui se revierte el pago hecho de el vendedor al comprador    
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, tokenValido.cantidad);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          socket.emit("compraPendiente",{comprador:buyer})
                          await new Promise(resolve => setTimeout(resolve, 10000));
                          this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,tokenValido.cantidad,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        } else if (!retirarDelVendedor && retirar) {
                           socket.emit("revirtiendoAcomprador",{comprador:buyer});
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
      
                          await new Promise(resolve => setTimeout(resolve, 10000));
                          this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        }
                 
                    } catch (error) {
                      return socket.emit("errorDeCompra",{comprador:buyer});
                    }
                }

              } else {
                return socket.emit('notSelling',{comprador:buyer});
              }


            } else {
              return socket.emit("notSelling",{comprador:buyer});
            }
          //esto significa que es nft
          }else if(assetsEnVentaDelVendedor.length == 0 && nftEnVentaDelVendedor.length>0){

            console.log("encontrado el NFT del vendedor");
            let asset = nftEnVentaDelVendedor[0];
            if (asset) {
              console.log("el NFT está en nuestras manos");
              console.log(asset);
              let vendedor = await (await this.gateway).getVendedorDelNFT(asset._id);
              if (vendedor) {
                const cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);
                if (cuentaBloqueadaVendedor === true) {
                  socket.emit("notAvailable",{comprador:buyer});
                  return;
                }
                let resultGetAssetBalanceOfComprador = await (await this.raptoreumCore).getAssetBalance(tokenValido.address, asset.asset);
                console.log("encontramos al vendedor");
                let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                console.log("pasamos el get asset balance");
                let resultGetRaptoreumBalanceOfVendedor = await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId);
                console.log("pasamos el account balance");
                let getBalanceOfBuyer = await (await this.raptoreumCore).getAccountBalance(buyer);
                let isRWS = await this.isRaptoreumWorldStockHolder(vendedor.vendedorId);
                let raptoreumNecesario =asset.price;
                console.log("RAPTOREUM NECESARIO:", raptoreumNecesario);

                if (isRWS === false && resultGetBalanceOfVendedor == 1 && getBalanceOfBuyer >= (raptoreumNecesario + 1) ) {    
                  let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                  let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                  if (!resultBlockBuyer && resultBlockSeller) {
                    await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                    socket.emit('couldNotConnect',{comprador:buyer});
                    return;
                  }
                  if (resultBlockBuyer && !resultBlockSeller) {
                    await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                    socket.emit('couldNotConnect',{comprador:buyer});
                    return;
                  }
                  let insertarVentaVendedor = "";
                  let insertarCompraComprador = "";
                  if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                    
                
                    let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                 
                    if (retirarDeCajaChicaPalVendedor) {
                      socket.emit("compraPendiente",{comprador:buyer});
                       insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, 1, asset.assetpicture,"NFT");
                       insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, 1, asset.assetpicture,"NFT"); 
                    }     else if (!retirarDeCajaChicaPalVendedor) {
                      socket.emit("errorDeCompra",{comprador:buyer});
                      return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 10000));
                  }
           
            

                    try 
                    {
                      socket.emit("compraPendiente", { comprador:buyer });                                           
                     
                        console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                        let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                        let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, 1, asset.asset);
                        if (retirar && retirarDelVendedor) {
                          let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                          let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);                         
                          socket.emit("compraExitosa", { comprador:buyer });                           
                          let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                          this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                          let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                          let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          await this.raptoreumWorldStockInvestorsMoney(buyer,0.078,"nftSold") 
                          // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                        } else if (!retirar && retirarDelVendedor) { //reintentamos retiro de rtm para enviarlo al vendedor                            
                          socket.emit("revirtiendoAvendedor",{comprador:buyer});
                   
                          //la transaccion pendiente debe insertarse al principio y ser eliminadas una vez se termine el proceso de compra
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, 1);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          await new Promise(resolve => setTimeout(resolve, 10000));

                          this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        } else if (!retirarDelVendedor && retirar) {
                          socket.emit("revirtiendoAcomprador",{comprador:buyer});
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                      
                          await new Promise(resolve => setTimeout(resolve, 10000));

                          this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        }
                 
                    } catch (error) {
                      console.log(error)
        
                    }
                  

              
                  return socket.emit("sellerNotEnoughTokens",{comprador:buyer});
                } else if (isRWS === false && getBalanceOfBuyer < (raptoreumNecesario + 1)) {
                  return socket.emit("buyerNotEnoughRaptoreum",{comprador:buyer});
                } else if (isRWS === true) {

                   try {                        
                    let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
                    let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block");
                    if (!resultBlockBuyer && resultBlockSeller) {
                      await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                      socket.emit('couldNotConnect',{comprador:buyer});
                      return;
                    }
                    if (resultBlockBuyer && !resultBlockSeller) {
                      await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                      socket.emit('couldNotConnect',{comprador:buyer});
                      return;
                    }
                    let insertarVentaVendedor = "";
                    let insertarCompraComprador = "";
                    if (resultGetRaptoreumBalanceOfVendedor < 0.00002) {
                    
                
                      let retirarDeCajaChicaPalVendedor = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                
                      if (retirarDeCajaChicaPalVendedor) {
                        socket.emit("compraPendiente",{comprador:buyer});
                         insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, asset.asset, tokenValido.cantidad, asset.assetpicture,"Asset");
                         insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, asset.asset, tokenValido.cantidad, asset.assetpicture,"Asset");
                      }     else if (!retirarDeCajaChicaPalVendedor) {
                        socket.emit("errorDeCompra",{comprador:buyer});
                        return;
                      }
                      await new Promise(resolve => setTimeout(resolve, 10000));
                    }
              
                        console.log("direccion a enviar RTM:", vendedor.sellerAddress);
                        let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario);
                        let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, 1, asset.asset);
                        if (retirar && retirarDelVendedor) {
                          let updateBuyer = await (await this.gateway).updateCompraOventa(insertarCompraComprador, "COMPLETED", retirarDelVendedor);
                          let updateSeller = await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "COMPLETED", retirar);          
                          socket.emit("compraExitosa", { asset: asset.asset, cantidad: tokenValido.cantidad });             
                          let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.sellerAddress, asset.asset);
                          this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance: resultGetBalanceOfVendedor });
                          let resultunBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                          let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                          // let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                        } else if (!retirar && retirarDelVendedor) { //reintentamos retiro de rtm para enviarlo al vendedor
                          socket.emit("revirtiendoAvendedor",{comprador:buyer});
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, asset.asset, 1);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultunBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                     
                          await new Promise(resolve => setTimeout(resolve, 10000));
                          
                   
                          this.intentarRetiradaDeEmergenciaDeToken(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);

                          //seguir revision desde aqui a abajo
                        } else if (!retirarDelVendedor && retirar) {
                          socket.emit("revirtiendoAcomprador",{comprador:buyer});
                          let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                          let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", tokenValido.address, 0.00009);
                          let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
          
                          await new Promise(resolve => setTimeout(resolve, 10000));
                          this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,resultGetAssetBalanceOfComprador,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,1,asset.asset,insertarCompraComprador,insertarVentaVendedor);
                        }
                 
                    } catch (error) {
                    return  socket.emit("errorDeCompra",{comprador:buyer});
                    }
                }

              } else {
              return  socket.emit('notSelling',{comprador:buyer});
              }


            } else {
            return  socket.emit("notSelling",{comprador:buyer});
            }

          }

        }

      

   } });



    });
  }
//hay que cambiar el nft market al principio como el asset market para enviar socket si se elimina un asset

  public async assetToMarket(asset: string, token: string, price: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("primer paso");
        const usuariodecodificado = await decodeToken(token);
        if (usuariodecodificado != "error" && usuariodecodificado != "expired") {
          let result = await (await this.gateway).verifyTokenEnVenta2(asset, usuariodecodificado.userid);
          console.log("segundo paso");
          console.log("result verifytokenenventa:", result);
          if (result === true) {
            console.log("rejecting cuz verifytokenenventa es true");
            reject("selling");
          } else if (result === false) {
            console.log("false verifytokenenventa");
            const usuariofinal = usuariodecodificado.usuario;
            const userid = usuariodecodificado.userid;
            const selleraddress = usuariodecodificado.address;
            let assetBalance = await (await this.raptoreumCore).getAssetBalance(usuariodecodificado.address, asset);
            console.log("asset balance");
            if (assetBalance > 1) {
              console.log("tiene al menos un asset"); //
              let result = await (await this.gateway).insertAssetInMarket(asset, userid, usuariofinal, selleraddress, price);//you are here
              if (result) {
                result.balance = assetBalance;
                resolve(result);
              } else {
                reject("assetToMarketError");
              }
            } else if (assetBalance == 0) {
              reject("tooLowBalance");
            }

          } else if (result === "errorGettingToken") {
            reject("assetToMarketError");
          }
        } else if (usuariodecodificado == "expired") {
          console.log("aplicandonorlogged");
          reject("notLogged");
        } else if (usuariodecodificado == "error") {
          reject("error");
        }

      } catch (error) {
        console.log("error de aassettomarket", error);
        if (error == 'el activo no existe por lo tanto no puede ser vendido') {
          reject("notExists");
        }
        else if (error == "selling") {
          reject("selling");
        }
        else {
          reject("error");
        }
      }
    });
  }
  
  public async raptoreumWorldStockInvestorsMoney(comprador: string, rtmAenviar: number, transactionType: string) {
    let [result]: any = await (await this.gateway).getData("SELECT userid,address FROM users WHERE address != ?", ["none"]);
    if (result) {
      let envios = 0;
      const assetPromises = result.map(async (ITEM: any) => {
        let resultGetBalanceOfToken = await (await this.raptoreumCore).getAssetBalance(ITEM.address, "raptoreumworldstock");
        if (resultGetBalanceOfToken && resultGetBalanceOfToken != 0 && resultGetBalanceOfToken > 0) {
          let partes = resultGetBalanceOfToken;
          envios += partes;
          let withdraw = await (await this.raptoreumCore).withdrawRaptoreum(comprador, ITEM.address, partes * rtmAenviar);
          if (withdraw) {
            let insertRaptoreumTransaction = await (await this.gateway).raptoreumWorldStockTransaction(result.userid, partes * rtmAenviar, transactionType);
          }

        }
      });
      const resolvedAssets = await Promise.all(assetPromises);
      return envios;
    }
  }


  private async intentarRetiradaDeEmergenciaDeToken(comprador: string, balanceAnterior: number, transaccionPending: string, addressComprador: string, addressVendedor: string, idVendedor: string, assetDebt: number, assetName: string, idVentaComprador: string, idVentaVendedor: string) {
    let intentos = 0;
  
    const intentar = async () => {
      let isPending = await (await this.gateway).getTransaccionPendiente(transaccionPending);
  
      if (isPending === true) {
        let balance = await (await this.raptoreumCore).getAssetBalance(comprador, assetName);
  
        if (balance > balanceAnterior) {
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
        } else {
          setTimeout(intentar, 5000);
        }
      } else if (isPending === false) {
        return;
      } else if (isPending === "error") {
        setTimeout(intentar, 5000);
      }
    };
  
    setTimeout(intentar, 5000);
  };
  private async getRaptoreumdHealth(){
     let result=await axios.get('http://localhost:3009/raptoreumdHealth')
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
 private async intentarRetiradaDeEmergenciaDeRaptoreum (
    comprador: string,
    balanceAnterior: number,
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
        let balance = await (await this.raptoreumCore).getAccountBalance(idVendedor);
  
        if (balance > balanceAnterior) {
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
        } else {
          setTimeout(intentar, 5000);
        }
      } else if (isPending === false) {
        return;
      } else if (isPending === "error") {
        setTimeout(intentar, 5000);
      }
    };
  
    setTimeout(intentar, 5000);
  };
  public async isRaptoreumWorldStockHolder(token: string) {
    const usuariodecodificado = await decodeToken(token);
    if (usuariodecodificado != "error" && usuariodecodificado != "expired") {
      let [result]: any = await (await this.gateway).getData("SELECT userid,address FROM users WHERE userid = ?", [usuariodecodificado.userid]);
      if (result) {

        let resultGetBalanceOfToken = await (await this.raptoreumCore).getAssetBalance(result[0].address, "raptoreumworldstock");
        if (resultGetBalanceOfToken && resultGetBalanceOfToken != 0 && resultGetBalanceOfToken > 0) {
          return true;
        } else if (resultGetBalanceOfToken && resultGetBalanceOfToken == 0) {
          return false;
        } else {
          return "error";
        }
      } else {
        return "error";
      }
    }
  }
}



























