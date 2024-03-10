const http = require('http');
import {CONFIG} from '../config/testingconfig'
import { Server, Socket } from 'socket.io';
import {UserGateway} from '../dataaccess/gateway'
import { decodeToken } from './jwtFunctions';
import { raptoreumCoreAccess} from './raptoreumCoreFunctions'

let tokenExpression=/^[A-Za-z0-9.]+$/
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
  
      let subject:string=object.subject.trim()

      let user:string=object.token

  
        if(subject =='balance' && tokenExpression.test(user))
        {      
            let result=await this.getUserInfo(user)
            if(result!==false){
              socket.emit("balance",result)
            }
     
        }else{
          socket.emit("invalidToken")
        }
     
     
        

  try {
 
  socket.on("getBalance", async (json: any, senderSocket:any) => {
    if(tokenExpression.test(json.token)){
      const result=await this.getUserInfo(json.token)
      if(result!==false)
      {
        socket.emit("balance",result)
      }
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
    let balance= await (await this.raptoreumCore).getAccountBalance(usuariofinal)
     return {balance:balance,address:address}  
  }
  }else{
    return false
  }

}
  
}
 

