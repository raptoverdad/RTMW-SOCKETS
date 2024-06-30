import {CONFIG} from '../config/testingconfig'
import { Server, Socket } from 'socket.io';
import {UserGateway} from '../dataaccess/gateway'
import { decodeToken } from './jwtFunctions';
import { raptoreumCoreAccess} from './raptoreumCoreFunctions'
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

const tokenExpresion = /^[a-zA-Z0-9._-]*$/;
const assetExpresion=/^[a-z]*$/;
const passwordExpresion=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]*$/;
const addressExpresion= /^[a-zA-Z0-9]*$/
const numberExpression= /^[0-9]+$/;
const minusStringExpression= /^[a-z]+$/;


export class socketService {
  private gateway= UserGateway.getInstance()
  private raptoreumCore=raptoreumCoreAccess.getInstance()
  private io: Server;
  private key:string;
  private withdrawBlockedAccounts:any[] =[]
  private usersConected:any;

  constructor() {
    this.key = "skrillex";
    this.io = new Server(
      http.createServer().listen(3000),
      {
        cors: {
          origin: "https://raptoreumworld.com",
          methods: ["GET", "POST"],
          credentials: false,
        },
      }
    );
   console.log("conectado en"," ",3000)


    this.io.use(async (sockete:any, next:any) => {
      let frontendKey = await sockete.handshake.query.key;
      if (frontendKey !== this.key) {
        throw new Error("invalid socket connection")
      } else {
        next();
      }
    });

    this.io.on("connection", async(socket:any) => {

      console.log("new connection")
      console.log("object connection:",socket.handshake.query.object)

      // Convierte la cadena nuevamente a un objeto
      const object: any = JSON.parse(socket.handshake.query.object);

      let subject:string=object.subject.trim()

      let user:string=object.token

     if(subject=="assetsmarket"){
         console.log("llega conexion que quiere assetsmarket<")
         let result=await this.getAssetsMarket()
          console.log("result para enviar con el socket:",result)
         socket.emit("assetsmarket",result)
      }



  //falta arreglar lo de los usuarios
  socket.on("withdraw", async (json: any, senderSocket:any) => {
    if (tokenExpresion.test(json.token) && addressExpresion.test(json.to)){
      const result=await decodeToken(json.token)

      if(result!="expired" && result!="error")
      {
        const encontrado = await(await this.gateway).verifyAccountBlocked(result.userid)
        if (encontrado===false) {

          let floatNecesary=parseFloat(json.amount)+1
          let float=parseFloat(json.amount)

          try {
            console.log("coin:",json.coin)
            if(json.coin=='raptoreum'){
              let balance = await (await this.raptoreumCore).getAccountBalance(result.userid);
              if(balance >=floatNecesary){
                console.log("pasamos a coin raptoreum")
                console.log("el balance de la cuenta de raptoreum es el suficiente")
                try {
                  let withdraw=await (await this.raptoreumCore).withdrawRaptoreum(result.userid,json.to,float)
                  if(withdraw){
                    socket.emit("successfulWithdraw")
                    let comision=await (await this.raptoreumCore).withdrawRaptoreum(result.userid,"RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K",0.9)
                  }
                } catch (error) {
                  console.log(error)
                  if(error!==false){
                    socket.emit("notEnoughBalance")
                  }else{
                    socket.emit("withdrawError")
                  }
                }
              }else{
                socket.emit("notEnoughBalance")
              }

            }else{
              let resultGetBalanceOfToken=await (await this.raptoreumCore).getAssetBalance(result.userid,result.address,json.coin)
              if(resultGetBalanceOfToken >= float){
                let RTMbalance = await (await this.raptoreumCore).getAccountBalance(result.userid);
                if(RTMbalance >= 1)
                {
                  let withdraw=await (await this.raptoreumCore).withdrawToken(result.userid,json.to,float,json.asset)
                  if(withdraw){
                    let comision=await (await this.raptoreumCore).withdrawRaptoreum(result.userid,"RYZKdhd6xn9UiYWda6esfPVPuf448t2P5h",0.5777)
                   return socket.emit("successfulWithdraw")


                }else{
                  return socket.emit("withdrawError")
                }
                }else{
                  return socket.emit("notEnoughRTMBalance")
                }
              }else{
                return socket.emit("notEnoughBalance")
              }

          }

        } catch (error) {
          if(error!=false){
            socket.emit("notEnoughBalance")
          }else{
            socket.emit("withdrawError")
          }
        }



    }else if(encontrado){
    socket.emit("blockAccount")
  }
}else if(result=="expired"){
  socket.emit("expired")
}
   }})
  socket.on('assetToMarket',async (data:any)=>{
    try{
         let result = await this.assetToMarket(data.asset,data.token,data.price)
         if(result){
           socket.emit("successAssetToMarket",result)
           this.io.sockets.emit("newAssetInMarket",result)
         }
    }catch(e){
      console.log("ASSET TO MARKET ERROR:",e)
      socket.emit("assetToMarketError")
    }
})
  socket.on('detenerVenta',async(data:{token:string,ventaId:string})=>{
    if (tokenExpresion.test(data.token)) {
    let tokenValido=await decodeToken(data.token)

    if(tokenValido!="expired" && tokenValido!="error")
    {
      //sacar de las ordenes de los clientes si sierta orden está vinculada a su userid y si está se procede a eliminar la venta
      let usuario=tokenValido.userid
      const encontrado = await(await this.gateway).verifyAccountBlocked(usuario)
      if (encontrado===false) {
        const enVentaPorElUsuario = await(await this.gateway).verifyTokenEnVenta(usuario,data.ventaId)
        if(enVentaPorElUsuario)
        {
          let resultDetenerVenta=await (await this.gateway).detenerVenta(usuario,data.ventaId)
          if(resultDetenerVenta){
            //enviar el id de la venta y removerlo del market assets en el front
            socket.emit("ventaUsuarioDetenida",data.ventaId)
            this.io.sockets.emit("ventaDetenida",data.ventaId)
          }else{
            socket.emit("errorStoppingSell")
          }
        }else{
          console.log("EMITIENDO NOT SELLING Y CONSOLEANDO ENVENTAPORELUSUARIO:",enVentaPorElUsuario)
          socket.emit("notSelling")
        }
}
    }else if(tokenValido=="expired"){
      socket.emit("expired")
    }
  }})
  socket.on('compra', async (data: { token: string, ventaId: string,cantidad:number}) => {
    if (tokenExpresion.test(data.token)){

        console.log("La cadena es válida");

        let tokenValido = await decodeToken(data.token)
        if (tokenValido!="expired" && tokenValido!="error") {
            let buyer: string = tokenValido.userid
            const encontrado = await (await this.gateway).verifyAccountBlocked(buyer)
            if (encontrado === true) {
              console.log("encontrado en cuentas bloquedas")
                socket.emit("blockAccount")
                return
            } else if (encontrado === false) {
              console.log("encontrado false")
                let assetsEnVentaDelVendedor = await (await this.gateway).getMarketAssetsById(data.ventaId)
                if (assetsEnVentaDelVendedor.length > 0) {
                  console.log("encontrado el asset del vendedor")
                    let asset = assetsEnVentaDelVendedor[0]
                    if (asset) {
                      console.log("el asset está en nuestras manos")
                      console.log(asset)
                        let vendedor=await (await this.gateway).getVendedorDelToken(asset._id)
                      if(vendedor){
                        const cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(vendedor.vendedorId)
                        if(cuentaBloqueadaVendedor===true){
                          socket.emit("notAvailable")
                          return
                        }
                        console.log("encontramos al vendedor")
                        let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.vendedorId, vendedor.sellerAddress, asset.assetId)
                        console.log("pasamos el get asset balance")
                        let resultGetRaptoreumBalanceOfVendedor = await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId)
                        console.log("pasamos el account balance")
                        let getBalanceOfBuyer = await (await this.raptoreumCore).getAccountBalance(buyer)
                        console.log("pasamos el account balance del buyer")
                        let getTokenBalanceOfBuyer = await (await this.raptoreumCore).getAssetBalance(buyer, tokenValido.address, asset.assetId)
                        console.log("pasamos el token balance del buyer")
                        let raptoreumNecesario = data.cantidad * asset.price
                        console.log("RAPTOREUM NECESARIO:",raptoreumNecesario)
                        if (resultGetBalanceOfVendedor >= data.cantidad && getBalanceOfBuyer >= (raptoreumNecesario + 1)) {
                            console.log("direccion a enviar RTM:", vendedor.sellerAddress)
                           let retirar = await (await this.raptoreumCore).withdrawRaptoreum(buyer, vendedor.sellerAddress, raptoreumNecesario)
                            let retirarDelVendedor = await (await this.raptoreumCore).withdrawToken(vendedor.vendedorId, tokenValido.address, data.cantidad, asset.assetId)
                            if (retirar && retirarDelVendedor)



                             {
                                let comisionRTMWORLD = await (await this.raptoreumCore).withdrawRaptoreum(buyer, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", 0.87)
                                let resultGetBalanceOfVendedor = await (await this.raptoreumCore).getAssetBalance(vendedor.vendedorId, vendedor.sellerAddress, asset.assetId)
                                socket.emit("compraExitosa")
                                this.io.sockets.emit("venta", {ordenId:vendedor.ordenId,balance:resultGetBalanceOfVendedor})
                            } else if (!retirar && retirarDelVendedor)
                            {
                                let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block")
                                let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block")
                                socket.emit("blockAccount")
                                let retirarDeRaptoreumWorld = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworld", tokenValido.address, 0.3)
                                const intentarRetiradaDeEmergenciaDeToken = async () => {
                                  setTimeout(async () => {
                                    let balance = await (await this.raptoreumCore).getAssetBalance(buyer, tokenValido.address, asset.assetId)
                                    if (balance > getTokenBalanceOfBuyer) {
                                        let retirarDeEmergenciaDelCliente = await (await this.raptoreumCore).withdrawToken(buyer, vendedor.sellerAddress, data.cantidad, asset.assetId);
                                        if (retirarDeEmergenciaDelCliente) {
                                            let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock")
                                            let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock")
                                          socket.emit("accountUnblocked")
                                        }
                                       } else {
                                        socket.emit("blockAccount")
                                        setTimeout(intentarRetiradaDeEmergenciaDeToken, 30000);
                                      }
                                  }, 30000);
                                };
                                intentarRetiradaDeEmergenciaDeToken();
                            } else if (!retirarDelVendedor && retirar) {
                                //¿por que let resultBlockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "block" si ya le devolví el dinero?)
                                let resultBlockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "block")
                                let reembolzarAlBuyer = await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworld", tokenValido.address, raptoreumNecesario);
                                socket.emit("errorDeCompra")


                                const intentarRetiradaDeEmergencia = async () => {
                                    setTimeout(async () => {
                                        let balance = await (await this.raptoreumCore).getAccountBalance(vendedor.vendedorId);
                                        if (balance >= resultGetRaptoreumBalanceOfVendedor + raptoreumNecesario - 0.1) {
                                            console.log("Intentando retirar el Raptoreum enviado");
                                            //en esta linea vas:
                                            let retirarDeEmergenciaDelVendedor = await (await this.raptoreumCore).withdrawRaptoreum(vendedor.vendedorId, "RYZ9vWUmG3sepJXEqxDQAGEtDLxscei76K", raptoreumNecesario - 0.1);
                                            if (retirarDeEmergenciaDelVendedor) {
                                                let resultUnblockSeller = await (await this.gateway).blockOrUnblockUserTransactions(vendedor.vendedorId, "unblock");
                                            }
                                        } else {

                                            setTimeout(intentarRetiradaDeEmergencia, 30000);
                                        }
                                    }, 30000);
                                };

                                intentarRetiradaDeEmergencia();
                            }

                          } else if (resultGetBalanceOfVendedor < data.cantidad) {
                              socket.emit("sellerNotEnoughTokens")
                          } else if (getBalanceOfBuyer < (raptoreumNecesario + 1)) {
                              socket.emit("buyerNotEnoughRaptoreum")
                          }else{
                            console.log("EEEELSEEE")
                          }

                      }else{
                        socket.emit('notSelling')
                      }


                    } else {
                        socket.emit("notSelling")
                    }

                }

            }
        }else if(tokenValido=="expired")
        {
          socket.emit("expired")
        }
    } else {
        console.log("elseeeeeeeeeee")
    }

  })
})}
private async getAssetsMarket(): Promise<any> {
  console.log("get market assets disparada");

  try {
    let marketAssets = await (await this.gateway).getMarketAssets();

    // Mapear las promesas de balance y esperar a que todas se resuelvan
    const balancePromises = await Promise.all(marketAssets.map(async (e: any) => {
      let orden = e._id;
      let vendedor = await (await this.gateway).getVendedorDelToken(orden);
      let balance = await (await this.raptoreumCore).getAssetBalance(vendedor.vendedorId, vendedor.sellerAddress, e.assetId);
      console.log("paso 1 consolear balance obtenido en el mapeo de marketAssets:", balance);

      if (balance > 1) {
        console.log("paso 2 el balance es mayor a 1, asignando balance al elemento");
        e.balance = balance;
        return e;
      } else if (balance < 1) {
        try {
          console.log("paso 2 el balance es menor a 1, detenemos la venta del asset");
          let resultDetenerVenta = await (await this.gateway).detenerVenta(vendedor.vendedorId, orden);
          console.log("RESULT DETENER VENTA:", resultDetenerVenta);
          console.log("venta detenida");
        } catch (e) {
          console.log("ERROR EN GETASSETSMARKET", e);
        }finally{
          return undefined
        }

      }
    }));

    // Filtrar los elementos que no son undefined
    const filteredAssets = balancePromises.filter(asset => asset !== undefined);

    return filteredAssets;
  } catch (e) {
    console.log("ERROR NO CENTRALIZADO EN IF DE BALANCE MAYOR A 1:", e);
  }
}

                 public async assetToMarket(asset:string,token:string,price:string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("primer paso")
        const usuariodecodificado = await decodeToken(token);
        if(usuariodecodificado != "error" && usuariodecodificado!="expired"){
          let result=await (await this.gateway).verifyTokenEnVenta(asset,usuariodecodificado.userid)
          console.log("segundo paso")
          console.log("result verifytokenenventa:",result)
          if (result===true){
           console.log("rejecting cuz verifytokenenventa es true")
              reject("selling")
            }else if(result===false){
console.log("false verifytokenenventa")
              const usuariofinal = usuariodecodificado.usuario;
              const userid=usuariodecodificado.userid
              const selleraddress = usuariodecodificado.address;
              let assetBalance=await (await this.raptoreumCore).getAssetBalance(usuariodecodificado.userid,usuariodecodificado.address,asset)
    console.log("asset balance")
     if(assetBalance >1){
                console.log("tiene al menos un asset")                                                    //
            let result=await (await this.gateway).insertAssetInMarket(asset,userid,usuariofinal,selleraddress,price)
              if(result){
                resolve(result)
               }else{
                reject("assetToMarketError")
               }
            } else if(assetBalance ==0){
              reject("tooLowBalance")
            }

            }else if(result==="errorGettingToken"){
              reject("assetToMarketError")
            }
        }else if(usuariodecodificado=="expired"){
          console.log("aplicandonorlogged")
          reject("notLogged")
        }else if(usuariodecodificado == "error"){
          reject("error")
        }

      } catch (error) {
        console.log("error de aassettomarket",error)
        if(error=='el activo no existe por lo tanto no puede ser vendido')
        {
          reject("notExists")
        }
        else if(error=="selling"){
          reject("selling")
        }
        else{
          reject("error")
        }
      }
         })}

        }
