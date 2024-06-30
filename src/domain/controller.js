
const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
class controller{

constructor(){

}
 async checkRaptoreumd() {

    exec('pgrep raptoreumd', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando el comando: ${error}`);
       return false;
      } else if (stderr) {
        console.error(`Error de stderr: ${stderr}`);
       return false
      } else if (stdout.trim().length > 0) {
        console.log("raptoreumd está corriendo bien");
        return true
      } else {
        return false
      }
    });

}


async  getUserIds() {
  try {
    console.log("SE APAGÓ EL SERVIDOR. TOMANDO USUARIOS DE MYSQL");
    const connection = await mysql.createPool({
      host: '127.0.0.1',
      user: 'raptoreumworld',
      password: 'Bnx6aw300172_',
      database: 'raptoreumworld'
    });

    const [rows, fields] = await (await connection).execute('SELECT userid FROM users WHERE address != ?', ['none']);
    return rows.map(row => row.userid);
  } catch (error) {
    console.error(error);
  }
}

async  printUserIds() {
  const userIds = await getUserIds();
  console.log("EJECUTANDO LA CARGA DE LA WALLET DE WALLETS:");
  userIds.forEach(userid => {
    exec(`raptoreum-cli loadwallet ${userid}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando el comando para ${userid}: ${error}`);
        return;
      }
      console.log(`Comando ejecutado para ${userid}: ${stdout}`);
      if (stderr) {
        console.error(`Error stderr para ${userid}: ${stderr}`);
      }
    });
  });
}
async  runDaemon() {

    const raptoreumdProcess = spawn('raptoreumd', {
      detached: true,
      stdio: 'ignore'
    });

    raptoreumdProcess.unref();

    raptoreumdProcess.on('error', (error) => {
      console.error(`Error al iniciar raptoreumd: ${error}`);
      return false;
    });

    raptoreumdProcess.on('exit', (code, signal) => {
      if (code === 0) {
        console.log('Proceso raptoreumd iniciado exitosamente');
       return true
      } else {
        console.error(`El proceso raptoreumd terminó con código de salida ${code}`);
        return false
      }
    });

}
async start(){
    while(true) {
    
        let check = await this.checkRaptoreumd();
        if(check) {
          console.log("raptoreumd está corriendo, reiniciando ciclo...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue; // repite el ciclo
        } else {
   
          await this.runDaemon();

          await new Promise(resolve => setTimeout(resolve, 15000));

          await this.printUserIds();

        }

    
  }

}
}
let controllerOriginal=new controller()

controllerOriginal.start()
