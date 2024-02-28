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
    getAccountBalance(account:any){
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
    createWallet(client:string){

        let address
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
          
        return address
    }
    sendRaptoreum(to){

    }

    
}


