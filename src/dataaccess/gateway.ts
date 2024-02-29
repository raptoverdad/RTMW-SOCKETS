
import { createPool,RowDataPacket } from 'mysql2';
import * as mysql from 'mysql2/promise';
import {CONFIG} from '../config/testingconfig'
import {decodeToken} from '../domain/jwtFunctions'
import { ResultSetHeader } from 'mysql2/promise';


export class UserGateway {
  private static instance: UserGateway;
  private pool: mysql.Pool | null;

  private constructor() {
    this.pool = null;
  }

  public static async getInstance(): Promise<UserGateway>
  {
    if (!UserGateway.instance) {
      UserGateway.instance = new UserGateway();
      let setup = await UserGateway.instance.setupDatabase();
    }
    return UserGateway.instance;
  }

  public async insertWallet(usuario:String,wallet:String): Promise<boolean> 
  {
    let finalResult: boolean = false;
  
    if (!this.pool) {
      console.log('El pool no está disponible');
      return finalResult;
    }
  
    try {
  
      // Verificar si la hora ya existe para este usuario
      const updateQuery = 'UPDATE users SET wallet=? WHERE user=?';
      const updateValues = [wallet,usuario];
  
      if(this.pool != null){
        const [result, fields] = await (await this.pool).execute(updateQuery, updateValues);
    
        if (result && 'affectedRows' in result){
          let updateWallet = result as ResultSetHeader;
          if(updateWallet.affectedRows <0){
            finalResult=true
            return true
          }else{
            return false
          }
        } else {
          console.log("hubo un error updating la wallet")
          return false
        }
      }else{
        console.log("pool is not up")
        return false
      }
    } catch (error) {
      console.log('Error en el método insertHora', error);
    }
  
    return finalResult;
  }

  public async anularHora(hora:string,usuario:string) :Promise<boolean> 
  {
    let success=false
    let anularHora="DELETE FROM horas WHERE hora = ? AND usuario = ?"
    let valoresDeAnulacion=[hora,usuario]
    if(this.pool!= null){
      let resultado = await this.pool.execute(anularHora, valoresDeAnulacion);
      if (Array.isArray(resultado)) {
        const affectedRows = (resultado[0] as any).affectedRows;
      if (affectedRows !== undefined && affectedRows > 0) {
         success=true
       }else{
        success= false
      }
     }
     
    }
    return success
  }
  public async getMisiones(): Promise<any[]  | string> 
  {
    let getVotesQuery="SELECT * FROM misiones"

    if (!this.pool) {
      throw new Error('No se pudo conectar a la base de datos');
    }else{
      let [result] = await this.pool.execute<RowDataPacket[]>(getVotesQuery);

      if(Array.isArray(result))
      {
    
        if(result.length == 0 || result==undefined)
        {
          return "no misiones"
        }else if(result.length > 0)
        {
          let newArray:any=[]
          result.forEach(i=>{
            newArray.push(i)
          })
          return newArray
        }else{
          return "no misiones"
        }

      }else{
        return "no misiones"
      }
    }
  } 
  public async getPersonas(): Promise<any[]  | string> 
  {
    let getVotesQuery="SELECT * FROM misiones"

    if (!this.pool) {
      throw new Error('No se pudo conectar a la base de datos');
    }else{
      let [result] = await this.pool.execute<RowDataPacket[]>(getVotesQuery);

      if(Array.isArray(result))
      {
    
        if(result.length == 0 || result==undefined)
        {
          return "no misiones"
        }else if(result.length > 0)
        {
          let newArray:any=[]
          result.forEach(i=>{
            newArray.push(i)
          })
          return newArray
        }else{
          return "no misiones"
        }

      }else{
        return "no misiones"
      }
    }
  } 
   public async aceptarRecahazarMision(data: {type:string,token: string,descripcion:string }): Promise<boolean> 
  { 
    let updateMisionesQuery:string=''
    if(data.type=='accept'){
       updateMisionesQuery = "UPDATE misiones SET estado = 'aceptada' WHERE usuario = ? AND descripcion = ?";
    }else if(data.type=='reject'){
      updateMisionesQuery = "UPDATE misiones SET estado = 'rechazada' WHERE usuario = ? AND descripcion = ?";
    }
      const usuariodecodificado = await decodeToken(data.token, CONFIG.JWT_SECRET);
      const updateMisionesValues = [usuariodecodificado, data.descripcion];
      let updateHoraResult: ResultSetHeader | undefined;
            try {
              if(this.pool != null){
                const [result, fields] = await (await this.pool).execute(updateMisionesQuery, updateMisionesValues);
            
                if (result && 'affectedRows' in result) {
                  updateHoraResult = result as ResultSetHeader;
                  if(updateHoraResult.affectedRows <0){
                    return true
                  }else{
                    return false
                  }
                } else {
                  return false
                }
              }else{
                return false
              }
             
            } catch (error) {
              return false
            }
   
    
   
  }

  private async setupDatabase(): Promise<void> 
  {
    let connected = false;
    
    while (!connected) {
      try {
        this.pool = await mysql.createPool({
          host:"monorail.proxy.rlwy.net",
          user: "root",
          password: "fcAEHgD4c5A5babc4Ec4cGG6gbH-Fh43",
          database: "railway",
          port:13272
        });
        console.log("connected to database")
        connected = true; // Establecemos la conexión con éxito
      } catch (error) {
        console.log("ERRORRRRRR")
        connected=false
        console.error("Error al conectar a la base de datos:", error);
        // Esperamos antes de intentar nuevamente
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Puedes ajustar el tiempo de espera según tus necesidades
      }

    }
   } }