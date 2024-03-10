
import { createPool,RowDataPacket } from 'mysql2';
import * as mysql from 'mysql2/promise';
import {CONFIG} from '../config/testingconfig'
import {decodeToken} from '../domain/jwtFunctions'
import { ResultSetHeader } from 'mysql2/promise';
import { MongoClient, Db, Collection } from 'mongodb';

export class UserGateway {
  private static instance: UserGateway;
  private pool: mysql.Pool | null;
  private db: Db | null;
  private assetsCollection: Collection<any> | null;

  private constructor() {
    this.pool = null;
    this.db = null;
    this.assetsCollection = null;
  }

  public static async getInstance(): Promise<UserGateway>
  {
    if (!UserGateway.instance) {
      UserGateway.instance = new UserGateway();
      let setup = await UserGateway.instance.setupDatabase();
    }
    return UserGateway.instance;
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
  public async getAssetsComprados(){

  }
  public async insertAssetComprado(){

  }
  public async getAssetBalance(){

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
        const client = new MongoClient('mongodb://127.0.0.1:27017');
        await client.connect();
        this.db = client.db('raptoreumworld');
        this.assetsCollection = this.db.collection('assets');
        console.log('Connected to MongoDB');
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