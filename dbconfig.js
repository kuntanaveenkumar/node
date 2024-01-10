require('dotenv').config();
const  config = {
   user: process.env.USERNAME,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
	database: process.env.DATABASE,
	  pool: {
		max: 50,
		min: 0,
		idleTimeoutMillis: 30000,
		
	  },
	  options: {
		encrypt: false, // for azure
		trustServerCertificate: false, // change to true for local dev / self-signed certs
		trustedConnection: true,
	  }
	}
module.exports = config;

require('dotenv').config();
const  sqlconfig = {
   user: process.env.USERNAME,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
	database: process.env.DATABASE,
	  pool: {
		max: 50,
		min: 0,
		idleTimeoutMillis: 30000
	  },
	  options: {
		encrypt: false, // for azure
		trustServerCertificate: false, // change to true for local dev / self-signed certs
		trustedConnection: true,
	  }
	}
module.exports = sqlconfig;
