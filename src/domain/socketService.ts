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
      let materia:string=await socket.handshake.query.materia
      if(materia =='misiones')
      {
      let misiones=await (await this.gateway).getMisiones()
       socket.emit("misiones",misiones)    
      }
      else if(materia=="personas")
      {  
       //funcion que devuelve misiones
       socket.emit('personas')
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
  socket.on("getAccountBalance", async (json: any, senderSocket:any) => {
    //falta verificacion del json  
    let tokenValido=await decodeToken(json.token,CONFIG.JWT_SECRET)
    if(tokenValido != null)
    {
      const usuariodecodificado = await decodeToken(json.token, CONFIG.JWT_SECRET);
      let address=await (await this.gateway).getUserAddress(usuariodecodificado);
      let balance=await (await this.raptoreumCore).getAccountBalance(address);
      socket.emit("accountBalance",balance)
  
    }else
    {
      socket.emit("notValidToken")
      console.log("emmiting not valid token")
    }
  });
  socket.on("crearWallet", async (json: any, senderSocket:any) => {
    const usuariodecodificado = await decodeToken(json.token, CONFIG.JWT_SECRET);
    const usuariofinal = usuariodecodificado.data;
    let result = false;
    while (!result) {
        let wallet= await (await this.raptoreumCore).createWallet();
        if(typeof wallet =='string'){
          result = await (await this.gateway).insertWallet(usuariofinal, wallet);
        }else{
          result=false
        }
        //insertWallet func returns true or false
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
private async getAccountBalance(): Promise<void> {
 
}
  
}
 

