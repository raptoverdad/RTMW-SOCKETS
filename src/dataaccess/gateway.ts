
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
  public async getUserAddress(user:string): Promise<string> 
  {
    const getAddressQuery="SELECT address FROM users WHERE usuario=? "

    if (!this.pool) {
      throw new Error('No se pudo conectar a la base de datos');
    }else{

      let [result] = await this.pool.execute<RowDataPacket[]>(getAddressQuery,[user]);

      if(Array.isArray(result))
      {   
        if(result.length == 0 || result==undefined)
        {
          return "no address"
        }else if(result.length > 0)
        {
          return result[0].address
        }else{
          throw new Error("UNEXPECTED RESULT")
        }

      }else{
        return "no address"
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
          host:"localhost",
          user: "root",
          password: "1234",
          database: "raptoreumworld",
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