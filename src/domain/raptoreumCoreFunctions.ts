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
    public async createWallet(): Promise<boolean | string> {
      let result
        exec(`./raptoreum-cli getnewaddress`, {cwd: 'C:/Users/56947/Desktop/raptoreum-win-1.3.17.05'}, (error:any, stdout:string, stderr:any) => {
            if (error) {
              console.error(`Error al retroceder el directorio: ${error.message}`);
              return false;
            }
            if (stderr) {
              console.error(`Error en la salida estándar: ${stderr}`);
              return false;
            }else{
               result= stdout
            }       
            // Listar archivos en el directorio actual   
          });
          if (typeof result == 'string'){
            return result
          }else{
            return false
          }
    }
   

    
}


