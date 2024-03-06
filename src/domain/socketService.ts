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
  
      let subject:string=object.subject

      let user:string=object.token

  
        if(subject =='balance')
        {      
            let result=await this.getUserInfo(user)
            if(result!==false){
              socket.emit("balance",result)
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

  socket.on("getBalance", async (json: any, senderSocket:any) => {
    const result=await this.getUserInfo(json.token)
    if(result!==false){
      socket.emit("balance",result)
    }
    
  });

  }catch(e){
    console.log(e)
  }
  })
}

private async getUserInfo(token:string): Promise<{balance:any,address:string} | {address:string} | false> {
  let tokenValido=await decodeToken(token,CONFIG.JWT_SECRET)
  if(tokenValido != null)
  {
    let usuariofinal = tokenValido.data;

  let address=await (await this.gateway).getUserAddress(usuariofinal)
  if(address=='none'){
    console.log("address es none")
    return {address:address}
  }else{
    console.log("address no es none")
    let balance= await (await this.raptoreumCore).getAccountBalance(address)
     return {balance:balance,address:address}  
  }
  }else{
    return false
  }
}
  
}
 

