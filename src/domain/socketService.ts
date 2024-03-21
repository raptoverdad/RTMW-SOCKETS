import {CONFIG} from '../config/testingconfig'
import { Server, Socket } from 'socket.io';
import {UserGateway} from '../dataaccess/gateway'
import { decodeToken } from './jwtFunctions';
import { raptoreumCoreAccess} from './raptoreumCoreFunctions'
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

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
    const certPath = path.join(__dirname, '..', '..', '..', 'raptoreumworld.crt');
    const keyPath = path.join(__dirname, '..', '..', '..', 'raptoreumworld.key');
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    this.io = new Server(
      https.createServer(options).listen(4000),
      {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          credentials: false,
        },
      }
    );
   console.log("conectado en"," ",4000)
 
  
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

  try {    
        if(subject=="balance"){
          if(tokenExpresion.test(user))
          {
          const result=await decodeToken(user,CONFIG.JWT_SECRET)
          if(result!=null){
          const encontrado =await(await this.gateway).verifyAccountBlocked(result.usuario)
          if(encontrado===true){
            socket.emit("blockAccount",result.usuario)
          }else if(encontrado===false){
            let result=await this.getUserInfo(user)
            if(result!==false){
              socket.emit("balance",result)
            }
          }
          }
          }
        }else if(subject=="assetsmarket"){
         let result=await this.getAssetsMarket()
         socket.emit("assetsmarket",result)
        }
    
  } catch (error) {
    console.log(error)
  }
  socket.on("getBalance", async (json: any, senderSocket:any) => {
    if (tokenExpresion.test(json.token)){ 
      const resultToken=await decodeToken(json.token,CONFIG.JWT_SECRET)
      if(resultToken){
      const encontrado =await(await this.gateway).verifyAccountBlocked(resultToken.usuario)
      if (encontrado===false) {
        const result=await this.getUserInfo(json.token) 
        if(result!==false)
        {
          socket.emit("balance",result)
        }
      } else if(encontrado){
        socket.emit("blockAccount",resultToken.usuario)
      } 
    }
    }
  }); 
  socket.on("withdraw", async (json: any, senderSocket:any) => {
    if (tokenExpresion.test(json.token) && addressExpresion.test(json.to)){ 
      const result=await decodeToken(json.token,CONFIG.JWT_SECRET)

      if(result!=null)
      {
        const encontrado = await(await this.gateway).verifyAccountBlocked(result.usuario)
        if (encontrado===false) {
          console.log("password de withdraw:",json.password)
        let verifyPass=await (await this.gateway).verifyPassword(result.usuario,json.password)
        if(verifyPass){
          console.log("contra verificada",json.password)
          let float=parseFloat(json.amount)
          try {
            console.log("coin:",json.coin)
            if(json.coin=='raptoreum'){
              console.log("pasamos a coin raptoreum")
              console.log("coin:",json.password)
              let resultGetRaptoreumBalance=await (await this.raptoreumCore).getAccountBalance(result.usuario)
              if(resultGetRaptoreumBalance >= json.amount+1)
              {
                console.log("el balance de la cuenta de raptoreum es el suficiente")
                try {
                  let withdraw=await (await this.raptoreumCore).withdrawRaptoreum(result.usuario,json.to,float)
                  if(withdraw){
                    socket.emit("successfulWithdraw")
                   
                  }     
                } catch (error) {
                  console.log(error)
                  if(error!==false){
                    socket.emit("notEnoughBalance")
                  }else{
                    socket.emit("withdrawError")
                  }
                } finally{
                  let ricaComision=await (await this.raptoreumCore).withdrawRaptoreum(result.usuario,"RRk1kqXNWfgzLB8EWENBw2cgTEibgQPhcW",0.9)
                }
              }else  if(resultGetRaptoreumBalance < json.amount+1)
              {
                socket.emit("notEnoughBalance")
              }
        
            }else{
              let resultGetBalanceOfVendedor=await (await this.raptoreumCore).getAssetBalance(result.usuario,result.address,json.coin)
              let withdraw=await (await this.raptoreumCore).withdrawToken(result.usuario,json.to,float,json.asset)
              if(withdraw){
                let withdraw=await (await this.raptoreumCore).withdrawRaptoreum(result.usuario,"RRk1kqXNWfgzLB8EWENBw2cgTEibgQPhcW",0.8)
                socket.emit("successfulWithdraw")
              }else{
                socket.emit("withdrawError")
              }
            }
          
          } catch (error) {
            if(error!=false){
              socket.emit("notEnoughBalance")
            }else{
              socket.emit("withdrawError")
            }
          }
        }else{
          socket.emit("wrongPassword")
        }
     
  
      }else if(encontrado){
      socket.emit("blockAccount",result.usuario)
    }
  }
     }
  }); 
  socket.on("validAddress", async (data: string, senderSocket:any) => {
    if(addressExpresion.test(data)){
      try {
        let result=await (await this.raptoreumCore).validateAddress(data)
        if(result){
          socket.emit("validAddressResult",true)
        }else if(!result){
          socket.emit("validAddressResult",false)
        }
      } catch (error) {
        console.log(error)
      }
    } 
  });
  socket.on('detenerVenta',async(data:{token:string,asset:string})=>{
    if (tokenExpresion.test(data.token) && assetExpresion.test(data.asset)) {
    let tokenValido=await decodeToken(data.token,CONFIG.JWT_SECRET)
       
    if(tokenValido != null)
    {
      let usuario=tokenValido.usuario
      const encontrado = await(await this.gateway).verifyAccountBlocked(usuario)
      if (encontrado===false) {
        let asset=data.asset
        let resultDetenerVenta=await (await this.gateway).detenerVenta(usuario,asset)
        if(resultDetenerVenta){
          this.io.sockets.emit("ventaDetenida",{asset:asset,vendedor:usuario})
        }
      }else if(encontrado===true){
        socket.emit("blockAccount",usuario)
      }
    }
}
  })
  socket.on('compra',async(data:{token:string,asset:string,contraseña:string,cantidad:number,price:number,vendedor:string})=>{
    if (tokenExpresion.test(data.token) 
    // esta está fallando && assetExpresion.test(data.asset)
  
  //  && numberExpression.test(data.cantidad.toString() )
  //  && passwordExpresion.test(data.contraseña)
  //  && numberExpression.test(data.price.toString())
  //  && minusStringExpression.test(data.vendedor)
    ){
      console.log("La cadena es válida");
    
    let tokenValido=await decodeToken(data.token,CONFIG.JWT_SECRET)
    if(tokenValido != null)
    {
      let buyer:string=tokenValido.usuario
      const encontrado = await(await this.gateway).verifyAccountBlocked(buyer)
     if (encontrado===true) {
      socket.emit("blockAccount",buyer)
      return
      } else  if (encontrado===false){ 
      let assetsEnVentaDelVendedor=await (await this.gateway).getMarketAssetsByUser(data.vendedor)
      if (assetsEnVentaDelVendedor.length > 0){
       let asset=   assetsEnVentaDelVendedor.find(e=>{
          return e.asset==data.asset && e.vendedor==data.vendedor 
        })
        if(asset){
          let resultGetBalanceOfVendedor=await (await this.raptoreumCore).getAssetBalance(data.vendedor,asset.sellerAddress,asset.assetId)
          let resultGetRaptoreumBalanceOfVendedor=await (await this.raptoreumCore).getAccountBalance(data.vendedor)
          let getBalanceOfBuyer=await (await this.raptoreumCore).getAccountBalance(buyer)
          let getTokenBalanceOfBuyer=await (await this.raptoreumCore).getAssetBalance(buyer,tokenValido.address,asset.assetId)
          let raptoreumNecesario=data.cantidad*asset.price
          if(resultGetBalanceOfVendedor >= data.cantidad && getBalanceOfBuyer >= raptoreumNecesario+0.8){     
                console.log("direccion a enviar RTM:",asset.sellerAddress)    
                 let retirar=await (await this.raptoreumCore).withdrawRaptoreum(buyer,asset.sellerAddress,raptoreumNecesario)
                 let retirarDelVendedor=await (await this.raptoreumCore).withdrawToken(data.vendedor,tokenValido.address,data.cantidad,asset.assetID)
                 if(retirar && retirarDelVendedor){
                  let comisionRTMWORLD=await (await this.raptoreumCore).withdrawRaptoreum(buyer,"RQfvPMJjrLmHJnn3fWmEhz3Lpp4KKdKvdE",0.7)
                  let resultGetBalanceOfVendedor=await (await this.raptoreumCore).getAssetBalance(data.vendedor,asset.sellerAddress,asset.assetId)
                  socket.emit("compraExitosa")
                  this.io.sockets.emit("venta",{vendedor:data.vendedor,asset:data.asset,assetID:asset.assetID,balance:resultGetBalanceOfVendedor})
                } else if (!retirar && retirarDelVendedor) {
                  let resultBlockBuyer=await (await this.gateway).blockOrUnblockUserTransactions(buyer,"block")
                  let resultBlockSeller=await (await this.gateway).blockOrUnblockUserTransactions(data.vendedor,"block")
                  socket.emit("errorDeCompra")
                  this.io.sockets.emit("blockAccount",data.vendedor)
                  this.io.sockets.emit("blockAccount",buyer)      
                  let retirarDeRaptoreumWorld=await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworld",tokenValido.address,0.3)
                  const intentarRetiradaDeEmergenciaDeToken = async () => {
                    let balance=await (await this.raptoreumCore).getAssetBalance(buyer,tokenValido.address,asset.assetId)
                    if(balance >= getTokenBalanceOfBuyer){
                      let retirarDeEmergenciaDelCliente = await (await this.raptoreumCore).withdrawToken(buyer, asset.sellerAddress, data.cantidad, asset.assetID);
                      if (retirarDeEmergenciaDelCliente)
                         {
                          let resultBlockBuyer=await (await this.gateway).blockOrUnblockUserTransactions(buyer,"unblock")
                          let resultBlockSeller=await (await this.gateway).blockOrUnblockUserTransactions(data.vendedor,"unblock")
                          this.io.sockets.emit("accountUnblocked",buyer)
                          this.io.sockets.emit("accountUnblocked",data.vendedor)
                          }
                    }else{
                      this.io.sockets.emit("blockAccount",buyer)
                      this.io.sockets.emit("blockAccount",data.vendedor)
                      setTimeout(intentarRetiradaDeEmergenciaDeToken, 4000);
                    }
                  
                };
                intentarRetiradaDeEmergenciaDeToken();
              } else if (!retirarDelVendedor && retirar) {
                let resultBlockBuyer=await (await this.gateway).blockOrUnblockUserTransactions(buyer,"block")
                let resultBlockSeller=await (await this.gateway).blockOrUnblockUserTransactions(data.vendedor,"block")
                socket.emit("errorDeCompra")
                this.io.sockets.emit("blockAccount",data.vendedor)
                this.io.sockets.emit("blockAccount",buyer)
                let reembolzarAlBuyer= await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworld", tokenValido.address, raptoreumNecesario);
                const intentarRetiradaDeEmergencia = async () => {
                  setTimeout(async () => {
                    let balance = await (await this.raptoreumCore).getAccountBalance(data.vendedor);
                    if (balance >= resultGetRaptoreumBalanceOfVendedor + raptoreumNecesario - 0.1) {
                      console.log("Intentando retirar el Raptoreum enviado");
                      let retirarDeEmergenciaDelVendedor = await (await this.raptoreumCore).withdrawRaptoreum(data.vendedor, "RQfvPMJjrLmHJnn3fWmEhz3Lpp4KKdKvdE", raptoreumNecesario - 0.1);
                      if (retirarDeEmergenciaDelVendedor) {
                        let resultUnblockBuyer = await (await this.gateway).blockOrUnblockUserTransactions(buyer, "unblock");
                        let resultUnblockSeller = await (await this.gateway).blockOrUnblockUserTransactions(data.vendedor, "unblock");
                        this.io.sockets.emit("accountUnblocked", data.vendedor);
                        this.io.sockets.emit("accountUnblocked", buyer);
                      }
                    } else {
                      this.io.sockets.emit("blockAccount", data.vendedor);
                      this.io.sockets.emit("blockAccount", buyer);
                      setTimeout(intentarRetiradaDeEmergencia, 30000);
                    }
                  }, 30000);
                };
                
                intentarRetiradaDeEmergencia();
              }
        
          }else if(resultGetBalanceOfVendedor <data.cantidad ){
            socket.emit("sellerNotEnoughTokens")
          }else if( getBalanceOfBuyer < raptoreumNecesario)
          {
            socket.emit("buyerNotEnoughRaptoreum")
          }
       
        }else{
          socket.emit("notSelling")
        }
      
      }

    }
  } 
} else{
  console.log("elseeeeeeeeeee")
}

  })

  })
  this.getBalanceeeee()
  this.withdrawTest()
}

