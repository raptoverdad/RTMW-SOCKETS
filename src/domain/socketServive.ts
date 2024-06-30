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
         let result=await this.getAssetsMarket()
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
   }
});
socket.on("validAddress", async (data: {token:string,payload:string}, senderSocket:any) => {
let tokenValido=await decodeToken(data.token)
console.log("TOKEN VALIDO",tokenValido)
console.log("PAYLOAD:",data.payload)
if(tokenValido != 'error' && tokenValido != 'expired'){
  if(addressExpresion.test(data.payload)){
    try {
      let result=await (await this.raptoreumCore).validateAddress(data.payload)
      if(result){
        socket.emit("validAddressResult",true)
      }else if(!result){
        socket.emit("validAddressResult",false)
      }
    } catch (error) {
      console.log(error)
    }
  }
}
});



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
    if (tokenExpresion.test(data.token)
        // esta está fallando && assetExpresion.test(data.asset)

        //  && numberExpression.test(data.cantidad.toString() )
        //  && passwordExpresion.test(data.contraseña)
        //  && numberExpression.test(data.price.toString())
        //  && minusStringExpression.test(data.vendedor)
    ) {
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
                        const cuentaBloqueadaVendedor = await (await this.gateway).verifyAccountBlocked(buyer)
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

  })

}
private async getAssetsMarket(): Promise<any> {
  let marketAssets=await (await this.gateway).getMarketAssets()
  const balancePromises = marketAssets.map(async (e:any) => {
   let orden= e._id
   let vendedor=await (await this.gateway).getVendedorDelToken(orden)
    e.balance = await (await this.raptoreumCore).getAssetBalance(vendedor.vendedorId, vendedor.sellerAddress, e.assetId);
    return e;
  });

  // Esperar a que todas las promesas se resuelvan
  marketAssets = await Promise.all(balancePromises);
 console.log(marketAssets)
  return marketAssets;
}
}
