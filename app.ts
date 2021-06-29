import express from 'express';
import * as http from 'http';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';
import { CommonRoutesConfig } from './common/common.routes.config';
import { UsersRoutes } from './users/users.routes.config';
import debug from 'debug';
const dotenvResult = require('dotenv').config();
import { AuthRoutes } from './auth/auth.routes.config';
import helmet from 'helmet';


if (dotenvResult.error) {
    throw dotenvResult.error;
}

export const app: express.Application = express();
export const server: http.Server = http.createServer(app);
const port = 3000;
const routes: Array<CommonRoutesConfig> = [];
const debugLog: debug.IDebugger = debug('app');

app.use(express.json());
app.use(cors());
app.use(helmet());



const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true })
    ),
};

if (!process.env.DEBUG) {
    loggerOptions.meta = false; // when not debugging, make terse
    if (typeof global.it === 'function') {
        loggerOptions.level = 'http'; // for non-debug test runs, squelch entirely
    }
}

app.use(expressWinston.logger(loggerOptions));


//swagger-----------------------------------------
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';

const swaggerOptions = {  
    swaggerDefinition: {  
        openapi: '3.0.0',
        info: {  
            title:'basic-Rest-API-project',  
            version:'1.0.0'  
        }  
    },  
    apis:['./users/users.routes.config.ts'],  
}  
export const swaggerDocs = swaggerJsDoc(swaggerOptions);  

//app.route('/api-docs')
//.all(swaggerUI.serve,swaggerUI.setup(swaggerDocs)); 
//------------------------------------------------



routes.push(new UsersRoutes(app));
routes.push(new AuthRoutes(app));

const runningMessage = `Server running at http://localhost:${port}`;
app.get('/', (req: express.Request, res: express.Response) => {
    res.status(200).send(runningMessage)
});


server.listen(port, () => {
    routes.forEach((route: CommonRoutesConfig) => {
        debugLog(`Routes configured for ${route.getName()}`);
    });
    console.log(runningMessage);
});