private async getBalanceeeee(){
  await (await this.raptoreumCore).getAccountBalance("rorro")
}
private async withdrawTest(){
  await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworld","RDpWT71tTCrkzNmdSJ6dfDt6ky5G6YPCSk",1)
}
  
private async getUserInfo(token: string): Promise<any> {
  try {
    let tokenValido = await decodeToken(token, CONFIG.JWT_SECRET);
    if (tokenValido != null) {
      let usuariofinal = tokenValido.usuario;
      let assetsDelUsuario: any[] = [];
      let userRaptoreumData;

      let address = await (await this.gateway).getUserAddress(usuariofinal);
      if (address == 'none') {
        console.log("address es none");
        userRaptoreumData = { address: address };
      } else {
        console.log("address no es none");
        let balance = await (await this.raptoreumCore).getAccountBalance(usuariofinal);
        userRaptoreumData = { balance: balance, address: address };
        
        let assetsEnVentaDelUsuario = await (await this.gateway).getMarketAssetsByUser(usuariofinal);
        let todosLosAssets = await (await this.gateway).getAssets();
        
        assetsDelUsuario = await Promise.all(todosLosAssets.map(async (element) => {
          // Utilizamos una función async para poder utilizar await dentro de la función map
          const balance = await (await this.raptoreumCore).getAssetBalance(tokenValido.usuario, tokenValido.address, element.assetId);
          element.balance = balance;
    
          if (assetsEnVentaDelUsuario.length > 0) {
              console.log("encontramos assets en venta (rodrigo el mejor)");
              const enVenta = assetsEnVentaDelUsuario.some(asset => asset.asset === element.asset);
              element.enVenta = enVenta;
              console.log("asset.enVenta de rodrigoelmejor:", enVenta);
          } else {
              element.enVenta = false;
          }
    
          if (element.balance > 0 || element.creador === usuariofinal || element.enVenta || element.vendedor === usuariofinal) {
              return element;
          }
        }));
      }

      if (assetsDelUsuario.length > 0) {
        return { raptoreumData: userRaptoreumData, todosLosAssets: assetsDelUsuario };
      } else {
        return { raptoreumData: userRaptoreumData, todosLosAssets: "no hay assets del usuario" };
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}
private async getAssetsMarket(): Promise<any> {
  let marketAssets=await (await this.gateway).getMarketAssets()
  const balancePromises = marketAssets.map(async (e) => {
    e.balance = await (await this.raptoreumCore).getAssetBalance(e.vendedor, e.sellerAddress, e.assetId);
    return e;
  });

  // Esperar a que todas las promesas se resuelvan
  marketAssets = await Promise.all(balancePromises);

  return marketAssets;
}
}
 

