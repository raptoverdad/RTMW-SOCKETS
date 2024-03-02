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
    public async getAccountBalance(account:any){
        // Retroceder un directorio
    let  raptoreumAddress=account
    exec(`dir`, {cwd: 'C:/Users/56947/projects'}, (error:any, stdout:any, stderr:any) => {
    if (error) {
      console.error(`Error al retroceder el directorio: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error en la salida estándar: ${stderr}`);
      return;
    }else{
       console.log(`Salida estándar del comando "dir":\n${stdout}`);
    }
    // Listar archivos en el directorio actual  
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
            console.log(walletAddress)
            resolve(walletAddress);
          }
        });
      });
    }
   

    
}


