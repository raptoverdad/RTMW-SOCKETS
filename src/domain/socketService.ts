import { Server } from 'socket.io';
import { UserGateway } from '../dataaccess/gateway';
import { decodeToken } from './jwtFunctions';
import { raptoreumCoreAccess } from './raptoreumCoreFunctions';
import * as http from 'http';
import axios from 'axios'
const tokenExpresion = /^[a-zA-Z0-9._-]*$/;
const addressExpresion= /^[a-zA-Z0-9]*$/

async function getFromCache(key,client) {

  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

async function setInCache(key, value, client) { // 1 hour expiration by defa>

  await client.set(key, JSON.stringify(value));
}

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
console.log("consumiendo")
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
 //   console.log("new connection");
//    console.log("object connection:", socket.handshake.query.object);
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
   // console.log("new connection");
   // console.log("object connection:", socket.handshake.query.object);

    if (subject === "assetsmarket" || subject === "nftmarket") {
        await this.handleMarket(subject, socket, socketId, user);
    }
     

   socket.on('assetToMarket', async (data: any) => {
        let asset:string=data.asset
        let price = parseFloat(data.price);
//console.log(data)
        // Verificar si `price` es un número válido y está dentro del rango permitido
        if (isNaN(price) || price <= 0 || price > 1000000000) {
          return "notValidPrice";
        }
        if (!asset || asset.length < 1 || asset.length > 250) {
          return "invalidParameters";
        }
        let healh=await this.getRaptoreumdHealth()
        if(healh == "error"){
          return socket.emit("serverDown")
        }else if(healh=="dead"){
         return socket.emit("serverDown")
        }

        if (!this.rateLimiters[socketId].consume(1, user)) {
          return;
        }

          try {
            let result = await this.assetToMarket(data.asset, data.token, data.price);
            if (result)
            {
              socket.emit("successAssetToMarket", result);
              this.io.sockets.emit("newAssetInMarket", result);
              return;
            }
          } catch (e) {
            return  socket.emit("assetToMarketError", e);
          }

      });
   socket.on('detenerVenta', async (data: { token: string; asset: string; ventaId: string;}) => {
        if (!this.rateLimiters[socketId].consume(1, user)) {
          return;
        }


try{
        let healh=await this.getRaptoreumdHealth()
        if(healh == "error"){
          return socket.emit("serverDown")
        }else if(healh=="dead"){
         return socket.emit("serverDown")
        }
        console.log("DATA QUE LLEGA PARA DETENER VENTA:", data);
        if (tokenExpresion.test(data.token)) {
          let tokenValido = await decodeToken(data.token);
          if (tokenValido != "expired" && tokenValido != "error") {
console.log("TOKEN VALIDO")
 //sacar de las ordenes de los clientes si sierta orden está vinculada a su userid y si está se procede a eliminar la venta
            let usuario = tokenValido.userid;
console.log("pasando a verifyaccountblocked")
            const encontrado = await (await this.gateway).verifyAccountBlocked(usuario);
            console.log("RESULTADO DE LA BUSQUEDA DEL USUARIO EN CUENTAS BLOQUEADAS:",encontrado)
            if (encontrado === false) {
              console.log("data con la que revisar token en venta por el usuario:", data);
              const NFTenVentaPorElUsuario = await (await this.gateway).verifyNftEnVenta(data.asset, usuario, data.ventaId);
              const enVentaPorElUsuario = await (await this.gateway).verifyTokenEnVenta(data.asset, usuario, data.ventaId);
              if (enVentaPorElUsuario && !NFTenVentaPorElUsuario) {
                console.log("asset en venta")
                let resultDetenerVenta = await (await this.gateway).detenerVenta(usuario, data.ventaId,"asset");
                if (resultDetenerVenta) {
                  //enviar el id de la venta y removerlo del market assets en el front
                   socket.emit("ventaUsuarioDetenida", data.ventaId);
                    return this.io.sockets.emit("ventaDetenida", data.ventaId);
                } else {
                 return    socket.emit("errorStoppingSell");
                }
              }   if (!enVentaPorElUsuario && NFTenVentaPorElUsuario) {
 console.log("nft en venta")

                let resultDetenerVenta = await (await this.gateway).detenerVenta(usuario, data.ventaId,"nft");
                if (resultDetenerVenta) {
                  //enviar el id de la venta y removerlo del market assets en el front
                   socket.emit("ventaUsuarioDetenida", data.ventaId);
                    return this.io.sockets.emit("ventaDetenida", data.ventaId);
                } else {
                 return    socket.emit("errorStoppingSell");
                }
               } else if (!enVentaPorElUsuario && !NFTenVentaPorElUsuario){
                console.log("EMITIENDO NOT SELLING Y CONSOLEANDO ENVENTAPORELUSUARIO:", enVentaPorElUsuario);
             return  socket.emit("notSelling");
              }
            }
          } else if (tokenValido == "expired") {
            return socket.emit("expired");
          }
        }


         }catch(e){
console.log(e)

         }
        return

      });
 socket.on('compra', async (data: { token: string; ventaId: string; cantidad: number;totp:any; }) => {

    if (tokenExpresion.test(data.token) && typeof (data.cantidad) == "number" && data.cantidad > 0) {
        console.log("pasamos la validacion de parametros")
        let tokenValido = await decodeToken(data.token);
        if(tokenValido==="error")return
        if(tokenValido==="expired")return socket.emit("expired")
        let isTotp=await this.isTOTP(tokenValido.userid)
        if(isTotp==="error")return
        if(isTotp===true){
         let resultTOTP=await this.verifyTOTP(tokenValido.userid,data.totp)
         if(resultTOTP===false)return socket.emit("invalidTOTP")
           if(resultTOTP==="error")return socket.emit("errorTOTP")

        }
        let result = await this.getRaptoreumdHealth();
        if (result == "error" || result == "dead") {
            return this.handleError(socket, "serverDown", "Server is down");
        }

        if (!this.rateLimiters[socketId].consume(1, user)) { return; }
        console.log("La cadena es válida");

        let buyer = tokenValido.userid;
        let accountBlocked = await (await this.gateway).verifyAccountBlocked(buyer);
        if (accountBlocked !== "error" && accountBlocked===true) {
            console.log("cuenta bloqueada del comprador!!")
            return this.handleError(socket, "blockAccount", "Account is blocked");
        }
console.log("ID DE LA VENTA:",data.ventaId)
        let [assetsEnVentaDelVendedor, nftEnVentaDelVendedor] = await Promise.all([
           await (await this.gateway).getMarketAssetsById(data.ventaId),
            await(await this.gateway).getMarketNFTsById(data.ventaId)
        ]);
console.log("ASSET EN VENTA?:",assetsEnVentaDelVendedor)
console.log("NFT EN VENTA?:",nftEnVentaDelVendedor)

        if (assetsEnVentaDelVendedor.length === 0 && nftEnVentaDelVendedor.length === 0) {
            console.log("no está en venta!!!")
            return this.handleError(socket, "notSelling", "No assets or NFTs are being sold");
        }else if(assetsEnVentaDelVendedor.length > 0 && nftEnVentaDelVendedor.length > 0)   return this.handleError(socket, "notSelling", "2 assets  are being sold");

  let itemType = null;
let itemEnVenta=null
    if (assetsEnVentaDelVendedor.length > 0) {
      itemEnVenta=assetsEnVentaDelVendedor[0]
      itemType = 'Asset';
    } else if (nftEnVentaDelVendedor.length >0){
   itemEnVenta=nftEnVentaDelVendedor[0]

      itemType = 'nft';
    }
        
        console.log("obtendremos al vendedor:",itemEnVenta._id)
        let vendedor = await (await this.gateway).getVendedorDelToken(itemEnVenta._id,itemType);
        console.log("VENDEDOR:",vendedor)
        if (!vendedor) {
            console.log("NO HAY VENDEDOR:",vendedor)
            return await this.handleError(socket, "notSelling", "Seller is not available");
        }
        console.log("HAY VENDEDOR:")
        let cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);

        if (cuentaBloqueadaVendedor!=="error" && cuentaBloqueadaVendedor===true) {
            console.log("cuenta bloqueada del vendedor!!")
            return await this.handleError(socket, "notAvailable", "Seller's account is blocked");
        }
        else if(cuentaBloqueadaVendedor==="error" ){
           return await this.handleError(socket, "notAvailable", "Seller's account is blocked");
        }
        console.log("obteniendo data importante:!!")
        let [balanceOfVendedor, raptoreumBalanceOfVendedor, balanceOfBuyer,resultGetAssetBalanceOfComprador] = await Promise.all([
           await (await this.raptoreumCore).getUserAssets(vendedor.sellerAddress),
           await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId),
           await (await this.raptoreumCore).getAccountBalance(buyer),
           await (await this.raptoreumCore).getAddressBalance(tokenValido.address,"RAPTOREUMWORLDCOIN"),
        ]);
      
        console.log("DATA IMPORTANTE:","BALANCE OF VENDEDOR:",balanceOfVendedor,"raptoreum balance of vendedor:",raptoreumBalanceOfVendedor, "BALANCE DEL COMPRADOR:",balanceOfBuyer,"RESULT GET ASSET BALANCE OF COMPRADOR:",resultGetAssetBalanceOfComprador)
        let isRWS = false
        if(resultGetAssetBalanceOfComprador !== "error" && resultGetAssetBalanceOfComprador !== "notFound" && resultGetAssetBalanceOfComprador>0) isRWS=true
    let balanceAssetEnVenta=balanceOfVendedor.find(e=>e.asset===itemEnVenta.asset)
     
        if(balanceAssetEnVenta==="error")  return await this.handleError(socket, "notSelling", "Seller is not available");
     if(balanceAssetEnVenta==="notFound")  return await this.handleError(socket, "notSelling", "Seller is not available");

         
 let raptoreumNecesario=itemEnVenta.price*data.cantidad
        if(!raptoreumNecesario)    return this.handleError(socket, "notAvailable", "no se pudo conseguir precio del asset");
        if ( balanceAssetEnVenta.balance >= data.cantidad ) {
          console.log("PASAMOS POR QUE EL VENDEDOR TIENE EL BALANCE SUFICIENTE PARA VENDER")
            if(!isRWS){
              console.log("NO ES RWS")
                if (balanceOfBuyer < (raptoreumNecesario + 10)){
                  console.log("NO TIENE PLATA")
                return this.handleError(socket, "buyerNotEnoughRaptoreum", "Buyer does not have enough Raptoreum");
                }
            }else if(isRWS){
                if (balanceOfBuyer < raptoreumNecesario){
                    return this.handleError(socket, "buyerNotEnoughRaptoreum", "Buyer does not have enough Raptoreum");
                }
            }
         
console.log("pasamos a bloquear:")
            let blocked =await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block");
             let blocked2 =await (await this.gateway).blockOrUnblockUserTransactions(buyer,"block");

            if (!blocked) {
                console.log("no pudimos bloquear")
                     console.log("emitiendo couldNotConnect")
                socket.emit('couldNotConnect');
                return          
              }
    if (!blocked2) {
                console.log("no pudimos bloquear")
                     console.log("emitiendo couldNotConnect")
                socket.emit('couldNotConnect');
                return
              }

  let  insertarVentaVendedor = await (await this.gateway).insertCompraOventa(vendedor.vendedorId, "venta", raptoreumNecesario, itemEnVenta.asset, data.cantidad, itemEnVenta.assetpicture,itemType);
  let  insertarCompraComprador = await (await this.gateway).insertCompraOventa(buyer, "compra", raptoreumNecesario, itemEnVenta.asset, data.cantidad, itemEnVenta.assetpicture,itemType);
                 let pending=false
            console.log("nos saltamos el retiro de raptoreum por que el vendedor tiene mas de 1")
            if (raptoreumBalanceOfVendedor < 0.00002) {
                let retiroCajaChica = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworldoficial", vendedor.sellerAddress, 0.00009);
                if (!retiroCajaChica) {
                    return this.handleError(socket, "errorDeCompra", "Error in small cash withdrawal");
                }
                 pending=true
                socket.emit("compraPendiente");
                await new Promise(resolve => setTimeout(resolve, 20000));
            }
            try {
                let { raptoreumWithdraw, tokenWithdraw } = await this.handleWithdrawals(buyer, vendedor.sellerAddress, raptoreumNecesario, vendedor.vendedorId, tokenValido.address, data.cantidad, balanceAssetEnVenta.assetid);
               console.log("RAPTOREUM WITHDRAW:",raptoreumWithdraw)
               console.log("token WITHDRAW:",tokenWithdraw)
                if (raptoreumWithdraw && tokenWithdraw) {
                   try{
                    if(itemType === "nft"){
                         let resultDetenerVenta = await (await this.gateway).detenerVenta(vendedor.vendedorId,vendedor.ordenId,"nft")
                    if (resultDetenerVenta) {
                        this.io.sockets.emit("ventaDetenida", vendedor.ordenId);
                    }

                     }
                     }catch(e){
                    console.log("ERROR EN DETENER VENTA:",e)
                   }
                  console.log("AMBAS TRANSACCIONES SALIERON BIEN")
                    let [updateBuyer, updateSeller] = await Promise.all([
                   await (await this.gateway).updateCompraOventa(insertarCompraComprador, "SUCCESS", tokenWithdraw),
                   await (await this.gateway).updateCompraOventa(insertarVentaVendedor, "SUCCESS", raptoreumWithdraw)
                    ]);

                  socket.emit("compraExitosa", { asset: itemEnVenta.asset, cantidad: data.cantidad });
                    this.io.sockets.emit("venta", { ordenId: vendedor.ordenId, balance:  balanceAssetEnVenta.balance-data.cantidad });
                    await this.blockOrUnblockTransactions(await this.gateway, [buyer, vendedor.vendedorId], false);
                    if(!isRWS){
                        await this.raptoreumWorldStockInvestorsMoney(buyer, 0.32, "tokenSold");
                  await (await this.raptoreumCore).withdrawRaptoreum(vendedor.vendedorId,  tokenValido.address, 1.99);
                    }


                } else if(raptoreumWithdraw && !tokenWithdraw){
                   if(pending)return  socket.emit("errorDeCompra")
                  console.log("TOKEN WITHDRAW SALIÓ MAL")
                    let transaccionPendidente = await (await this.gateway).transaccionPendiente(vendedor.vendedorId,vendedor.sellerAddress,buyer,  tokenValido.address,"raptoreum",raptoreumNecesario);
                    let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoverdad", tokenValido.address, 0.00009);
                    let resultunBlockcomprador = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    await this.intentarRetiradaDeEmergenciaDeRaptoreum(buyer,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,raptoreumNecesario,itemEnVenta.asset,insertarCompraComprador,insertarVentaVendedor);
                       return
                  } else if(!raptoreumWithdraw && tokenWithdraw){
                   if(pending)return socket.emit("errorDeCompra")
                  console.log("RAPTOREUM WITHDRAW SALIÓ MAL")
                    let transaccionPendidente = await (await this.gateway).transaccionPendiente(buyer, tokenValido.address, vendedor.sellerAddress, vendedor.vendedorId, itemEnVenta.asset, data.cantidad);
                    let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoverdad",tokenValido.address, 0.00009);
                    let resultunBlockvendedor = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                    await new Promise(resolve => setTimeout(resolve, 60000));
                   await this.intentarRetiradaDeEmergenciaDeToken(buyer,transaccionPendidente,tokenValido.address,vendedor.sellerAddress,vendedor.vendedorId,data.cantidad,balanceAssetEnVenta.assetid,insertarCompraComprador,insertarVentaVendedor);
                   return
                  }else if(!raptoreumWithdraw && !tokenWithdraw){
                    if(pending)return socket.emit("errorDeCompra")
                 await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                 await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                  }  
            } catch (error) {
                 console.log("ERROR DE COMPRA:",error)
                return this.handleError(socket, "errorDeCompra", "Purchase error");
            }
        } else if (balanceOfVendedor < data.cantidad) {
           console.log("EMITIENDO SELLERNOTENOIGHTOKENS")
            return this.handleError(socket, "sellerNotEnoughTokens", "Seller does not have enough tokens");
        }
    }else{
        console.log("error con la data")
    }
});


 })

}

