import { Server } from 'http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Context } from 'aws-lambda';
import * as serverlessExpress from 'aws-serverless-express';
import * as express from 'express';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import bodyParser = require('body-parser');
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

let lambdaProxy: Server;

async function bootstrap(islocal?: boolean) {
  let nestApp;
  const expressServer = express();
  if (islocal) {
    nestApp = await NestFactory.create<NestExpressApplication>(AppModule);
  }
  else {
    nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressServer));
  }

  const optionsSwagger = new DocumentBuilder()
    .setTitle('API example')
    .setDescription('The API description')
    .setVersion('1.0')
    // .addBearerAuth()
    .addTag('api')
    .build();
  const documentSwagger = SwaggerModule.createDocument(nestApp, optionsSwagger);
  SwaggerModule.setup('api', nestApp, documentSwagger);

  const options = {
    origin: '*',
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: ['*'],
  };
  nestApp.use(bodyParser.json({ limit: '10mb' }));
  nestApp.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  nestApp.enableCors(options);

  if (islocal) {
    let localApp = (nestApp as NestExpressApplication);
    await localApp.listen(4001);
  }
  else {
    let cloudApp = (nestApp as ExpressAdapter);
    await cloudApp.init();
    return serverlessExpress.createServer(expressServer);
  }
}

//For running local app
bootstrap(true);

//Export handler for running on AWS Cloud (LAMBDA)
export const handler = (event: any, context: Context) => {
  if (!lambdaProxy) {
    bootstrap(false).then((server) => {
      lambdaProxy = server;
      serverlessExpress.proxy(lambdaProxy, event, context);
    });
  } else {
    serverlessExpress.proxy(lambdaProxy, event, context);
  }
};
