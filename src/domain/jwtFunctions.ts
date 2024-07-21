const jwt = require('jsonwebtoken');



export async function decodeToken(token: any): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.USERSSECRET, (err: any, decoded: any) => {
      if (err) {
        console.log("token error:", err);
        if (err.message === "jwt expired") {
          resolve("expired");
        } else {
          resolve("error");
        }
      } else {
        console.log("esto es lo que recuperamos:", decoded);
        resolve(decoded);
      }
    });
  });
}

