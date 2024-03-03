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
  private usersConected:any;

  constructor() {
    this.key="skrillex"
    this.io = new Server(
      http.createServer().listen(process.env.PORT),
      {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          credentials: false,
        },
      }
    );
   console.log("conectado en"," ",3001)
  this.createAddress()
  
    this.io.use(async (sockete:any, next:any) => {
      let frontendKey = await sockete.handshake.query.key;
      if (frontendKey !== this.key) {
        throw new Error("invalid socket connection")
      } else {
        next();
      }
    });

    this.io.on("connection", async(socket:any) => {
      let subject:string=await socket.handshake.query.object.subject
      let user:string=await socket.handshake.query.object.token
      let tokenValido=await decodeToken(user,CONFIG.JWT_SECRET)
      if(tokenValido != null)
      {
        let usuariofinal = tokenValido.data;
        if(subject =='balance')
        {      
          let address=await (await this.gateway).getUserAddress(usuariofinal)
          let balance= await (await this.raptoreumCore).getAccountBalance(address)
          socket.emit("balance",{balance:balance,address:address})    
        }
      }    

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
  socket.on("getUserInfo", async (json: any, senderSocket:any) => {
    this.getUserInfo(json.token)

  });
  socket.on("crearWallet", async (json: any) => {
    const usuariodecodificado = await decodeToken(json.token, CONFIG.JWT_SECRET);
    const usuariofinal = usuariodecodificado.data;
    let result = false;
    while (!result) {
        let wallet= await (await this.raptoreumCore).createWallet();
        if(typeof wallet =='string'){
           //insertWallet func returns true or false
          result = await (await this.gateway).insertWallet(usuariofinal, wallet);
        }else{
          result=false
        }
       
    }
  });

  }catch(e){
    console.log(e)
  }
  })
}
private async createAddress(): Promise<void> {
  await (await this.raptoreumCore).createWallet();
}
private async getUserInfo(token:string): Promise<{balance:string,address:string} | Error> {

  let tokenValido= decodeToken(token,CONFIG.JWT_SECRET)
  if(tokenValido != null)
  {
    const usuarioFinal = tokenValido.data;
    try {
      let address=await (await this.gateway).getUserAddress(usuarioFinal);
      let balance=await (await this.raptoreumCore).getAccountBalance(address);
      if(balance!=null){
        return{balance,address}
      }else{
        return new Error("error trying to get account balance")
      }   
    } catch (error) {
      return new Error("error trying to get account balance")
    }
   
  }else
  {
    return new Error("not valid token")
  }

}
  
}
 

