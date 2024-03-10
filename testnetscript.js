const { exec } = require('child_process');
let jsonparseado={name:"MyCoin", updatable:false, is_unique:false, decimalpoint:0,type:0, targetAddress:"rau2d3EvbQeHC2UZDw4t5bmz86GKqsR21y", issueFrequency:0, amount:10, ownerAddress:"rau2d3EvbQeHC2UZDw4t5bmz86GKqsR21y"}
let jsonstring=JSON.stringify({name:"MyCoin", updatable:false, is_unique:false, decimalpoint:0,type:0, targetAddress:"rau2d3EvbQeHC2UZDw4t5bmz86GKqsR21y", issueFrequency:0, amount:10, ownerAddress:"rau2d3EvbQeHC2UZDw4t5bmz86GKqsR21y"})
exec(`raptoreum-cli -rpcwallet=rorroporro createasset '${jsonstring}'`, { cwd: 'C:/Users/56947/Desktop/raptoreum' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el comando: ${error.message}`);
  
    } else if (stderr) {
      console.error(`Error en la salida estándar: ${stderr}`);
  
    } else {
      console.log(jsonstring)
    }
  });
