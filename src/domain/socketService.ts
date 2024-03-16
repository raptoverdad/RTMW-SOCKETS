const http = require('http');
import {CONFIG} from '../config/testingconfig'
import { Server, Socket } from 'socket.io';
import {UserGateway} from '../dataaccess/gateway'
import { decodeToken } from './jwtFunctions';
import { raptoreumCoreAccess} from './raptoreumCoreFunctions'


export class socketService {
  private gateway= UserGateway.getInstance()
  private raptoreumCore=raptoreumCoreAccess.getInstance()
  private io: Server;
  private key:string;
  private withdrawBlockedAccounts:any[] =[]
  private usersConected:any;

  constructor() {
    this.key="skrillex"
    this.io = new Server(
      http.createServer().listen(4000),
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
        let result=await this.getUserInfo(user)
        if(result!==false){
          socket.emit("balance",result)
        }else{
          console.log("NO SE PUDO EMITIR EL SOCKET")
        }
      }else if(subject=="assetsmarket"){
       let result=await this.getAssetsMarket()
       socket.emit("assetsmarket",result)
      }
    
 
  } catch (error) {
    console.log(error)
  }
    
     
 



  socket.on("getBalance", async (json: any, senderSocket:any) => {
  
      const result=await this.getUserInfo(json.token) 
      if(result!==false)
      {
        socket.emit("balance",result)
      }
    
  });
 
  socket.on("validAddress", async (data: string, senderSocket:any) => {
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
 
  });
  socket.on('detenerVenta',async(data:{token:string,asset:string})=>{
    let tokenValido=await decodeToken(data.token,CONFIG.JWT_SECRET)
    if(tokenValido != null)
    {
    let usuario=tokenValido.usuario
    let asset=data.asset
    let resultDetenerVenta=await (await this.gateway).detenerVenta(usuario,asset)
    if(resultDetenerVenta){
      this.io.sockets.emit("ventaDetenida",{asset:asset,vendedor:usuario})
    }
    }
  })
  socket.on('compra',async(data:{token:string,asset:string,contraseña:string,cantidad:number,price:number,vendedor:string})=>{
    let tokenValido=await decodeToken(data.token,CONFIG.JWT_SECRET)
    if(tokenValido != null)
    {
      let buyer:string=tokenValido.usuario
      let assetsEnVentaDelVendedor=await (await this.gateway).getMarketAssetsByUser(data.vendedor)
      if (assetsEnVentaDelVendedor.length > 0){
       let asset=   assetsEnVentaDelVendedor.find(e=>{
          return e.asset==data.asset && e.vendedor==data.vendedor 
        })
        if(asset){
          let resultGetBalanceOfVendedor=await (await this.raptoreumCore).getAssetBalance(data.vendedor,asset.sellerAddress,asset.assetId)
          let getBalanceOfBuyer=await (await this.raptoreumCore).getAccountBalance(buyer)
          let raptoreumNecesario=data.cantidad*asset.price
          if(resultGetBalanceOfVendedor >= data.cantidad && getBalanceOfBuyer > raptoreumNecesario){         
                 let retirar=await (await this.raptoreumCore).withdrawRaptoreum(buyer,asset.sellerAddress,raptoreumNecesario)
                 let retirarDelVendedor=await (await this.raptoreumCore).withdrawToken(data.vendedor,tokenValido.address,data.cantidad,asset.assetID)
                 if(retirar && retirarDelVendedor){
                  let resultGetBalanceOfVendedor=await (await this.raptoreumCore).getAssetBalance(data.vendedor,asset.sellerAddress,asset.assetId)
                  socket.emit("compraExitosa")
                  this.io.sockets.emit("venta",{vendedor:data.vendedor,asset:data.asset,assetID:asset.assetID,balance:resultGetBalanceOfVendedor})
                } else if (!retirar && retirarDelVendedor) {
                  this.withdrawBlockedAccounts.push({ usuario: buyer })
                  let getBalanceOfBuyer=await (await this.raptoreumCore).getAccountBalance(buyer)
                  if(getBalanceOfBuyer<1){
                    let retirarDeRaptoreumWorld=await (await this.raptoreumCore).withdrawRaptoreum("raptoreumworld",tokenValido.address,1)
                  }
                  const intentarRetiradaDeEmergenciaDeToken = async () => {
                    let retirarDeEmergenciaDelCliente = await (await this.raptoreumCore).withdrawToken(buyer, asset.sellerAddress, data.cantidad, asset.assetID);
                    if (retirarDeEmergenciaDelCliente) {
                        let index = this.withdrawBlockedAccounts.findIndex(objeto => objeto.usuario === data.vendedor);
                        // Si se encuentra el índice del objeto, elimínalo del array
                        if (index !== -1) {
                            this.withdrawBlockedAccounts.splice(index, 1);
                        }
                        this.io.sockets.emit("accountUnblocked",buyer)
                    } else {
                        this.io.sockets.emit("blockAccount",buyer)
                        // Si la retirada no fue exitosa, esperar y volver a intentarlo después de 4 segundos
                        setTimeout(intentarRetiradaDeEmergenciaDeToken, 4000);
                    }
                };
                intentarRetiradaDeEmergenciaDeToken();
              } else if (!retirarDelVendedor && retirar) {
                this.withdrawBlockedAccounts.push({ usuario: data.vendedor });
                // Función para intentar la retirada de emergencia
                const intentarRetiradaDeEmergencia = async () => {
                    let retirarDeEmergenciaDelVendedor = await (await this.raptoreumCore).withdrawRaptoreum(data.vendedor, tokenValido.address, raptoreumNecesario - 0.5);
                    if (retirarDeEmergenciaDelVendedor) {
                        let index = this.withdrawBlockedAccounts.findIndex(objeto => objeto.usuario === data.vendedor);
                        // Si se encuentra el índice del objeto, elimínalo del array
                        if (index !== -1) {
                            this.withdrawBlockedAccounts.splice(index, 1);
                        }
                        this.io.sockets.emit("accountUnblocked",data.vendedor)
                    } else {
                        this.io.sockets.emit("blockAccount",data.vendedor)
                        // Si la retirada no fue exitosa, esperar y volver a intentarlo después de 4 segundos
                        setTimeout(intentarRetiradaDeEmergencia, 4000);
                    }
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
  })

  })
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
 

