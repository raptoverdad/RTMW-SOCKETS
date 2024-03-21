import { rejects } from "assert";
const { exec } = require('child_process');
import axios from 'axios';



interface RpcRequest {
  jsonrpc: string;
  id: string;
  method: string;
  params: any[];
}
export class raptoreumCoreAccess {
    private static instance: raptoreumCoreAccess;
    public static async getInstance(): Promise<raptoreumCoreAccess>
    {
      if (!raptoreumCoreAccess.instance) {
        raptoreumCoreAccess.instance = new raptoreumCoreAccess();
     
      }
      return raptoreumCoreAccess.instance;
    }

    public async getAccountBalance(usuario: any): Promise<number> {
      try {
        const rpcUser = 'rodrigo';
const rpcPassword = '1234'; // Reemplaza con tu contraseña
const rpcHost = 'http://localhost:10225/wallet/raptoreumworld';
        const requestData: RpcRequest = {
          jsonrpc: '1.0',
          id: 'curltest',
          method: 'getbalance',
          params: ['*',6],
        };
    
        const response = await axios.post(
          rpcHost,
          requestData,
          {
            auth: {
              username: rpcUser,
              password: rpcPassword,
            },
            headers: {
              'Content-Type': 'text/plain;',
            },
          }
        );
    
        if (response) {
          console.log(response)
          const accountBalance = parseFloat(response.data.result);
          return accountBalance;
        } else {

          throw new Error('Error en el formato de respuesta RPC');
        }
      } catch (error:any) {
        console.error(`Error al obtener el saldo de la cuenta: ${error.message}`);
        throw new Error(error);
      }
    }
public async getAssetBalance(vendedor:string,addressVendedor:string,assetId:string): Promise<number>{
  return new Promise((resolve, reject) => {
    // Retroceder un directorio
//    exec(`raptoreum-cli -rpcwallet=${address} getbalance`, {cwd: 'C:/Users/56947/Desktop/raptoreum'}, (error:any, stdout:any, stderr:any) => {
//    if (error) {
//      console.error(`Error al retroceder el directorio: ${error.message}`);
//      reject(error);
//    }
//    if (stderr) {
//      console.error(`Error en la salida estándar: ${stderr}`);
//      reject(new Error(stderr));
//    }else{
//      console.log(`Salida GETACCOUNTBALANCE:\n${stdout}`);
//      const outputLines = stdout.trim().split('\n');
//      const addressBalance = outputLines[outputLines.length - 1].trim();
//      resolve(addressBalance)
//}
//// Listar archivos en el directorio actual  
//});
const numeroAleatorio = Math.floor(Math.random() * 11);
resolve(numeroAleatorio)
}) }
public async withdrawToken(billeteraDelToken:string,to:string,cantidad:number,assetID:string): Promise<boolean>{
  //revisar el balance de raptoreum para poder sacar el token
  return new Promise((resolve, reject) => {
    // Retroceder un directorio
//    exec(`raptoreum-cli -rpcwallet=${address} getbalance`, {cwd: 'C:/Users/56947/Desktop/raptoreum'}, (error:any, stdout:any, stderr:any) => {
//    if (error) {
//      console.error(`Error al retroceder el directorio: ${error.message}`);
//      reject(error);
//    }
//    if (stderr) {
//      console.error(`Error en la salida estándar: ${stderr}`);
//      reject(new Error(stderr));
//    }else{
//      console.log(`Salida GETACCOUNTBALANCE:\n${stdout}`);
//      const outputLines = stdout.trim().split('\n');
//      const addressBalance = outputLines[outputLines.length - 1].trim();
//      resolve(addressBalance)
//}
//// Listar archivos en el directorio actual  
//});
resolve(false)
//reject("Insufficient tokens funds")
}) }
//public async withdrawRaptoreum(username:string,address:string,amount:number): Promise<string | false> {
//  return new Promise((resolve, reject) => {
//      exec(`raptoreum-cli -rpcwallet=C:/Users/56947/AppData/Roaming/RaptoreumCore/${username} sendtoaddress "${address}" ${amount}`, { cwd: 'C:/Users/56947/Desktop/raptoreum' }, (error: any, stdout: any, stderr: any) => {
//        if (error) {
//          console.error(`Error al ejecutar el comando: ${error.message}`);
//          return reject(false);
//        } else if (stderr) {
//          console.error(`Error en la salida estándar: ${stderr}`);
//          return reject(false);
//        } else {
//            console.log(stdout)
//          console.log("typeof de stdout:", typeof stdout)
//          console.log("length de stdout:",stdout.length)
//          if( stdout.length== 66){
//            let output=stdout
//            return resolve(output);
//          }else if(stdout.includes("Insufficient")){
//            console.log("rechazando")
//            return reject("Insufficient raptoreum funds");
//          }
//    }});
//  });
//}

public async withdrawRaptoreum(username:string,address:string,amount:number): Promise<string | false> {
  return new Promise(async (resolve, reject) => {
    try {
      const rpcUser = 'rodrigo';
const rpcPassword = '1234'; // Reemplaza con tu contraseña
const rpcHost = `http://localhost:10225/wallet/${username}`;
      const requestData: RpcRequest = {
        jsonrpc: '1.0',
        id: 'curltest',
        method: 'sendtoaddress',
        params: [address, amount],
      };
      const response = await axios.post(
        rpcHost,
        requestData,
        {
          auth: {
            username: rpcUser,
            password: rpcPassword,
          },
          headers: {
            'Content-Type': 'text/plain;',
          },
        }
      );
      if (response) {
        console.log(response)
        const accountBalance = parseFloat(response.data.result);
        return accountBalance;
      } else {

        throw new Error('Error en el formato de respuesta RPC');
      }
    } catch (error:any) {
      console.error(`Errorrrrr enviar rtm de la cuenta: ${error}`);
      throw new Error(error);
    }
  });
}
    //arrglar esta funcion
    public async createWallet(): Promise<string | null> {
      return new Promise((resolve, reject) => {
        exec(`raptoreum-cli -rpcwallet=C:/Users/56947/AppData/Roaming/RaptoreumCore/wallet3/ getnewaddress`, { cwd: 'C:/Users/56947/Desktop/raptoreum' }, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error(`Error al ejecutar el comando: ${error.message}`);
            reject(error);
          } else if (stderr) {
            console.error(`Error en la salida estándar: ${stderr}`);
            reject(stderr);
          } else {
            // Dividir la salida en líneas y tomar la última línea que contiene la dirección de la cartera
            const outputLines = stdout.trim().split('\n');
            const walletAddress = outputLines[outputLines.length - 1].trim();
            // Devolver la dirección de la cartera
            console.log("create wallet address",walletAddress)
            resolve(walletAddress);
          }
        });
      });
    }
    public async validateAddress(address: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        exec(`raptoreum-cli validateaddress "${address}"`, { cwd: 'C:/Users/56947/Desktop/raptoreum' }, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error(`Error al ejecutar el comando: ${error.message}`);
            reject(error.message);
          } else if (stderr) {
            console.error(`Error en la salida estándar: ${stderr}`);
            reject(stderr);
          } else {
            const output = stdout;
            if (output.indexOf('"isvalid":') !== -1) {
              const startIndex = output.indexOf('"isvalid":') + '"isvalid":'.length;
              if (startIndex === undefined) {
                reject(new Error('No se pudo encontrar el índice de inicio'));
              } else {
                const endIndex = output.indexOf(',', startIndex) !== -1 ? output.indexOf(',', startIndex) : output.indexOf('}', startIndex);
                let valid = output.substring(startIndex, endIndex).trim();
                if (valid === 'true') {
                  resolve(true);
                } else if (valid === 'false') {
                  resolve(false);
                } else {
                  reject(new Error('No se pudo determinar si la dirección es válida'));
                }
              }
            } else {
              reject(new Error('No se pudo encontrar el campo "isvalid" en la salida'));
            }
          }
        });
      });
    }

    
}


