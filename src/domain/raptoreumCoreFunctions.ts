import { rejects } from "assert";

const { exec } = require('child_process');

export class raptoreumCoreAccess {
    private static instance: raptoreumCoreAccess;
    public static async getInstance(): Promise<raptoreumCoreAccess>
    {
      if (!raptoreumCoreAccess.instance) {
        raptoreumCoreAccess.instance = new raptoreumCoreAccess();
     
      }
      return raptoreumCoreAccess.instance;
    }
    public async getAccountBalance(address:any): Promise<string | null>{
      return new Promise((resolve, reject) => {
        // Retroceder un directorio
        exec(`raptoreum-cli -rpcwallet=${address} getbalance`, {cwd: 'C:/Users/56947/Desktop/raptoreum'}, (error:any, stdout:any, stderr:any) => {
        if (error) {
          console.error(`Error al retroceder el directorio: ${error.message}`);
          reject(error);
        }
        if (stderr) {
          console.error(`Error en la salida estándar: ${stderr}`);
          reject(new Error(stderr));
        }else{
          console.log(`Salida GETACCOUNTBALANCE:\n${stdout}`);
          const outputLines = stdout.trim().split('\n');
          const addressBalance = outputLines[outputLines.length - 1].trim();
          resolve(addressBalance)
    }
    // Listar archivos en el directorio actual  
  });
}) }
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


