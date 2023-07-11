import Arena from "@colyseus/arena";
import {monitor} from "@colyseus/monitor";
import {RequestContext} from "@mikro-orm/core";
import express from "express";
import cors from 'cors'
const logger = require("./helpers/logger");
import {connect, DI} from "./config/database.config";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import {MainRoom} from "./rooms/MainRoom";
import basicAuth from "express-basic-auth";
import { WebSocketTransport } from  "@colyseus/ws-transport"

const basicAuthMiddleware = basicAuth({
    users: {
        ballAdmin: process.env.MONITOR_PASSWORD,
    },
    challenge: true
});


export default Arena({
    getId: () => "Your Colyseus App",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer
            .define('lobby_room', MainRoom)
            .filterBy(['realm'])
            .enableRealtimeListing()

    },

    initializeTransport: (options) => {

        return new WebSocketTransport({
            ...options,
            pingInterval: 3000,
            pingMaxRetries: 6,
        });
    },

    initializeExpress: (app) => {
        Sentry.init({
            dsn: "https://a63f59c117c3480aaf67e834e09587be@o367262.ingest.sentry.io/4504614290718720",
            integrations: [
                // enable HTTP calls tracing
                new Sentry.Integrations.Http({ tracing: true }),
                // enable Express.js middleware tracing
                new Tracing.Integrations.Express({ app }),
            ],

            // Set tracesSampleRate to 1.0 to capture 100%
            // of transactions for performance monitoring.
            // We recommend adjusting this value in production
            tracesSampleRate: 1.0,
        });


        // RequestHandler creates a separate execution context using domains, so that every
        // transaction/span/breadcrumb is attached to its own Hub instance
        app.use(Sentry.Handlers.requestHandler());
        // TracingHandler creates a trace for every incoming request
        app.use(Sentry.Handlers.tracingHandler());


        /**
         * Bind your custom express routes here:
         */
        app.use(express.json());

        app.use(express.urlencoded({extended: true, limit: "10kb"}));


        const allowlist = ['https://play.decentraland.org', 'https://play.decentraland.zone']
        const corsOptionsDelegate = (req: any, callback: any) => {

            try {
                let corsOptions;
                // console.log("allowlist.indexOf(req.header('Origin')) !== -1", allowlist.indexOf(req.header('Origin')) !== -1)
                // console.log("req", req)
                // console.log("req.header", req.header('Origin'))
                if (allowlist.indexOf(req.header('Origin')) !== -1) {
                    corsOptions = {origin: true} // reflect (enable) the requested origin in the CORS response
                } else {
                    corsOptions = {origin: false} // disable CORS for this request
                }
                callback(null, corsOptions) // callback expects two parameters: error and options
            } catch (e) {
                console.log("Error in cors option delegate", e)
                // sendTelegram(`Error in cors option delegate ${e}`)
            }


        }

        app.use(cors(corsOptionsDelegate))

        //
        // MikroORM: it is important to create a RequestContext before registering routes that access the database.
        // See => https://mikro-orm.io/docs/identity-map/
        //
        app.use((req, res, next) => RequestContext.create(DI.orm.em, next));

        // Register routes for our simple user auth
        // app.use("/users", userRoutes);

        // app.use((req, res, next) => {
        //     RequestContext.create(orm.em, next);
        // });

        // Connect to our database
        connect().then(async () => {
            logger.silly(`*** Connected to Database! ***`);

        });
        app.get("/", (req, res) => {
            res.send("This really is back of the room");
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */


        // app.get("/", function rootHandler(req, res) {
        //     res.end("Hello world!");
        // });


        app.use(Sentry.Handlers.errorHandler());

        // Optional fallthrough error handler
        // @ts-ignore
        app.use(function onError(err, req, res, next) {
            // The error id is attached to `res.sentry` to be returned
            // and optionally displayed to the user for support.
            res.statusCode = 500;
            res.end(res.sentry + "\n");
        });

        // app.get("/debug-sentry", function mainHandler(req, res) {
        //     throw new Error("My first Sentry error!");
        // });

        app.use("/colyseus", basicAuthMiddleware, monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});