public async isTOTP(userid:string){
try{
 let [result]:any = await (await this.gateway).getData("SELECT istotp FROM users where userid=?", [userid]);
if(result.istotp == "false"){
return false
}else if(result.istotp == "true"){
return true
}
}catch(e)
{
console.log(e)
return "error"
}
}
public async verifyTOTP(userid:string,code:string){
let [result]:any = await (await this.gateway).getData("SELECT totp FROM users where userid=?", [userid]);
  if (result) {
   if(result.totp != "none"){
    const isValid = speakeasy.totp.verify({
      secret: result.totp,
      encoding: 'base32',
      token: code,
    });

    if (isValid) {
     return true
    } else {
      return false
    }
   }else{
     return false
    }
    // Verifica que la contraseña ingresada coincida con la almacenada en la base de datos

  } else {

    return "error"
  }

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
             console.log("llegó asset market:")
             marketAssets = await (await this.gateway).getMarketAssets();
        } else if (subject === "nftmarket") {
            marketAssets = await (await this.gateway).getMarketNFTs();
        } else {
            throw new Error(`Unknown subject: ${subject}`);
        }
console.log("asset market result:",marketAssets)
        // Mapear las promesas de balance y esperar a que todas se resuelvan
        const balancePromises = await Promise.all(marketAssets.map(async (e) => {
            let orden = e._id;
            let vendedor;
            if (subject === "assetsmarket") {
                vendedor = await (await this.gateway).getVendedorDelToken(orden,"Asset");
            }else if (subject === "nftmarket") {
                vendedor = await (await this.gateway).getVendedorDelNFT(orden);
            }

            
           
            let asseEncontrado=   await (await this.raptoreumCore).getAddressBalance(vendedor.sellerAddress,e.asset)
             console.log("asseEncontrado:",asseEncontrado)   

            if (asseEncontrado !=="error" && asseEncontrado !=="notFound" && asseEncontrado.balance >= 1) {
                console.log(`paso 2 el balance es mayor a 1, asignando balance al elemento`);
                e.balance = asseEncontrado.balance;
                return e;
            } else {
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
        const result = await (await gateway).blockOrUnblockUserTransactions(user, action);
        if (!result) {
            await gateway.blockOrUnblockUserTransactions(user, block ? "unblock" : "block");
            return false;
        }
    }
    return true;
}
private async getRaptoreumdHealth(){
    let result =await axios.get('http://localhost:3009/raptoreumdHealth')
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
  public async assetToMarket(asset: string, token: string, price: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("primer paso");
        const usuariodecodificado = await decodeToken(token);
        if (usuariodecodificado != "error" && usuariodecodificado != "expired") {
 let isTotp=await this.isTOTP(usuariodecodificado.userid)
        if(isTotp==="error")return
        if(isTotp===true){
         let resultTOTP=await this.verifyTOTP(usuariodecodificado.userid,data.totp)
         if(resultTOTP===false)return socket.emit("invalidTOTP")
           if(resultTOTP==="error")return socket.emit("errorTOTP")

        }

   let cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId);

        if (cuentaBloqueadaVendedor!=="error" && cuentaBloqueadaVendedor===true) {
            console.log("cuenta bloqueada del vendedor!!")
            return await this.handleError(socket, "notAvailable", "Seller's account is blocked");
        }
        else if(cuentaBloqueadaVendedor==="error" ){
           return await this.handleError(socket, "notAvailable", "Seller's account is blocked");
        }

          let getAssetType=await (await this.raptoreumCore).getUserAssets(usuariodecodificado.address)
          if(getAssetType !== "getUserAssetsError" && getAssetType.length >0){
               let foundAsset = getAssetType.find((i:any) => i.asset===asset);
               if(!foundAsset)return
               let result = await (await this.gateway).verifyTokenEnVenta2(asset, usuariodecodificado.userid,foundAsset.type);
               console.log("segundo paso");
               console.log("result verifytokenenventa:", result);
               if (result === true) {
                 console.log("rejecting cuz verifytokenenventa es true");
                 reject("selling");
               } else if (result === false) {
                try {
                  console.log("TYPE PARA INSERTAR EN EL MARKET:",foundAsset.type)
                  let result = await (await this.gateway).insertAssetInMarket(asset, usuariodecodificado.userid,usuariodecodificado.usuario,usuariodecodificado.address,price,foundAsset.type);
                  if(result)resolve(result)
                } catch (error) {
                  reject("assetToMarketError");
                }

               } else if (result === "errorGettingToken") {
                 reject("assetToMarketError");
               }
          }


        } else if (usuariodecodificado == "expired") {
          console.log("aplicandonorlogged");
          reject("notLogged");
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
 public async handleWithdrawals( buyer:any, sellerAddress:any, raptoreumAmount:any, sellerId:any, tokenAddress:any, tokenAmount:any, asset:any) {
console.log("ASSET A RETIRTAR:",asset)
console.log("ASSET A RETIRTAR:",asset)
console.log("ASSET A RETIRTAR:",asset)
console.log("ASSET A RETIRTAR:",asset)
console.log("ASSET A RETIRTAR:",asset)
console.log("ASSET A RETIRTAR:",asset)
console.log("ASSET A RETIRTAR:",asset)

    let raptoreumWithdraw = false
// await (await this.raptoreumCore).withdrawRaptoreum(buyer, sellerAddress, raptoreumAmount);
    let tokenWithdraw = await  (await this.raptoreumCore).withdrawToken(sellerId, tokenAddress, tokenAmount, asset,sellerAddress,sellerAddress);
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
console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL")
console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL")
console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL")
console.log("PASAMOS A INTENTAR RETIRADA DE RAPTOREUM POR QUE EL VENDEDOR SALIO BIEN Y EL COMPRADOR MAL")
    const intentar = async () => {
      let isPending = await (await this.gateway).getTransaccionPendiente(transaccionPending);

      if (isPending === true) {

          let retirarDeEmergenciaDelVendedor = await (await this.raptoreumCore).withdrawRaptoreum(idVendedor, addressComprador, raptoreumDebt);

          if (retirarDeEmergenciaDelVendedor) {
            console.log(raptoreumDebt," RAPTOREUMS RETIRADOS CORRECTAMENTE DEL DEL VENDEDOR")
            await Promise.all([
              (await this.gateway).transaccionPendienteOut(transaccionPending),
              (await this.gateway).updateCompraOventa(idVentaComprador, "REJECTED", "none"),
              (await this.gateway).updateCompraOventa(idVentaVendedor, "REJECTED", "none"),
              (await this.gateway).blockOrUnblockUserTransactions(comprador, "unblock"),
              (await this.gateway).blockOrUnblockUserTransactions(idVendedor, "unblock")
            ]);
          } else {
            if (intentos < 5) {
              console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM")
              console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM")
              console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM")
              console.log("INTENTAMOS RETIRADA NUEVAMENTE POR QUE NO PUDIMOS RETIRAR RTM")
              intentos++;
              setTimeout(intentar, 20000);
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
        setTimeout(intentar, 20000);
      }
    };

    setTimeout(intentar, 20000);
  }
  private async intentarRetiradaDeEmergenciaDeToken(comprador: string, transaccionPending: string, addressComprador: string, addressVendedor: string, idVendedor: string, assetDebt: number, assetName: string, idVentaComprador: string, idVentaVendedor: string) {
    let intentos = 0;
    const intentar = async () => {
      let isPending = await (await this.gateway).getTransaccionPendiente(transaccionPending);
      if (isPending === true) {
          let retirarDeEmergenciaDelCliente = await (await this.raptoreumCore).withdrawToken(comprador, addressVendedor, assetDebt, assetName,addressComprador,addressComprador);
          if (retirarDeEmergenciaDelCliente) {
console.log("ACTUALIZANDO DATA. TOKEN ENVIADO")
console.log("ACTUALIZANDO DATA. TOKEN ENVIADO")
console.log("ACTUALIZANDO DATA. TOKEN ENVIADO")
console.log("ACTUALIZANDO DATA. TOKEN ENVIADO")
console.log("ACTUALIZANDO DATA. TOKEN ENVIADO")
console.log("ACTUALIZANDO DATA. TOKEN ENVIADO")

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
              setTimeout(intentar, 40000);
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
        setTimeout(intentar, 40000);
      }
    };

    setTimeout(intentar, 40000);
  }
}


